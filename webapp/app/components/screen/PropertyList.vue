<template>
  <section
    ref="stageRef"
    class="screen-property-list bg-background relative h-full w-full overflow-hidden overscroll-none"
  >
    <h2 class="sr-only">
      {{
        activeRealEstateListingSlug
          ? `Liste des biens : ${activeRealEstateListingSlug.replaceAll('-', ' ')}`
          : 'Liste des biens immobiliers'
      }}
    </h2>

    <p v-if="activeRealEstateListingDescription" class="sr-only">
      {{ activeRealEstateListingDescription }}
    </p>

    <p v-if="activeCategoryDescription" class="sr-only">
      {{ activeCategoryDescription }}
    </p>

    <div
      ref="navigationRef"
      class="relative h-full w-full overflow-hidden focus:outline-none"
      tabindex="0"
      @keydown="onKeydown"
    >
      <Transition name="property-filter" mode="out-in">
        <LazyLineProperty
          :key="propertyFilterTransitionKey"
          :on-line-property-ref-update="handleLinePropertyRefUpdate"
          :accommodations="renderedItemsList"
          :view-mode-list="viewModeList"
          :screen-width="screenWidth"
          :zoom-scale="zoomScale"
          :cinema-mode="cinemaMode"
          :cinema-overlay-class="cinemaOverlayClass"
          :get-alt-text="getAltText"
        />
      </Transition>

      <LazyPropertyOverlayGridList
        :value="activeRealEstateListingSlug"
        :items="realEstateListingOptions"
        :accommodation-categories="accommodationCategories"
        :active-category-slug="activeCategorySlug"
        :current="index + 1"
        :total="safeItemsList.length || 1"
        :progress="progress"
        @update:value="selectRealEstateListing"
        @select-category="selectCategory"
        @prev="goPrev"
        @next="goNext"
        @next-screen="emit('next-screen')"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
// 1. Imports

// 2. Types et constantes statiques
type PropertyListProps = {
  totalCount?: number
  itemsList?: PropertyItem[][]
  activeRealEstateListingSlug?: string
}

const columnTemplate: ScreenColumnTemplate = 'single'
const WHEEL_GESTURE_RELEASE_MS = 90
const TOUCH_SWIPE_THRESHOLD_PX = 48

// 3. Props et emits
const emit = defineEmits<{
  (e: 'next-screen'): void
}>()

const props = defineProps<PropertyListProps>()

// 4. Composables, stores, routeur
const logger = useLogger({ module: 'screen-property-list' })
const { viewModeList, itemsList: defaultItemsList } = useAccommodation()
const metadataStore = useMetadataStore()
const localePath = useLocalePath()
const { warmQuickActionTarget } = useQuickActionWarmup()
const { setScreenMeta } = useScreenSystem()
const { cinemaOverlayClass, cinemaMode } = useDesignSystem()

// 5. Etat local
const warmedPropertyDetailTargets = new Set<string>()

const selectedCategorySlug = ref<string | null>(null)
const isBackgroundListReady = ref(false)
const stageRef = ref<HTMLElement | null>(null)
const navigationRef = ref<HTMLDivElement | null>(null)
const linePropertyRef = ref<HTMLDivElement | null>(null)
const index = ref(0)
const viewportW = ref(typeof window === 'undefined' ? 1 : window.innerWidth)

let wheelLock = false
let wheelUnlockTimer: number | null = null
let resizeObserver: ResizeObserver | null = null
const touchStartPoint = reactive({ x: 0, y: 0 })
const touchCurrentPoint = reactive({ x: 0, y: 0 })
let isTouchTracking = false

// 6. Data inputs

// 7. Validation et helpers purs
const getChunkSize = (): number => (viewModeList.value === 'single' ? 1 : 4)

const chunkPropertyItems = (items: PropertyItem[], size: number): PropertyItem[][] => {
  if (size <= 0) return []
  const chunks: PropertyItem[][] = []
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }
  return chunks
}

// 8. Computed UI-ready
const sourceItemsList = computed<PropertyItem[][]>(() => {
  const sourceItemsList = props.itemsList ?? defaultItemsList.value
  return Array.isArray(sourceItemsList) ? sourceItemsList : []
})

const sourcePropertyItems = computed<PropertyItem[]>(() => sourceItemsList.value.flat())
const { accommodationCategories, realEstateListingOptions } =
  usePropertyListOptions(sourcePropertyItems)

const safeItemsList = computed<PropertyItem[][]>(() => {
  if (!selectedCategorySlug.value) return sourceItemsList.value

  const filteredItems = sourcePropertyItems.value.filter(
    (item) => item.categorySlug === selectedCategorySlug.value,
  )

  return chunkPropertyItems(filteredItems, getChunkSize())
})

const renderedItemsList = computed(() => {
  if (!isBackgroundListReady.value) {
    return safeItemsList.value.slice(0, 1)
  }

  return safeItemsList.value
})

const activeRealEstateListingSlug = computed<string>(() => {
  return props.activeRealEstateListingSlug ?? realEstateListingOptions.value[0]?.value ?? ''
})

const activeRealEstateListingDescription = computed<string | null>(() => {
  const listing = metadataStore.getAccommodationRealEstateListings.find(
    (item) => item.slug === activeRealEstateListingSlug.value,
  )

  return listing?.text ?? null
})

const activeCategoryDescription = computed<string | null>(() => {
  if (!selectedCategorySlug.value) return null

  const category = metadataStore.getAccommodationCategories.find(
    (item) => item.slug === selectedCategorySlug.value,
  )

  return category?.text ?? null
})

const activeCategorySlug = computed<string | null>(() => selectedCategorySlug.value)
const propertyFilterTransitionKey = computed<string>(() => {
  return `${activeRealEstateListingSlug.value}:${activeCategorySlug.value ?? 'all'}`
})

const getMaxIndex = (): number => Math.max(0, safeItemsList.value.length - 1)
const maxIndex = computed(getMaxIndex)

const getProgress = (): number => (maxIndex.value === 0 ? 0 : index.value / maxIndex.value)
const progress = computed(getProgress)

const getViewportWidth = (): number => {
  const stageWidth = stageRef.value?.clientWidth
  if (typeof stageWidth === 'number' && stageWidth > 0) return stageWidth
  if (typeof window !== 'undefined' && window.innerWidth) return window.innerWidth
  return viewportW.value || 1
}

// Sortie statique : aucune mesure de fenetre n'aura lieu, la largeur vaudrait
// 1 pixel et chaque bien serait invisible. Le CSS prend le relais.
const isStaticOutput = useRuntimeConfig().public.staticOutput === true

const getScreenWidth = (): string =>
  isStaticOutput ? '100vw' : `${Math.max(1, viewportW.value)}px`
const screenWidth = computed(getScreenWidth)

const getPropertyItemsToWarm = (): PropertyItem[] => {
  return [safeItemsList.value[index.value], safeItemsList.value[index.value + 1]]
    .filter((screen): screen is PropertyItem[] => Array.isArray(screen))
    .flat()
    .filter((item) => typeof item.href === 'string' && item.href.trim().length > 0)
}

const warmPropertyDetailTargets = (): void => {
  const targets = getPropertyItemsToWarm()
    .map((item) => item.href)
    .filter((href, hrefIndex, hrefs) => hrefs.indexOf(href) === hrefIndex)
    .filter((href) => !warmedPropertyDetailTargets.has(href))

  if (targets.length === 0) return

  targets.forEach((to) => {
    warmedPropertyDetailTargets.add(to)

    warmQuickActionTarget({
      id: `property-list-detail:${to}`,
      to,
    })
  })

  logger.info('Warm property detail targets', {
    screenId: 'screen-property-list',
    index: index.value,
    targets,
  })
}

const applyTransformForIndex = (i: number): void => {
  const el = linePropertyRef.value
  if (!el) return

  const maxRenderedIndex = Math.max(0, renderedItemsList.value.length - 1)
  const safeIndex = Math.min(maxRenderedIndex, Math.max(0, i))
  const w = Math.max(1, getViewportWidth())

  viewportW.value = w
  el.style.transform = `translate3d(${-safeIndex * w}px, 0, 0)`
}

const clampIndex = (i: number): number => {
  return Math.min(maxIndex.value, Math.max(0, i))
}

const getAltText = (title?: string, city?: string): string => {
  if (title && city) return `${title} - ${city}`
  if (title) return title
  if (city) return city
  return 'Visuel immobilier'
}

const syncLayoutNextFrame = (): void => {
  if (typeof window === 'undefined') return
  requestAnimationFrame(() => {
    applyTransformForIndex(index.value)
  })
}

const { zoomScale, isAnimating, transitionToIndex, resetTransitionState, cancelTransition } =
  useTransitions({
    linePropertyRef,
    viewportW,
    index,
    maxIndex,
    applyTransformForIndex,
  })

// 9. Actions et handlers
const handleLinePropertyRefUpdate = (element: HTMLDivElement | null): void => {
  linePropertyRef.value = element
}

const selectCategory = (categorySlug: string | null): void => {
  selectedCategorySlug.value = categorySlug || null
}

const selectRealEstateListing = async (listingSlug: string): Promise<void> => {
  if (!listingSlug || listingSlug === activeRealEstateListingSlug.value) return

  await navigateTo(localePath(`/properties/${listingSlug}`))
}

const goNext = (): void => {
  if (!isBackgroundListReady.value) return
  transitionToIndex(index.value + 1)
}

const goPrev = (): void => {
  if (!isBackgroundListReady.value) return
  transitionToIndex(index.value - 1)
}

const goHome = (): void => {
  if (!isBackgroundListReady.value) return
  transitionToIndex(0)
}

const goEnd = (): void => {
  if (!isBackgroundListReady.value) return
  transitionToIndex(maxIndex.value)
}

const isInteractiveEventTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false

  return Boolean(
    target.closest(
      'a, button, input, textarea, select, option, label, summary, [role="button"], [contenteditable="true"], [data-no-swipe]',
    ),
  )
}

const unlockWheel = (): void => {
  wheelLock = false
  wheelUnlockTimer = null
}

const lockWheel = (): void => {
  wheelLock = true
  if (wheelUnlockTimer) window.clearTimeout(wheelUnlockTimer)
  wheelUnlockTimer = window.setTimeout(unlockWheel, WHEEL_GESTURE_RELEASE_MS)
}

const onWheel = (e: WheelEvent): void => {
  if (!isBackgroundListReady.value) return
  if (wheelLock || isAnimating.value) {
    e.preventDefault()
    lockWheel()
    return
  }

  const dx = Math.abs(e.deltaX)
  const dy = Math.abs(e.deltaY)
  const dominant = dx > dy ? e.deltaX : e.deltaY

  if (dominant > 0) {
    e.preventDefault()
    lockWheel()
    goNext()
  } else if (dominant < 0) {
    e.preventDefault()
    lockWheel()
    goPrev()
  }
}

const onTouchStart = (e: TouchEvent): void => {
  if (!isBackgroundListReady.value) return
  if (isAnimating.value || e.touches.length !== 1) return
  if (isInteractiveEventTarget(e.target)) return

  const touch = e.touches[0]
  if (!touch) return

  touchStartPoint.x = touch.clientX
  touchStartPoint.y = touch.clientY
  touchCurrentPoint.x = touch.clientX
  touchCurrentPoint.y = touch.clientY
  isTouchTracking = true
}

const onTouchMove = (e: TouchEvent): void => {
  if (!isBackgroundListReady.value) return
  if (!isTouchTracking || e.touches.length !== 1) return

  const touch = e.touches[0]
  if (!touch) return

  touchCurrentPoint.x = touch.clientX
  touchCurrentPoint.y = touch.clientY

  const deltaX = touchCurrentPoint.x - touchStartPoint.x
  const deltaY = touchCurrentPoint.y - touchStartPoint.y

  if (
    Math.abs(deltaX) >= TOUCH_SWIPE_THRESHOLD_PX ||
    Math.abs(deltaY) >= TOUCH_SWIPE_THRESHOLD_PX
  ) {
    e.preventDefault()
  }
}

const onTouchEnd = (): void => {
  if (!isBackgroundListReady.value) return

  if (!isTouchTracking || isAnimating.value) {
    isTouchTracking = false
    return
  }

  const deltaX = touchCurrentPoint.x - touchStartPoint.x
  const deltaY = touchCurrentPoint.y - touchStartPoint.y
  const absDeltaX = Math.abs(deltaX)
  const absDeltaY = Math.abs(deltaY)

  if (absDeltaX > absDeltaY && absDeltaX >= TOUCH_SWIPE_THRESHOLD_PX) {
    if (deltaX < 0) goNext()
    if (deltaX > 0) goPrev()
  }

  if (absDeltaY > absDeltaX && absDeltaY >= TOUCH_SWIPE_THRESHOLD_PX) {
    if (deltaY < 0) goNext()
    if (deltaY > 0) goPrev()
  }

  isTouchTracking = false
}

const onKeydown = (e: KeyboardEvent): void => {
  if (!isBackgroundListReady.value) return

  const target = e.target as HTMLElement | null
  const tag = target?.tagName?.toLowerCase()
  const isTyping =
    tag === 'input' || tag === 'textarea' || target?.getAttribute('contenteditable') === 'true'

  if (isTyping) return

  switch (e.key) {
    case 'ArrowRight':
    case 'ArrowDown':
      e.preventDefault()
      goNext()
      break
    case 'ArrowLeft':
    case 'ArrowUp':
      e.preventDefault()
      goPrev()
      break
    case 'Home':
      e.preventDefault()
      goHome()
      break
    case 'End':
      e.preventDefault()
      goEnd()
      break
  }
}

const onResize = (): void => {
  viewportW.value = getViewportWidth()
  applyTransformForIndex(index.value)
}

const startResizeObserver = (): void => {
  if (typeof ResizeObserver === 'undefined') return
  const el = stageRef.value
  if (!el) return

  resizeObserver = new ResizeObserver((entries) => {
    const entry = entries[0]
    const width = entry?.contentRect?.width ?? 0
    if (width <= 0) return
    viewportW.value = Math.max(1, width)
    applyTransformForIndex(index.value)
  })

  resizeObserver.observe(el)
}

const stopResizeObserver = (): void => {
  resizeObserver?.disconnect()
  resizeObserver = null
}

const getViewModeList = (): typeof viewModeList.value => viewModeList.value
const getScreensLength = (): number => safeItemsList.value.length

const handleViewModeListChange = async (): Promise<void> => {
  index.value = clampIndex(index.value)
  await nextTick()
  applyTransformForIndex(index.value)
  resetTransitionState()
  syncLayoutNextFrame()
  warmPropertyDetailTargets()
}

const handleScreensChange = async (): Promise<void> => {
  index.value = clampIndex(index.value)
  await nextTick()
  applyTransformForIndex(index.value)
  syncLayoutNextFrame()
  warmPropertyDetailTargets()
}

const handleCategoryChange = async (): Promise<void> => {
  index.value = 0
  await nextTick()
  applyTransformForIndex(index.value)
  syncLayoutNextFrame()
  warmPropertyDetailTargets()
}

// 10. Watch et watchEffect
watch(getViewModeList, handleViewModeListChange)
watch(getScreensLength, handleScreensChange)
watch(selectedCategorySlug, handleCategoryChange)

watch(index, () => {
  syncLayoutNextFrame()
  warmPropertyDetailTargets()
})

watch(linePropertyRef, (element) => {
  if (element) {
    syncLayoutNextFrame()
  }
})

// 11. Metadonnees ecran ou page

// 12. Lifecycle
const handleMounted = (): void => {
  setScreenMeta('screen-property-list', {
    type: 'landing',
    navigator: {
      enabled: false,
    },
    logo: {
      visible: true,
    },
    layout: {
      column: columnTemplate,
      contentZone: 'none',
      imageZone: 'background',
      hasBackgroundImage: true,
    },
  })

  viewportW.value = getViewportWidth()
  applyTransformForIndex(index.value)
  syncLayoutNextFrame()
  warmPropertyDetailTargets()

  navigationRef.value?.addEventListener('wheel', onWheel, { passive: false })
  navigationRef.value?.addEventListener('touchstart', onTouchStart, { passive: true })
  navigationRef.value?.addEventListener('touchmove', onTouchMove, { passive: false })
  navigationRef.value?.addEventListener('touchend', onTouchEnd, { passive: true })
  navigationRef.value?.addEventListener('touchcancel', onTouchEnd, { passive: true })
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('resize', onResize)
  startResizeObserver()

  requestAnimationFrame(() => {
    isBackgroundListReady.value = true
    warmPropertyDetailTargets()
  })
}

const handleBeforeUnmount = (): void => {
  navigationRef.value?.removeEventListener('wheel', onWheel)
  navigationRef.value?.removeEventListener('touchstart', onTouchStart)
  navigationRef.value?.removeEventListener('touchmove', onTouchMove)
  navigationRef.value?.removeEventListener('touchend', onTouchEnd)
  navigationRef.value?.removeEventListener('touchcancel', onTouchEnd)
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('resize', onResize)
  stopResizeObserver()

  cancelTransition()
  if (wheelUnlockTimer) window.clearTimeout(wheelUnlockTimer)
}

onMounted(handleMounted)
onBeforeUnmount(handleBeforeUnmount)
</script>

<style scoped>
.property-filter-enter-active,
.property-filter-leave-active {
  transition:
    opacity 180ms ease,
    transform 220ms ease;
}

.property-filter-enter-from {
  opacity: 0;
  transform: scale(1.01);
}

.property-filter-leave-to {
  opacity: 0;
  transform: scale(0.995);
}

.overlay-grid {
  pointer-events: none;
  position: absolute;
  inset: 0;
  z-index: 20;
  display: grid;
  grid-template-columns: 1fr min(100%, 56rem) 1fr;
}

@media (min-width: 1536px) {
  .overlay-grid {
    grid-template-columns: 1fr min(100%, 76rem) 1fr;
  }
}

.rail {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: rgba(255, 255, 255, 0.12);
  overflow: hidden;
}

.rail::after {
  content: '';
  position: absolute;
  top: -120%;
  left: 0;
  width: 100%;
  height: 120%;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(255, 255, 255, 0.4) 30%,
    rgba(255, 255, 255, 1) 50%,
    rgba(255, 255, 255, 0.4) 70%,
    transparent 100%
  );
  opacity: 0.6;
  animation: lineMove 3.2s linear infinite;
}

@keyframes lineMove {
  0% {
    transform: translateY(0%);
  }
  100% {
    transform: translateY(300%);
  }
}

@media (max-width: 1024px) {
  .rail::after {
    height: 100%;
  }
}
</style>
