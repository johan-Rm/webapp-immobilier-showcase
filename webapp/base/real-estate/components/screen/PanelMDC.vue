<template>
  <div
    class="screen-panel-mdc bg-background text-foreground grid"
    :class="[
      screenColumnTemplate[columnTemplate].value,
      isPhoneDevice || isTabletPortrait ? 'overflow-y-auto' : 'overflow-hidden',
    ]"
  >
    <div class="relative h-full" :class="isPhoneDevice || isTabletPortrait ? 'order-2' : 'order-1'">
      <AppImage
        class="h-full w-full object-cover"
        :src="bgImageUrl"
        alt="Decorative landscape"
        v-bind="IMAGE_PRESETS.vertical3col"
      />

      <AppOverlay :percentage="30" />

      <div class="absolute inset-x-0 bottom-4 z-10 flex justify-center px-4 2xl:bottom-16 2xl:px-6">
        <ULink
          :to="realEstatePropertiesAnchor"
          aria-label="Voir nos biens immobiliers"
          class="group relative inline-flex h-10 items-center gap-2 rounded-xl bg-black/20 px-3 text-sm font-medium text-white/90 backdrop-blur transition hover:bg-white/15 hover:text-white 2xl:h-14 2xl:gap-3 2xl:rounded-2xl 2xl:px-5 2xl:text-base"
        >
          <UIcon name="i-lucide-arrow-down" class="text-base text-white/90 2xl:text-xl" />
          <span>Nos biens immobiliers</span>
        </ULink>
      </div>
    </div>

    <div
      class="relative h-full w-full pt-32 md:pt-8 2xl:pt-64"
      :class="[
        isPhoneDevice || isTabletPortrait ? 'order-1' : 'order-2',
        isPhoneDevice || isTabletPortrait ? '' : 'min-h-0',
      ]"
    >
      <div class="relative flex h-full min-h-0 w-full flex-col items-start justify-center gap-4">
        <HeadingH1 size="3xl" class="w-full px-6 uppercase md:max-w-2xl 2xl:max-w-full 2xl:px-16">
          {{ panelTitle }}
        </HeadingH1>

        <MarkdownPanelMdc :content="page" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 1. Imports
import type { WebPage } from '@schemas/interfaces'

// 2. Types et constantes statiques
type PanelMdcProps = {
  webPageSlug?: string
}

const realEstatePropertiesAnchor = '#screen-real-estate-three-col-properties'
const columnTemplate: ScreenColumnTemplate = 'split-33-67'

// 3. Props et emits
const props = withDefaults(defineProps<PanelMdcProps>(), {
  webPageSlug: 'l-agence',
})

// 4. Composables, stores, routeur
const { getPageBySlug } = useWebPage()
const { isPhoneDevice, isTabletPortrait } = useDeviceDetect()
const { setScreenMeta, screenColumnTemplate } = useScreenSystem()

// 5. Etat local

// 6. Data inputs
const page = computed<WebPage | null>(() => getPageBySlug(props.webPageSlug))

// 7. Validation et helpers purs

// 8. Computed UI-ready
const bgImageUrl = computed<string>(() => {
  const image = page.value?.associatedMedia

  if (typeof image === 'string') return image

  if (Array.isArray(image)) {
    const firstImage = image[0]

    if (typeof firstImage === 'string') return firstImage

    if (firstImage && typeof firstImage === 'object' && typeof firstImage.url === 'string') {
      return firstImage.url
    }
  }

  return ''
})

const panelTitle = computed(() => {
  const alternativeHeadline =
    typeof page.value?.alternativeHeadline === 'string' ? page.value.alternativeHeadline.trim() : ''
  const headline = typeof page.value?.headline === 'string' ? page.value.headline.trim() : ''

  return alternativeHeadline || headline
})

// 9. Actions et handlers

// 10. Watch et watchEffect

// 11. Metadonnees ecran ou page

// 12. Lifecycle
onMounted(() => {
  setScreenMeta('screen-panel-mdc', {
    type: 'standard',
    navigator: {
      enabled: false,
    },
    layout: {
      column: columnTemplate,
      contentZone: isPhoneDevice.value || isTabletPortrait.value ? 'top' : 'left',
      imageZone: isPhoneDevice.value || isTabletPortrait.value ? 'bottom' : 'left',
    },
    socialNetwork: {
      visible: true,
      backgroundTone: 'black',
    },
    logo: {
      visible: true,
    },
  })
})
</script>
