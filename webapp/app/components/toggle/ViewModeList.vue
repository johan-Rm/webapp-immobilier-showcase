<template>
  <div class="flex flex-col items-center" :class="gapClass">
    <div
      class="border-border/25 bg-surface/25 pointer-events-auto inline-flex gap-1 rounded-[18px] border p-1 backdrop-blur"
      role="group"
      aria-label="Choisir une vue"
    >
      <button
        class="hover:bg-background/10 text-foreground grid place-items-center transition hover:-translate-y-0.5"
        :class="[buttonSizeClass, props.modelValue === 'single' ? '!text-secondary' : '']"
        type="button"
        title="Vue single"
        aria-label="Vue single"
        :aria-pressed="props.modelValue === 'single'"
        @click="setMode('single')"
      >
        <UIcon name="i-lucide-square" :class="iconSizeClass" />
      </button>

      <button
        class="hover:bg-background/10 text-foreground grid place-items-center transition hover:-translate-y-0.5"
        :class="[buttonSizeClass, props.modelValue === 'quad' ? '!text-secondary' : '']"
        type="button"
        title="Vue quadri (2×2)"
        aria-label="Vue quadri (2×2)"
        :aria-pressed="props.modelValue === 'quad'"
        @click="setMode('quad')"
      >
        <UIcon name="i-lucide-layout-grid" :class="iconSizeClass" />
      </button>

      <button
        class="hover:bg-background/10 text-foreground grid place-items-center transition hover:-translate-y-0.5"
        :class="[buttonSizeClass, props.modelValue === 'row4' ? '!text-secondary' : '']"
        type="button"
        title="Vue ligne (4)"
        aria-label="Vue ligne (4)"
        :aria-pressed="props.modelValue === 'row4'"
        @click="setMode('row4')"
      >
        <UIcon name="i-lucide-columns-4" :class="iconSizeClass" />
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
  modelValue: ViewModeList
  size?: 'sm' | 'md'
}

type Emits = {
  'update:modelValue': [ViewModeList]
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
  if (props.modelValue === 'quad') return 'Vue quadri'
  if (props.modelValue === 'row4') return 'Vue ligne'
  return 'Vue single'
})

// 9. Actions et handlers
const setMode = (mode: ViewModeList): void => {
  emit('update:modelValue', mode)
}

// 10. Watch et watchEffect

// 11. Metadonnees ecran ou page

// 12. Lifecycle
</script>
