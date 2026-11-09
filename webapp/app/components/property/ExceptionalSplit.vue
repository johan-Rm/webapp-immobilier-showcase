<template>
  <!-- SCREEN_04 — Split 50/50 : moitié image + moitié panneau texte sur fond `background`.
       `screen.reverse` permute les deux moitiés sur desktop. Mobile : image en haut (42%). -->
  <div class="flex h-full w-full flex-col md:flex-row">
    <div
      class="relative order-first h-[42%] md:h-full md:w-1/2"
      :class="screen.reverse ? 'md:order-2' : 'md:order-1'"
    >
      <AppImage
        :src="screen.media[0]?.src ?? ''"
        :alt="screen.media[0]?.alt ?? ''"
        class="absolute inset-0 size-full object-cover"
        sizes="xs:100vw md:50vw"
        :loading="eager ? 'eager' : 'lazy'"
        :preload="eager"
        :fetchpriority="eager ? 'high' : 'auto'"
      />
      <div
        v-if="displayImageOverlayClass"
        class="pointer-events-none absolute inset-0"
        :class="displayImageOverlayClass"
        aria-hidden="true"
      />
    </div>
    <div
      class="bg-background text-foreground flex flex-1 flex-col justify-center px-6 py-10 md:w-1/2 md:px-16"
      :class="screen.reverse ? 'md:order-1' : 'md:order-2'"
    >
      <PropertyContentZone :screen="screen" tone="surface" />
      <ul
        v-if="screen.specs"
        class="text-foreground/70 mt-7 flex flex-wrap gap-x-4 gap-y-2 text-xs tracking-wide"
      >
        <li v-for="spec in screen.specs" :key="spec">{{ spec }}</li>
      </ul>
      <button
        v-if="screen.cta"
        type="button"
        class="border-foreground/50 mt-8 inline-flex w-fit items-center gap-2 border-b pb-1 text-base transition-opacity hover:opacity-70"
        @click="emit('go-next')"
      >
        {{ screen.cta }} <span aria-hidden="true">→</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
// 1. Imports
import type { ExceptionalScreen } from '#shared/types/exceptional'

import { imageOverlayClass } from './exceptional.helpers'

// 3. Props et emits
const props = defineProps<{ screen: ExceptionalScreen; eager?: boolean }>()
const emit = defineEmits<{ 'go-next': [] }>()

// 8. Computed UI-ready
const displayImageOverlayClass = computed(() => imageOverlayClass(props.screen))
</script>
