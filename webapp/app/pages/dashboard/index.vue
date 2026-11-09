<template>
  <UPage class="pages-dashboard h-full w-full">
    <DashboardPropertyWorkspace
      v-if="accommodationsData"
      :data="accommodationsData"
      :user="user"
      @refresh="refreshAccommodations"
      @saved="handleAccommodationSaved"
      @logout="logout"
    />

    <UPageSection
      v-else
      class="bg-background text-foreground flex h-dvh w-screen items-center justify-center px-6"
    >
      <div class="max-w-xl text-center">
        <UIcon
          name="i-lucide-loader-circle"
          class="text-surface mx-auto text-4xl"
          aria-hidden="true"
        />
        <h1 class="font-heading mt-6 text-3xl">Chargement des biens</h1>
        <p v-if="accommodationsError" class="text-error mt-3 text-sm">
          Impossible de charger les biens du dashboard.
        </p>
        <p v-else class="text-foreground/60 mt-3 text-sm">Lecture des fiches Markdown en cours.</p>
      </div>
    </UPageSection>
  </UPage>
</template>

<script setup lang="ts">
// 1. Imports
import { useDashboardAccommodations } from '~/composables/dashboard/useDashboardAccommodations'

// 2. Types et constantes statiques

// 3. Props et emits

// 4. Composables, stores, routeur
const { loggedIn, clear, fetch, user } = useUserSession()
const { loadAccommodationForm, loadDashboardContent, loadCategoryCodes, loadMediaObjects } =
  useMetadata()

// 5. Etat local
const dashboardHeroImageUrl = useState<string>('dashboard.hero-image.url', () => '')

// 6. Data inputs
await fetch()
if (!loggedIn.value) {
  await navigateTo('/dashboard/login')
}

const {
  data: accommodationsData,
  error: accommodationsError,
  refresh: refreshAccommodations,
} = await useDashboardAccommodations(loggedIn)

const firstItem = accommodationsData.value?.items[0]
dashboardHeroImageUrl.value =
  firstItem?.preview.media[0]?.imageUrl ?? firstItem?.preview.primaryImageUrl ?? ''

// Données non-critiques : un échec ne doit pas bloquer l'accès au dashboard.
try {
  await Promise.all([
    loadAccommodationForm(),
    loadDashboardContent(),
    loadCategoryCodes(),
    loadMediaObjects(),
  ])
} catch {
  // Silencieux : les metadonnees locales restent disponibles en fallback.
}

// 7. Validation et helpers purs

// 8. Computed UI-ready

// 9. Actions et handlers
const logout = async (): Promise<void> => {
  await clear()
  await navigateTo('/dashboard/login')
}

const handleAccommodationSaved = async (): Promise<void> => {
  await refreshAccommodations()
}

// 10. Watch et watchEffect
watch(loggedIn, async (isLoggedIn) => {
  if (isLoggedIn && !accommodationsData.value) {
    await refreshAccommodations()
  }
})

// 11. Metadonnees ecran ou page
definePageMeta({
  layout: 'dashboard',
})

// 12. Lifecycle
</script>
