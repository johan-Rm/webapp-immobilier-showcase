<template>
  <main data-layout="editorial" data-section="contenu" :class="{ 'editorial-layout': !plain }">
    <slot />
  </main>
</template>
<script setup lang="ts">
// 1. Imports
// 2. Types et constantes statiques
// 3. Props et emits
defineProps<{ plain?: boolean }>()
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
<style>
.editorial-layout {
  height: 100dvh;
  width: 100vw;
  overflow: hidden;
  color: #0f172a;
  background: #f8fafc;
  font-family: system-ui, sans-serif;
}
.editorial-layout a {
  color: #075985;
  text-underline-offset: 0.2em;
}
.editorial-layout * {
  box-sizing: border-box;
}
body:has(.editorial-layout) {
  margin: 0;
}
</style>
