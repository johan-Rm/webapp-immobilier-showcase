<template>
  <UCard>
    <div class="space-y-4">
      <p>{{ t('editor.savedBeforePublication') }}</p>
      <p v-if="state.projection" role="status">{{ t(`editor.projection_${state.projection}`) }}</p>
      <div class="flex flex-wrap gap-3">
        <UButton
          :loading="state.pending"
          :disabled="state.conflict"
          :label="t('editor.save')"
          @click="actions.save"
        />
        <UButton
          :disabled="!status.canPreview"
          variant="outline"
          :label="t('editor.preview')"
          @click="actions.preview"
        />
        <UButton
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
        <UButton variant="ghost" :label="t('editor.back')" @click="actions.close" />
      </div>
    </div>
  </UCard>
</template>
<script setup lang="ts">
// 4. Composables
const { t } = useI18n()
const { state, status, actions } = inject<ReturnType<typeof useArticleEditor>>('saas.editor')!
</script>
