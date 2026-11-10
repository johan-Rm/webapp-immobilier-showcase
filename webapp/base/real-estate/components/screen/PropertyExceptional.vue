<template>
  <!--
    Orchestrateur du parcours immersif horizontal d'un bien d'exception.
    Monte le rail (RÉGION A) et les surcouches (B→F). Coexistence avec le
    useScreenSystem vertical : capture totale via `navigator.enabled:false`
    + handoff `next-screen` en fin de rail (patron ScreenPropertyList).
    Les surcouches `fixed` permanentes (synthèse, progressbar, mode lecture)
    ne s'affichent que lorsque l'écran parcours est l'écran vertical actif.
  -->
  <div
    ref="rootRef"
    class="bg-background font-body relative h-dvh min-h-screen w-full overflow-hidden"
  >
    <h1 class="sr-only">{{ summary.name }} — {{ summary.location }}</h1>

    <!-- RÉGION A — Rail horizontal (scroll-snap). Molette verticale → horizontal (composable). -->
    <div
      ref="scrollerRef"
      class="flex h-full w-full snap-x snap-mandatory [scrollbar-width:none] overflow-x-auto overflow-y-hidden overscroll-x-contain scroll-smooth [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      :style="scrollerStyle"
    >
      <section
        v-for="(screen, index) in screens"
        :id="screen.id"
        :key="screen.id"
        :ref="(el) => registerScreen(el, screen.id)"
        class="relative h-full w-screen shrink-0 snap-start snap-always overflow-hidden"
      >
        <PropertyExceptionalSplit
          v-if="screen.template === 'SCREEN_04'"
          :screen="screen"
          :eager="index === 0"
          @go-next="goToNext(screen.id)"
        />
        <PropertyExceptionalOverlay
          v-else-if="screen.template === 'SCREEN_02'"
          :screen="screen"
          :eager="index === 0"
        />
        <PropertyExceptionalFull
          v-else-if="screen.template === 'SCREEN_03'"
          :screen="screen"
          :eager="index === 0"
          :is-first="index === 0"
        />
        <PropertyExceptionalTriptych
          v-else-if="screen.template === 'SCREEN_01'"
          :screen="screen"
          @open-lightbox="openLightbox"
          @go-next="goToNext(screen.id)"
        />
        <PropertyExceptionalCarousel
          v-else-if="screen.template === 'SCREEN_05'"
          :screen="screen"
          :active-media-index="currentMediaIndex(screen.id)"
          @select-media="(mediaIndex: number) => selectMedia(screen.id, mediaIndex)"
        />
        <PropertyExceptionalDuo v-else-if="screen.template === 'SCREEN_06'" :screen="screen" />
        <PropertyExceptionalContact
          v-else
          :title="screen.title"
          :property-reference="summary.reference"
          :contact-image="summary.contactImage"
        />
      </section>
    </div>

    <!-- RÉGION B — Mode lecture (déclencheur du travelling cinématique, desktop, écran actif). -->
    <button
      v-if="isScreenActive && canStartReadingMode"
      type="button"
      class="fixed top-1/2 right-5 z-50 hidden -translate-y-1/2 animate-pulse items-center text-white/70 transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white md:right-4 md:flex"
      :aria-label="readingModeButtonLabel"
      :aria-pressed="false"
      @click="toggleReadingMode"
    >
      <UIcon :name="readingModeIcon" class="text-4xl" aria-hidden="true" />
    </button>

    <!-- RÉGION C — Synthèse fixe (repère permanent + ouverture du drawer). -->
    <PropertyExceptionalSummary
      v-if="isScreenActive"
      :summary="summary"
      :badges="badges"
      :expanded="isInfoPanelOpen"
      @open-info="openInfoPanel"
    />

    <!-- RÉGION D — Barre de progression dans le parcours. -->
    <div v-if="isScreenActive" class="absolute inset-x-0 bottom-0 z-50 h-1 bg-white/15">
      <div
        class="h-full origin-left bg-white/90 transition-transform duration-500"
        :style="{ transform: `scaleX(${progress})` }"
      />
    </div>

    <!-- RÉGION E — Lightbox du triptyque (overlay modal). -->
    <PropertyExceptionalLightbox
      :media="currentLightboxMedia"
      :has-multiple="hasMultipleLightboxMedia"
      :index="lightboxIndex"
      :total="lightboxTotal"
      @close="closeLightbox"
      @navigate="showLightboxAt"
    />

    <!-- RÉGION F — Panneau d'infos du bien (drawer gauche). -->
    <PropertyDetailDrawer
      :open="isInfoPanelOpen"
      content-class="w-[38%] max-w-xl"
      aria-label="Détails du bien"
      @update:open="(value: boolean) => (value ? undefined : closeInfoPanel())"
    >
      <PropertyDetailPanel
        ref="detailPanel"
        :property="accommodation"
        :place-label="panelData.placeLabel"
        :offer-label="panelData.offerLabel"
        :listing-label="panelData.listingLabel"
        :category-label="panelData.categoryLabel"
        :summary-items="panelData.summaryItems"
        :detail-items="panelData.detailItems"
        :feature-items="panelData.featureItems"
        :sections="panelData.sections"
      />
    </PropertyDetailDrawer>
  </div>
</template>

<script setup lang="ts">
// 1. Imports
import {
  deriveExceptionalBadges,
  deriveExceptionalScreens,
  deriveExceptionalSummary,
} from '@services/mapper/exceptional'

// 2. Types et constantes statiques
// Le parcours remplace le détail classique dans la même section verticale.
type DetailPanelExpose = {
  resetScrollPosition: () => void
}

const SCREEN_ID = 'screen-property-detail'
const columnTemplate: ScreenColumnTemplate = 'single'

// 3. Props et emits
const props = defineProps<{ slug: string }>()
const emit = defineEmits<{ 'next-screen': [] }>()

// 4. Composables, stores, routeur
const store = useAccommodationStore()
const { screenStatus, setScreenMeta } = useScreenSystem()
const detailPanel = useTemplateRef<DetailPanelExpose>('detailPanel')

// 6. Data inputs
const accommodation = computed(() => store.getAccommodationBySlug(props.slug))
const { panelData } = usePropertyDetailPanelData(accommodation)

// 8. Computed UI-ready
const screens = computed(() => deriveExceptionalScreens(accommodation.value))
const summary = computed(() => deriveExceptionalSummary(accommodation.value, screens.value))
const badges = computed(() => deriveExceptionalBadges(accommodation.value))
const isScreenActive = computed(() => screenStatus.value.currentId === SCREEN_ID)

// 4bis. Logique du rail (état + handlers), avec handoff vertical en fin de parcours.
const {
  scrollerRef,
  rootRef,
  isInfoPanelOpen,
  lightboxIndex,
  progress,
  canStartReadingMode,
  readingModeIcon,
  readingModeButtonLabel,
  scrollerStyle,
  currentLightboxMedia,
  hasMultipleLightboxMedia,
  lightboxTotal,
  currentMediaIndex,
  registerScreen,
  selectMedia,
  openLightbox,
  closeLightbox,
  showLightboxAt,
  goToNext,
  openInfoPanel,
  closeInfoPanel,
  toggleReadingMode,
} = useExceptionalRail({
  screens,
  isActive: isScreenActive,
  onRequestNextScreen: () => emit('next-screen'),
})

// 10. Watch et watchEffect
watch(isInfoPanelOpen, async (isOpen) => {
  if (!isOpen) return
  await nextTick()
  detailPanel.value?.resetScrollPosition()
})

// 11. Métadonnées écran
// Capture totale de la navigation verticale tant que le parcours tient l'interaction
// (patron ScreenPropertyList) + logo visible sur l'imagerie sombre plein écran.
watchEffect(() => {
  setScreenMeta(SCREEN_ID, {
    type: 'landing',
    navigator: { enabled: false },
    logo: { visible: true },
    layout: { column: columnTemplate, contentZone: 'none', imageZone: 'background' },
  })
})
</script>
