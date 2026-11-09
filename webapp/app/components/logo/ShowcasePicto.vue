<template>
  <div class="inline-flex items-center justify-center" role="img" :aria-label="logoAriaLabel">
    <LogoPictoSvg
      class="w-auto shrink-0 object-contain"
      :class="[{ 'logo-showcase-picto--mono': props.mono }, props.colorClass, sizeClass]"
      :style="inlineSize"
    />
  </div>
</template>

<script setup lang="ts">
// 1. Imports
import { computed } from 'vue'

import LogoPictoSvg from '~/assets/logo/showcase-picto.svg'

// 2. Types et constantes statiques
type PresetSize = 'xs' | 'sm' | 'md' | 'lg'

// 3. Props et emits
const props = withDefaults(
  defineProps<{
    colorClass?: string
    size?: PresetSize | number
    mono?: boolean
    ariaLabel?: string
  }>(),
  {
    colorClass: 'text-primary',
    size: 'sm',
    mono: true,
    ariaLabel: undefined,
  },
)

// 4. Composables, stores, routeur
const { appData } = useApp()

// 5. Etat local

// 6. Data inputs

// 7. Validation et helpers purs

// 8. Computed UI-ready
const logoAriaLabel = computed(() => props.ariaLabel ?? appData.value?.components?.logo?.ariaLabel)
const sizeClass = computed(() => {
  if (typeof props.size === 'number') return ''
  const map: Record<PresetSize, string> = {
    xs: 'h-4',
    sm: 'h-5',
    md: 'h-6',
    lg: 'h-8',
  }
  return map[props.size] ?? map.sm
})

const inlineSize = computed(() =>
  typeof props.size === 'number' ? { height: `${props.size}px` } : undefined,
)

// 9. Actions et handlers

// 10. Watch et watchEffect

// 11. Metadonnees ecran ou page

// 12. Lifecycle
</script>

<style scoped>
.logo-showcase-picto--mono :deep(path),
.logo-showcase-picto--mono :deep(rect),
.logo-showcase-picto--mono :deep(circle),
.logo-showcase-picto--mono :deep(ellipse),
.logo-showcase-picto--mono :deep(polygon),
.logo-showcase-picto--mono :deep(polyline) {
  fill: currentColor;
  stroke: currentColor;
}

.logo-showcase-picto--mono :deep([fill='white']),
.logo-showcase-picto--mono :deep([style*='fill:white']),
.logo-showcase-picto--mono :deep([style*='fill: white']) {
  fill: white;
}
</style>
