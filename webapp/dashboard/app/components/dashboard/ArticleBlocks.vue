<template>
  <DashboardPanel kind="content" :title="t('editor.content')">
    <div class="mb-4 flex flex-wrap gap-3">
      <UButton
        v-for="type in types"
        :key="type"
        class="dashboard-panel-action"
        variant="outline"
        :label="t(`editor.add_${type}`)"
        @click="actions.add(type)"
      />
    </div>
    <div class="space-y-4">
      <DashboardPanel
        v-for="(block, index) in blocks"
        :key="block.id"
        kind="content"
        :data-block-type="block.type"
      >
        <div class="mb-4 flex flex-wrap items-center gap-2">
          <h3 class="mr-auto font-medium">{{ t(`editor.block_${block.type}`) }}</h3>
          <UButton
            class="dashboard-panel-action"
            :disabled="index === 0"
            :aria-label="t('editor.moveUp')"
            icon="i-lucide-arrow-up"
            variant="ghost"
            @click="actions.move(index, -1)"
          />
          <UButton
            class="dashboard-panel-action"
            :disabled="index === blocks.length - 1"
            :aria-label="t('editor.moveDown')"
            icon="i-lucide-arrow-down"
            variant="ghost"
            @click="actions.move(index, 1)"
          />
          <UButton
            color="error"
            variant="ghost"
            :label="t('editor.removeBlock')"
            @click="actions.remove(index)"
          />
        </div>
        <DashboardRichText
          v-if="block.type === 'text'"
          v-model="block.document"
          :disabled="editor.state.pending"
        />
        <div v-else class="space-y-3">
          <UButton
            class="dashboard-panel-action"
            variant="outline"
            :label="t('editor.chooseMedia')"
            @click="resources.actions.open('media', block.id)"
          />
          <template v-if="block.type === 'image'">
            <p>{{ t('editor.selectedMedia', { id: block.mediaId }) }}</p>
            <UFormField :label="t('editor.alt')" :name="`${block.id}-alt`"
              ><UInput v-model="block.alt" class="w-full"
            /></UFormField>
            <UFormField :label="t('editor.caption')" :name="`${block.id}-caption`"
              ><UInput v-model="block.caption" class="w-full"
            /></UFormField>
          </template>
          <template v-else>
            <div
              v-for="(item, itemIndex) in block.items"
              :key="itemIndex"
              class="border-default space-y-2 border p-3"
            >
              <p>{{ t('editor.selectedMedia', { id: item.mediaId }) }}</p>
              <UFormField :label="t('editor.alt')" :name="`${block.id}-${itemIndex}-alt`"
                ><UInput v-model="item.alt" class="w-full"
              /></UFormField>
              <UFormField :label="t('editor.caption')" :name="`${block.id}-${itemIndex}-caption`"
                ><UInput v-model="item.caption" class="w-full"
              /></UFormField>
              <UButton
                class="dashboard-panel-action"
                :disabled="itemIndex === 0"
                :label="t('editor.moveUp')"
                variant="ghost"
                @click="moveItem(block.items, itemIndex)"
              />
              <UButton
                class="dashboard-panel-action"
                :label="t('editor.removeImage')"
                variant="ghost"
                @click="block.items.splice(itemIndex, 1)"
              />
            </div>
          </template>
        </div>
      </DashboardPanel>
    </div>
  </DashboardPanel>
</template>
<script setup lang="ts">
// 1. Imports
// 2. Constants
const types = ['text', 'image', 'gallery'] as const
// 3. Props et emits
// 4. Composables
const { t } = useI18n()
const editor = inject<ReturnType<typeof useArticleEditor>>('saas.editor')!
const resources = inject<ReturnType<typeof useArticleResources>>('saas.resources')!
const { blocks, actions } = useArticleBlocks(editor)
// 5. État local
// 6. Data inputs
// 7. Validation et helpers purs
// 8. Computed UI-ready
// 9. Handlers
const moveItem = <T,>(items: T[], index: number) => {
  const [item] = items.splice(index, 1)
  items.splice(index - 1, 0, item!)
}
// 10. Watch et watchEffect
// 11. Métadonnées écran ou page
// 12. Lifecycle
</script>
