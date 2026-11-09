<template>
  <article
    :aria-labelledby="panel.headingId"
    role="group"
    class="screen-real-estate-three-col-properties__panel relative isolate flex h-full min-h-[70vh] justify-center overflow-hidden"
    :class="panelAlignmentClass"
  >
    <AppImage
      :src="panel.image"
      :alt="panel.imageAlt"
      class="absolute inset-0 h-full w-full object-cover"
      :loading="index === 0 ? 'eager' : 'lazy'"
      v-bind="IMAGE_PRESETS.vertical3col"
    />

    <AppOverlay :percentage="50" />

    <NuxtLink
      :to="isDisabled ? undefined : localePath(panel.to)"
      :aria-label="panelAriaLabel"
      :aria-disabled="isDisabled"
      class="relative z-10 mb-0 flex w-full flex-col items-center justify-center gap-3 px-8 py-12 text-center transition md:mb-20 md:px-10 2xl:mb-64"
      :class="[
        isDisabled
          ? 'pointer-events-none cursor-not-allowed opacity-40 grayscale'
          : 'pointer-events-none md:pointer-events-auto',
      ]"
    >
      <HeadingH3
        :id="panel.headingId"
        class="pointer-events-auto"
        hide-line
        size="2xl"
        text-align="center"
      >
        {{ panel.title }}
      </HeadingH3>

      <p
        v-if="shouldShowDescription && panel.description"
        class="line-clamp-2 text-xs leading-relaxed font-medium text-white/85 2xl:px-10"
      >
        {{ panel.description }}
      </p>
    </NuxtLink>
  </article>
</template>

<script setup lang="ts">
// 1. Imports

// 2. Types et constantes statiques
type TryptiquePanel = {
  image: string
  imageAlt: string
  title: string
  description: string
  to: string
  headingId: string
}

type ThreeColPropertyPanelProps = {
  panel: TryptiquePanel
  index: number
}

// 3. Props et emits
const props = defineProps<ThreeColPropertyPanelProps>()

// 4. Composables, stores, routeur
const localePath = useLocalePath()

const { isPhoneDevice, isTabletPortrait } = useDeviceDetect()

const { getItemsByRealEstateListing } = useAccommodation()

// 5. Etat local

// 6. Data inputs

// 7. Validation et helpers purs
const getListingSlugFromUrl = (url?: string): string => {
  if (!url) return ''
  return url.split('/').filter(Boolean).at(-1) ?? ''
}

const isListingUrl = (url?: string): boolean => {
  return typeof url === 'string' && url.includes('/properties/')
}

const isDisabled = computed<boolean>(() => {
  if (!isListingUrl(props.panel.to)) return false

  const listingSlug = getListingSlugFromUrl(props.panel.to)
  return getItemsByRealEstateListing(listingSlug).value.length === 0
})

const shouldShowDescription = computed<boolean>(() => {
  return !isPhoneDevice.value && !isTabletPortrait.value
})

// 8. Computed UI-ready

// 9. Actions et handlers
const panelAriaLabel = computed<string>(() => {
  if (isDisabled.value) {
    return `${props.panel.title} – Aucun bien disponible`
  }

  return props.panel.description
    ? `${props.panel.title} – ${props.panel.description}`
    : props.panel.title
})

const panelAlignmentClass = computed<string>(() => {
  if (props.index === 0) return 'items-end'
  return isPhoneDevice.value ? 'items-center' : 'items-end'
})

// 10. Watch et watchEffect

// 11. Metadonnees ecran ou page

// 12. Lifecycle
</script>
