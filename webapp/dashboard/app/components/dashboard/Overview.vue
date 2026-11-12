<template>
  <section class="h-dvh min-h-0 overflow-y-auto px-5 pt-20 pb-8 sm:px-10 lg:pt-10">
    <div class="mx-auto max-w-4xl space-y-7">
      <header>
        <p class="text-primary mb-2 text-sm font-medium">{{ t('home.eyebrow') }}</p>
        <h1 class="text-3xl font-semibold tracking-tight">{{ t('home.title') }}</h1>
        <p class="text-muted mt-3">{{ t('home.description') }}</p>
      </header>
      <UAlert v-if="state.error" color="warning" :title="state.error" role="alert" />
      <UCard v-if="state.user">
        <DashboardContextPicker />
      </UCard>
      <UCard v-if="context.project">
        <p class="text-muted text-sm">{{ t('home.activeProject') }}</p>
        <h2 class="mt-2 text-xl font-semibold">{{ context.project.name }}</h2>
        <p class="text-muted mt-3 text-sm">{{ t('home.availability') }}</p>
      </UCard>
      <UAlert
        v-else-if="state.user && !state.loading"
        icon="i-lucide-folder-open"
        :title="t('home.empty')"
      />
      <p v-else role="status">{{ t('access.loading') }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
// 4. Composables
const { t } = useI18n()
const { state, context } = useDashboardAccess()
</script>
