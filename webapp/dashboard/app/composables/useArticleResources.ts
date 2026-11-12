export const useArticleResources = (editor: ReturnType<typeof useArticleEditor>) => {
  type Category = {
    id: string
    revision: string
    labels: Partial<Record<'fr' | 'en' | 'es', string>>
  }
  type Media = { id: string; caption: string; ready: boolean; kind: string }
  const access = useDashboardAccess()
  const { t } = useI18n()
  const state = reactive({
    open: false,
    mode: 'categories' as 'categories' | 'media',
    query: '',
    categories: [] as Category[],
    media: [] as Media[],
    page: 1,
    hasNext: false,
    loading: false,
    pending: false,
    error: '',
    category: null as Category | null,
    label: '',
    usages: [] as { id: string; headline: string }[],
    impacts: 0,
    confirmed: false,
    file: null as File | null,
    caption: '',
    target: 'primary' as string,
  })
  const base = computed(() => `/projects/${encodeURIComponent(editor.projectId.value)}`)
  const categoryItems = computed(() =>
    state.categories.map((item) => ({
      ...item,
      label: item.labels[editor.state.locale] ?? t('editor.untranslatedCategory'),
      selected: editor.state.form.categoryIds.includes(item.id),
    })),
  )
  let sequence = 0
  const search = async (page = 1) => {
    const requestId = ++sequence
    const project = editor.projectId.value
    state.loading = true
    state.error = ''
    try {
      const result = await access.actions.request<{
        items: Category[] & Media[]
        hasNext: boolean
      }>(`${base.value}/${state.mode}`, { query: { q: state.query, page, pageSize: 20 } })
      if (requestId !== sequence || project !== editor.projectId.value) return
      if (state.mode === 'categories') state.categories = result.items
      else state.media = result.items
      state.page = page
      state.hasNext = result.hasNext
    } catch {
      if (requestId === sequence && project === editor.projectId.value)
        state.error = t('editor.resourceFailed')
    } finally {
      if (requestId === sequence) state.loading = false
    }
  }
  const open = async (mode: 'categories' | 'media', target = 'primary') => {
    state.categories = []
    state.media = []
    state.mode = mode
    state.target = target
    state.query = ''
    state.category = null
    state.label = ''
    state.usages = []
    state.impacts = 0
    state.confirmed = false
    state.file = null
    state.caption = ''
    state.open = true
    await search()
  }
  const toggle = (id: string) => {
    const ids = editor.state.form.categoryIds
    editor.state.form.categoryIds = ids.includes(id) ? ids.filter((v) => v !== id) : [...ids, id]
  }
  const edit = async (category: Category) => {
    state.pending = true
    state.error = ''
    state.confirmed = false
    try {
      const usages = await access.actions.collection<{ id: string; headline: string }>(
        `${base.value}/categories/${category.id}/usages`,
      )
      state.category = category
      state.label = category.labels[editor.state.locale] ?? ''
      state.usages = usages
      state.impacts = usages.length
    } catch {
      state.error = t('editor.resourceFailed')
    } finally {
      state.pending = false
    }
  }
  const saveCategory = async () => {
    if (!state.label.trim() || (state.category && !state.confirmed)) return
    state.pending = true
    state.error = ''
    try {
      const category = await access.actions.request<Category>(
        `${base.value}/categories${state.category ? `/${state.category.id}` : ''}`,
        {
          method: state.category ? 'PUT' : 'POST',
          headers: state.category ? { 'If-Match': state.category.revision } : {},
          body: { labels: { ...state.category?.labels, [editor.state.locale]: state.label } },
        },
      )
      if (!state.category && !editor.state.form.categoryIds.includes(category.id))
        editor.state.form.categoryIds.push(category.id)
      state.category = null
      state.label = ''
      state.confirmed = false
      await search()
    } catch {
      state.error = t('editor.resourceFailed')
    } finally {
      state.pending = false
    }
  }
  const selectMedia = (media: Media) => {
    if (!media.ready || media.kind !== 'image') return
    const image = { mediaId: media.id, alt: '', caption: media.caption }
    if (state.target === 'primary')
      editor.state.form.translation.primaryImage = { mediaId: media.id, alt: '' }
    else {
      const block = editor.state.form.translation.content.blocks.find((b) => b.id === state.target)
      if (block?.type === 'image') {
        block.mediaId = media.id
        block.caption = media.caption
      }
      if (block?.type === 'gallery') block.items.push(image)
    }
    state.open = false
  }
  const upload = async () => {
    if (!state.file) return
    state.pending = true
    state.error = ''
    const body = new FormData()
    body.set('file', state.file)
    body.set('locale', editor.state.locale)
    body.set('caption', state.caption)
    try {
      const media = await access.actions.request<Media>(`${base.value}/media`, {
        method: 'POST',
        body,
      })
      if (!media.ready || media.kind !== 'image') {
        await search()
        state.error = t('editor.mediaProcessing')
        return
      }
      selectMedia(media)
    } catch {
      state.error = t('editor.resourceFailed')
    } finally {
      state.pending = false
    }
  }
  return {
    state,
    categoryItems,
    actions: { search, open, toggle, edit, saveCategory, selectMedia, upload },
  }
}
