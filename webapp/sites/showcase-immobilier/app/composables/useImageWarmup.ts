import type { MaybeRefOrGetter } from 'vue'

import { computed, onBeforeUnmount, toValue, watch } from 'vue'

type UseImageWarmupOptions = {
  stateKey?: string
  warmupEnabled?: MaybeRefOrGetter<boolean>
  startWhen?: 'runtime' | 'passive'
  batchSize?: number
  batchDelayMs?: number
  preset?: keyof typeof IMAGE_PRESETS
}

type ImgFn = (src: string, modifiers: Record<string, unknown>) => string

// Cache module-level : populé depuis le setup (useImageWarmup ou registerImgFn).
// Permet à prefetchWithPreset de fonctionner dans les event handlers et callbacks async.
let _imgFn: ImgFn | null = null

export const registerImgFn = (img: ImgFn): void => {
  if (!_imgFn) _imgFn = img
}

const IMAGE_EXTENSION_REGEX = /\.(avif|webp|png|jpe?g|gif|svg)(?:[?#].*)?$/i
const warmupImageInstances = new Map<string, HTMLImageElement>()

const isLikelyImageUrl = (value: string): boolean => {
  if (value.startsWith('/_ipx/')) return true
  if (value.startsWith('/images/')) return true
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return IMAGE_EXTENSION_REGEX.test(value) || value.includes('/_ipx/')
  }
  if (value.startsWith('/')) return IMAGE_EXTENSION_REGEX.test(value)
  return false
}

export const prefetchImage = (url: string): Promise<void> =>
  new Promise((resolve) => {
    if (!import.meta.client) {
      resolve()
      return
    }

    const normalizedUrl = url.trim()
    if (!normalizedUrl) {
      resolve()
      return
    }

    if (warmupImageInstances.has(normalizedUrl)) {
      resolve()
      return
    }

    const image = new Image()

    const cleanup = (): void => {
      image.onload = null
      image.onerror = null
      warmupImageInstances.delete(normalizedUrl)
      resolve()
    }

    image.onload = cleanup
    image.onerror = cleanup
    image.decoding = 'async'
    warmupImageInstances.set(normalizedUrl, image)
    image.src = normalizedUrl
  })

export const getImageUrl = (value: unknown): string => {
  if (!value || typeof value !== 'object') return ''

  const candidate = value as { contentUrl?: unknown; url?: unknown }
  if (typeof candidate.url === 'string') return candidate.url.trim()
  if (typeof candidate.contentUrl === 'string') return candidate.contentUrl.trim()
  return ''
}

/**
 * Prefetch impératif d'une URL brute via un preset nommé, avec ajustement DPR.
 * Utilise le cache module-level populé par registerImgFn() depuis le setup.
 */
export const prefetchWithPreset = (rawUrl: string, preset: keyof typeof IMAGE_PRESETS): void => {
  if (!import.meta.client || !rawUrl || !_imgFn) return
  const { width, format, quality, fit } = IMAGE_PRESETS[preset]
  const dpr = Math.min(Math.ceil(window.devicePixelRatio || 1), 2)
  void prefetchImage(_imgFn(rawUrl, { width: width * dpr, format, quality, fit }))
}

export const useImageWarmup = (
  urls: MaybeRefOrGetter<string | string[]>,
  options?: UseImageWarmupOptions,
): void => {
  // Appelé inconditionnellement pour respecter les règles des composables Vue.
  // Utilisé uniquement si options.preset est fourni.
  const img = useImage()
  registerImgFn(img)

  if (!import.meta.client) return

  const stateKey = options?.stateKey ?? 'default'
  const logger = useLogger({ module: `image-warmup:${stateKey}` })

  const runtimeReady = useState<boolean>('deferred.runtime.ready', () => false)
  const passiveReady = useState<boolean>('deferred.passive.ready', () => false)

  const loadedUrls = new Set<string>()
  const pendingUrls = new Set<string>()

  type TimerHandle = ReturnType<typeof setTimeout>
  let batchTimer: TimerHandle | null = null
  let isRunning = false

  const gateReady = computed(() =>
    options?.startWhen === 'passive' ? passiveReady.value : runtimeReady.value,
  )

  const clearTimers = (): void => {
    if (batchTimer !== null) {
      clearTimeout(batchTimer)
      batchTimer = null
    }
  }

  const applyPreset = (url: string): string => {
    if (!options?.preset) return url
    const { width, format, quality, fit } = IMAGE_PRESETS[options.preset]
    const dpr = Math.min(Math.ceil(window.devicePixelRatio || 1), 2)
    return img(url, { width: width * dpr, format, quality, fit })
  }

  const runBatches = async (queue: string[]): Promise<void> => {
    const batchSize = options?.batchSize ?? 1
    const batchDelayMs = options?.batchDelayMs ?? 1200

    isRunning = true

    try {
      let cursor = 0

      while (cursor < queue.length) {
        const batch = queue.slice(cursor, cursor + batchSize)

        await Promise.all(
          batch.map(async (url) => {
            try {
              await prefetchImage(url)
            } finally {
              loadedUrls.add(url)
              pendingUrls.delete(url)
            }
          }),
        )

        cursor += batchSize

        if (cursor < queue.length) {
          await new Promise<void>((resolve) => {
            batchTimer = setTimeout(() => {
              batchTimer = null
              resolve()
            }, batchDelayMs)
          })
        }
      }
    } finally {
      isRunning = false
    }
  }

  const schedule = (): void => {
    const enabled = toValue(options?.warmupEnabled ?? true)
    const ready = gateReady.value

    // Normalise string | string[] en string[] puis applique le preset si fourni.
    const rawUrls = [toValue(urls)]
      .flat()
      .map((url) => url.trim())
      .filter((url) => url.length > 0)

    if (!enabled || !ready || isRunning) return

    const queue = Array.from(new Set(rawUrls))
      .filter(isLikelyImageUrl)
      .map(applyPreset)
      .filter((url) => !loadedUrls.has(url) && !pendingUrls.has(url))

    if (queue.length === 0) return

    for (const url of queue) {
      pendingUrls.add(url)
    }

    logger.info('warmup:queue', {
      queueLength: queue.length,
      queue,
    })

    void runBatches(queue)
  }

  watch(
    () => ({
      enabled: toValue(options?.warmupEnabled ?? true),
      ready: gateReady.value,
      urls: toValue(urls),
    }),
    () => {
      schedule()
    },
    { deep: true, immediate: true },
  )

  onBeforeUnmount(() => {
    clearTimers()
  })
}
