<template>
  <UPage ref="pageRef" :ui="screenUi.page">
    <!-- Titre réservé aux lecteurs d'écran et au SEO : le screen contact porte le titre visuel. -->
    <h1 v-if="accessibleTitle" class="sr-only">{{ accessibleTitle }}</h1>

    <!-- Écran principal de conversion : rendu immédiat pour garder le parcours de contact direct. -->
    <UPageSection data-screen="screen-contact" :ui="screenUi.pageSection">
      <ScreenContact />
    </UPageSection>

    <!-- Relance éditoriale avant le footer pour maintenir une sortie orientée exploration. -->
    <UPageSection data-screen="screen-real-estate-three-col-properties" :ui="screenUi.pageSection">
      <LazyScreenRealEstateThreeColProperties />
    </UPageSection>

    <!-- Point de sortie commun : navigation, contact et informations de confiance. -->
    <UPageSection data-screen="screen-footer" :ui="screenUi.pageSection">
      <LazyScreenFooter />
    </UPageSection>
  </UPage>
</template>

<script setup lang="ts">
// 1. Imports

// 2. Types et constantes statiques
// Slug éditorial stable attendu dans le contenu pour alimenter la route contact.
const CONTACT_PAGE_SLUG = 'contact'

// Transition cohérente avec les pages éditoriales plein écran du site.
const transitionMode = 'cross-zoom'

// 3. Props et emits

// 4. Composables, stores, routeur
const { getPageBySlug } = useWebPage()
const { items: accommodations } = useAccommodation()

// Conteneur scanné par le système de navigation afin de limiter les interactions à cette page.
const pageRef = useTemplateRef<HTMLElement>('pageRef')

const { screenUi } = useScreenSystem({
  // Parcours vertical adapté à une page contact courte avec sections complémentaires.
  axis: 'y',
  // Le parcours ne boucle pas afin de conserver une fin de page explicite.
  loop: false,
  // Maintient la navigation clavier disponible sur desktop.
  keyboard: true,
  // Active les transitions automatiques prévues par le système d'écrans.
  auto: true,
  // Garde le swipe mobile avec un seuil assez élevé pour éviter les déclenchements involontaires.
  touch: true,
  touchThreshold: 60,
  // Protège les transitions tactiles contre les répétitions rapides.
  touchCooldownMs: 700,
  // Empêche le scroll natif de concurrencer la navigation par écran.
  touchPreventScroll: true,
  // Active la navigation wheel desktop sur un seuil plus sensible que la page d'accueil horizontale.
  wheel: true,
  wheelThreshold: 40,
  // Réduit les doubles déclenchements sur trackpads.
  wheelCooldownMs: 300,
  container: pageRef,
  transitionMode,
  anchors: {
    // Les sections restent adressables par hash sans créer de routes dédiées.
    enabled: true,
    // L'URL change seulement lors d'une navigation explicite pour éviter un hash trompeur.
    syncMode: 'explicit-only',
    // Nettoie le hash quand la navigation implicite quitte une section ancrée.
    clearHashOnImplicitNavigation: true,
  },
})

// 5. Etat local

// 6. Data inputs
// Donnée éditoriale de la page, transmise ensuite au composable SEO.
const page = computed(() => getPageBySlug(CONTACT_PAGE_SLUG))

// 7. Validation et helpers purs

// 8. Computed UI-ready
// H1 accessible dérivé du contenu pour préserver la hiérarchie sémantique de la route.
const accessibleTitle = computed<string | undefined>(() => page.value?.headline)

// 9. Actions et handlers

// 10. Watch et watchEffect

// 11. Metadonnees ecran ou page
// Métadonnées SEO construites depuis la page contact et les biens disponibles pour le JSON-LD.
usePageSeo(page, accommodations)

// 12. Lifecycle
</script>
