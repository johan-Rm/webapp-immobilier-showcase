<template>
  <!-- SCREEN_05 — Mini carousel (full image + vignettes). Le visuel principal change selon la
       vignette sélectionnée (`activeMediaIndex`, piloté par le composable du rail). -->
  <AppImage
    :src="currentMedia.src"
    :alt="currentMedia.alt"
    class="absolute inset-0 size-full object-cover transition-[opacity] duration-300"
    sizes="sm:100vw md:100vw lg:100vw xl:100vw 2xl:100vw"
    loading="lazy"
  />
  <div
    v-if="displayImageOverlayClass"
    class="pointer-events-none absolute inset-0"
    :class="displayImageOverlayClass"
    aria-hidden="true"
  />
  <div
    class="absolute right-6 bottom-40 left-6 z-10 max-w-xl text-right md:right-32 md:bottom-40 md:left-auto"
  >
    <PropertyContentZone :screen="screen" tone="image" align="right" />

    <!-- Navigation interne (max 5 vignettes). Mobile : flex-1 → toutes visibles. -->
    <div class="mt-5 flex gap-1.5 md:justify-end">
      <button
        v-for="(media, mediaIndex) in screen.media.slice(0, 5)"
        :key="media.src"
        type="button"
        class="relative h-11 min-w-0 flex-1 overflow-hidden rounded border transition-all md:h-12 md:w-18 md:flex-none"
        :class="
          activeIndex === mediaIndex
            ? 'border-white opacity-100'
            : 'border-white/30 opacity-70 hover:opacity-100'
        "
        :aria-label="`Voir : ${media.alt}`"
        @click="emit('select-media', mediaIndex)"
      >
        <AppImage
          :src="media.src"
          :alt="media.alt"
          class="size-full object-cover"
          sizes="xs:64px md:72px"
          loading="lazy"
        />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
// 1. Imports
import type { ExceptionalMedia, ExceptionalScreen } from '#shared/types/exceptional'

import { imageOverlayClass } from './exceptional.helpers'

// 3. Props et emits
const props = defineProps<{ screen: ExceptionalScreen; activeMediaIndex?: number }>()
const emit = defineEmits<{ 'select-media': [index: number] }>()

// 8. Computed UI-ready
const displayImageOverlayClass = computed(() =>
  imageOverlayClass(props.screen, 'bg-gradient-to-t from-black/85 via-black/35 to-black/30'),
)
const activeIndex = computed<number>(() => props.activeMediaIndex ?? 0)
const currentMedia = computed<ExceptionalMedia>(
  () => props.screen.media[activeIndex.value] ?? props.screen.media[0] ?? { src: '', alt: '' },
)
</script>
