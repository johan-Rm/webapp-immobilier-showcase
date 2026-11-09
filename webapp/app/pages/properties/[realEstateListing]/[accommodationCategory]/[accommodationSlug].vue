<template>
  <UPage ref="pageRef" :ui="screenUi.page">
    <!-- Détail du bien : parcours immersif si le bien définit des screens (hasPart), sinon la
         fiche détail classique. Le slug route pilote le chargement. -->
    <UPageSection data-screen="screen-property-detail" :ui="screenUi.pageSection">
      <ScreenPropertyExceptional v-if="isExceptional" :slug="slug" @next-screen="next" />
      <ScreenPropertyDetail v-else :slug="slug" />
    </UPageSection>

    <!-- Relance immobilière après le détail pour prolonger l'exploration. -->
    <UPageSection data-screen="screen-real-estate-three-col-properties" :ui="screenUi.pageSection">
      <LazyScreenRealEstateThreeColProperties />
    </UPageSection>

    <!-- Footer commun avec contact, navigation et informations de confiance. -->
    <UPageSection data-screen="screen-footer" :ui="screenUi.pageSection">
      <LazyScreenFooter />
    </UPageSection>
  </UPage>
</template>

<script setup lang="ts">
// 1. Imports
import { isExceptionalProperty } from '@services/mapper/exceptional'
import { accommodationToWebPage } from '@services/mapper/webPage'

// 2. Types et constantes statiques
// Transition partagée par les parcours verticaux de propriétés.
const transitionMode = 'cross-zoom'

// 3. Props et emits

// 4. Composables, stores, routeur
const route = useRoute()
const accommodationStore = useAccommodationStore()
const { loadAccommodations } = useAccommodation()
useContentVersion()

// Conteneur racine utilisé par le système de navigation par screens.
const pageRef = useTemplateRef<HTMLElement>('pageRef')

const { screenUi, next } = useScreenSystem({
  // Parcours vertical : détail, relance, footer.
  axis: 'y',
  // Pas de boucle afin de garder une sortie de page explicite.
  loop: false,
  // Navigation clavier disponible sur desktop.
  keyboard: true,
  // Active les transitions automatiques prévues par le système d'écrans.
  auto: true,
  // Swipe mobile avec seuil haut pour limiter les changements accidentels.
  touch: true,
  touchThreshold: 60,
  // Temporise les gestes tactiles pendant les transitions.
  touchCooldownMs: 700,
  // Évite la concurrence entre scroll natif et navigation par screen.
  touchPreventScroll: true,
  // Wheel desktop adaptée à un parcours vertical.
  wheel: true,
  wheelThreshold: 40,
  // Limite les doubles déclenchements au trackpad.
  wheelCooldownMs: 300,
  container: pageRef,
  transitionMode,
  anchors: {
    // Les sections restent adressables sans créer de routes enfants.
    enabled: true,
    // Synchronisation du hash réservée aux navigations explicites.
    syncMode: 'explicit-only',
    // Nettoie le hash lorsqu'une navigation implicite quitte une section.
    clearHashOnImplicitNavigation: true,
  },
})

// 5. Etat local

// 6. Data inputs
// Slug canonique du bien transmis au screen de détail et à la clé de chargement.
const slug = computed(() => {
  const raw = route.params.accommodationSlug
  return Array.isArray(raw) ? (raw[0] ?? '') : String(raw ?? '')
})

await useAsyncData(
  () => `accommodation-detail:${slug.value}`,
  async () => {
    // Le détail peut être ouvert directement : on hydrate le store si le bootstrap global
    // n'a pas encore chargé les biens au moment du rendu de la route.
    if (!accommodationStore.getAccommodations.length) {
      await loadAccommodations()
    }
    return true
  },
  {
    // Rejoue le chargement si Nuxt réutilise la page pour un autre slug de bien.
    watch: [slug],
  },
)

// Bien métier résolu depuis le store après chargement éventuel.
const accommodation = computed(() => accommodationStore.getAccommodationBySlug(slug.value))

// Active le parcours immersif si le bien définit des screens valides (sinon fiche classique).
const isExceptional = computed(() => isExceptionalProperty(accommodation.value))

// Conversion vers un contrat WebPage pour réutiliser la même pipeline SEO que les pages éditoriales.
const page = computed(() => {
  if (!accommodation.value) return null
  return accommodationToWebPage(accommodation.value)
})

// 7. Validation et helpers purs

// 8. Computed UI-ready

// 9. Actions et handlers

// 10. Watch et watchEffect

// 11. Metadonnees ecran ou page
// SEO enrichi par le bien courant, avec une page dérivée pour les métadonnées sociales.
usePageSeo(page, undefined, accommodation)

// 12. Lifecycle
</script>
