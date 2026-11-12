<template>
  <section class="h-full min-h-0 overflow-y-auto px-5 pt-20 pb-10 lg:p-8">
    <div class="mx-auto max-w-5xl space-y-6">
      <h1 class="text-2xl font-bold">{{ t('menu.articles') }}</h1>
      <DashboardContextPicker />
      <UAlert v-if="state.error" color="error" role="alert" :description="state.error" />
      <UAlert v-if="state.success" color="success" role="status" :description="state.success" />
      <p v-if="!projectId">{{ t('editor.chooseProject') }}</p>
      <p v-else-if="state.loading" role="status">{{ t('access.loading') }}</p>
      <template v-else-if="state.editing">
        <fieldset :disabled="state.pending" class="space-y-6">
          <DashboardArticleFields />
          <DashboardArticleBlocks />
        </fieldset>
        <DashboardArticleActions />
      </template>
      <DashboardArticleList v-else />
      <DashboardArticleResources />
    </div>
  </section>
</template>

<script setup lang="ts">
// 4. Composables
const { t } = useI18n()
const editor = useArticleEditor()
const { state, projectId, dirty } = editor
const resources = useArticleResources(editor)
provide('saas.editor', editor)
provide('saas.resources', resources)
const unsaved = useState('saas.unsaved', () => false)
const busy = useState('saas.busy', () => false)
// 9. Handlers
const beforeUnload = (event: BeforeUnloadEvent) => {
  if (dirty.value) {
    event.preventDefault()
    event.returnValue = ''
  }
}
onBeforeRouteLeave(() => !busy.value && (!unsaved.value || editor.actions.confirmDiscard()))
// 10. Watchers
watch(
  () => state.pending || resources.state.pending,
  (value) => {
    busy.value = value
  },
)
watch(dirty, (value) => {
  unsaved.value = value
})
watch(projectId, () => {
  state.editing = false
  state.items = []
  resources.state.open = false
  void editor.actions.list()
})
// 12. Lifecycle
onMounted(() => {
  void editor.actions.list()
  window.addEventListener('beforeunload', beforeUnload)
})
onBeforeUnmount(() => {
  unsaved.value = false
  busy.value = false
  window.removeEventListener('beforeunload', beforeUnload)
})
</script>
