<template>
  <div class="grid h-dvh w-screen overflow-hidden lg:grid-cols-[260px_minmax(0,1fr)]">
    <aside class="border-default bg-default hidden min-h-0 border-r lg:block">
      <ClientOnly>
        <DashboardNavigation />
        <template #fallback><USkeleton class="m-5 h-12" /></template>
      </ClientOnly>
    </aside>
    <div class="flex min-h-0 min-w-0 flex-col">
      <header
        class="bg-default flex h-16 shrink-0 items-center justify-between gap-3 px-5 sm:px-10"
      >
        <UButton
          class="lg:invisible"
          icon="i-lucide-menu"
          variant="soft"
          :aria-label="t('menu.open')"
          @click="menuOpen = true"
        />
        <ClientOnly>
          <USelect
            v-model="colorMode.preference"
            :items="themeItems"
            :aria-label="t('theme.label')"
            class="w-44"
          />
          <template #fallback><USkeleton class="h-8 w-44" /></template>
        </ClientOnly>
      </header>
      <div class="min-h-0 flex-1 [&>section]:h-full [&>section]:pt-8">
        <ClientOnly>
          <slot />
          <template #fallback>
            <p class="px-5 pt-8 sm:px-10" role="status">{{ t('access.loading') }}</p>
          </template>
        </ClientOnly>
      </div>
    </div>
    <USlideover v-model:open="menuOpen" side="left" :title="t('menu.navigation')">
      <template #body><DashboardNavigation @navigate="menuOpen = false" /></template>
    </USlideover>
  </div>
</template>

<script setup lang="ts">
// 1. Imports
// 2. Types et constantes statiques
// 3. Props et emits
// 4. Composables, stores, routeur
const { t } = useI18n()
const colorMode = useColorMode()
// 5. État local
const menuOpen = ref(false)
// 6. Data inputs
// 7. Validation et helpers purs
// 8. Computed UI-ready
const themeItems = computed(() => [
  { label: t('theme.light'), value: 'light', icon: 'i-lucide-sun' },
  { label: t('theme.dark'), value: 'dark', icon: 'i-lucide-moon' },
  { label: t('theme.system'), value: 'system', icon: 'i-lucide-monitor' },
])
// 9. Actions et handlers
// 10. Watch et watchEffect
// 11. Métadonnées écran ou page
// 12. Lifecycle
</script>
