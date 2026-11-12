<template>
  <div class="grid h-dvh w-screen overflow-hidden lg:grid-cols-[260px_minmax(0,1fr)]">
    <aside class="border-default bg-default hidden min-h-0 border-r lg:block">
      <DashboardNavigation />
    </aside>
    <div class="min-h-0 min-w-0">
      <UButton
        class="fixed top-4 left-4 z-20 lg:hidden"
        icon="i-lucide-menu"
        variant="soft"
        :aria-label="t('menu.open')"
        @click="menuOpen = true"
      />
      <slot />
    </div>
    <USlideover v-model:open="menuOpen" side="left" :title="t('menu.navigation')">
      <template #body><DashboardNavigation @navigate="menuOpen = false" /></template>
    </USlideover>
  </div>
</template>

<script setup lang="ts">
// 4. Composables
const { t } = useI18n()
// 5. État local
const menuOpen = ref(false)
</script>
