<template>
  <blockquote :class="['inline-flex max-w-full items-center gap-3', textSizeClass[props.textSize]]">
    <UIcon
      :name="props.iconName"
      class="text-foreground/80 mx-auto text-[clamp(1.75rem,2.5vw,3.75rem)]"
      aria-hidden="true"
    />
    <span class="text-foreground/70 leading-[1.35]">
      {{ props.phrase }}
    </span>
  </blockquote>
</template>

<script setup lang="ts">
// 1. Imports

// 2. Types et constantes statiques
type BlockquoteOnelineTextSize = 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl'

type Props = {
  phrase: string
  iconName?: string
  textSize?: BlockquoteOnelineTextSize
}

const textSizeClass: Record<BlockquoteOnelineTextSize, string> = {
  sm: 'text-sm md:text-base',
  base: 'text-base md:text-lg',
  lg: 'text-lg md:text-xl',
  xl: 'text-xl md:text-2xl',
  '2xl': 'text-2xl md:text-3xl',
  '3xl': 'text-3xl md:text-4xl',
  '4xl': 'text-4xl md:text-5xl',
  '5xl': 'text-5xl md:text-6xl',
}

// 3. Props et emits
const props = withDefaults(defineProps<Props>(), {
  iconName: 'i-lucide-quote',
  textSize: 'base',
})

// 4. Composables, stores, routeur

// 5. Etat local

// 6. Data inputs

// 7. Validation et helpers purs

// 8. Computed UI-ready

// 9. Actions et handlers

// 10. Watch et watchEffect

// 11. Metadonnees ecran ou page

// 12. Lifecycle
</script>
