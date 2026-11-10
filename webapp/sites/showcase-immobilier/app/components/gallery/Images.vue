<template>
  <div ref="containerRef" class="gallery h-full w-full">
    <div class="gallery__grid">
      <div
        v-for="item in props.items"
        :key="item.id"
        class="gallery__item relative mb-3 overflow-hidden rounded-2xl md:mb-4"
      >
        <div class="bg-foreground/10 relative w-full overflow-hidden rounded-2xl">
          <AppImage
            v-if="isImageAllowed(item.sourceIndex)"
            :src="item.src"
            :alt="item.title"
            v-bind="getImageProps(item.sourceIndex)"
            @loaded="markImageAsLoaded(item.sourceIndex)"
            @error="markImageAsLoaded(item.sourceIndex)"
          />
        </div>

        <AppOverlay :percentage="40" />

        <span
          class="bg-foreground/40 text-tiny absolute bottom-2 left-2 inline-flex rounded-2xl px-2 py-1 tracking-[0.08em] text-white/60 uppercase backdrop-blur-sm"
        >
          {{ item.alternateName }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 1. Imports

// 2. Types et constantes statiques
type GalleryImageItem = {
  id: string
  title: string
  alternateName: string
  src: string
  sourceIndex: number
}

type GalleryImagesProps = {
  active?: boolean
  items?: GalleryImageItem[]
}

// nombre d'images visibles dans la colonne au-dessus du fold pour ce composant
const EAGER_COUNT = 6

const SCROLL_SPEED = 0.35

const AUTO_SCROLL_ENABLED = true

// 3. Props et emits
const props = withDefaults(defineProps<GalleryImagesProps>(), {
  active: false,
  items: () => [],
})

// 4. Composables, stores, routeur
const { IMAGE_PRESETS } = useAppImage()
const GALLERY_IMAGE_PRESET = IMAGE_PRESETS.galleryColumn

// 5. Etat local
const containerRef = ref<HTMLElement | null>(null)

const hasBeenActivated = ref(false)

const loadedImageIndexes = ref<Set<number>>(new Set())

const loadedCriticalImageIndexes = ref<Set<number>>(new Set())

let rafId: number | null = null

// 6. Data inputs

// 7. Validation et helpers purs

// 8. Computed UI-ready
const galleryItems = computed<GalleryImageItem[]>(() => props.items ?? [])

// Sortie statique : le parcours par ecrans ne s'executera pas, aucun ecran ne
// deviendra actif. Sans cette bascule, la galerie resterait vide dans le livrable.
const isStaticOutput = useRuntimeConfig().public.staticOutput === true

const isActive = computed<boolean>(() => isStaticOutput || props.active || hasBeenActivated.value)

const criticalVisibleImageIndexes = computed<number[]>(() => {
  if (galleryItems.value.length === 0) return []

  const firstColumnIndex = galleryItems.value[0]?.sourceIndex
  const secondColumnIndex =
    galleryItems.value[Math.ceil(galleryItems.value.length / 2)]?.sourceIndex

  return [firstColumnIndex, secondColumnIndex].filter(
    (index): index is number => typeof index === 'number',
  )
})

const areCriticalVisibleImagesLoaded = computed<boolean>(() => {
  const criticalIndexes = criticalVisibleImageIndexes.value

  return (
    criticalIndexes.length > 0 &&
    criticalIndexes.every((index) => loadedCriticalImageIndexes.value.has(index))
  )
})

const areAllImagesLoaded = computed<boolean>(() => {
  return (
    galleryItems.value.length > 0 &&
    galleryItems.value.every((item) => loadedImageIndexes.value.has(item.sourceIndex))
  )
})

const isImageAllowed = (sourceIndex: number): boolean => {
  // Sortie statique : le chargement progressif ne s'executera pas, toutes les
  // images doivent etre presentes des la generation.
  if (isStaticOutput) return true

  const isCriticalVisibleImage = criticalVisibleImageIndexes.value.includes(sourceIndex)

  if (isCriticalVisibleImage) return isActive.value
  if (!isActive.value) return false

  return areCriticalVisibleImagesLoaded.value
}

const getImageProps = (sourceIndex: number) => {
  const criticalIndexPosition = criticalVisibleImageIndexes.value.indexOf(sourceIndex)
  const isCriticalVisibleImage = criticalIndexPosition !== -1

  return {
    width: GALLERY_IMAGE_PRESET.width,
    sizes: GALLERY_IMAGE_PRESET.sizes,
    format: GALLERY_IMAGE_PRESET.format,
    quality: GALLERY_IMAGE_PRESET.quality,
    fit: GALLERY_IMAGE_PRESET.fit,
    loading:
      isActive.value || isCriticalVisibleImage || sourceIndex < EAGER_COUNT ? 'eager' : 'lazy',
    fetchpriority:
      criticalIndexPosition === 0
        ? 'high'
        : isCriticalVisibleImage || sourceIndex < EAGER_COUNT
          ? 'auto'
          : 'low',
    placeholder: false,
    decoding: 'async',
    class: 'block h-auto w-full object-contain',
  } as const
}

// 9. Actions et handlers
const markImageAsLoaded = (sourceIndex: number): void => {
  if (loadedImageIndexes.value.has(sourceIndex)) return

  loadedImageIndexes.value = new Set([...loadedImageIndexes.value, sourceIndex])

  if (criticalVisibleImageIndexes.value.includes(sourceIndex)) {
    loadedCriticalImageIndexes.value = new Set([...loadedCriticalImageIndexes.value, sourceIndex])
  }

  if (AUTO_SCROLL_ENABLED && isActive.value && areAllImagesLoaded.value) {
    scheduleStart()
  }
}

const scheduleStart = (): void => {
  if (!AUTO_SCROLL_ENABLED) return

  nextTick(() => requestAnimationFrame(() => requestAnimationFrame(start)))
}

const activate = (): void => {
  if (!hasBeenActivated.value) {
    hasBeenActivated.value = true
  } else if (AUTO_SCROLL_ENABLED && areAllImagesLoaded.value) {
    scheduleStart()
  }
}

const stop = (): void => {
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
}

const start = (): void => {
  if (!AUTO_SCROLL_ENABLED) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  stop()

  const tick = (): void => {
    const el = containerRef.value
    if (!el || el.scrollHeight <= el.clientHeight) {
      rafId = requestAnimationFrame(tick)
      return
    }

    el.scrollTop += SCROLL_SPEED

    if (el.scrollTop + el.clientHeight >= el.scrollHeight) {
      el.scrollTop = 0
    }

    rafId = requestAnimationFrame(tick)
  }

  rafId = requestAnimationFrame(tick)
}

defineExpose({ activate, start, stop })

// 10. Watch et watchEffect
watch(galleryItems, () => {
  loadedImageIndexes.value = new Set()
  loadedCriticalImageIndexes.value = new Set()
})

// 11. Metadonnees ecran ou page

// 12. Lifecycle
onUnmounted(stop)
</script>

<style scoped>
.gallery {
  overflow-y: scroll;
  scrollbar-width: none;
}

.gallery::-webkit-scrollbar {
  display: none;
}

.gallery__grid {
  columns: 3;
  column-gap: 0.75rem;
  padding: 1rem 0.75rem;
}

.gallery__item {
  break-inside: avoid;
}

@media (max-width: 1023px) {
  .gallery__grid {
    columns: 2;
  }
}

@media (max-width: 479px) {
  .gallery__grid {
    columns: 1;
  }
}
</style>
