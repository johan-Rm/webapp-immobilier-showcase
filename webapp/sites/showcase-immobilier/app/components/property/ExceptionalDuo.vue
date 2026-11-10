<template>
  <!-- SCREEN_06 — Duo (2 visuels juxtaposés) + texte. Côte à côte (desktop) / empilés (mobile),
       dégradé sombre, puis bloc texte aligné à droite. -->
  <div class="absolute inset-0 grid grid-rows-2 lg:grid-cols-2 lg:grid-rows-1">
    <AppImage
      v-for="media in screen.media"
      :key="media.src"
      :src="media.src"
      :alt="media.alt"
      class="size-full object-cover"
      sizes="xs:100vw lg:50vw"
      loading="lazy"
    />
  </div>
  <div
    v-if="displayImageOverlayClass"
    class="pointer-events-none absolute inset-0"
    :class="displayImageOverlayClass"
    aria-hidden="true"
  />
  <div
    class="absolute top-1/2 right-6 left-6 z-10 max-w-xl -translate-y-1/2 text-right lg:top-auto lg:right-32 lg:bottom-36 lg:left-auto lg:translate-y-0"
  >
    <PropertyContentZone :screen="screen" tone="image" align="right" />
  </div>
</template>

<script setup lang="ts">
// 1. Imports
import type { ExceptionalScreen } from '#shared/types/exceptional'

import { imageOverlayClass } from './exceptional.helpers'

// 3. Props et emits
const props = defineProps<{ screen: ExceptionalScreen }>()

// 8. Computed UI-ready
const displayImageOverlayClass = computed(() =>
  imageOverlayClass(props.screen, 'bg-gradient-to-t from-black/85 via-black/25 to-black/10'),
)
</script>
