<template>
  <DashboardPanel kind="articles" :title="t('editor.actions')">
    <div class="space-y-4">
      <p>{{ t('editor.savedBeforePublication') }}</p>
      <p v-if="state.projection" role="status">{{ t(`editor.projection_${state.projection}`) }}</p>
      <div class="flex flex-wrap gap-3">
        <UButton
          class="dashboard-panel-action"
          :loading="state.pending"
          :disabled="state.conflict"
          :label="t('editor.save')"
          @click="actions.save"
        />
        <UButton
          class="dashboard-panel-action"
          :disabled="!status.canPreview"
          variant="outline"
          :label="t('editor.preview')"
          @click="actions.preview"
        />
        <UButton
          class="dashboard-panel-action"
          :disabled="!status.canPublish"
          :label="t('editor.publish')"
          @click="actions.publication('publish')"
        />
        <UButton
          :disabled="!status.canPublish || !status.published"
          color="warning"
          :label="t('editor.unpublish')"
          @click="actions.publication('unpublish')"
        />
        <UButton
          v-if="state.retryKey"
          class="dashboard-panel-action"
          :disabled="state.pending"
          variant="outline"
          :label="t('editor.retry')"
          @click="actions.publication(state.retryAction as 'publish' | 'unpublish')"
        />
        <UButton
          v-if="state.conflict"
          color="warning"
          :label="t('editor.reload')"
          @click="actions.open(state.article?.id, state.locale)"
        />
        <UButton
          class="dashboard-panel-action"
          variant="ghost"
          :label="t('editor.back')"
          @click="actions.close"
        />
      </div>
    </div>
  </DashboardPanel>
</template>
<script setup lang="ts">
// 1. Imports
// 2. Types et constantes statiques
// 3. Props et emits
// 4. Composables
const { t } = useI18n()
const { state, status, actions } = inject<ReturnType<typeof useArticleEditor>>('saas.editor')!
// 5. État local
// 6. Data inputs
// 7. Validation et helpers purs
// 8. Computed UI-ready
// 9. Actions et handlers
// 10. Watch et watchEffect
// 11. Métadonnées écran ou page
// 12. Lifecycle
</script>
