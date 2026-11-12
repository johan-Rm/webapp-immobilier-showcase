<template>
  <USlideover
    v-model:open="state.open"
    :title="t(state.mode === 'categories' ? 'editor.categories' : 'editor.chooseMedia')"
  >
    <template #body>
      <div class="space-y-5">
        <UAlert v-if="state.error" role="alert" color="error" :description="state.error" />
        <form class="flex gap-2" @submit.prevent="actions.search()">
          <UInput v-model="state.query" :aria-label="t('editor.resourceSearch')" />
          <UButton type="submit" :label="t('editor.search')" />
        </form>
        <p v-if="state.loading">{{ t('access.loading') }}</p>
        <template v-else-if="state.mode === 'categories'">
          <div
            v-for="item in categoryItems"
            :key="item.id"
            class="flex items-center justify-between gap-3"
          >
            <UCheckbox
              :model-value="item.selected"
              :label="item.label"
              @update:model-value="actions.toggle(item.id)"
            />
            <UButton
              variant="ghost"
              :disabled="state.pending"
              :label="t('editor.editCategory', { label: item.label })"
              @click="actions.edit(item)"
            />
          </div>
          <form class="space-y-3" @submit.prevent="actions.saveCategory">
            <h3 class="font-semibold">
              {{ t(state.category ? 'editor.modifyCategory' : 'editor.newCategory') }}
            </h3>
            <UAlert
              v-if="state.category"
              role="alert"
              color="warning"
              :description="t('editor.sharedWarning', { count: state.impacts })"
            />
            <ul v-if="state.category" class="space-y-1">
              <li v-for="item in state.usages" :key="item.id">{{ item.headline }}</li>
            </ul>
            <UCheckbox
              v-if="state.category"
              v-model="state.confirmed"
              :label="t('editor.confirmShared')"
            />
            <UFormField :label="t('editor.categoryLabel')" name="category-label" required
              ><UInput v-model="state.label" class="w-full"
            /></UFormField>
            <UButton
              type="submit"
              :loading="state.pending"
              :disabled="!state.label.trim() || Boolean(state.category && !state.confirmed)"
              :label="t('editor.saveCategory')"
            />
            <UButton variant="ghost" :label="t('editor.cancelCategory')" @click="cancelCategory" />
          </form>
        </template>
        <template v-else>
          <div
            v-for="item in state.media"
            :key="item.id"
            class="flex items-center justify-between gap-3"
          >
            <span>{{ item.caption || item.id }}</span>
            <UButton
              :disabled="!item.ready || item.kind !== 'image'"
              :label="t('editor.selectMedia', { label: item.caption || item.id })"
              @click="actions.selectMedia(item)"
            />
          </div>
          <form class="space-y-3" @submit.prevent="actions.upload">
            <UFormField :label="t('editor.file')" name="media-file"
              ><UInput
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                @change="chooseFile"
            /></UFormField>
            <UFormField :label="t('editor.caption')" name="media-caption"
              ><UInput v-model="state.caption"
            /></UFormField>
            <UButton
              type="submit"
              :loading="state.pending"
              :disabled="!state.file"
              :label="t('editor.upload')"
            />
          </form>
        </template>
        <div class="flex gap-3">
          <UButton
            :disabled="state.page <= 1 || state.loading"
            :label="t('editor.previous')"
            @click="actions.search(state.page - 1)"
          />
          <UButton
            :disabled="!state.hasNext || state.loading"
            :label="t('editor.next')"
            @click="actions.search(state.page + 1)"
          />
        </div>
        <UButton
          variant="outline"
          :label="t('editor.closeResources')"
          @click="state.open = false"
        />
      </div>
    </template>
  </USlideover>
</template>
<script setup lang="ts">
// 4. Composables
const { t } = useI18n()
const { state, categoryItems, actions } =
  inject<ReturnType<typeof useArticleResources>>('saas.resources')!
// 9. Handlers
const cancelCategory = () => {
  state.category = null
  state.label = ''
}
const chooseFile = (event: Event) => {
  state.file = (event.target as HTMLInputElement).files?.[0] ?? null
}
</script>
