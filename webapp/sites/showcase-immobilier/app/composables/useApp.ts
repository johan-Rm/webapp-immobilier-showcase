import type { ComputedRef, Ref } from 'vue'

import { computed } from 'vue'

/**
 * Contrat public du composable `useApp`.
 *
 * Il expose la locale courante, la donnée `app` réactive et les helpers utiles
 * pour charger ou relire la configuration globale déjà hydratée dans le store.
 */
type UseAppReturn = {
  locale: Ref<LocaleCode>
  appData: ComputedRef<App | null>
  accommodationUi: ComputedRef<AppAccommodation | null>
  loadApp: () => Promise<void>
  getApp: () => App | null
  isLandingShellVisible: ComputedRef<boolean>
  preloadDashboard: () => void
  seedDashboardHeroImageUrl: () => Promise<void>
}

/**
 * Expose l'accès réactif à la donnée `app` chargée dans le store metadata.
 *
 * Responsabilités :
 * - relayer la locale courante utilisée par les loaders de contenu
 * - charger le document `app` via le pipeline metadata existant
 * - fournir un accès réactif unique à la configuration globale du site
 * - calculer la visibilité du shell de démarrage (`AppBootShell`)
 *
 * @returns API réactive orientée `app` pour les pages et composables métier.
 *
 * @example
 * const { appData, loadApp } = useApp()
 * await loadApp()
 * const app = appData.value
 */
export const useApp = (): UseAppReturn => {
  const { localeSetting } = useLang()
  const { loadApp } = useMetadata()
  const store = useMetadataStore()
  const locale = computed(() => localeSetting.value)
  const appData = computed<App | null>(() => store.getApp)
  const accommodationUi = computed<AppAccommodation | null>(() => store.getAccommodationUi)

  const { initCoreDataStatus } = useNuxtServerInit()
  const { loggedIn } = useUserSession()

  // Partagé avec FullImage.vue : signal que l'image hero est prête à être affichée.
  const isHeroImageReady = useState<boolean>(
    'screen.real-estate-full-image.hero-ready',
    () => false,
  )
  // Partagé avec app.vue : persiste la fin de vie du shell pour la session courante.
  const hasLandingShellCompleted = useState<boolean>('app.boot-shell.completed', () => false)
  // Partagé avec dashboard/index.vue : URL de la première image hero du dashboard.
  const dashboardHeroImageUrl = useState<string>('dashboard.hero-image.url', () => '')

  // Chaîne de gardes ordonnées : chaque early return représente un état où
  // le shell n'a pas de raison d'être visible.
  const isLandingShellVisible = computed<boolean>(() => {
    // Le shell a déjà terminé son cycle de vie : ne plus l'afficher.
    if (hasLandingShellCompleted.value) return false
    // Init en attente ou en cours : le shell reste visible pour masquer un contenu incomplet.
    const status = initCoreDataStatus.value
    if (status === 'idle' || status === 'loading') return true

    // Échec d'init : ne pas attendre une image hero qui n'arrivera jamais
    // (sans données, FullImage ne pose aucun signal). On révèle immédiatement
    // ce que le rendu SSR ou le cache a produit.
    if (status === 'error') return false

    // Init réussie : le shell attend que l'image hero soit prête.
    return !isHeroImageReady.value
  })

  /**
   * Initialise le préchargement client-side de la première image visible du dashboard.
   *
   * À appeler une seule fois pendant le setup du composant racine.
   * Sans effet si l'utilisateur n'est pas connecté ou si aucune image n'est disponible.
   */
  const preloadDashboard = (): void => {
    useImageWarmup(dashboardHeroImageUrl, {
      stateKey: 'dashboard-hero',
      warmupEnabled: loggedIn,
      preset: 'heroFullScreen',
    })
  }

  /**
   * Récupère en arrière-plan l'URL de la première image du dashboard et la stocke
   * dans l'état partagé, permettant au warmup de démarrer avant la navigation vers
   * le dashboard.
   *
   * Sans effet si l'utilisateur n'est pas connecté ou si l'URL est déjà connue.
   * Silencieux en cas d'erreur : l'image se chargera normalement à l'arrivée sur le dashboard.
   */
  const seedDashboardHeroImageUrl = async (): Promise<void> => {
    if (!loggedIn.value || dashboardHeroImageUrl.value) return

    try {
      const data = await $fetch<DashboardAccommodationsResponse>('/api/dashboard/accommodations', {
        query: { locale: localeSetting.value },
      })
      const firstItem = data?.items?.[0]
      if (!firstItem) return
      dashboardHeroImageUrl.value =
        firstItem.preview.media[0]?.imageUrl || firstItem.preview.primaryImageUrl || ''
    } catch {
      // Silencieux : l'image se chargera normalement à l'arrivée sur le dashboard.
    }
  }

  /**
   * Retourne la donnée `app` actuellement disponible dans le store.
   *
   * @returns Configuration globale localisée ou `null` si elle n'est pas chargée.
   */
  const getApp = (): App | null => appData.value

  return {
    locale,
    appData,
    accommodationUi,
    loadApp,
    getApp,
    isLandingShellVisible,
    preloadDashboard,
    seedDashboardHeroImageUrl,
  }
}
