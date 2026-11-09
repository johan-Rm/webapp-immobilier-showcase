import type { ComponentPublicInstance, ComputedRef, MaybeRefOrGetter } from 'vue'

import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'

type MaybeElementInstance = HTMLElement | SVGElement | ComponentPublicInstance
type MaybeElementRef = MaybeRefOrGetter<MaybeElementInstance | null | undefined>
type UseSwipeDirection = 'up' | 'right' | 'down' | 'left' | 'none'

export type ScreenColumnTemplateDefinition = {
  columns: 1 | 2 | 3
  value: string
}

export type ScreenContentZonePlacement =
  'full' | 'top' | 'bottom' | 'left' | 'right' | 'multiple' | 'none'

export type ScreenImageZonePlacement =
  'none' | 'full' | 'top' | 'bottom' | 'left' | 'right' | 'background' | 'center' | 'multiple'

export type ScreenLayoutMeta = {
  column?: ScreenColumnTemplate
  contentZone: ScreenContentZonePlacement
  imageZone: ScreenImageZonePlacement
  hasBackgroundImage?: boolean
  backgroundImage?: string
}

export type ScreenType = 'landing' | 'standard' | 'footer'

export type ScreenMeta = {
  type: ScreenType
  columnTemplate: ScreenColumnTemplate
  background?: string
  layout?: ScreenLayoutMeta
  navigator?: {
    enabled?: boolean
    keyboard?: boolean
    wheel?: boolean
    touch?: boolean
  }
  logo?: {
    visible?: boolean
    containerVariant?: 'glass'
  }
  socialNetwork?: {
    visible?: boolean
    backgroundTone?: 'white' | 'black'
  }
  quickActions?: {
    containerVariant?: 'glass'
  }
}

export type ScreenMetaInput = Omit<ScreenMeta, 'columnTemplate'> & {
  columnTemplate?: ScreenColumnTemplate
}

export type ScreenStatusState = {
  currentId: string | null
  screens: Record<string, ScreenMeta>
}

export type UseScreenSystemOptions<T extends string> = {
  sections?: readonly T[]
  axis?: ScreenAxis
  axisAttribute?: string
  container?: MaybeElementRef
  viewport?: MaybeElementRef
  loop?: boolean
  durationMs?: number
  keyboard?: boolean
  interactionAxisMode?: 'strict' | 'both'
  auto?: boolean
  containerSelector?: string
  viewportSelector?: string
  sectionSelector?: string
  touch?: boolean
  touchThreshold?: number
  touchCooldownMs?: number
  touchPreventScroll?: boolean
  wheel?: boolean
  wheelThreshold?: number
  wheelCooldownMs?: number
  transitionMode?: ScreenTransitionMode
  wheelAxisMode?: 'active' | 'vertical'
  wheelDirectionLock?: boolean
  wheelDirectionLockRatio?: number
  sectionsMode?: 'direct' | 'deep'
  resolveScreenId?: (currentId: T | null) => string | null
  anchors?: {
    enabled?: boolean
    syncMode?: ScreenAnchorSyncMode
    clearHashOnImplicitNavigation?: boolean
  }
}

export type UseScreenSystemReturn<T extends string = string> = {
  screenUi: ComputedRef<{
    page: { root: string; center: string }
    pageSection: { root: string; container: string }
  }>
  screenColumnTemplate: Readonly<Record<ScreenColumnTemplate, ScreenColumnTemplateDefinition>>
  screenStatus: Ref<ScreenStatusState>
  currentMeta: ComputedRef<ScreenMeta | null>
  currentId: ComputedRef<T | null>
  setCurrentId: (id: string | null) => void
  setScreenMeta: (id: string, meta: ScreenMetaInput) => void
  resetScreenStatus: () => void
  next: () => void
  prev: () => void
  goToId: (id: T) => void
}

const SCREEN_COLUMN_TEMPLATES: Readonly<
  Record<ScreenColumnTemplate, ScreenColumnTemplateDefinition>
> = Object.freeze({
  single: Object.freeze({ columns: 1, value: 'h-full w-full' }),
  'split-50-50': Object.freeze({ columns: 2, value: 'grid-cols-1 md:grid-cols-2' }),
  'split-67-33': Object.freeze({
    columns: 2,
    value: 'grid-cols-1 md:grid-cols-[66.67%_33.33%]',
  }),
  'split-33-67': Object.freeze({
    columns: 2,
    value: 'grid-cols-1 md:grid-cols-[33.33%_66.67%]',
  }),
  'triple-equal': Object.freeze({ columns: 3, value: 'grid-cols-1 md:grid-cols-3' }),
})

const createDefaultScreenStatus = (): ScreenStatusState => ({
  currentId: null,
  screens: {},
})

const clampIndex = (index: number, maxIndex: number): number => {
  if (maxIndex <= 0) return 0
  if (index < 0) return 0
  if (index > maxIndex) return maxIndex
  return index
}

const isInteractiveEventTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false

  return Boolean(
    target.closest(
      'a, button, input, textarea, select, summary, label, [role="button"], [data-screen-touch-ignore]',
    ),
  )
}

const normalizeHashToScreenId = (value: string): string | null => {
  const normalized = value.startsWith('#') ? value.slice(1) : value
  if (!normalized) return null

  try {
    return decodeURIComponent(normalized)
  } catch {
    return normalized
  }
}

const getCurrentHashScreenId = (): string | null => {
  return normalizeHashToScreenId(window.location.hash)
}

const updateUrlHash = (id: string | null, mode: 'replace' | 'push' = 'replace'): void => {
  if (!id) return

  const nextHash = `#${encodeURIComponent(id)}`
  if (window.location.hash === nextHash) return

  const nextUrl = `${window.location.pathname}${window.location.search}${nextHash}`
  window.history[mode === 'push' ? 'pushState' : 'replaceState'](window.history.state, '', nextUrl)
}

const clearUrlHash = (): void => {
  if (!window.location.hash) return

  const nextUrl = `${window.location.pathname}${window.location.search}`
  window.history.replaceState(window.history.state, '', nextUrl)
}

export const useScreenSystem = <T extends string = string>(
  options: UseScreenSystemOptions<T> = {},
): UseScreenSystemReturn<T> => {
  const resolveTransitionMode = (mode: ScreenTransitionMode) => {
    if (mode === 'slide-horizontal') {
      return { style: 'slide' as ScreenTransitionStyle, axisOverride: 'x' as ScreenAxis }
    }

    if (mode === 'slide-vertical') {
      return { style: 'slide' as ScreenTransitionStyle, axisOverride: 'y' as ScreenAxis }
    }

    return { style: mode as ScreenTransitionStyle, axisOverride: null }
  }

  const transitionMode = options.transitionMode ?? 'slide'
  const { style: transitionStyle, axisOverride } = resolveTransitionMode(transitionMode)

  const loop = options.loop ?? false
  const durationMs = options.durationMs ?? 700
  const interactionAxisMode = options.interactionAxisMode ?? 'both'
  const auto = options.auto ?? false
  const containerSelector = options.containerSelector ?? '.screen-track'
  const viewportSelector = options.viewportSelector
  const sectionSelector = options.sectionSelector ?? '[data-screen]'
  const axisAttribute = options.axisAttribute ?? 'data-axis'
  const containerRef = options.container
  const viewportRef = options.viewport

  const keyboardEnabled = options.keyboard ?? false
  const touchEnabled = options.touch ?? false
  const touchThreshold = options.touchThreshold ?? 60
  const touchCooldownMs = options.touchCooldownMs ?? 600
  const touchPreventScroll = options.touchPreventScroll ?? true
  const wheelEnabled = options.wheel ?? false
  const wheelThreshold = options.wheelThreshold ?? 120
  const wheelCooldownMs = options.wheelCooldownMs ?? 300
  const wheelAxisMode = options.wheelAxisMode ?? 'vertical'
  const wheelDirectionLock = options.wheelDirectionLock ?? true
  const wheelDirectionLockRatio = options.wheelDirectionLockRatio ?? 1.2
  const sectionsMode = options.sectionsMode ?? 'direct'

  const resolveScreenId = options.resolveScreenId
  const anchorsEnabled = options.anchors?.enabled ?? false
  const anchorSyncMode = options.anchors?.syncMode ?? 'explicit-only'
  const clearHashOnImplicitNavigation = options.anchors?.clearHashOnImplicitNavigation ?? false

  const screenStatus = useState<ScreenStatusState>('screen-status', createDefaultScreenStatus)
  const screenCurrent = useState<string | null>('screen.current', () => null)

  const setCurrentId = (id: string | null): void => {
    screenStatus.value.currentId = id
  }

  const setScreenMeta = (id: string, meta: ScreenMetaInput): void => {
    const resolvedColumnTemplate = meta.columnTemplate ?? meta.layout?.column

    if (!resolvedColumnTemplate) {
      return
    }

    const normalizedMeta: ScreenMeta = {
      ...meta,
      columnTemplate: resolvedColumnTemplate,
    }

    screenStatus.value.screens = {
      ...screenStatus.value.screens,
      [id]: normalizedMeta,
    }
  }

  const resetScreenStatus = (): void => {
    screenStatus.value = createDefaultScreenStatus()
  }

  const currentMeta = computed<ScreenMeta | null>(() => {
    const id = screenStatus.value.currentId

    if (!id) {
      // Sortie statique : aucun ecran ne devient actif faute de script. On
      // retombe sur le premier ecran declare, ce qui donne au logo, aux
      // couleurs et aux blocs conditionnes un etat coherent dans le livrable.
      if (useRuntimeConfig().public.staticOutput === true) {
        const [firstMeta] = Object.values(screenStatus.value.screens)
        return firstMeta ?? null
      }

      return null
    }

    return screenStatus.value.screens[id] ?? null
  })

  const axis = ref<ScreenAxis>(axisOverride ?? options.axis ?? 'y')
  const currentIndex = ref<number>(0)
  const sections = shallowRef<readonly T[]>(options.sections ?? [])
  const sectionsAxis = ref<ScreenAxis[]>([])
  const sectionElements = ref<HTMLElement[]>([])

  const containerEl = ref<HTMLElement | null>(null)
  const viewportEl = ref<HTMLElement | null>(null)
  const hasMounted = ref(false)
  const hasInitialized = ref(false)
  const hasResolvedInitialAnchor = ref(false)
  const skipNextCurrentIdCleanup = ref(false)
  const scrollLockRef = ref<{ value: boolean } | null>(null)

  const cleanupFns: Array<() => void> = []

  const { width: windowWidth, height: windowHeight } = useWindowSize()
  const { width: viewportWidth, height: viewportHeight } = useElementSize(viewportEl)
  const reducedMotion = usePreferredReducedMotion()

  const maxIndex = computed(() => Math.max(sections.value.length - 1, 0))
  const currentId = computed<T | null>(() => sections.value[currentIndex.value] ?? null)

  const isNavigatorEnabled = computed<boolean>(
    () => currentMeta.value?.navigator?.enabled !== false,
  )
  const isKeyboardEnabled = computed<boolean>(
    () =>
      keyboardEnabled &&
      isNavigatorEnabled.value &&
      currentMeta.value?.navigator?.keyboard !== false,
  )
  const isWheelEnabled = computed<boolean>(
    () => wheelEnabled && isNavigatorEnabled.value && currentMeta.value?.navigator?.wheel !== false,
  )
  const isTouchEnabled = computed<boolean>(
    () => touchEnabled && isNavigatorEnabled.value && currentMeta.value?.navigator?.touch !== false,
  )

  const activeAxis = computed<ScreenAxis>(
    () => sectionsAxis.value[currentIndex.value] ?? axis.value,
  )

  const stepSize = computed(() => {
    const size = activeAxis.value === 'y' ? viewportHeight.value : viewportWidth.value
    const fallback = activeAxis.value === 'y' ? windowHeight.value : windowWidth.value
    return size || fallback
  })

  const translateValue = computed(() => -currentIndex.value * stepSize.value)

  const transform = computed(() =>
    activeAxis.value === 'y'
      ? `translate3d(0, ${translateValue.value}px, 0)`
      : `translate3d(${translateValue.value}px, 0, 0)`,
  )

  const transitionDuration = computed(() => (reducedMotion.value === 'reduce' ? 0 : durationMs))
  const containerClass = computed(() => (activeAxis.value === 'y' ? 'flex-col' : 'flex-row'))

  const touchClass = computed(() => {
    if (!isTouchEnabled.value || !touchPreventScroll) return ''
    return activeAxis.value === 'y' ? 'touch-pan-x' : 'touch-pan-y'
  })

  const transitionClass = computed(() => `screen-transition-${transitionStyle}`)
  const motionClass = computed(() =>
    transitionStyle === 'slide' ? 'screen-motion-translate' : 'screen-motion-overlay',
  )
  const isSlideMotion = computed(() => transitionStyle === 'slide')

  const pageUi = computed(() => ({
    root: 'page-ui-root h-full w-full',
    center: `page-ui-center screen-track h-full w-full flex transition-transform ease-out ${containerClass.value} ${touchClass.value} ${transitionClass.value} ${motionClass.value}`,
  }))

  const pageSectionUi = computed(() => ({
    root: 'page-section-ui-root h-dvh w-screen min-w-screen flex-none',
    container:
      'page-section-ui-container h-full w-full !max-w-none !mx-0 !px-0 sm:!px-0 lg:!px-0 flex flex-col lg:grid py-0 sm:py-0 lg:py-0 gap-8 sm:gap-16',
  }))

  const screenUi = computed(() => ({
    page: pageUi.value,
    pageSection: pageSectionUi.value,
  }))

  const isReady = computed<boolean>(() => {
    return hasMounted.value && containerEl.value !== null && sections.value.length > 0
  })

  const swipeTarget = computed<HTMLElement | null>(() => {
    return containerEl.value ?? viewportEl.value ?? null
  })

  const wheelTarget = computed<HTMLElement | null>(() => {
    return viewportEl.value ?? containerEl.value ?? null
  })

  const resetNavigatorState = () => {
    sections.value = []
    sectionsAxis.value = []
    sectionElements.value = []
    currentIndex.value = 0
    hasInitialized.value = false
  }

  const resolveContainer = (): HTMLElement | null => {
    const fromRef = containerRef ? unrefElement(containerRef) : null
    const rawBase = fromRef ?? document.querySelector<HTMLElement>(containerSelector)
    const base = rawBase instanceof HTMLElement ? rawBase : null

    if (!base) return null
    if (base.matches(containerSelector)) return base

    return base.querySelector<HTMLElement>(containerSelector) ?? base
  }

  const resolveViewport = (container: HTMLElement | null): HTMLElement | null => {
    const fromRef = viewportRef ? unrefElement(viewportRef) : null
    if (fromRef instanceof HTMLElement) return fromRef

    if (viewportSelector) {
      const fromSelector = document.querySelector<HTMLElement>(viewportSelector)
      if (fromSelector) return fromSelector
    }

    return container?.parentElement ?? null
  }

  const resolveDomRefs = () => {
    containerEl.value = resolveContainer()
    viewportEl.value = resolveViewport(containerEl.value)
  }

  const collectSectionElements = (): HTMLElement[] => {
    if (!containerEl.value) return []

    const directItems = Array.from(containerEl.value.children).filter(
      (child): child is HTMLElement => child instanceof HTMLElement,
    )

    const items =
      sectionsMode === 'deep'
        ? Array.from(containerEl.value.querySelectorAll<HTMLElement>(sectionSelector))
        : directItems.filter((item) => item.matches(sectionSelector))

    return items.filter((item) => Boolean(item.dataset.screen))
  }

  const syncSectionsFromDom = () => {
    if (!auto) {
      sectionElements.value = collectSectionElements()
      return
    }

    if (!containerEl.value) {
      resetNavigatorState()
      return
    }

    const items = collectSectionElements()

    if (items.length === 0) {
      resetNavigatorState()
      return
    }

    const ids = items.map((item) => item.dataset.screen as T)
    const axes = items.map((item) => {
      const axisValue = item.getAttribute(axisAttribute)
      return axisValue === 'x' || axisValue === 'y' ? axisValue : axis.value
    })

    sections.value = ids
    sectionsAxis.value = axes
    sectionElements.value = items

    if (!hasInitialized.value) {
      currentIndex.value = 0
      hasInitialized.value = true
      return
    }

    if (currentIndex.value > ids.length - 1) {
      currentIndex.value = ids.length - 1
    }
  }

  const applyActiveSection = () => {
    if (!isReady.value) return

    sectionElements.value.forEach((item, index) => {
      const isActive = index === currentIndex.value
      let state: 'active' | 'before' | 'after'
      if (isActive) state = 'active'
      else if (index < currentIndex.value) state = 'before'
      else state = 'after'

      item.dataset.screenActive = isActive ? 'true' : 'false'
      item.dataset.screenState = state
      item.style.zIndex = isActive ? '2' : '1'

      if (isActive) {
        item.classList.add('is-screen-active')
      } else {
        item.classList.remove('is-screen-active')
      }
    })
  }

  const applyTransform = () => {
    if (!isReady.value || !containerEl.value) return

    const nextTransform = isSlideMotion.value ? transform.value : 'translate3d(0, 0, 0)'

    containerEl.value.style.setProperty('--screen-translate', nextTransform)
    containerEl.value.style.setProperty('--screen-duration', `${transitionDuration.value}ms`)
    containerEl.value.dataset.screenAxis = activeAxis.value
  }

  const isKnownScreenId = (id: string | null): id is T => {
    if (!id) return false
    return sections.value.includes(id as T)
  }

  const goToIndex = (index: number) => {
    if (!isReady.value) return

    const resolveNextIndex = () => {
      if (loop) {
        const size = sections.value.length
        return ((index % size) + size) % size
      }

      return clampIndex(index, maxIndex.value)
    }

    const nextIndex = resolveNextIndex()
    if (nextIndex === currentIndex.value) return

    currentIndex.value = nextIndex
  }

  const goToId = (id: T) => {
    const index = sections.value.indexOf(id)
    if (index === -1) return
    goToIndex(index)
  }

  const next = () => {
    goToIndex(currentIndex.value + 1)
  }

  const prev = () => {
    goToIndex(currentIndex.value - 1)
  }

  const applyHashScreen = (id: string | null): boolean => {
    if (!isKnownScreenId(id)) return false

    skipNextCurrentIdCleanup.value = true
    goToId(id)
    return true
  }

  const onHashChange = () => {
    if (!hasResolvedInitialAnchor.value) return
    applyHashScreen(getCurrentHashScreenId())
  }

  const onAnchorClick = (event: Event) => {
    if (event.defaultPrevented) return
    if (!(event instanceof MouseEvent)) return
    if (event.button !== 0) return
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

    const target = event.target
    if (!(target instanceof Element)) return

    const anchor = target.closest('a[href^="#"]')
    if (!(anchor instanceof HTMLAnchorElement)) return
    if (anchor.target && anchor.target !== '_self') return

    const screenId = normalizeHashToScreenId(anchor.getAttribute('href') ?? '')
    if (!isKnownScreenId(screenId)) return

    event.preventDefault()
    updateUrlHash(screenId, 'push')
    skipNextCurrentIdCleanup.value = true
    goToId(screenId)
  }

  const setupAnchors = () => {
    if (!anchorsEnabled) return

    const handleInitialHash = () => {
      if (hasResolvedInitialAnchor.value || sections.value.length === 0) return
      hasResolvedInitialAnchor.value = true
      applyHashScreen(getCurrentHashScreenId())
    }

    const stopSectionsWatch = watch(
      () => sections.value,
      () => {
        handleInitialHash()
      },
      { deep: true, immediate: true },
    )

    cleanupFns.push(stopSectionsWatch)

    if (anchorSyncMode === 'always') {
      const stopCurrentIdWatch = watch(
        () => currentId.value,
        (nextId) => {
          if (!hasResolvedInitialAnchor.value || !nextId) return
          updateUrlHash(nextId, 'replace')
        },
      )

      cleanupFns.push(stopCurrentIdWatch)
    }

    if (anchorSyncMode === 'explicit-only' && clearHashOnImplicitNavigation) {
      const stopCleanupWatch = watch(
        () => currentId.value,
        (nextId, previousId) => {
          if (!hasResolvedInitialAnchor.value || !nextId) return
          if (nextId === previousId) return

          if (skipNextCurrentIdCleanup.value) {
            skipNextCurrentIdCleanup.value = false
            return
          }

          clearUrlHash()
        },
      )

      cleanupFns.push(stopCleanupWatch)
    }

    cleanupFns.push(useEventListener(window, 'hashchange', onHashChange))

    if (containerEl.value) {
      cleanupFns.push(useEventListener(containerEl.value, 'click', onAnchorClick))
    }
  }

  const setupKeyboard = () => {
    if (!keyboardEnabled) return

    const handleKeydown = (event: KeyboardEvent) => {
      if (!isKeyboardEnabled.value || !isReady.value) return

      const target = event.target
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
      ) {
        return
      }

      if (event.defaultPrevented) return

      const isNextKey =
        interactionAxisMode === 'both'
          ? event.key === 'ArrowDown' || event.key === 'ArrowRight'
          : event.key === 'ArrowDown' || (activeAxis.value === 'x' && event.key === 'ArrowRight')

      const isPrevKey =
        interactionAxisMode === 'both'
          ? event.key === 'ArrowUp' || event.key === 'ArrowLeft'
          : event.key === 'ArrowUp' || (activeAxis.value === 'x' && event.key === 'ArrowLeft')

      if (isNextKey) {
        event.preventDefault()
        next()
      }

      if (isPrevKey) {
        event.preventDefault()
        prev()
      }
    }

    cleanupFns.push(useEventListener(window, 'keydown', handleKeydown, { passive: false }))
  }

  const setupTouch = () => {
    if (!touchEnabled) return

    const target = swipeTarget.value
    if (!target) return

    const setScrollLock = (locked: boolean) => {
      if (!scrollLockRef.value) return
      scrollLockRef.value.value = locked
    }

    const lockTarget = viewportEl.value
    scrollLockRef.value = lockTarget ? (useScrollLock(lockTarget) as { value: boolean }) : null

    const isTouchGestureSuspended = ref(false)

    const unlockTimeout = useTimeoutFn(() => {
      if (!touchPreventScroll) return
      setScrollLock(false)
    }, touchCooldownMs + 200)

    const scheduleUnlockReset = useThrottleFn(() => unlockTimeout.start(), 100)

    const swipeEnd = useThrottleFn((direction: UseSwipeDirection) => {
      if (!isTouchEnabled.value || !isReady.value) return

      if (interactionAxisMode === 'both') {
        if (direction === 'up' || direction === 'left') next()
        if (direction === 'down' || direction === 'right') prev()
        return
      }

      if (activeAxis.value === 'y') {
        if (direction === 'up') next()
        if (direction === 'down') prev()
      }

      if (activeAxis.value === 'x') {
        if (direction === 'left') next()
        if (direction === 'right') prev()
      }
    }, touchCooldownMs)

    const swipe = useSwipe(target, {
      passive: false,
      threshold: touchThreshold,
      onSwipeStart: (event) => {
        if (!isTouchEnabled.value) return

        if (isInteractiveEventTarget(event.target)) {
          isTouchGestureSuspended.value = true
          return
        }

        if (touchPreventScroll) event.preventDefault()
        if (touchPreventScroll && scrollLockRef.value) setScrollLock(true)
        scheduleUnlockReset()
      },
      onSwipe: (event) => {
        if (!isTouchEnabled.value) return
        if (isTouchGestureSuspended.value) return

        if (touchPreventScroll) event.preventDefault()
        scheduleUnlockReset()
      },
      onSwipeEnd: (event, direction) => {
        if (!isTouchEnabled.value) return

        if (isTouchGestureSuspended.value) {
          isTouchGestureSuspended.value = false
          return
        }

        if (touchPreventScroll) event.preventDefault()

        swipeEnd(direction)

        if (touchPreventScroll && scrollLockRef.value) {
          setScrollLock(false)
        }

        unlockTimeout.stop()
      },
    })

    cleanupFns.push(() => {
      if (scrollLockRef.value) {
        scrollLockRef.value.value = false
      }

      swipe.stop()
      scrollLockRef.value = null
    })
  }

  const setupWheel = () => {
    if (!wheelEnabled) return

    const target = wheelTarget.value
    if (!target) return

    const isScrollable = (element: HTMLElement | null, axisValue: ScreenAxis, delta: number) => {
      if (!element) return false

      let current: HTMLElement | null = element

      while (current) {
        const style = window.getComputedStyle(current)
        const overflow = axisValue === 'y' ? style.overflowY : style.overflowX
        const isScrollOverflow =
          overflow === 'auto' || overflow === 'scroll' || overflow === 'overlay'

        const canScroll =
          isScrollOverflow &&
          (axisValue === 'y'
            ? current.scrollHeight > current.clientHeight
            : current.scrollWidth > current.clientWidth)

        if (canScroll) {
          if (axisValue === 'y') {
            const canScrollDown = current.scrollTop + current.clientHeight < current.scrollHeight
            const canScrollUp = current.scrollTop > 0

            if ((delta > 0 && canScrollDown) || (delta < 0 && canScrollUp)) {
              return true
            }
          } else {
            const canScrollRight = current.scrollLeft + current.clientWidth < current.scrollWidth
            const canScrollLeft = current.scrollLeft > 0

            if ((delta > 0 && canScrollRight) || (delta < 0 && canScrollLeft)) {
              return true
            }
          }
        }

        current = current.parentElement
      }

      return false
    }

    let lastWheelAt = 0
    let accumulated = 0

    const handleWheel = (event: WheelEvent) => {
      if (!isWheelEnabled.value || !isReady.value) return

      const DELTA_MODE_SCALE: Record<number, number> = { 1: 40, 2: 800 }
      const deltaModeScale = DELTA_MODE_SCALE[event.deltaMode] ?? 1
      const deltaX = event.deltaX
      const deltaY = event.deltaY
      const useDominantDelta = interactionAxisMode === 'both'

      const primaryDelta = useDominantDelta
        ? Math.abs(deltaY) >= Math.abs(deltaX)
          ? deltaY
          : deltaX
        : activeAxis.value === 'y'
          ? deltaY
          : wheelAxisMode === 'vertical'
            ? deltaY
            : deltaX

      const crossDelta = useDominantDelta
        ? 0
        : activeAxis.value === 'y'
          ? deltaX
          : wheelAxisMode === 'vertical'
            ? deltaX
            : deltaY

      if (!useDominantDelta && wheelDirectionLock) {
        if (Math.abs(crossDelta) > Math.abs(primaryDelta) * wheelDirectionLockRatio) {
          return
        }
      }

      const rawDelta = primaryDelta
      if (rawDelta === 0) return

      const atStart = currentIndex.value === 0
      const atEnd = currentIndex.value === maxIndex.value

      if (!loop) {
        if (rawDelta < 0 && atStart) return
        if (rawDelta > 0 && atEnd) return
      }

      const scrollAxis: ScreenAxis = useDominantDelta
        ? Math.abs(deltaY) >= Math.abs(deltaX)
          ? 'y'
          : 'x'
        : activeAxis.value === 'y'
          ? 'y'
          : wheelAxisMode === 'vertical'
            ? 'y'
            : 'x'

      const targetEl = event.target instanceof HTMLElement ? event.target : null
      if (isScrollable(targetEl, scrollAxis, rawDelta)) return

      event.preventDefault()

      const now = Date.now()
      if (now - lastWheelAt < wheelCooldownMs) {
        accumulated = 0
        return
      }

      const scaledDelta = rawDelta * deltaModeScale

      if (accumulated !== 0 && Math.sign(accumulated) !== Math.sign(scaledDelta)) {
        accumulated = 0
      }

      accumulated += scaledDelta

      if (Math.abs(accumulated) < wheelThreshold) return

      if (accumulated > 0) next()
      if (accumulated < 0) prev()

      accumulated = 0
      lastWheelAt = now
    }

    cleanupFns.push(useEventListener(target, 'wheel', handleWheel, { passive: false }))
  }

  const setupMutationObserver = () => {
    if (!auto || !containerEl.value) return

    const refreshObserved =
      sectionsMode === 'deep'
        ? useDebounceFn(() => {
            syncSectionsFromDom()
            applyActiveSection()
            applyTransform()
          }, 50)
        : () => {
            syncSectionsFromDom()
            applyActiveSection()
            applyTransform()
          }

    const { stop } = useMutationObserver(
      containerEl,
      () => {
        refreshObserved()
      },
      {
        childList: true,
        subtree: sectionsMode === 'deep',
      },
    )

    cleanupFns.push(stop)
  }

  const initializeScreenSystem = () => {
    resolveDomRefs()
    syncSectionsFromDom()

    if (!isReady.value) return

    applyActiveSection()
    applyTransform()

    setupAnchors()
    setupKeyboard()
    setupTouch()
    setupWheel()
    setupMutationObserver()
  }

  watch(
    () => currentIndex.value,
    () => {
      applyActiveSection()
    },
  )

  watch(
    () => [
      currentIndex.value,
      activeAxis.value,
      viewportWidth.value,
      viewportHeight.value,
      windowWidth.value,
      windowHeight.value,
      transitionDuration.value,
    ],
    () => {
      applyTransform()
    },
  )

  watch(
    () => currentId.value,
    (nextId) => {
      const resolved = resolveScreenId ? resolveScreenId(nextId) : nextId
      const canSyncCurrentId = auto || sections.value.length > 0

      if (!canSyncCurrentId) {
        return
      }

      screenCurrent.value = resolved ?? null
      setCurrentId(screenCurrent.value)
    },
    { immediate: true },
  )

  onMounted(() => {
    hasMounted.value = true

    requestAnimationFrame(() => {
      initializeScreenSystem()
    })
  })

  onBeforeUnmount(() => {
    cleanupFns.forEach((cleanup) => cleanup())
    cleanupFns.length = 0
  })

  return {
    screenUi,
    screenColumnTemplate: SCREEN_COLUMN_TEMPLATES,
    screenStatus,
    currentMeta,
    currentId,
    setCurrentId,
    setScreenMeta,
    resetScreenStatus,
    next,
    prev,
    goToId,
  }
}
