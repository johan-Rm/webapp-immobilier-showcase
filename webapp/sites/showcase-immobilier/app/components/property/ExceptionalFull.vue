<template>
  <!-- SCREEN_03 — Full image + texte (zone optionnelle). Cas `isFirst` (écran d'ouverture) :
       bloc texte aligné à droite pour ne pas concurrencer la synthèse fixe, sans accent. -->
  <AppImage
    :src="screen.media[0]?.src ?? ''"
    :alt="screen.media[0]?.alt ?? ''"
    class="absolute inset-0 size-full object-cover"
    sizes="sm:100vw md:100vw lg:100vw xl:100vw 2xl:100vw"
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
  <div
    v-if="screen.title"
    class="absolute z-10 max-w-xl text-white"
    :class="
      isFirst
        ? 'right-6 bottom-32 left-6 text-right md:right-32 md:bottom-36 md:left-auto md:max-w-2xl'
        : 'bottom-32 left-6 md:bottom-36 md:left-16'
    "
  >
    <PropertyContentZone :screen="screen" tone="image" :align="isFirst ? 'right' : 'left'" />
  </div>
</template>

<script setup lang="ts">
// 1. Imports
import type { ExceptionalScreen } from '#shared/types/exceptional'

import { imageOverlayClass } from './exceptional.helpers'

// 2. Types et constantes statiques

// 3. Props et emits
const props = defineProps<{ screen: ExceptionalScreen; eager?: boolean; isFirst?: boolean }>()

// 4. Composables, stores, routeur

// 5. Etat local

// 6. Data inputs

// 7. Validation et helpers purs

// 8. Computed UI-ready
const displayImageOverlayClass = computed(() =>
  imageOverlayClass(props.screen, 'bg-gradient-to-t from-black/80 via-black/25 to-black/20'),
)

// 9. Actions et handlers

// 10. Watch et watchEffect

// 11. Metadonnees ecran ou page

// 12. Lifecycle
</script>
