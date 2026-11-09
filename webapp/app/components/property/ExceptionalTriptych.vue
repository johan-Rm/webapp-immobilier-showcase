<template>
  <!-- SCREEN_01 — Triptyque (3 visuels) + texte. Composition éditoriale de 3 visuels superposés,
       chacun cliquable (→ lightbox). Desktop : texte et triptyque côte à côte. Mobile : empilés.
       `reverse` permute les deux blocs sur desktop. -->
  <div class="flex h-full w-full flex-col justify-center px-6 pt-28 pb-24 md:block md:p-0">
    <div
      class="text-foreground md:absolute md:top-1/2 md:z-10 md:max-w-sm md:-translate-y-1/2"
      :class="screen.reverse ? 'md:right-12 md:text-right lg:right-20' : 'md:left-12 lg:left-20'"
    >
      <PropertyContentZone :screen="screen" tone="surface" />
      <button
        v-if="screen.cta"
        type="button"
        class="border-foreground/50 mt-6 inline-flex items-center gap-2 border-b pb-1 text-sm transition-opacity hover:opacity-70"
        @click="emit('go-next')"
      >
        {{ screen.cta }} <span aria-hidden="true">→</span>
      </button>
    </div>
    <div
      class="relative mt-12 aspect-3/2 w-full md:absolute md:top-1/2 md:mt-0 md:aspect-auto md:h-[68dvh] md:w-[58vw] md:-translate-y-1/2"
      :class="screen.reverse ? 'md:left-10 lg:left-16' : 'md:right-10 lg:right-16'"
    >
      <button
        v-if="screen.media[0]"
        type="button"
        class="group absolute top-0 right-[10%] z-20 aspect-video w-[62%] cursor-zoom-in overflow-hidden rounded-md bg-white p-1 shadow-2xl transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        :aria-label="`Agrandir : ${screen.media[0].alt}`"
        @click="emit('open-lightbox', screen.media, 0)"
      >
        <span class="relative block size-full overflow-hidden">
          <AppImage
            :src="screen.media[0].src"
            :alt="screen.media[0].alt"
            class="size-full object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="sm:58vw md:36vw"
            loading="lazy"
          />
          <span
            v-if="displayImageOverlayClass"
            class="pointer-events-none absolute inset-0"
            :class="displayImageOverlayClass"
            aria-hidden="true"
          />
        </span>
      </button>
      <button
        v-if="screen.media[1]"
        type="button"
        class="group absolute bottom-[10%] left-[4%] z-10 aspect-video w-[58%] cursor-zoom-in overflow-hidden rounded-md shadow-2xl transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        :aria-label="`Agrandir : ${screen.media[1].alt}`"
        @click="emit('open-lightbox', screen.media, 1)"
      >
        <span class="relative block size-full overflow-hidden">
          <AppImage
            :src="screen.media[1].src"
            :alt="screen.media[1].alt"
            class="size-full object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="sm:54vw md:34vw"
            loading="lazy"
          />
          <span
            v-if="displayImageOverlayClass"
            class="pointer-events-none absolute inset-0"
            :class="displayImageOverlayClass"
            aria-hidden="true"
          />
        </span>
      </button>
      <button
        v-if="screen.media[2]"
        type="button"
        class="group absolute right-[6%] bottom-0 z-30 h-[56%] w-[32%] cursor-zoom-in overflow-hidden rounded-md shadow-2xl transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        :aria-label="`Agrandir : ${screen.media[2].alt}`"
        @click="emit('open-lightbox', screen.media, 2)"
      >
        <span class="relative block size-full overflow-hidden">
          <AppImage
            :src="screen.media[2].src"
            :alt="screen.media[2].alt"
            class="size-full object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="sm:30vw md:18vw"
            loading="lazy"
          />
          <span
            v-if="displayImageOverlayClass"
            class="pointer-events-none absolute inset-0"
            :class="displayImageOverlayClass"
            aria-hidden="true"
          />
        </span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
// 1. Imports
import type { ExceptionalMedia, ExceptionalScreen } from '#shared/types/exceptional'

import { imageOverlayClass } from './exceptional.helpers'

// 3. Props et emits
const props = defineProps<{ screen: ExceptionalScreen }>()
const emit = defineEmits<{
  'open-lightbox': [media: readonly ExceptionalMedia[], index: number]
  'go-next': []
}>()

// 8. Computed UI-ready
const displayImageOverlayClass = computed(() => imageOverlayClass(props.screen))
</script>
