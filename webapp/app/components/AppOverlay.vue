<template>
  <div
    class="absolute inset-0 bg-black"
    :style="{ opacity: normalizedOpacity }"
    aria-hidden="true"
  />
</template>

<script setup lang="ts">
// 1. Imports

// 2. Types et constantes statiques

// 3. Props et emits
const props = withDefaults(
  defineProps<{
    percentage?: number
  }>(),
  {
    percentage: 35,
  },
)

// 4. Composables, stores, routeur

// 5. Etat local

// 6. Data inputs

// 7. Validation et helpers purs

// 8. Computed UI-ready
const normalizedOpacity = computed(() => {
  const safeValue = Number.isFinite(props.percentage) ? props.percentage : 0
  return Math.min(100, Math.max(0, safeValue)) / 100
})

// 9. Actions et handlers

// 10. Watch et watchEffect

// 11. Metadonnees ecran ou page

// 12. Lifecycle
</script>
