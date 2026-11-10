<template>
  <UPage ref="pageRef" :ui="screenUi.page">
    <!-- Titre accessible issu de la page éditoriale de listing immobilier. -->
    <h1 v-if="accessibleTitle" class="sr-only">{{ accessibleTitle }}</h1>

    <!-- Liste filtrée par type de bien : le screen reçoit des données prêtes pour l'affichage. -->
    <UPageSection data-screen="screen-property-list" :ui="screenUi.pageSection">
      <ScreenPropertyList
        :items-list="propertyItemsList"
        :total-count="accommodations.length"
        :active-real-estate-listing-slug="realEstateListingSlug"
        @next-screen="next"
      />
    </UPageSection>

    <!-- Relance vers les biens mis en avant pour éviter une impasse si la liste est courte. -->
    <UPageSection data-screen="screen-real-estate-three-col-properties" :ui="screenUi.pageSection">
      <LazyScreenRealEstateThreeColProperties />
    </UPageSection>

    <!-- Sortie de page commune : navigation, contact et signaux de confiance. -->
    <UPageSection data-screen="screen-footer" :ui="screenUi.pageSection">
      <LazyScreenFooter />
    </UPageSection>
  </UPage>
</template>

<script setup lang="ts">
// 1. Imports

// 2. Types et constantes statiques
// Page de référence utilisée pour les métadonnées du listing immobilier.
const PROPERTY_LISTING_PAGE_SLUG = 'nos-biens-immobiliers'

// Transition cohérente avec les autres parcours immobiliers verticaux.
const transitionMode = 'cross-zoom'

// 3. Props et emits

// 4. Composables, stores, routeur
const route = useRoute()
const localePath = useLocalePath()
const accommodationStore = useAccommodationStore()
const { getItemsListByAccommodations } = useAccommodation()
const metadataStore = useMetadataStore()
const { getPageBySlug } = useWebPage()
useContentVersion()

// Conteneur de la navigation par screens pour limiter les interactions à cette page.
const pageRef = useTemplateRef<HTMLElement>('pageRef')

const { next, screenUi } = useScreenSystem({
  // Parcours vertical : liste, relance, footer.
  axis: 'y',
  // Pas de boucle pour conserver une fin de parcours claire.
  loop: false,
  // Navigation clavier disponible pour l'exploration desktop.
  keyboard: true,
  // Active les transitions automatiques prévues par le système d'écrans.
  auto: true,
  // Swipe mobile avec seuil haut pour limiter les changements involontaires.
  touch: true,
  touchThreshold: 60,
  // Temporise les gestes tactiles pendant les transitions.
  touchCooldownMs: 700,
  // Empêche le scroll natif de concurrencer la navigation par screen.
  touchPreventScroll: true,
  // Navigation wheel plus sensible sur axe vertical.
  wheel: true,
  wheelThreshold: 40,
  // Protège contre les doubles déclenchements au trackpad.
  wheelCooldownMs: 300,
  container: pageRef,
  transitionMode,
  anchors: {
    // Permet d'adresser les sections sans créer de sous-routes.
    enabled: true,
    // Le hash ne se synchronise que lors des navigations explicites.
    syncMode: 'explicit-only',
    // Évite de garder un hash obsolète après une navigation implicite.
    clearHashOnImplicitNavigation: true,
  },
})

// 5. Etat local

// 6. Data inputs
// Page de référence utilisée pour les métadonnées du listing immobilier.
const page = computed(() => getPageBySlug(PROPERTY_LISTING_PAGE_SLUG))

// Normalise le paramètre dynamique pour comparer des slugs stables côté SSR et client.
const realEstateListingSlug = computed(() => {
  const param = route.params.realEstateListing
  if (Array.isArray(param)) return String(param[0] ?? '')
  return String(param ?? '')
})

// Ensemble des types de biens connus, dérivé des métadonnées chargées.
// Le Set garde la vérification de route lisible et évite les recherches répétées.
const knownRealEstateListingSlugs = computed(
  () =>
    new Set(
      metadataStore.getAccommodationRealEstateListings
        .map((item: { slug?: string | null }) => item.slug)
        .filter((slug: unknown): slug is string => typeof slug === 'string' && slug.length > 0),
    ),
)

// Données métier filtrées par type de bien, exposées ensuite en format carte via le composable.
const accommodations = computed(() =>
  accommodationStore.getAccommodationsByRealEstateListing(realEstateListingSlug.value),
)

// 7. Validation et helpers purs
if (
  metadataStore.getAccommodationRealEstateListings.length > 0 &&
  !knownRealEstateListingSlugs.value.has(realEstateListingSlug.value)
) {
  // Redirection douce des anciens slugs ou slugs inconnus vers leur équivalent éditorial.
  // Elle évite une 404 lorsque la route peut être comprise comme une page de contenu.
  const target =
    realEstateListingSlug.value.length > 0
      ? localePath(`/${realEstateListingSlug.value}`)
      : localePath('/')

  await navigateTo(target, { replace: true })
}

// 8. Computed UI-ready
// H1 hors écran pour conserver une structure sémantique sans doubler le titre du screen.
const accessibleTitle = computed<string | undefined>(() => page.value?.headline)

// Mapping UI-ready centralisé dans `useAccommodation` pour éviter de transformer les données
// dans le template.
const propertyItemsList = getItemsListByAccommodations(accommodations)

// 9. Actions et handlers

// 10. Watch et watchEffect

// 11. Metadonnees ecran ou page
// SEO enrichi par la page de listing et les biens filtrés pour produire des données structurées utiles.
usePageSeo(page, accommodations)

// 12. Lifecycle
</script>
