<template>
  <div
    class="pointer-events-none font-mono text-sm font-semibold text-white 2xl:text-4xl"
    aria-label="Position dans la progression"
  >
    <span class="text-background">{{ String(current).padStart(2, '0') }}</span>
    <span class="opacity-70">/</span>
    <span>{{ String(total).padStart(2, '0') }}</span>
  </div>
</template>

<script setup lang="ts">
// 1. Imports
import { toRefs } from 'vue'

// 2. Types et constantes statiques

// 3. Props et emits
const props = defineProps<{ current: number; total: number }>()

// 4. Composables, stores, routeur

// 5. Etat local

// 6. Data inputs
const { current, total } = toRefs(props)

// 7. Validation et helpers purs

// 8. Computed UI-ready

// 9. Actions et handlers

// 10. Watch et watchEffect

// 11. Metadonnees ecran ou page

// 12. Lifecycle
</script>
