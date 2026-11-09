<template>
  <div class="bg-background/15 mx-auto h-1.5 w-full">
    <div
      class="bg-background/90 h-full origin-left"
      :style="{ transform: `scaleX(${progress})` }"
    />
  </div>
</template>

<script setup lang="ts">
// 1. Imports
import { toRef } from 'vue'

// 2. Types et constantes statiques

// 3. Props et emits
const props = defineProps<{ progress: number }>()

// 4. Composables, stores, routeur

// 5. Etat local

// 6. Data inputs
const progress = toRef(props, 'progress')

// 7. Validation et helpers purs

// 8. Computed UI-ready

// 9. Actions et handlers

// 10. Watch et watchEffect

// 11. Metadonnees ecran ou page

// 12. Lifecycle
</script>
