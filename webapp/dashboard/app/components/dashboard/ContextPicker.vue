<template>
  <DashboardPanel kind="context" :title="t('context.title')">
    <div class="grid gap-4 sm:grid-cols-2">
      <UFormField :label="t('context.organization')" name="organization">
        <USelect
          class="w-full"
          :model-value="state.organizationId"
          :items="context.organizationItems"
          :placeholder="t('context.chooseOrganization')"
          @update:model-value="actions.selectOrganization(String($event))"
        />
      </UFormField>
      <UFormField :label="t('context.project')" name="project">
        <USelect
          class="w-full"
          :model-value="state.projectId"
          :items="context.projectItems"
          :disabled="state.loading || !state.organizationId"
          :placeholder="t('context.chooseProject')"
          @update:model-value="actions.selectProject(String($event))"
        />
      </UFormField>
    </div>
  </DashboardPanel>
</template>

<script setup lang="ts">
// 1. Imports
// 2. Types et constantes statiques
// 3. Props et emits
// 4. Composables
const { t } = useI18n()
const { state, context, actions } = useDashboardAccess()
// 5. État local
// 6. Data inputs
// 7. Validation et helpers purs
// 8. Computed UI-ready
// 9. Actions et handlers
// 10. Watch et watchEffect
// 11. Métadonnées écran ou page
// 12. Lifecycle
</script>
