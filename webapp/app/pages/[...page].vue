<template>
  <UPage ref="pageRef" :ui="screenUi.page">
    <!-- Screen éditorial générique : le slug validé pilote le contenu MDC affiché. -->
    <UPageSection data-screen="screen-panel-mdc" :ui="screenUi.pageSection">
      <ScreenPanelMDC :web-page-slug="slug" />
    </UPageSection>

    <!-- Relance immobilière commune aux pages éditoriales avant la sortie de page. -->
    <UPageSection data-screen="screen-real-estate-three-col-properties" :ui="screenUi.pageSection">
      <LazyScreenRealEstateThreeColProperties />
    </UPageSection>

    <!-- Footer commun pour conserver les points de contact et de confiance. -->
    <UPageSection data-screen="screen-footer" :ui="screenUi.pageSection">
      <LazyScreenFooter />
    </UPageSection>
  </UPage>
</template>

<script setup lang="ts">
// 1. Imports

// 2. Types et constantes statiques
// Slug simple en kebab-case : évite que la catch-all absorbe des chemins profonds
// ou des valeurs incompatibles avec les slugs éditoriaux attendus.
const pattern = /^[a-z](?:[a-z0-9]*)(?:-[a-z0-9]+)*$/

// Transition partagée avec les pages éditoriales à screens verticaux.
const transitionMode = 'cross-zoom'

// 3. Props et emits

// 4. Composables, stores, routeur
const route = useRoute()
const { getPageBySlug } = useWebPage()

// Conteneur utilisé par la navigation plein écran pour scoper wheel, touch et ancres.
const pageRef = useTemplateRef<HTMLElement>('pageRef')

const { screenUi } = useScreenSystem({
  // Navigation verticale : lecture éditoriale, relance immobilière, puis footer.
  axis: 'y',
  // Pas de boucle afin de conserver une progression et une sortie lisibles.
  loop: false,
  // Accessibilité desktop via navigation clavier.
  keyboard: true,
  // Autorise les transitions automatiques prévues par le système d'écrans.
  auto: true,
  // Swipe mobile avec seuil franc pour éviter les changements de section accidentels.
  touch: true,
  touchThreshold: 60,
  // Temporise les gestes tactiles pendant les transitions.
  touchCooldownMs: 700,
  // Priorise la navigation par screen sur le scroll natif.
  touchPreventScroll: true,
  // Wheel desktop plus sensible sur un axe vertical.
  wheel: true,
  wheelThreshold: 40,
  // Réduit les répétitions involontaires des trackpads.
  wheelCooldownMs: 300,
  container: pageRef,
  transitionMode,
  anchors: {
    // Les screens restent adressables sans multiplier les routes.
    enabled: true,
    // Synchronisation explicite uniquement pour préserver une URL stable pendant la lecture.
    syncMode: 'explicit-only',
    // Évite de conserver un hash obsolète après navigation implicite.
    clearHashOnImplicitNavigation: true,
  },
})

// 5. Etat local

// 6. Data inputs
// Normalise le paramètre dynamique pour fournir un slug stable au screen MDC
// et au lookup de page, quel que soit le format reçu par Vue Router.
const slug = computed(() => {
  const param = route.params.page
  if (Array.isArray(param)) return param[0] ?? ''
  return typeof param === 'string' ? param : ''
})

// Page éditoriale résolue depuis le slug public de la route.
const page = computed(() => getPageBySlug(slug.value))

// 7. Validation et helpers purs

// 8. Computed UI-ready

// 9. Actions et handlers

// 10. Watch et watchEffect

// 11. Metadonnees ecran ou page
definePageMeta({
  validate: (route) => {
    // Validation Nuxt exécutée avant rendu : elle protège la route catch-all
    // contre les URL ambiguës et limite les 404 tardives.
    const param = route.params.page
    if (Array.isArray(param)) {
      return param.length === 1 && pattern.test(param[0] ?? '')
    }
    return typeof param === 'string' && pattern.test(param)
  },
})

// SEO générique de page éditoriale, piloté par le contenu résolu.
usePageSeo(page)

// 12. Lifecycle
</script>
