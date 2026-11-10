<template>
  <div class="panel-dual-carousel relative h-full min-h-0 w-full min-w-0 overflow-hidden">
    <div
      class="panel-dual-carousel__track h-full w-full transition-transform duration-700 ease-out"
      :style="trackStyle"
    >
      <div
        v-for="(item, index) in items"
        :key="`${item.title}-${index}`"
        class="panel-dual-carousel__slide relative h-full min-h-0 w-full min-w-0 overflow-hidden"
      >
        <AppImage
          v-if="shouldRenderImage(index)"
          :src="item.image"
          :alt="item.title"
          class="absolute inset-0 h-full w-full object-cover"
          :loading="getImageLoading(index)"
          :fetchpriority="getImageFetchPriority(index)"
          :placeholder="false"
          fit="cover"
          @loaded="handleImageLoaded(index, item)"
          @error="handleImageLoaded(index, item)"
        />

        <AppOverlay :percentage="40" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 1. Imports

// 2. Types et constantes statiques
type CarouselPanelItem = {
  category: string
  title: string
  image: string
  paragraphs: string[]
}

type CarouselPanelProps = {
  items?: CarouselPanelItem[]
  activeIndex?: number
  loadAllImages?: boolean
}

type ImageLoading = 'eager' | 'lazy'

type ImageFetchPriority = 'high' | 'low' | 'auto'

type CarouselPanelImageLoadPayload = {
  index: number
  src: string
}

type CarouselPanelImagesLoadedPayload = {
  total: number
}

// 3. Props et emits
const props = withDefaults(defineProps<CarouselPanelProps>(), {
  items: () => [],
  activeIndex: 0,
  loadAllImages: false,
})

const emit = defineEmits<{
  'image-loaded': [payload: CarouselPanelImageLoadPayload]
  'images-loaded': [payload: CarouselPanelImagesLoadedPayload]
}>()

// 4. Composables, stores, routeur

// 5. Etat local

// 6. Data inputs
const loadedImageKeys = ref<Set<string>>(new Set())

const emittedLoadedSignature = ref<string | null>(null)

// 7. Validation et helpers purs
const getImageKey = (index: number, src: string): string => `${index}:${src}`

const shouldRenderImage = (index: number): boolean => {
  return index === 0 || props.loadAllImages
}

const getImageLoading = (index: number): ImageLoading => {
  if (props.loadAllImages) return 'eager'

  return index === 0 ? 'eager' : 'lazy'
}

const getImageFetchPriority = (index: number): ImageFetchPriority => {
  if (index === safeActiveIndex.value) return 'high'
  return props.loadAllImages ? 'auto' : 'low'
}

// 8. Computed UI-ready

// 9. Actions et handlers
const items = computed<CarouselPanelItem[]>(() => props.items ?? [])

const safeActiveIndex = computed<number>(() => {
  if (items.value.length === 0) return 0

  return Math.min(Math.max(props.activeIndex, 0), items.value.length - 1)
})

const itemsSignature = computed<string>(() => {
  return items.value.map((item, index) => getImageKey(index, item.image)).join('|')
})

const expectedImageKeys = computed<string[]>(() => {
  if (items.value.length === 0) return []

  const expectedItems = props.loadAllImages ? items.value : items.value.slice(0, 1)

  return expectedItems.map((item, index) => getImageKey(index, item.image))
})

const expectedImageSignature = computed<string>(() => expectedImageKeys.value.join('|'))

const trackStyle = computed<Record<string, string>>(() => {
  return {
    transform: `translate3d(0, -${safeActiveIndex.value * 100}%, 0)`,
  }
})

const handleImageLoaded = (index: number, item: CarouselPanelItem): void => {
  const nextLoadedImageKeys = new Set(loadedImageKeys.value)

  nextLoadedImageKeys.add(getImageKey(index, item.image))
  loadedImageKeys.value = nextLoadedImageKeys

  emit('image-loaded', {
    index,
    src: item.image,
  })
}

// 10. Watch et watchEffect
watch(itemsSignature, () => {
  loadedImageKeys.value = new Set()
  emittedLoadedSignature.value = null
})

watchEffect(() => {
  const expectedKeys = expectedImageKeys.value
  const signature = expectedImageSignature.value

  if (expectedKeys.length === 0 || emittedLoadedSignature.value === signature) return

  const hasLoadedExpectedImages = expectedKeys.every((key) => loadedImageKeys.value.has(key))

  if (!hasLoadedExpectedImages) return

  emittedLoadedSignature.value = signature
  emit('images-loaded', { total: expectedKeys.length })
})

// 11. Metadonnees ecran ou page

// 12. Lifecycle
</script>

<style scoped>
.panel-dual-carousel__track {
  will-change: transform;
}

.panel-dual-carousel__slide {
  height: 100%;
}
</style>
