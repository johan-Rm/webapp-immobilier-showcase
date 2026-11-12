<template>
  <UApp :locale="fr">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>

<script setup lang="ts">
// 1. Imports
import { fr } from '@nuxt/ui/locale'

// 4. Composables
const { t } = useI18n()

// 11. Métadonnées
useHead({ htmlAttrs: { lang: 'fr' }, title: () => t('app.name') })
useSeoMeta({ robots: 'noindex, nofollow' })
</script>
