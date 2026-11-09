<template>
  <UPage ref="pageRef" :ui="screenUi.page">
    <!-- Titre réservé aux lecteurs d'écran et au SEO : la landing garde son rendu visuel immersif. -->
    <h1 v-if="accessibleTitle" class="sr-only">{{ accessibleTitle }}</h1>

    <!-- Premier écran critique : rendu immédiat pour préserver la perception de vitesse. -->
    <UPageSection :data-screen="SCREEN_IDS.landing" :ui="screenUi.pageSection">
      <component
        :is="activeLandingScreen.component"
        :data="landingScreenData"
        @next-screen="next"
      />
    </UPageSection>

    <!-- Sections secondaires montées après préparation du runtime pour alléger l'hydratation initiale. -->
    <UPageSection
      v-if="shouldRenderDeferredScreens"
      :data-screen="SCREEN_IDS.whyChooseShowcase"
      :ui="screenUi.pageSection"
    >
      <LazyScreenWhyChooseShowcase :data="whyChooseShowcaseData" />
    </UPageSection>

    <!-- Section éditoriale desktop uniquement : son format visuel est moins adapté aux petits écrans. -->
    <UPageSection
      v-if="shouldRenderDeferredScreens && !isPhoneDevice"
      :data-screen="SCREEN_IDS.essaouiraTheJewel"
      :ui="screenUi.pageSection"
    >
      <LazyScreenEssaouiraTheJewel :data="essaouiraTheJewelData" />
    </UPageSection>

    <UPageSection
      v-if="shouldRenderDeferredScreens"
      :data-screen="SCREEN_IDS.invest"
      :ui="screenUi.pageSection"
    >
      <LazyScreenInvesting :data="investData" />
    </UPageSection>

    <!-- Expérience synchronisée desktop : évite de charger une interaction dense sur mobile. -->
    <UPageSection
      v-if="shouldRenderDeferredScreens && !isPhoneDevice"
      :data-screen="SCREEN_IDS.panelScrollDualSynced"
      :ui="screenUi.pageSection"
    >
      <LazyScreenPanelScrollDualSynced :data="panelScrollDualSyncedData" />
    </UPageSection>

    <!-- Respiration éditoriale conservée hors mobile pour maintenir un parcours compact sur téléphone. -->
    <UPageSection
      v-if="shouldRenderDeferredScreens && !isPhoneDevice"
      :data-screen="SCREEN_IDS.blockquote"
      :ui="screenUi.pageSection"
    >
      <LazyScreenBlockquote :data="blockquoteData" />
    </UPageSection>

    <UPageSection
      v-if="shouldRenderDeferredScreens"
      :data-screen="SCREEN_IDS.realEstateThreeColProperties"
      :ui="screenUi.pageSection"
    >
      <LazyScreenRealEstateThreeColProperties :data="realEstateThreeColPropertiesData" />
    </UPageSection>

    <!-- Point de sortie de la page : contact, navigation et informations de confiance. -->
    <UPageSection
      v-if="shouldRenderDeferredScreens"
      :data-screen="SCREEN_IDS.footer"
      :ui="screenUi.pageSection"
    >
      <LazyScreenFooter :data="footerData" />
    </UPageSection>
  </UPage>
</template>

<script setup lang="ts">
// 1. Imports
import { defineAsyncComponent, type Component } from 'vue'

import ScreenRealEstateFullImage from '~/components/screen/real-estate/FullImage.vue'
import ScreenRealEstateRounded from '~/components/screen/real-estate/Rounded.vue'

// 2. Types et constantes statiques
/**
 * Associe une variante de landing à son slug public, à son bloc éditorial
 * et au composant Vue chargé de son rendu.
 */
type LandingScreenConfig = {
  slug: string
  screenId: string
  component: Component
}

// Identifiants stables des sections plein écran.
// Ils relient le contenu éditorial, les ancres URL et la navigation interne.
const SCREEN_IDS = {
  landing: 'screen-landing',
  realEstateFullImage: 'screen-real-estate-full-image',
  realEstateSplit: 'screen-real-estate-split',
  realEstateThreeColProperties: 'screen-real-estate-three-col-properties',
  whyChooseShowcase: 'screen-why-choose-showcase',
  essaouiraTheJewel: 'screen-essaouira-the-jewel',
  invest: 'screen-invest',
  panelScrollDualSynced: 'screen-panel-scroll-dual-synced',
  blockquote: 'screen-blockquote',
  footer: 'screen-footer',
} as const

// Slugs exposés dans la query string `landing`.
// Les garder séparés des ids d'écran évite de coupler l'URL publique à l'implémentation.
const LANDING_SLUGS = {
  fullImage: 'full-image',
  rounded: 'rounded',
  split: 'split',
  threeColProperties: 'three-col-properties',
} as const

const ScreenRealEstateSplit = defineAsyncComponent(
  () => import('~/components/screen/real-estate/Split.vue'),
)

const ScreenRealEstateThreeColProperties = defineAsyncComponent(
  () => import('~/components/screen/real-estate/ThreeColProperties.vue'),
)

// Registre local des variantes de landing disponibles pour la page d'accueil.
// Chaque entrée associe un slug public, le bloc éditorial attendu et le composant d'affichage.
const landingScreens = [
  {
    slug: LANDING_SLUGS.rounded,
    screenId: SCREEN_IDS.realEstateFullImage,
    component: ScreenRealEstateRounded,
  },
  {
    slug: LANDING_SLUGS.fullImage,
    screenId: SCREEN_IDS.realEstateFullImage,
    component: ScreenRealEstateFullImage,
  },
  {
    slug: LANDING_SLUGS.split,
    screenId: SCREEN_IDS.realEstateSplit,
    component: ScreenRealEstateSplit,
  },
  {
    slug: LANDING_SLUGS.threeColProperties,
    screenId: SCREEN_IDS.realEstateThreeColProperties,
    component: ScreenRealEstateThreeColProperties,
  },
] as const satisfies readonly LandingScreenConfig[]

const DEFAULT_LANDING_SLUG = LANDING_SLUGS.fullImage
// Fallback défensif : la page doit rester rendable même si le registre évolue
// sans conserver explicitement la variante par défaut.
const DEFAULT_LANDING_SCREEN =
  landingScreens.find((screen) => screen.slug === DEFAULT_LANDING_SLUG) ?? landingScreens[0]
const HOME_PAGE_SLUG = 'home'

// Mode partagé avec `useScreenSystem` pour conserver une transition cohérente
// entre la landing dynamique et les sections différées.
const transitionMode = 'cross-zoom'

// 3. Props et emits

// 4. Composables, stores, routeur
const { isPhoneDevice } = useDeviceDetect()
const route = useRoute()
const appConfig = useAppConfig()
const { getPageBySlug, getPageComponentByIdentifier } = useWebPage()
const { items: accommodations } = useAccommodation()
useContentVersion()
const { runtimeReady } = useDeferredRuntime()

// Référence du conteneur racine transmise au système d'écrans.
// Elle permet de limiter les interactions wheel/touch au viewport de cette route.
const pageRef = useTemplateRef<HTMLElement>('pageRef')

const { next, screenUi } = useScreenSystem({
  // Navigation horizontale pensée comme une exploration séquentielle de screens.
  axis: 'x',
  // Empêche le retour automatique au premier screen pour préserver un parcours maîtrisé.
  loop: false,
  // Garde une navigation clavier disponible pour l'accessibilité et les usages desktop.
  keyboard: true,
  // Active l'avancement automatique prévu par le système d'écrans.
  auto: true,
  // Autorise le swipe mobile avec un seuil volontairement franc pour éviter les erreurs.
  touch: true,
  touchThreshold: 60,
  // Limite les déclenchements successifs pendant les transitions tactiles.
  touchCooldownMs: 700,
  // Bloque le scroll natif quand le geste est pris en charge par la navigation écran.
  touchPreventScroll: true,
  // Active la navigation wheel desktop, calibrée avec un seuil plus élevé que le touch.
  wheel: true,
  wheelThreshold: 120,
  // Réduit les doubles déclenchements sur trackpads et molettes sensibles.
  wheelCooldownMs: 300,
  transitionMode,
  // Attache le système d'interaction au conteneur de page plutôt qu'au document global.
  container: pageRef,
  anchors: {
    // Les ancres rendent les screens adressables sans transformer la page en routing imbriqué.
    enabled: true,
    // Synchronisation explicite uniquement : évite qu'un simple scroll interne modifie l'URL.
    syncMode: 'explicit-only',
    // Nettoie le hash lors des navigations implicites pour éviter une URL trompeuse.
    clearHashOnImplicitNavigation: true,
  },
})

// 5. Etat local
// Les sections non critiques attendent que le runtime client soit prêt afin de préserver
// le rendu initial, l'hydratation et le poids JavaScript de la première vue.
// Les ecrans secondaires sont montes apres stabilisation du runtime, cote client.
// En capture statique, aucun script ne s'executera : ils doivent donc etre rendus
// des le serveur, faute de quoi la maquette se limite au premier ecran.
const shouldRenderDeferredScreens = ref(
  import.meta.prerender || useRuntimeConfig().public.staticOutput === true,
)

// 6. Data inputs
// Donnée éditoriale normalisée de la page d'accueil, résolue par slug stable.
const page = computed(() => getPageBySlug(HOME_PAGE_SLUG))

// 7. Validation et helpers purs
/**
 * Résout un bloc éditorial par identifiant dans la page active.
 *
 * La page orchestre les blocs, tandis que les composants restent responsables de l'affichage.
 *
 * @param identifier Identifiant du bloc attendu dans le contrat éditorial de la page.
 * @returns Le bloc correspondant lorsqu'il existe dans la page active.
 */
const getComponentByIdentifier = (identifier: string) =>
  getPageComponentByIdentifier(page.value, identifier)

// 8. Computed UI-ready
// Titre accessible hors écran : conserve un H1 indexable sans imposer de titre visuel
// dans une expérience plein écran déjà portée par les screens.
const accessibleTitle = computed<string | undefined>(() => appConfig.organization.fullName)

// Normalise la query `landing` pour garantir un choix déterministe côté SSR et client,
// y compris lorsque Nuxt reçoit plusieurs valeurs pour le même paramètre.
const landingParam = computed(() => {
  const raw = route.query.landing
  if (Array.isArray(raw)) return raw[0] ?? DEFAULT_LANDING_SLUG
  return typeof raw === 'string' && raw ? raw : DEFAULT_LANDING_SLUG
})

// Les slugs inconnus retombent sur la variante par défaut afin d'éviter un écran vide
// tout en gardant l'URL tolérante aux campagnes ou tests A/B invalides.
const activeLandingScreen = computed(() => {
  return (
    landingScreens.find((screen) => screen.slug === landingParam.value) ?? DEFAULT_LANDING_SCREEN
  )
})

// Identifiant du bloc éditorial attendu pour la variante de landing active.
const activeLandingScreenId = computed(() => activeLandingScreen.value.screenId)

// Données prêtes pour le composant dynamique de landing.
// `undefined` laisse le screen gérer son fallback sans bloquer la route.
const landingScreenData = computed(
  () => getComponentByIdentifier(activeLandingScreenId.value) ?? undefined,
)

// Les computed suivants exposent au template un contrat simple par screen.
// La page reste responsable de l'orchestration, pas du rendu détaillé des blocs.
const whyChooseShowcaseData = computed(
  () => getComponentByIdentifier(SCREEN_IDS.whyChooseShowcase) ?? undefined,
)

const essaouiraTheJewelData = computed(
  () => getComponentByIdentifier(SCREEN_IDS.essaouiraTheJewel) ?? undefined,
)

const investData = computed(() => getComponentByIdentifier(SCREEN_IDS.invest) ?? undefined)

const panelScrollDualSyncedData = computed(
  () => getComponentByIdentifier(SCREEN_IDS.panelScrollDualSynced) ?? undefined,
)

const blockquoteData = computed(() => getComponentByIdentifier(SCREEN_IDS.blockquote) ?? undefined)

const realEstateThreeColPropertiesData = computed(
  () => getComponentByIdentifier(SCREEN_IDS.realEstateThreeColProperties) ?? undefined,
)

const footerData = computed(() => getComponentByIdentifier(SCREEN_IDS.footer) ?? undefined)

// 9. Actions et handlers

// 10. Watch et watchEffect
watch(
  runtimeReady,
  (value) => {
    // Les sections secondaires sont montées après préparation du runtime pour réduire
    // le coût initial de la landing sans masquer le contenu une fois l'app stabilisée.
    if (value) {
      shouldRenderDeferredScreens.value = true
    }
  },
  { immediate: true },
)

// 11. Metadonnees ecran ou page
// Métadonnées SEO construites depuis le contenu éditorial et les biens disponibles.
// La page transmet des sources réactives strictes au composable dédié.
usePageSeo(page, accommodations)

// 12. Lifecycle
</script>
