<template>
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
</template>

<script setup lang="ts">
// 4. Composables
const { t } = useI18n()
const { state, context, actions } = useDashboardAccess()
</script>
