import type { ExceptionalMedia, ExceptionalScreen } from '#shared/types/exceptional'
import type { ComponentPublicInstance, MaybeRefOrGetter } from 'vue'

/**
 * Logique réactive du rail horizontal du parcours immersif (bien d'exception).
 *
 * Encapsule le scroll-snap horizontal, la conversion molette → horizontal, la
 * navigation clavier, le mode lecture cinématique, l'autoplay des carousels,
 * la lightbox du triptyque, l'observation de l'écran actif et la préférence
 * d'animation réduite. SSR-safe (`window` résolu au montage).
 *
 * Coexistence avec le `useScreenSystem` vertical : ce composable ne touche pas
 * à `navigator` (la capture est posée par l'orchestrateur). Lorsqu'on atteint le
 * dernier écran et qu'un geste avant survient, il appelle `onRequestNextScreen`
 * pour rendre la main à la navigation verticale (patron `ScreenPropertyList`).
 */

// Vitesse de travelling du mode lecture : assez lent pour lire, sans effet de snap.
const READING_MODE_SCROLL_SPEED_PX_PER_SECOND = 280
// Cadence de défilement automatique des vignettes d'un écran carousel actif.
const CAROUSEL_AUTOPLAY_INTERVAL_MS = 3500
const TOUCH_SWIPE_THRESHOLD_PX = 48

type UseExceptionalRailOptions = {
  screens: MaybeRefOrGetter<readonly ExceptionalScreen[]>
  /** Vrai quand l'écran parcours est l'écran vertical actif (sinon handlers neutralisés). */
  isActive?: MaybeRefOrGetter<boolean>
  /** Rendu de la main à la navigation verticale en fin de rail. */
  onRequestNextScreen?: () => void
}

export const useExceptionalRail = (options: UseExceptionalRailOptions) => {
  const screens = computed<readonly ExceptionalScreen[]>(() => toValue(options.screens))
  const isActive = computed<boolean>(() => toValue(options.isActive ?? true))

  // Conteneur scrollable + racine (porte le listener `wheel` non passif).
  const scrollerRef = useTemplateRef<HTMLElement>('scrollerRef')
  const rootRef = useTemplateRef<HTMLElement>('rootRef')

  const screenElements = new Map<string, HTMLElement>()
  const activeScreenId = ref<string>(screens.value[0]?.id ?? 'contact')
  const galleryIndex = reactive<Record<string, number>>({})
  const touchStartPoint = reactive({ x: 0, y: 0 })
  const touchCurrentPoint = reactive({ x: 0, y: 0 })
  const isReadingModeActive = ref(false)
  const navigationInProgress = ref(false)
  const prefersReducedMotion = ref(false)
  const isInfoPanelOpen = ref(false)
  const lightboxMedia = ref<readonly ExceptionalMedia[] | null>(null)
  const lightboxIndex = ref(0)

  let screenObserver: IntersectionObserver | null = null
  let readingModeAnimationFrame: number | null = null
  let readingModePreviousTimestamp: number | null = null
  let carouselAutoplayTimer: ReturnType<typeof setInterval> | null = null
  let programmaticScrollEndTimer: ReturnType<typeof setTimeout> | null = null
  let isTouchTracking = false

  // Computed ------------------------------------------------------------------
  const total = computed<number>(() => screens.value.length)
  const activeIndex = computed<number>(() =>
    Math.max(
      0,
      screens.value.findIndex((screen) => screen.id === activeScreenId.value),
    ),
  )
  const progress = computed<number>(() =>
    total.value <= 1 ? 0 : activeIndex.value / (total.value - 1),
  )
  const hasNextScreen = computed<boolean>(() => activeIndex.value < total.value - 1)
  const isAtLastScreen = computed<boolean>(() => activeIndex.value >= total.value - 1)
  const canStartReadingMode = computed<boolean>(
    () =>
      activeIndex.value === 0 &&
      hasNextScreen.value &&
      !isReadingModeActive.value &&
      !prefersReducedMotion.value,
  )
  const readingModeIcon = computed<string>(() => 'i-heroicons-play-solid')
  const readingModeButtonLabel = computed<string>(
    () => 'Lancer le parcours automatique de la fiche',
  )
  const scrollerStyle = computed((): Record<string, string> | undefined => {
    if (isReadingModeActive.value) return { scrollBehavior: 'auto', scrollSnapType: 'none' }
    if (navigationInProgress.value) return { scrollSnapType: 'none' }
    return undefined
  })
  const currentLightboxMedia = computed<ExceptionalMedia | null>(() => {
    const media = lightboxMedia.value
    if (!media) return null
    return media[lightboxIndex.value] ?? media[0] ?? null
  })
  const hasMultipleLightboxMedia = computed<boolean>(() => (lightboxMedia.value?.length ?? 0) > 1)
  const lightboxTotal = computed<number>(() => lightboxMedia.value?.length ?? 0)

  // Carousel ------------------------------------------------------------------
  const currentMediaIndex = (id: string): number => galleryIndex[id] ?? 0

  const selectMedia = (id: string, mediaIndex: number): void => {
    galleryIndex[id] = mediaIndex
  }

  const stopCarouselAutoplay = (): void => {
    if (carouselAutoplayTimer !== null) {
      clearInterval(carouselAutoplayTimer)
      carouselAutoplayTimer = null
    }
  }

  const startCarouselAutoplay = (id: string): void => {
    stopCarouselAutoplay()
    if (prefersReducedMotion.value || isReadingModeActive.value) return
    const screen = screens.value.find((item) => item.id === id)
    if (!screen || screen.template !== 'SCREEN_05' || screen.media.length <= 1) return

    carouselAutoplayTimer = setInterval(() => {
      const current = galleryIndex[id] ?? 0
      galleryIndex[id] = (current + 1) % screen.media.length
    }, CAROUSEL_AUTOPLAY_INTERVAL_MS)
  }

  // Lightbox ------------------------------------------------------------------
  const openLightbox = (media: readonly ExceptionalMedia[], index: number): void => {
    if (media.length === 0) return
    lightboxMedia.value = media
    lightboxIndex.value = index
  }

  const closeLightbox = (): void => {
    lightboxMedia.value = null
  }

  const showLightboxAt = (offset: number): void => {
    const media = lightboxMedia.value
    if (!media) return
    lightboxIndex.value = (lightboxIndex.value + offset + media.length) % media.length
  }

  // Navigation ----------------------------------------------------------------
  const registerScreen = (el: Element | ComponentPublicInstance | null, id: string): void => {
    if (el instanceof HTMLElement) screenElements.set(id, el)
    else screenElements.delete(id)
  }

  const scrollToScreen = (id: string): void => {
    screenElements
      .get(id)
      ?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' })
  }

  const goToNext = (currentId: string): void => {
    const index = screens.value.findIndex((screen) => screen.id === currentId)
    const next = screens.value[index + 1]
    if (next) scrollToScreen(next.id)
  }

  const goToFirst = (): void => {
    const first = screens.value[0]
    if (first) scrollToScreen(first.id)
  }

  const goToLast = (): void => {
    const last = screens.value.at(-1)
    if (last) scrollToScreen(last.id)
  }

  // Panneau d'infos -----------------------------------------------------------
  const openInfoPanel = (): void => {
    stopReadingMode()
    isInfoPanelOpen.value = true
  }

  const closeInfoPanel = (): void => {
    isInfoPanelOpen.value = false
  }

  const goToContactFromPanel = (): void => {
    closeInfoPanel()
    scrollToScreen('contact')
  }

  // Mode lecture cinématique --------------------------------------------------
  const clearReadingModeAnimation = (): void => {
    if (readingModeAnimationFrame !== null) {
      cancelAnimationFrame(readingModeAnimationFrame)
      readingModeAnimationFrame = null
    }
    readingModePreviousTimestamp = null
  }

  function stopReadingMode(): void {
    isReadingModeActive.value = false
    clearReadingModeAnimation()
    startCarouselAutoplay(activeScreenId.value)
  }

  const runReadingModeFrame = (timestamp: number): void => {
    const scroller = scrollerRef.value
    if (!scroller || !isReadingModeActive.value) {
      stopReadingMode()
      return
    }

    const maxScrollLeft = Math.max(0, scroller.scrollWidth - scroller.clientWidth)
    const previousTimestamp = readingModePreviousTimestamp ?? timestamp
    const elapsedSeconds = Math.max(0, timestamp - previousTimestamp) / 1000
    const nextScrollLeft = Math.min(
      maxScrollLeft,
      scroller.scrollLeft + READING_MODE_SCROLL_SPEED_PX_PER_SECOND * elapsedSeconds,
    )

    readingModePreviousTimestamp = timestamp
    scroller.scrollLeft = nextScrollLeft

    if (nextScrollLeft >= maxScrollLeft) {
      stopReadingMode()
      return
    }

    readingModeAnimationFrame = requestAnimationFrame(runReadingModeFrame)
  }

  const startReadingMode = (): void => {
    const scroller = scrollerRef.value
    if (!scroller || !hasNextScreen.value) return
    clearReadingModeAnimation()
    stopCarouselAutoplay()
    isReadingModeActive.value = true
    readingModeAnimationFrame = requestAnimationFrame(runReadingModeFrame)
  }

  const toggleReadingMode = (): void => {
    if (isReadingModeActive.value) stopReadingMode()
    else startReadingMode()
  }

  // Navigation écran par écran + handoff vertical -----------------------------
  const goToAdjacentScreen = (direction: 1 | -1): void => {
    stopReadingMode()
    const scroller = scrollerRef.value
    const targetIndex = activeIndex.value + direction
    if (!scroller || targetIndex < 0 || targetIndex >= screens.value.length) return

    navigationInProgress.value = true
    scroller.scrollTo({ left: targetIndex * scroller.clientWidth, behavior: 'smooth' })

    if (programmaticScrollEndTimer !== null) clearTimeout(programmaticScrollEndTimer)
    programmaticScrollEndTimer = setTimeout(() => {
      navigationInProgress.value = false
      programmaticScrollEndTimer = null
    }, 500)
  }

  /** Rend la main à la navigation verticale (relance) en fin de rail. */
  const requestNextScreen = (): void => {
    stopReadingMode()
    options.onRequestNextScreen?.()
  }

  /** Avance dans le rail, ou bascule en vertical si on est déjà au dernier écran. */
  const advanceForward = (): void => {
    if (isAtLastScreen.value) requestNextScreen()
    else goToAdjacentScreen(1)
  }

  const handleWheel = (event: WheelEvent): void => {
    if (!isActive.value) return
    if (isInfoPanelOpen.value || lightboxMedia.value) return
    const deltaX = Math.abs(event.deltaX)
    const deltaY = Math.abs(event.deltaY)
    const dominantDelta = deltaX > deltaY ? event.deltaX : event.deltaY

    event.preventDefault()
    if (navigationInProgress.value) return
    if (dominantDelta > 0) advanceForward()
    else if (dominantDelta < 0) goToAdjacentScreen(-1)
  }

  const handleKeydown = (event: KeyboardEvent): void => {
    // La lightbox et le drawer captent le clavier même hors écran actif (surcouches modales).
    if (lightboxMedia.value) {
      if (event.key === 'Escape') closeLightbox()
      else if (event.key === 'ArrowRight') showLightboxAt(1)
      else if (event.key === 'ArrowLeft') showLightboxAt(-1)
      return
    }
    if (isInfoPanelOpen.value) {
      if (event.key === 'Escape') closeInfoPanel()
      return
    }
    // Navigation du rail : uniquement quand l'écran parcours est actif (sinon on laisse
    // le useScreenSystem vertical gérer les flèches sur la relance / le footer).
    if (!isActive.value) return
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault()
        advanceForward()
        break
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault()
        goToAdjacentScreen(-1)
        break
      case 'Home':
        event.preventDefault()
        goToFirst()
        break
      case 'End':
        event.preventDefault()
        goToLast()
        break
    }
  }

  const handleReadingModePointerInterrupt = (): void => {
    if (!isReadingModeActive.value) return
    stopReadingMode()
  }

  const isInteractiveEventTarget = (target: EventTarget | null): boolean => {
    if (!(target instanceof HTMLElement)) return false

    return Boolean(
      target.closest(
        [
          'a',
          'button',
          'input',
          'textarea',
          'select',
          'option',
          'label',
          'summary',
          '[role="button"]',
          '[contenteditable="true"]',
          '[data-no-swipe]',
          '[data-screen-touch-ignore]',
        ].join(', '),
      ),
    )
  }

  const handleTouchStart = (event: TouchEvent): void => {
    if (!isActive.value) return
    if (isInfoPanelOpen.value || lightboxMedia.value) return
    if (navigationInProgress.value || event.touches.length !== 1) return
    if (isInteractiveEventTarget(event.target)) return

    const touch = event.touches[0]
    if (!touch) return

    touchStartPoint.x = touch.clientX
    touchStartPoint.y = touch.clientY
    touchCurrentPoint.x = touch.clientX
    touchCurrentPoint.y = touch.clientY
    isTouchTracking = true
  }

  const handleTouchMove = (event: TouchEvent): void => {
    if (!isActive.value) return
    if (isInfoPanelOpen.value || lightboxMedia.value) return
    if (!isTouchTracking || event.touches.length !== 1) return

    const touch = event.touches[0]
    if (!touch) return

    touchCurrentPoint.x = touch.clientX
    touchCurrentPoint.y = touch.clientY

    const deltaX = touchCurrentPoint.x - touchStartPoint.x
    const deltaY = touchCurrentPoint.y - touchStartPoint.y
    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)

    if (
      (absX >= TOUCH_SWIPE_THRESHOLD_PX || absY >= TOUCH_SWIPE_THRESHOLD_PX) &&
      event.cancelable
    ) {
      event.preventDefault()
    }
  }

  const handleTouchEnd = (): void => {
    if (!isActive.value) {
      isTouchTracking = false
      return
    }

    if (
      !isTouchTracking ||
      isInfoPanelOpen.value ||
      lightboxMedia.value ||
      navigationInProgress.value
    ) {
      isTouchTracking = false
      return
    }

    const deltaX = touchCurrentPoint.x - touchStartPoint.x
    const deltaY = touchCurrentPoint.y - touchStartPoint.y
    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)

    if (absX > absY && absX >= TOUCH_SWIPE_THRESHOLD_PX) {
      if (deltaX < 0) advanceForward()
      if (deltaX > 0) goToAdjacentScreen(-1)
    }

    if (absY > absX && absY >= TOUCH_SWIPE_THRESHOLD_PX) {
      if (deltaY < 0) advanceForward()
      if (deltaY > 0) goToAdjacentScreen(-1)
    }

    isTouchTracking = false
  }

  // Watch ---------------------------------------------------------------------
  watch(activeScreenId, (id: string) => startCarouselAutoplay(id))

  // Lifecycle -----------------------------------------------------------------
  onMounted(() => {
    prefersReducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const scroller = scrollerRef.value
    if (!scroller) return

    screenObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.target instanceof HTMLElement) {
            const matched = [...screenElements.entries()].find(([, el]) => el === entry.target)
            if (matched) activeScreenId.value = matched[0]
          }
        }
      },
      { root: scroller, threshold: 0.6 },
    )

    for (const el of screenElements.values()) screenObserver.observe(el)

    rootRef.value?.addEventListener('wheel', handleWheel, { passive: false })
    rootRef.value?.addEventListener('touchstart', handleTouchStart, { passive: true })
    rootRef.value?.addEventListener('touchmove', handleTouchMove, { passive: false })
    rootRef.value?.addEventListener('touchend', handleTouchEnd, { passive: true })
    rootRef.value?.addEventListener('touchcancel', handleTouchEnd, { passive: true })
    scroller.addEventListener('pointerdown', handleReadingModePointerInterrupt)
    window.addEventListener('keydown', handleKeydown)
  })

  onBeforeUnmount(() => {
    clearReadingModeAnimation()
    stopCarouselAutoplay()
    if (programmaticScrollEndTimer !== null) clearTimeout(programmaticScrollEndTimer)
    screenObserver?.disconnect()
    screenObserver = null
    rootRef.value?.removeEventListener('wheel', handleWheel)
    rootRef.value?.removeEventListener('touchstart', handleTouchStart)
    rootRef.value?.removeEventListener('touchmove', handleTouchMove)
    rootRef.value?.removeEventListener('touchend', handleTouchEnd)
    rootRef.value?.removeEventListener('touchcancel', handleTouchEnd)
    scrollerRef.value?.removeEventListener('pointerdown', handleReadingModePointerInterrupt)
    window.removeEventListener('keydown', handleKeydown)
  })

  return {
    // refs de template
    scrollerRef,
    rootRef,
    // état
    activeScreenId,
    isInfoPanelOpen,
    isReadingModeActive,
    lightboxIndex,
    // computed
    progress,
    isAtLastScreen,
    canStartReadingMode,
    readingModeIcon,
    readingModeButtonLabel,
    scrollerStyle,
    currentLightboxMedia,
    hasMultipleLightboxMedia,
    lightboxTotal,
    // helpers de rendu
    currentMediaIndex,
    // actions
    registerScreen,
    selectMedia,
    openLightbox,
    closeLightbox,
    showLightboxAt,
    goToNext,
    openInfoPanel,
    closeInfoPanel,
    goToContactFromPanel,
    toggleReadingMode,
    requestNextScreen,
  }
}
