<template>
  <div class="screen-panel-scroll-dual-synced bg-background text-foreground" :class="rootGridClass">
    <div class="relative px-4 pt-24 pb-16 sm:pb-20 2xl:px-8 2xl:pt-64" :class="contentColumnClass">
      <LazyHeadingH2Screen>
        {{ sectionTitle }}
      </LazyHeadingH2Screen>

      <div class="h-full w-full">
        <Transition name="fade" mode="out-in">
          <LazyPanelActiveContent
            :key="`panel-${activeIndex}`"
            :panel="panels[activeIndex] ?? null"
            :active-index="activeIndex"
          />
        </Transition>
      </div>

      <div class="sr-only" aria-hidden="true">
        <h3 v-for="panel in panels" :key="`semantic-${panel.title}`">
          {{ panel.title }}
        </h3>
      </div>
    </div>

    <div class="row-start-1 h-full min-h-0 min-w-0 overflow-hidden md:row-auto">
      <LazyCarouselPanel
        v-if="shouldMountVisuals"
        :items="panels"
        :active-index="activeIndex"
        :load-all-images="shouldLoadAllVisuals"
        @images-loaded="handleCarouselImagesLoaded"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
// 1. Imports

// 2. Types et constantes statiques
type PanelScrollDualSyncedProps = {
  data?: CreativeWork
}

type Panel = {
  category: string
  title: string
  image: string
  paragraphs: string[]
}

const columnTemplate: ScreenColumnTemplate = 'split-33-67'
const SCREEN_ID = 'screen-panel-scroll-dual-synced'
const AUTOPLAY_DELAY_MS = 4500

// 3. Props et emits
const props = defineProps<PanelScrollDualSyncedProps>()

// 4. Composables, stores, routeur
const { setScreenMeta } = useScreenSystem()
const { isTabletPortrait, isPhoneDevice } = useDeviceDetect()
const reducedMotion = usePreferredReducedMotion()
const currentScreenId = useState<string | null>('screen.current', () => null)

// 5. Etat local
const activeIndex = ref(0)
// Sortie statique : aucun montage client n'aura lieu, les visuels doivent etre
// presents des le rendu serveur.
const hasMounted = ref(useRuntimeConfig().public.staticOutput === true)
const hasLoadedCarouselImages = ref(false)

let autoplayIntervalId: number | null = null

// 6. Data inputs

// 7. Validation et helpers purs
const getParagraphsFromText = (text: string | undefined): string[] => {
  if (typeof text !== 'string' || text.trim().length === 0) return []

  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0)
}

// 8. Computed UI-ready
const panels = computed<Panel[]>(() => {
  return (props.data?.hasPart ?? [])
    .map((part) => {
      const title = part.headline?.trim()
      const category = typeof part.additionalType === 'string' ? part.additionalType.trim() : ''
      const paragraphs = getParagraphsFromText(part.text)
      const image = part.image

      const imageUrl =
        typeof image === 'string'
          ? image.trim()
          : image &&
              typeof image === 'object' &&
              !Array.isArray(image) &&
              typeof image.url === 'string'
            ? image.url.trim()
            : ''

      if (!title || !category || paragraphs.length === 0 || !imageUrl) return null

      return {
        category,
        title,
        image: imageUrl,
        paragraphs,
      }
    })
    .filter((panel): panel is Panel => panel !== null)
})

const panelSignature = computed<string>(() => {
  return panels.value.map((panel) => `${panel.title}:${panel.image}`).join('|')
})

const shouldMountVisuals = computed<boolean>(() => hasMounted.value && panels.value.length > 0)

const isScreenActive = computed<boolean>(() => currentScreenId.value === SCREEN_ID)

const shouldLoadAllVisuals = computed<boolean>(
  () => shouldMountVisuals.value && isScreenActive.value,
)

const sectionTitle = computed<string>(() => props.data?.headline?.trim() ?? '')

const rootGridClass = computed<string>(() => {
  const baseClass = 'grid min-h-0'

  if (isTabletPortrait.value) return `${baseClass} h-dvh grid-cols-1 grid-rows-[45%_1fr]`
  if (!isPhoneDevice.value) return `${baseClass} h-full grid-cols-[33.33%_66.67%] grid-rows-1`
  return `${baseClass} h-dvh grid-cols-1 grid-rows-1`
})

const contentColumnClass = computed<string>(() => {
  const baseClass = 'relative flex min-w-0 flex-col overflow-hidden'
  return isTabletPortrait.value
    ? `${baseClass} row-start-2 h-full`
    : `${baseClass} row-start-1 h-full`
})

// 9. Actions et handlers
const stopAutoplay = (): void => {
  if (autoplayIntervalId !== null) {
    window.clearInterval(autoplayIntervalId)
    autoplayIntervalId = null
  }
}

const startAutoplay = (): void => {
  stopAutoplay()

  if (
    !shouldLoadAllVisuals.value ||
    !hasLoadedCarouselImages.value ||
    reducedMotion.value === 'reduce' ||
    panels.value.length <= 1
  ) {
    return
  }

  autoplayIntervalId = window.setInterval(() => {
    activeIndex.value = (activeIndex.value + 1) % panels.value.length
  }, AUTOPLAY_DELAY_MS)
}

const handleCarouselImagesLoaded = (): void => {
  if (!shouldLoadAllVisuals.value) return

  hasLoadedCarouselImages.value = true
}

// 10. Watch et watchEffect
watchEffect(() => {
  if (panels.value.length === 0) {
    activeIndex.value = 0
    return
  }

  if (activeIndex.value >= panels.value.length) {
    activeIndex.value = 0
  }
})

watch(
  panelSignature,
  () => {
    stopAutoplay()
    activeIndex.value = 0
    hasLoadedCarouselImages.value = false
  },
  {
    flush: 'sync',
  },
)

watch(
  () => [panelSignature.value, shouldLoadAllVisuals.value, hasLoadedCarouselImages.value] as const,
  async () => {
    stopAutoplay()

    activeIndex.value = 0

    if (!shouldLoadAllVisuals.value || !hasLoadedCarouselImages.value) return

    await nextTick()
    startAutoplay()
  },
  {
    immediate: true,
    flush: 'post',
  },
)

// 11. Metadonnees ecran ou page

// 12. Lifecycle
onMounted(() => {
  hasMounted.value = true

  setScreenMeta(SCREEN_ID, {
    type: 'standard',
    logo: { visible: true },
    layout: {
      column: columnTemplate,
      contentZone: 'left',
      imageZone: 'right',
    },
  })
})

onUnmounted(() => {
  stopAutoplay()
})
</script>
