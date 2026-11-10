<template>
  <!-- RÉGION E — Lightbox du triptyque (SCREEN_01). Overlay modal monté seulement si un visuel
       est ouvert. Flèches précédent/suivant si plusieurs visuels ; navigation clavier déléguée
       au composable du rail (la lightbox capte les touches en priorité quand ouverte). -->
  <Transition
    enter-active-class="transition-opacity duration-200"
    leave-active-class="transition-opacity duration-200"
    enter-from-class="opacity-0"
    leave-to-class="opacity-0"
  >
    <div
      v-if="media"
      class="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 md:p-12"
      role="dialog"
      aria-modal="true"
      aria-label="Visuel agrandi"
      @click.self="emit('close')"
    >
      <button
        type="button"
        class="absolute top-4 right-4 z-10 flex size-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        aria-label="Fermer"
        @click="emit('close')"
      >
        <UIcon name="i-heroicons-x-mark" class="text-2xl" aria-hidden="true" />
      </button>

      <button
        v-if="hasMultiple"
        type="button"
        class="absolute left-3 z-10 flex size-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:left-6"
        aria-label="Visuel précédent"
        @click="emit('navigate', -1)"
      >
        <UIcon name="i-heroicons-chevron-left" class="text-2xl" aria-hidden="true" />
      </button>

      <AppImage
        :src="media.src"
        :alt="media.alt"
        class="max-h-full max-w-full rounded-md object-contain shadow-2xl"
        sizes="sm:100vw md:100vw lg:100vw xl:100vw 2xl:100vw"
        fit="contain"
        :quality="85"
        loading="eager"
      />

      <button
        v-if="hasMultiple"
        type="button"
        class="absolute right-3 z-10 flex size-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:right-6"
        aria-label="Visuel suivant"
        @click="emit('navigate', 1)"
      >
        <UIcon name="i-heroicons-chevron-right" class="text-2xl" aria-hidden="true" />
      </button>

      <p
        v-if="hasMultiple"
        class="absolute bottom-5 left-1/2 -translate-x-1/2 text-xs tracking-[0.2em] text-white/70 tabular-nums"
      >
        {{ index + 1 }} / {{ total }}
      </p>
    </div>
  </Transition>
</template>

<script setup lang="ts">
// 1. Imports
import type { ExceptionalMedia } from '#shared/types/exceptional'

// 3. Props et emits
defineProps<{
  media: ExceptionalMedia | null
  hasMultiple: boolean
  index: number
  total: number
}>()
const emit = defineEmits<{ close: []; navigate: [offset: number] }>()
</script>
