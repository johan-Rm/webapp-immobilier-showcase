import type { ComputedRef, Ref } from 'vue'

import { nextTick, ref } from 'vue'

type UseTransitionsOptions = {
  linePropertyRef: Ref<HTMLDivElement | null>
  viewportW: Ref<number>
  index: Ref<number>
  maxIndex: ComputedRef<number>
  applyTransformForIndex: (i: number) => void
}

type UseTransitionsReturn = {
  transitionMode: Ref<TransitionMode>
  setTransition: (mode: TransitionMode) => void
  transitionOpacity: Ref<number>
  zoomScale: Ref<number>
  isAnimating: Ref<boolean>
  transitionToIndex: (targetIndex: number) => Promise<void>
  resetTransitionState: () => void
  cancelTransition: () => void
}

export const useTransitions = (options: UseTransitionsOptions): UseTransitionsReturn => {
  const { linePropertyRef, viewportW, index, maxIndex, applyTransformForIndex } = options

  const transitionMode = useState<TransitionMode>('ui.transition.mode', () => 'slide')
  const isAnimating = ref(false)
  const transitionOpacity = ref(0)
  const zoomScale = ref(1)

  let rafId: number | null = null

  const clampIndex = (i: number): number => {
    return Math.min(maxIndex.value, Math.max(0, i))
  }

  const easeInOutCubic = (t: number): number => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
  }

  const setRailFx = (intensity: number): void => {
    const el = linePropertyRef.value
    if (!el) return

    const blur = Math.round(intensity * 10)
    el.style.filter = blur > 0 ? `blur(${blur}px)` : ''
  }

  const animateNumber = (
    from: number,
    to: number,
    durationMs: number,
    onUpdate: (v: number) => void,
  ): Promise<void> => {
    if (rafId) cancelAnimationFrame(rafId)

    return new Promise((resolve) => {
      const start = performance.now()

      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / durationMs)
        const eased = easeInOutCubic(t)
        const v = from + (to - from) * eased

        onUpdate(v)

        if (t < 1) {
          rafId = requestAnimationFrame(tick)
          return
        }

        rafId = null
        resolve()
      }

      rafId = requestAnimationFrame(tick)
    })
  }

  const doTransitionJump = async (toIndex: number): Promise<void> => {
    index.value = toIndex
    await nextTick()
    applyTransformForIndex(index.value)
  }

  const runFade = async (toIndex: number): Promise<void> => {
    await animateNumber(0, 1, 180, (v) => {
      transitionOpacity.value = v
      setRailFx(v)
    })

    await doTransitionJump(toIndex)

    await animateNumber(1, 0, 240, (v) => {
      transitionOpacity.value = v
      setRailFx(v)
    })

    setRailFx(0)
  }

  const runFlash = async (toIndex: number): Promise<void> => {
    await animateNumber(0, 1, 90, (v) => {
      transitionOpacity.value = v
      setRailFx(v * 0.6)
    })

    await doTransitionJump(toIndex)

    await animateNumber(1, 0, 140, (v) => {
      transitionOpacity.value = v
      setRailFx(v * 0.6)
    })

    setRailFx(0)
  }

  const runSlide = async (toIndex: number): Promise<void> => {
    const from = index.value
    const to = toIndex
    const w = Math.max(1, viewportW.value || 1)

    transitionOpacity.value = 0
    zoomScale.value = 1

    await animateNumber(from, to, 420, (v) => {
      const x = -v * w
      const el = linePropertyRef.value

      if (el) el.style.transform = `translate3d(${x}px, 0, 0)`

      setRailFx(Math.min(1, Math.abs(v - from)))
    })

    index.value = to
    await nextTick()
    applyTransformForIndex(index.value)
    setRailFx(0)
  }

  const runZoomCut = async (toIndex: number): Promise<void> => {
    await animateNumber(0, 1, 180, (v) => {
      transitionOpacity.value = v
      zoomScale.value = 1 + 0.06 * v
      setRailFx(v * 0.8)
    })

    await doTransitionJump(toIndex)

    await animateNumber(1, 0, 220, (v) => {
      transitionOpacity.value = v
      zoomScale.value = 1 + 0.06 * v
      setRailFx(v * 0.5)
    })

    zoomScale.value = 1
    setRailFx(0)
  }

  const runCrossZoom = async (toIndex: number): Promise<void> => {
    await animateNumber(0, 1, 220, (v) => {
      transitionOpacity.value = v
      zoomScale.value = 1 - 0.03 * v
      setRailFx(v * 0.4)
    })

    await doTransitionJump(toIndex)

    await animateNumber(1, 0, 260, (v) => {
      transitionOpacity.value = v
      zoomScale.value = 0.97 + 0.03 * (1 - v)
      setRailFx(v * 0.3)
    })

    zoomScale.value = 1
    setRailFx(0)
  }

  const resetTransitionState = (): void => {
    transitionOpacity.value = 0
    zoomScale.value = 1
    setRailFx(0)
  }

  const transitionToIndex = async (targetIndex: number): Promise<void> => {
    if (isAnimating.value) return

    const toIndex = clampIndex(targetIndex)
    if (toIndex === index.value) return

    isAnimating.value = true
    resetTransitionState()

    try {
      if (transitionMode.value === 'slide') {
        await runSlide(toIndex)
      } else if (transitionMode.value === 'zoomCut') {
        await runZoomCut(toIndex)
      } else if (transitionMode.value === 'crossZoom') {
        await runCrossZoom(toIndex)
      } else if (transitionMode.value === 'flash') {
        await runFlash(toIndex)
      } else {
        await runFade(toIndex)
      }
    } finally {
      resetTransitionState()
      isAnimating.value = false
    }
  }

  const setTransition = (mode: TransitionMode): void => {
    transitionMode.value = mode
  }

  const cancelTransition = (): void => {
    if (rafId) cancelAnimationFrame(rafId)

    rafId = null
  }

  return {
    transitionMode,
    setTransition,
    transitionOpacity,
    zoomScale,
    isAnimating,
    transitionToIndex,
    resetTransitionState,
    cancelTransition,
  }
}
