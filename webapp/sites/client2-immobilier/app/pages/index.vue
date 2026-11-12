<template>
  <main>
    <h1>{{ $t('title') }}</h1>
    <nav aria-label="Articles"><NuxtLink to="/fr/articles">Articles</NuxtLink></nav>
  </main>
</template>

<script setup lang="ts">
// 1. Imports
// 2. Types et constantes statiques
// 3. Props et emits
// 4. Composables, stores, routeur
const { t } = useI18n()
// 5. Etat local
// 6. Data inputs
// 7. Validation et helpers purs
// 8. Computed UI-ready
// 9. Actions et handlers
// 10. Watch et watchEffect
// 11. Metadonnees ecran ou page
useHead(() => ({ title: t('title'), htmlAttrs: { lang: 'fr' } }))
// 12. Lifecycle
</script>
