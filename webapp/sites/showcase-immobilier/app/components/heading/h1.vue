<template>
  <h1
    class="heading-h1 space-y-2 leading-tight tracking-[0.01em]"
    :class="[{ 'text-white': !props.colorClass }, props.colorClass, sizeClass, textAlignClass]"
  >
    <span
      v-if="!props.hideLine"
      class="block h-px w-12 rounded-full bg-current/75"
      aria-hidden="true"
    />
    <span>
      <slot />
    </span>
  </h1>
</template>

<script setup lang="ts">
// 1. Imports
import { resolveHeadingSizeClass } from './sizePresets'

// 2. Types et constantes statiques
type HeadingTextAlign = 'left' | 'center' | 'right'

interface HeadingH1Props {
  hideLine?: boolean
  colorClass?: string
  size?: string
  textAlign?: HeadingTextAlign
}

// 3. Props et emits
const props = withDefaults(defineProps<HeadingH1Props>(), {
  hideLine: false,
  colorClass: '',
  size: '',
  textAlign: 'left',
})

// 4. Composables, stores, routeur

// 5. Etat local

// 6. Data inputs

// 7. Validation et helpers purs

// 8. Computed UI-ready
const sizeClass = computed(() => resolveHeadingSizeClass(props.size))

const textAlignClass = computed(() => {
  switch (props.textAlign) {
    case 'center':
      return 'text-center'
    case 'right':
      return 'text-right'
    default:
      return 'text-left'
  }
})

// 9. Actions et handlers

// 10. Watch et watchEffect

// 11. Metadonnees ecran ou page

// 12. Lifecycle
</script>

<style scoped>
.heading-size-xs {
  --h1-size: clamp(0.75rem, 1vw, 0.875rem);
}
.heading-size-sm {
  --h1-size: clamp(0.875rem, 1.2vw, 1rem);
}
.heading-size-md {
  --h1-size: clamp(1rem, 1.45vw, 1.3rem);
}
.heading-size-lg {
  --h1-size: clamp(1.1rem, 1.75vw, 1.5rem);
}
.heading-size-xl {
  --h1-size: clamp(1.2rem, 2vw, 1.85rem);
}
.heading-size-2xl {
  --h1-size: clamp(1.35rem, 2.4vw, 2.25rem);
}
.heading-size-3xl {
  --h1-size: clamp(1.7rem, 2.9vw, 3rem);
}
.heading-size-4xl {
  --h1-size: clamp(2.1rem, 3.6vw, 4.4rem);
}
.heading-size-5xl {
  --h1-size: clamp(2.5rem, 4.5vw, 5.5rem);
}
</style>
