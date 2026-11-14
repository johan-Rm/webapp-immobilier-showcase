<template>
  <DashboardPanel kind="articles" :title="t('editor.articleList')">
    <div class="space-y-4">
      <div class="flex flex-wrap gap-3">
        <UButton
          class="dashboard-panel-action"
          :label="t('editor.create')"
          @click="actions.open()"
        />
        <form class="flex flex-1 gap-2" @submit.prevent="actions.list()">
          <UInput v-model="state.query" :aria-label="t('editor.search')" />
          <UButton
            class="dashboard-panel-action"
            type="submit"
            variant="outline"
            :label="t('editor.search')"
          />
        </form>
      </div>
      <p v-if="!state.items.length">{{ t('editor.empty') }}</p>
      <DashboardPanel v-for="article in state.items" :key="article.id" kind="articles">
        <UButton
          class="dashboard-panel-action"
          variant="link"
          :label="article.translations[0]?.draft.headline || t('editor.untitled')"
          @click="actions.open(article.id)"
        />
      </DashboardPanel>
      <div class="flex gap-3">
        <UButton
          class="dashboard-panel-action"
          :disabled="state.page <= 1"
          :label="t('editor.previous')"
          @click="actions.list(state.page - 1)"
        />
        <UButton
          class="dashboard-panel-action"
          :disabled="!state.hasNext"
          :label="t('editor.next')"
          @click="actions.list(state.page + 1)"
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
const { state, actions } = inject<ReturnType<typeof useArticleEditor>>('saas.editor')!
// 5. État local
// 6. Data inputs
// 7. Validation et helpers purs
// 8. Computed UI-ready
// 9. Actions et handlers
// 10. Watch et watchEffect
// 11. Métadonnées écran ou page
// 12. Lifecycle
</script>
