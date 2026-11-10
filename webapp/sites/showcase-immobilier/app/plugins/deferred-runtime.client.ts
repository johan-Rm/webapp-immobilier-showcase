type IdleDeadlineLike = {
  didTimeout: boolean
  timeRemaining: () => number
}

type IdleRequestCallback = (deadline: IdleDeadlineLike) => void

const RUNTIME_IDLE_TIMEOUT_MS = 1200
const PASSIVE_FALLBACK_MS = 16000

const afterTwoFrames = (callback: () => void): void => {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      callback()
    })
  })
}

const runInIdle = (callback: () => void): void => {
  const requestIdleCallbackFn = (
    window as Window & {
      requestIdleCallback?: (cb: IdleRequestCallback, opts?: { timeout: number }) => number
    }
  ).requestIdleCallback

  if (typeof requestIdleCallbackFn === 'function') {
    requestIdleCallbackFn(
      () => {
        callback()
      },
      { timeout: RUNTIME_IDLE_TIMEOUT_MS },
    )
    return
  }

  setTimeout(callback, 200)
}

export default defineNuxtPlugin((nuxtApp) => {
  const runtimeReady = useState<boolean>('deferred.runtime.ready', () => false)
  const passiveReady = useState<boolean>('deferred.passive.ready', () => false)
  const pageFinished = useState<boolean>('runtime.page-finished', () => false)

  let passiveFallbackTimer: ReturnType<typeof setTimeout> | null = null
  let passiveListenersBound = false

  const removePassiveListeners = (): void => {
    if (!passiveListenersBound) return

    window.removeEventListener('pointerdown', markPassiveReady)
    window.removeEventListener('keydown', markPassiveReady)
    window.removeEventListener('scroll', markPassiveReady)
    window.removeEventListener('wheel', markPassiveReady)
    window.removeEventListener('touchstart', markPassiveReady)
    passiveListenersBound = false
  }

  const markPassiveReady = (): void => {
    if (passiveReady.value) return
    passiveReady.value = true

    if (passiveFallbackTimer !== null) {
      clearTimeout(passiveFallbackTimer)
      passiveFallbackTimer = null
    }

    removePassiveListeners()
  }

  const armPassiveGate = (): void => {
    if (passiveReady.value) return

    if (!passiveListenersBound) {
      window.addEventListener('pointerdown', markPassiveReady, { once: true, passive: true })
      window.addEventListener('keydown', markPassiveReady, { once: true, passive: true })
      window.addEventListener('scroll', markPassiveReady, { once: true, passive: true })
      window.addEventListener('wheel', markPassiveReady, { once: true, passive: true })
      window.addEventListener('touchstart', markPassiveReady, { once: true, passive: true })
      passiveListenersBound = true
    }

    if (passiveFallbackTimer !== null) {
      clearTimeout(passiveFallbackTimer)
    }
    passiveFallbackTimer = setTimeout(markPassiveReady, PASSIVE_FALLBACK_MS)
  }

  const scheduleRuntimeReady = (): void => {
    afterTwoFrames(() => {
      runInIdle(() => {
        runtimeReady.value = true
        armPassiveGate()
      })
    })
  }

  nuxtApp.hook('page:start', () => {
    pageFinished.value = false
    runtimeReady.value = false
  })

  nuxtApp.hook('page:finish', () => {
    pageFinished.value = true
    scheduleRuntimeReady()
  })

  onNuxtReady(() => {
    if (pageFinished.value) {
      scheduleRuntimeReady()
      return
    }

    // Fallback utile pour le premier affichage si `page:finish` n'est pas encore passé.
    pageFinished.value = true
    scheduleRuntimeReady()
  })
})
