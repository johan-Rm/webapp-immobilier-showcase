<template>
  <div class="space-y-4">
    <div class="flex flex-wrap gap-3">
      <UButton :label="t('editor.create')" @click="actions.open()" />
      <form class="flex flex-1 gap-2" @submit.prevent="actions.list()">
        <UInput v-model="state.query" :aria-label="t('editor.search')" />
        <UButton type="submit" variant="outline" :label="t('editor.search')" />
      </form>
    </div>
    <p v-if="!state.items.length">{{ t('editor.empty') }}</p>
    <UCard v-for="article in state.items" :key="article.id">
      <UButton
        variant="link"
        :label="article.translations[0]?.draft.headline || t('editor.untitled')"
        @click="actions.open(article.id)"
      />
    </UCard>
    <div class="flex gap-3">
      <UButton
        :disabled="state.page <= 1"
        :label="t('editor.previous')"
        @click="actions.list(state.page - 1)"
      />
      <UButton
        :disabled="!state.hasNext"
        :label="t('editor.next')"
        @click="actions.list(state.page + 1)"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
// 4. Composables
const { t } = useI18n()
const { state, actions } = inject<ReturnType<typeof useArticleEditor>>('saas.editor')!
</script>
