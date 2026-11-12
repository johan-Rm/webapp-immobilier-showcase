<template>
  <div class="h-full w-full"><DashboardAccessForm :key="mode" :mode="mode" /></div>
</template>

<script setup lang="ts">
// 2. Constantes
const modes = {
  connexion: 'login',
  invitation: 'invitation',
  'mot-de-passe': 'forgot',
  reinitialiser: 'reset',
} as const
// 4. Composables
const route = useRoute()
// 8. Données UI
const mode = computed(() => modes[route.params.access as keyof typeof modes])
// 11. Métadonnées
definePageMeta({
  layout: 'auth',
  validate: (route) =>
    ['connexion', 'invitation', 'mot-de-passe', 'reinitialiser'].includes(
      String(route.params.access),
    ),
})
</script>
