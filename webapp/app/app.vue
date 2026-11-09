<template>
  <UApp>
    <NuxtLoadingIndicator color="rgb(var(--color-surface) / 1)" :height="4" />
    <NuxtRouteAnnouncer />

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <ConstructionModal />

    <!-- v-if: maintenu en DOM jusqu'à completion pour permettre la transition CSS avant démontage -->
    <AppBootShell v-if="shouldMountLandingShell" />
  </UApp>
</template>

<script lang="ts" setup>
// 4. Composables, stores, routeur

const logger = useLogger({ module: 'app' })
// Locale active utilisée pour synchroniser lang HTML et forcer un re-init des données.
const { localeSetting } = useLang()
// Statut et données critiques de l'application (web pages, métadonnées).
const { initCoreData, isInitCoreDataReady, loadBackgroundData } = useNuxtServerInit()
// Drapeau de sortie statique : voir `runtimeConfig.public.staticOutput`.
const isStaticOutput = useRuntimeConfig().public.staticOutput === true
const { preloadDashboard, seedDashboardHeroImageUrl } = useApp()
preloadDashboard()

// Résolus en setup (contexte Nuxt valide) : useRuntimeConfig() ne peut pas être appelé
// dans le getter de useHead, qui est évalué par unhead hors contexte Vue côté SSR.
const faviconSvgHref = assetUrl('favicon.svg')
const themesCssHref = assetUrl('themes.css')

// 5. Etat local

// Verrou de déduplication : évite les appels concurrents à initCoreData.
let initPromise: Promise<boolean> | null = null
// Garde contre les ré-initialisations non demandées lors de re-renders ou changements de locale.
let hasInitializedOnce = false

// Persiste l'état de fin de vie du shell pour éviter qu'il remonte après sa sortie.
// Réinitialisé uniquement à chaque rechargement complet de la page.
const hasLandingShellCompleted = useState<boolean>('app.boot-shell.completed', () => false)

// 8. Computed UI-ready

// Contrôle le montage DOM du shell, indépendamment de sa visibilité CSS.
// Le shell reste monté le temps que la transition de sortie s'exécute,
// puis est retiré du DOM une fois hasLandingShellCompleted passé à true.
const shouldMountLandingShell = computed<boolean>(() => !hasLandingShellCompleted.value)

// 9. Actions et handlers

/**
 * Déclenche l'initialisation des données critiques de l'application.
 *
 * Protège contre les appels concurrents en mémorisant la promesse en cours.
 * Un second appel pendant l'init en cours attend la résolution de la première.
 *
 * @param forceRefresh Si `true`, relance l'init même si elle a déjà été effectuée
 *   (ex : changement de locale nécessitant un rechargement des données traduites).
 */
const runInit = async (forceRefresh = false): Promise<void> => {
  if ((hasInitializedOnce || isInitCoreDataReady.value) && !forceRefresh) {
    return
  }

  if (initPromise) {
    await initPromise
    // Un refresh forcé (ex : changement de locale) arrivé pendant une init en vol
    // doit relancer l'init après elle, sinon les données restent dans l'ancienne locale.
    if (!forceRefresh) return
  }

  const currentInitPromise = initCoreData()
  initPromise = currentInitPromise

  try {
    await currentInitPromise
    hasInitializedOnce = true
  } finally {
    if (initPromise === currentInitPromise) {
      initPromise = null
    }
  }
}

// Init SSR des données critiques : exécutée pendant le rendu serveur, l'état des
// stores (Pinia + useState) est sérialisé dans le payload et réhydraté côté client
// sans nouvel appel. En cas d'échec, le statut passe à 'error' et le client
// retente via onNuxtReady.
await callOnce('app.init-core-data', async () => {
  try {
    await runInit()
  } catch (error) {
    logger.error('app:init-core-data-ssr-failed', {
      message: error instanceof Error ? error.message : String(error),
    })
  }

  // Pre-rendu ou sortie statique : les donnees d'arriere-plan (accommodations)
  // sont normalement chargees apres l'hydratation, donc absentes du HTML produit.
  // Sans elles, les listes de biens sortent vides dans le livrable statique.
  // Le rendu serveur classique et le client conservent leur comportement.
  if (import.meta.prerender || (import.meta.server && isStaticOutput)) {
    try {
      await loadBackgroundData()
    } catch (error) {
      logger.error('app:prerender-background-data-failed', {
        message: error instanceof Error ? error.message : String(error),
      })
    }
  }
})

// 10. Watch et watchEffect

// Recharge les données critiques quand la locale change pour refléter la bonne langue.
// forceRefresh: true permet de contourner la garde hasInitializedOnce.
watch(
  () => localeSetting.value,
  async (nextLocale, previousLocale) => {
    if (nextLocale === previousLocale) return

    try {
      await runInit(true)
    } catch (error) {
      logger.error('app:init-core-data-refresh-failed', {
        message: error instanceof Error ? error.message : String(error),
      })
    }
  },
)

// 11. Metadonnees ecran ou page

useHead(() => ({
  title: 'Showcase Immobilier',
  htmlAttrs: {
    // Synchronise l'attribut lang du document HTML avec la locale active.
    lang: localeSetting.value,
  },
  meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
  link: [
    {
      key: 'app-favicon-svg',
      rel: 'icon',
      type: 'image/svg+xml',
      href: faviconSvgHref,
    },
    {
      key: 'app-themes-stylesheet',
      rel: 'stylesheet',
      href: themesCssHref,
    },
  ],
}))

// 12. Lifecycle

onErrorCaptured((error, instance, info) => {
  const typedError = error as Error

  logger.error('app:error-captured', {
    message: typedError?.message ?? String(error),
    stack: typedError?.stack,
    info,
    component: instance?.$?.type?.name,
  })

  // Ne pas retourner false : l'erreur doit continuer de se propager au handler
  // Nuxt pour qu'une erreur fatale atteigne error.vue au lieu de laisser une
  // zone cassée silencieuse. Ce hook ne sert qu'à enrichir le logging.
})

// Filet de sécurité client : retente l'init si le rendu SSR ne l'a pas complétée
// (ex : échec API pendant le SSR). Lance ensuite les données d'arrière-plan non
// critiques (accommodations).
onNuxtReady(async () => {
  try {
    await runInit()
  } catch (error: unknown) {
    logger.error('app:init-core-data-failed', {
      message: error instanceof Error ? error.message : String(error),
    })
  }

  void loadBackgroundData()
  void seedDashboardHeroImageUrl()
})
</script>
