<template>
  <div class="flex flex-col items-center" :class="gapClass">
    <div
      class="border-border/20 bg-surface/20 pointer-events-auto inline-flex gap-1 rounded-[18px] border p-1 backdrop-blur"
      role="group"
      aria-label="Choisir une transition"
    >
      <button
        class="hover:bg-background/10 text-foreground grid place-items-center transition hover:-translate-y-0.5"
        :class="[buttonSizeClass, props.modelValue === 'fade' ? '!text-secondary' : '']"
        type="button"
        title="Transition: fade"
        aria-label="Transition: fade"
        :aria-pressed="props.modelValue === 'fade'"
        @click="setMode('fade')"
      >
        <UIcon name="i-lucide-blend" :class="iconSizeClass" />
      </button>

      <button
        class="hover:bg-background/10 text-foreground grid place-items-center transition hover:-translate-y-0.5"
        :class="[buttonSizeClass, props.modelValue === 'zoomCut' ? '!text-secondary' : '']"
        type="button"
        title="Transition: zoom cut"
        aria-label="Transition: zoom cut"
        :aria-pressed="props.modelValue === 'zoomCut'"
        @click="setMode('zoomCut')"
      >
        <UIcon name="i-lucide-zoom-in" :class="iconSizeClass" />
      </button>

      <button
        class="hover:bg-background/10 text-foreground grid place-items-center transition hover:-translate-y-0.5"
        :class="[buttonSizeClass, props.modelValue === 'flash' ? '!text-secondary' : '']"
        type="button"
        title="Transition: flash"
        aria-label="Transition: flash"
        :aria-pressed="props.modelValue === 'flash'"
        @click="setMode('flash')"
      >
        <UIcon name="i-lucide-sparkles" :class="iconSizeClass" />
      </button>

      <button
        class="hover:bg-background/10 text-foreground grid place-items-center transition hover:-translate-y-0.5"
        :class="[buttonSizeClass, props.modelValue === 'slide' ? '!text-secondary' : '']"
        type="button"
        title="Transition: slide"
        aria-label="Transition: slide"
        :aria-pressed="props.modelValue === 'slide'"
        @click="setMode('slide')"
      >
        <UIcon name="i-lucide-arrow-left-right" :class="iconSizeClass" />
      </button>
    </div>

    <p class="text-foreground text-center font-medium" :class="labelClass">
      {{ selectedLabel }}
    </p>
  </div>
</template>

<script setup lang="ts">
// 1. Imports

import { computed } from 'vue'

// 2. Types et constantes statiques
type Props = {
  modelValue: TransitionMode
  size?: 'sm' | 'md'
}

type Emits = {
  'update:modelValue': [TransitionMode]
}

// 3. Props et emits
const props = defineProps<Props>()

const emit = defineEmits<Emits>()

// 4. Composables, stores, routeur

// 5. Etat local

// 6. Data inputs

// 7. Validation et helpers purs

// 8. Computed UI-ready
const size = computed(() => props.size ?? 'md')

const buttonSizeClass = computed(() =>
  size.value === 'sm' ? 'h-8 w-8 rounded-[14px]' : 'h-9 w-9 rounded-[16px]',
)

const iconSizeClass = computed(() => (size.value === 'sm' ? 'h-4 w-4' : 'h-4.5 w-4.5'))

const labelClass = computed(() => (size.value === 'sm' ? 'text-[0.65rem]' : 'text-xs'))

const gapClass = computed(() => (size.value === 'sm' ? 'gap-1.5' : 'gap-2'))

const selectedLabel = computed(() => {
  if (props.modelValue === 'zoomCut') return 'Zoom cut'
  if (props.modelValue === 'flash') return 'Flash'
  if (props.modelValue === 'slide') return 'Slide'
  return 'Fade'
})

// 9. Actions et handlers
const setMode = (mode: TransitionMode): void => {
  emit('update:modelValue', mode)
}

// 10. Watch et watchEffect

// 11. Metadonnees ecran ou page

// 12. Lifecycle
</script>
