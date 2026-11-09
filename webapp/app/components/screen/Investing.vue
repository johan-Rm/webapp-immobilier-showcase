<template>
  <div
    class="screen-invest bg-background text-foreground relative h-full"
    :class="screenColumnTemplate[column].value"
  >
    <div class="absolute inset-0 isolate">
      <LazyAppImage
        v-if="backgroundImage && shouldLoadVisuals"
        :src="backgroundImage.url"
        :alt="backgroundImage.alt"
        :width="BACKGROUND_IMAGE_WIDTH"
        class="absolute inset-0 h-full w-full object-cover"
        loading="lazy"
        fetchpriority="low"
        :placeholder="false"
        fit="cover"
      />

      <LazyAppOverlay :percentage="50" />
    </div>

    <LazyHeadingH2Screen :to="investingPageLink">
      {{ sectionLinkLabel }}
    </LazyHeadingH2Screen>

    <div
      class="xs:-translate-y-8 pointer-events-auto absolute inset-0 flex -translate-y-24 items-end justify-start px-6 md:translate-y-0 md:px-20 2xl:-translate-y-24"
      :class="contentBottomPaddingClass"
    >
      <div class="w-full md:max-w-2xl xl:max-w-3xl 2xl:max-w-7xl">
        <LazyCardInvest
          :section-label="sectionLabel"
          :section-title="sectionTitle"
          :section-paragraphs="paragraphs"
          :primary-link="primaryCardLink"
          :secondary-link="secondaryCardLink"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 1. Imports
import type { MediaObject } from '@schemas/interfaces'

// 2. Types et constantes statiques
type InvestScreenProps = {
  data?: CreativeWork
}

type RawImageObject = {
  url?: string
  alt?: string
  caption?: string
}

const column: ScreenColumnTemplate = 'single'

// 3. Props et emits
const props = defineProps<InvestScreenProps>()

// 4. Composables, stores, routeur
const logger = useLogger({ module: 'screen-invest' })
const localePath = useLocalePath()
const { getMenuItemByIdentifier } = useAppNavigation()
const { warmQuickActionTarget } = useQuickActionWarmup()
const { IMAGE_DIMENSIONS } = useAppImage()
const { setScreenMeta, screenColumnTemplate } = useScreenSystem()
const { isPhoneDevice, isLandscape } = useDeviceDetect()
const BACKGROUND_IMAGE_WIDTH = IMAGE_DIMENSIONS.fullscreenCover.width

// 5. Etat local
let hasWarmedSectionTarget = false

// 6. Data inputs

// 7. Validation et helpers purs

// 8. Computed UI-ready
const investingPageLink = computed<string>(() => {
  const investingItem = getMenuItemByIdentifier('investing')
  return localePath(investingItem?.url ?? '/')
})

const sectionLabel = computed<string>(() => props.data?.name?.trim() ?? '')
const sectionTitle = computed<string>(() => props.data?.headline?.trim() ?? '')
const sectionLinkLabel = computed<string>(() => props.data?.alternativeHeadline?.trim() ?? '')

const paragraphs = computed<string>(() => {
  const text = props.data?.text

  if (typeof text !== 'string' || text.trim().length === 0) {
    return ''
  }

  return text
})

const resolvedLinks = computed<MenuItem[]>(() => props.data?.links ?? [])
const primaryLink = computed<MenuItem | undefined>(() => resolvedLinks.value[0])
const secondaryLink = computed<MenuItem | undefined>(() => resolvedLinks.value[1])

const primaryCardLink = computed<{ label: string; to: string } | null>(() => {
  if (!primaryLink.value?.label) {
    return null
  }

  return {
    label: primaryLink.value.label,
    to: localePath(primaryLink.value.url ?? '/'),
  }
})

const secondaryCardLink = computed<{ label: string; to: string } | null>(() => {
  if (!secondaryLink.value?.label) {
    return null
  }

  return {
    label: secondaryLink.value.label,
    to: localePath(secondaryLink.value.url ?? '/'),
  }
})

const backgroundImage = computed<{ url: string; alt: string } | null>(() => {
  const image = props.data?.image

  if (typeof image === 'string' && image.trim().length > 0) {
    return {
      url: image,
      alt: '',
    }
  }

  if (image && typeof image === 'object' && 'url' in image && typeof image.url === 'string') {
    const rawImage = image as MediaObject | RawImageObject
    const url = image.url.trim()

    if (url.length === 0) {
      return null
    }

    const alt =
      ('alt' in rawImage && typeof rawImage.alt === 'string' && rawImage.alt.trim().length > 0
        ? rawImage.alt
        : undefined) ??
      ('caption' in rawImage &&
      typeof rawImage.caption === 'string' &&
      rawImage.caption.trim().length > 0
        ? rawImage.caption
        : undefined) ??
      ''

    return {
      url,
      alt,
    }
  }

  return null
})

const isPhoneLandscape = computed<boolean>(() => isPhoneDevice.value && isLandscape.value)

const contentBottomPaddingClass = computed<string>(() => {
  if (isPhoneLandscape.value) {
    return 'pb-4 md:pb-10'
  }

  return 'pb-10 md:pb-28'
})

const shouldLoadVisuals = useDeferredScreenVisuals(
  'screen-invest',
  computed(() => !!backgroundImage.value),
  { stage: 'runtime' },
)

// 9. Actions et handlers
const warmSectionTarget = (): void => {
  if (hasWarmedSectionTarget) return

  const to = investingPageLink.value
  if (!to || to === '/') return

  hasWarmedSectionTarget = true

  warmQuickActionTarget({
    id: `screen-invest:${to}`,
    to,
  })

  logger.info('Warm section target', {
    screenId: 'screen-invest',
    target: to,
  })
}

// 10. Watch et watchEffect

// 11. Metadonnees ecran ou page

// 12. Lifecycle
onMounted(() => {
  logger.info('Mounted screen', {
    screenId: 'screen-invest',
    hasBackgroundImage: Boolean(backgroundImage.value?.url),
    linksCount: resolvedLinks.value.length,
  })

  setScreenMeta('screen-invest', {
    type: 'standard',
    logo: {
      visible: true,
    },
    layout: {
      column,
      contentZone: 'none',
      imageZone: 'background',
      hasBackgroundImage: Boolean(backgroundImage.value?.url),
      backgroundImage: backgroundImage.value?.url ?? '',
    },
  })

  warmSectionTarget()
})

onUnmounted(() => {
  logger.info('Unmounted screen', {
    screenId: 'screen-invest',
  })
})
</script>
