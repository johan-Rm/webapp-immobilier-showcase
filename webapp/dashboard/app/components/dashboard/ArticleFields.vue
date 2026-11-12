<template>
  <UCard>
    <div class="space-y-4">
      <div class="flex flex-wrap items-end gap-4">
        <UFormField :label="t('editor.language')" name="article-language">
          <USelect
            :model-value="state.locale"
            :items="languages"
            :disabled="state.pending"
            @update:model-value="actions.changeLocale($event)"
          />
        </UFormField>
        <UBadge :label="t(status.published ? 'editor.published' : 'editor.draft')" />
        <UBadge v-if="status.generated" color="neutral" :label="t('editor.generated')" />
        <UBadge v-if="dirty" color="warning" :label="t('editor.unsaved')" />
      </div>
      <UFormField :label="t('editor.headline')" name="article-headline" required>
        <UInput v-model="state.form.translation.headline" class="w-full" :maxlength="220" />
      </UFormField>
      <UFormField :label="t('editor.slug')" name="article-slug" required>
        <UInput v-model="state.form.translation.slug" class="w-full" :maxlength="180" />
      </UFormField>
      <UFormField :label="t('editor.summary')" name="article-summary">
        <UTextarea v-model="state.form.translation.summary" class="w-full" />
      </UFormField>
      <UFormField :label="t('editor.metaTitle')" name="article-meta-title">
        <UInput v-model="state.form.translation.metaTitle" class="w-full" />
      </UFormField>
      <UFormField :label="t('editor.metaDescription')" name="article-meta-description">
        <UTextarea v-model="state.form.translation.metaDescription" class="w-full" />
      </UFormField>
      <div class="flex flex-wrap gap-3">
        <UButton
          variant="outline"
          :label="t('editor.categories')"
          @click="resources.actions.open('categories')"
        />
        <span>{{ t('editor.categoryCount', { count: state.form.categoryIds.length }) }}</span>
        <UButton
          variant="outline"
          :label="t('editor.primaryImage')"
          @click="resources.actions.open('media')"
        />
      </div>
      <div v-if="state.form.translation.primaryImage" class="space-y-3">
        <p>{{ t('editor.selectedMedia', { id: state.form.translation.primaryImage.mediaId }) }}</p>
        <UFormField :label="t('editor.alt')" name="primary-alt">
          <UInput v-model="state.form.translation.primaryImage.alt" class="w-full" />
        </UFormField>
        <UButton
          variant="ghost"
          :label="t('editor.removePrimary')"
          @click="state.form.translation.primaryImage = null"
        />
      </div>
    </div>
  </UCard>
</template>
<script setup lang="ts">
// 4. Composables
const { t } = useI18n()
const { state, status, dirty, actions } =
  inject<ReturnType<typeof useArticleEditor>>('saas.editor')!
const resources = inject<ReturnType<typeof useArticleResources>>('saas.resources')!
// 8. Computed UI-ready
const languages = computed(() => [
  { label: t('editor.language_fr'), value: 'fr' as const },
  { label: t('editor.language_en'), value: 'en' as const },
  { label: t('editor.language_es'), value: 'es' as const },
])
</script>
