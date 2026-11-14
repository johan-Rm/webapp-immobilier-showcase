<template>
  <nav class="flex h-full min-h-0 flex-col" :aria-label="t('menu.navigation')">
    <div class="border-default border-b p-5">
      <UButton to="/" variant="link" @click="emit('navigate')">
        <DashboardBrand />
      </UButton>
    </div>
    <div class="min-h-0 flex-1 space-y-6 overflow-y-auto p-4">
      <section v-for="group in groups" :key="group.label">
        <h2 class="text-muted mb-2 px-2 text-xs font-semibold tracking-wider uppercase">
          {{ group.label }}
        </h2>
        <UButton
          v-for="item in group.items"
          :key="item.label"
          :to="item.to"
          :disabled="!item.available"
          variant="ghost"
          color="neutral"
          class="mb-1 w-full justify-between"
          @click="emit('navigate')"
        >
          <span>{{ item.label }}</span>
          <span v-if="!item.available" class="text-xs">{{ t('menu.soon') }}</span>
        </UButton>
      </section>
    </div>
    <div class="border-default border-t p-4">
      <p class="text-muted mb-2 truncate text-xs">{{ state.user?.email }}</p>
      <UButton
        icon="i-lucide-log-out"
        color="neutral"
        variant="ghost"
        :label="t('auth.logout')"
        @click="actions.logout"
      />
    </div>
  </nav>
</template>

<script setup lang="ts">
// 1. Imports
// 2. Types et constantes statiques
// 3. Props et emits
const emit = defineEmits<{ navigate: [] }>()

// 4. Composables, stores, routeur
const { t } = useI18n()
const { groups } = useDashboardMenu()
const { state, actions } = useDashboardAccess()

// 5. État local
// 6. Data inputs
// 7. Validation et helpers purs
// 8. Computed UI-ready
// 9. Actions et handlers
// 10. Watch et watchEffect
// 11. Métadonnées écran ou page
// 12. Lifecycle
</script>
