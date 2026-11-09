<template>
  <div class="flex flex-col items-center" :class="gapClass">
    <div
      class="border-border/20 bg-surface/20 pointer-events-auto inline-flex gap-1 rounded-[18px] border p-1 backdrop-blur"
      role="group"
      aria-label="Choisir l'intensité cinéma"
    >
      <button
        class="hover:bg-background/10 text-foreground inline-flex items-center gap-2 font-semibold uppercase transition"
        :class="[buttonClass, props.modelValue === 'soft' ? '!text-secondary' : '']"
        type="button"
        title="Cinema soft"
        :aria-pressed="props.modelValue === 'soft'"
        @click="setMode('soft')"
      >
        Soft
      </button>

      <button
        class="hover:bg-background/10 text-foreground inline-flex items-center gap-2 font-semibold uppercase transition"
        :class="[buttonClass, props.modelValue === 'strong' ? '!text-secondary' : '']"
        type="button"
        title="Cinema strong"
        :aria-pressed="props.modelValue === 'strong'"
        @click="setMode('strong')"
      >
        Strong
      </button>

      <button
        class="hover:bg-background/10 text-foreground inline-flex items-center gap-2 font-semibold uppercase transition"
        :class="[buttonClass, props.modelValue === 'none' ? '!text-secondary' : '']"
        type="button"
        title="Désactiver le mode cinéma"
        :aria-pressed="props.modelValue === 'none'"
        @click="setMode('none')"
      >
        None
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
  modelValue: CinemaMode
  size?: 'sm' | 'md'
}

type Emits = {
  'update:modelValue': [CinemaMode]
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

const buttonClass = computed(() =>
  size.value === 'sm'
    ? 'h-7 px-2 text-[0.58rem] tracking-[0.14em] rounded-[12px]'
    : 'h-8 px-2.5 text-[0.7rem] tracking-[0.16em] rounded-[14px]',
)

const labelClass = computed(() => (size.value === 'sm' ? 'text-[0.65rem]' : 'text-xs'))

const gapClass = computed(() => (size.value === 'sm' ? 'gap-1.5' : 'gap-2'))

const selectedLabel = computed(() => {
  if (props.modelValue === 'strong') return 'Strong'
  if (props.modelValue === 'soft') return 'Soft'
  return 'Désactivé'
})

// 9. Actions et handlers
const setMode = (mode: CinemaMode): void => {
  emit('update:modelValue', mode)
}

// 10. Watch et watchEffect

// 11. Metadonnees ecran ou page

// 12. Lifecycle
</script>
