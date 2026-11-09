<template>
  <!-- Zone de contenu éditoriale partagée par tous les screens du parcours immersif :
       eyebrow + titre (avec accent optionnel) + texte. Le `tone` adapte les couleurs au
       fond (clair `surface`, image sombre `image`, panneau `overlay` mode-dépendant) ;
       `align` cale le paragraphe à droite. Les éléments additionnels (CTA, specs, vignettes)
       restent portés par chaque screen. -->
  <p :class="labelClass">— {{ screen.eyebrow }}</p>
  <h2 class="text-4xl leading-tight font-light text-balance md:text-5xl" :class="textClass">
    <span
      v-for="(part, partIndex) in parts"
      :key="partIndex"
      :class="part.accent ? accentClass : ''"
      >{{ part.text }}</span
    >
  </h2>
  <p
    v-if="screen.text"
    class="mt-5 line-clamp-2 max-w-md text-base leading-relaxed"
    :class="[textClass, align === 'right' ? 'ml-auto' : '']"
  >
    {{ screen.text }}
  </p>
</template>

<script setup lang="ts">
// 1. Imports
import type { ExceptionalScreen } from '#shared/types/exceptional'

import {
  BACKGROUND_ACCENT_CLASS,
  BACKGROUND_LABEL_CLASS,
  IMAGE_ACCENT_CLASS,
  IMAGE_LABEL_CLASS,
  overlayAccentClass,
  overlayLabelClass,
  overlayTextClass,
  titleParts,
} from './exceptional.helpers'

// 2. Types et constantes statiques
type ContentZoneTone = 'surface' | 'image' | 'overlay'
type ContentZoneAlign = 'left' | 'right'

// 3. Props et emits
const props = withDefaults(
  defineProps<{ screen: ExceptionalScreen; tone?: ContentZoneTone; align?: ContentZoneAlign }>(),
  { tone: 'image', align: 'left' },
)

// 8. Computed UI-ready
const parts = computed(() => titleParts(props.screen))

const labelClass = computed(() => {
  if (props.tone === 'surface') return BACKGROUND_LABEL_CLASS
  if (props.tone === 'overlay') return overlayLabelClass(props.screen)
  return IMAGE_LABEL_CLASS
})

const textClass = computed(() => {
  if (props.tone === 'surface') return 'text-foreground'
  if (props.tone === 'overlay') return overlayTextClass(props.screen)
  return 'text-white'
})

const accentClass = computed(() => {
  if (props.tone === 'surface') return BACKGROUND_ACCENT_CLASS
  if (props.tone === 'overlay') return overlayAccentClass(props.screen)
  return IMAGE_ACCENT_CLASS
})
</script>
