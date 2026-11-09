<template>
  <div class="screen-essaouira-the-jewel bg-background text-foreground" :class="rootGridClass">
    <div class="relative px-4 pt-24 pb-16 sm:pb-20 2xl:px-8 2xl:pt-64" :class="contentColumnClass">
      <LazyHeadingH2Screen :to="jewelPageLink">
        {{ sectionTitle }}
      </LazyHeadingH2Screen>

      <div
        class="grid h-full w-full grid-rows-[auto_minmax(0,1fr)] gap-4 overflow-hidden 2xl:gap-12"
        :class="contentTopPaddingClass"
      >
        <LazyPanelEditorialContent
          :section-eyebrow="sectionEyebrow"
          :section-paragraphs="sectionParagraphs"
          :section-quote="sectionQuote"
          :is-phone-device="isPhoneDevice"
          :is-landscape="isLandscape"
        />
      </div>
    </div>

    <div v-if="shouldRenderVisual" :class="visualColumnClass">
      <LazyGalleryImages
        v-if="shouldMountGallery"
        ref="galleryRef"
        :active="isScreenActive"
        :items="galleryItems"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
// 1. Imports

// 2. Types et constantes statiques
type Props = {
  data?: CreativeWork
}

type GalleryExpose = {
  activate: () => void
  start: () => void
  stop: () => void
}

// 3. Props et emits
const props = defineProps<Props>()

// 4. Composables, stores, routeur
const logger = useLogger({ module: 'screen-essaouira-the-jewel' })
const { getMenuItemByIdentifier } = useAppNavigation()
const { isPhoneDevice, isLandscape, isTabletPortrait } = useDeviceDetect()
const localePath = useLocalePath()
const { warmQuickActionTarget } = useQuickActionWarmup()
const { galleryItems } = useGalleryItems(computed(() => props.data?.hasPart))

// 5. Etat local
const galleryRef = ref<GalleryExpose | null>(null)
const currentScreenId = useState<string | null>('screen.current', () => null)

let hasWarmedSectionTarget = false

// 6. Data inputs

// 7. Validation et helpers purs

// 8. Computed UI-ready
const isScreenActive = computed(() => currentScreenId.value === 'screen-essaouira-the-jewel')

const jewelPageLink = computed<string>(() => {
  const item = getMenuItemByIdentifier('essaouira-the-jewel')
  return localePath(item?.url ?? '/')
})

const sectionTitle = computed<string>(() => props.data?.headline?.trim() ?? '')
const sectionEyebrow = computed<string>(() => props.data?.alternativeHeadline?.trim() ?? '')
const sectionQuote = computed<string>(() => props.data?.name?.trim() ?? '')

const sectionParagraphs = computed<string[]>(() => {
  if (!props.data?.text) return []

  return props.data.text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
})

const shouldRenderVisual = computed<boolean>(() => !isPhoneDevice.value)

const shouldMountGallery = computed<boolean>(() => {
  return shouldRenderVisual.value && galleryItems.value.length > 0
})

const criticalGalleryItems = computed<GalleryItem[]>(() => {
  if (galleryItems.value.length === 0) return []

  return [
    galleryItems.value[0],
    galleryItems.value[Math.ceil(galleryItems.value.length / 2)],
  ].filter((item): item is GalleryItem => item !== undefined)
})

const rootGridClass = computed<string>(() => {
  const base = 'grid min-h-0'

  if (isTabletPortrait.value) return `${base} h-dvh grid-cols-1 grid-rows-[45%_1fr]`
  if (!isPhoneDevice.value) return `${base} h-full grid-cols-[33.33%_66.67%]`
  return `${base} h-dvh grid-cols-1`
})

const contentColumnClass = computed<string>(() => {
  return isTabletPortrait.value ? 'row-start-2 h-full' : 'row-start-1 h-full'
})

const contentTopPaddingClass = computed<string>(() => {
  return isPhoneDevice.value && isLandscape.value ? 'pt-0' : 'pt-4 md:pt-16'
})

const visualColumnClass = computed<string>(() => {
  const base = 'relative h-full w-full overflow-hidden px-1'
  return !isPhoneDevice.value ? `${base} flex` : 'hidden'
})

// 9. Actions et handlers
useImageWarmup(() => criticalGalleryItems.value.map((item) => item.src), {
  stateKey: 'screen-essaouira-the-jewel:critical-gallery',
  warmupEnabled: shouldMountGallery,
  batchSize: 2,
  batchDelayMs: 0,
  preset: 'galleryColumn',
})

const warmSectionTarget = (): void => {
  if (hasWarmedSectionTarget) return

  const to = jewelPageLink.value
  if (!to || to === '/') return

  hasWarmedSectionTarget = true

  warmQuickActionTarget({
    id: `screen-essaouira-the-jewel:${to}`,
    to,
  })

  logger.info('Warm section target', {
    screenId: 'screen-essaouira-the-jewel',
    target: to,
  })
}

// 10. Watch et watchEffect
watch(isScreenActive, (active) => {
  if (active) {
    warmSectionTarget()
    galleryRef.value?.activate()
  } else {
    galleryRef.value?.stop()
  }
})

// 11. Metadonnees ecran ou page

// 12. Lifecycle
onMounted(() => {
  warmSectionTarget()
})
</script>
