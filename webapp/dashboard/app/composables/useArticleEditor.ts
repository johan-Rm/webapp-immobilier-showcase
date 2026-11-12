import type { SaasArticle, SaasArticleWrite, SaasLocale } from '#shared/types/saas/article'

import { saasArticleWriteSchema } from '#shared/schemas'

export const useArticleEditor = () => {
  const { t } = useI18n()
  const access = useDashboardAccess()
  const blank = (locale: SaasLocale): SaasArticleWrite => ({
    categoryIds: [],
    translation: {
      locale,
      headline: '',
      slug: '',
      summary: '',
      primaryImage: null,
      metaTitle: '',
      metaDescription: '',
      content: { schemaVersion: 1, blocks: [] },
    },
  })
  const state = reactive({
    article: null as SaasArticle | null,
    form: blank('fr'),
    baseline: '',
    locale: 'fr' as SaasLocale,
    items: [] as SaasArticle[],
    query: '',
    page: 1,
    hasNext: false,
    editing: false,
    loading: false,
    pending: false,
    error: '',
    success: '',
    conflict: false,
    projection: '' as '' | 'pending' | 'applied' | 'failed',
    retryKey: '',
    retryAction: '',
    retryRevision: '',
  })
  const projectId = computed(() => access.state.value.projectId)
  const base = computed(() => `/projects/${encodeURIComponent(projectId.value)}/articles`)
  const dirty = computed(() => state.editing && JSON.stringify(state.form) !== state.baseline)
  const edition = computed(() =>
    state.article?.translations.find((v) => v.draft.locale === state.locale),
  )
  const status = computed(() => ({
    published: Boolean(edition.value?.published),
    generated: edition.value?.draft.generated ?? false,
    revision: state.article?.revision ?? '',
    canPublish: Boolean(edition.value) && !dirty.value && !state.pending && !state.conflict,
    canPreview: Boolean(edition.value) && !dirty.value && !state.pending,
  }))
  const fail = (error: unknown) => {
    const code = (error as { data?: { error?: { code?: string } } }).data?.error?.code
    state.conflict = code === 'revision_conflict' || code === 'revision_required'
    state.error = t(state.conflict ? 'editor.conflict' : 'editor.failed')
  }
  const adopt = (article: SaasArticle | null, locale = state.locale) => {
    state.article = article
    state.locale = locale
    const draft = article?.translations.find((v) => v.draft.locale === locale)?.draft
    state.form = draft
      ? JSON.parse(
          JSON.stringify({
            categoryIds: article!.categoryIds,
            translation: {
              locale: draft.locale,
              headline: draft.headline,
              slug: draft.slug,
              summary: draft.summary,
              primaryImage: draft.primaryImage,
              metaTitle: draft.metaTitle,
              metaDescription: draft.metaDescription,
              content: draft.content,
            },
          }),
        )
      : blank(locale)
    if (!draft && article) state.form.categoryIds = [...article.categoryIds]
    state.baseline = JSON.stringify(state.form)
    state.editing = true
    state.conflict = false
    state.error = ''
    state.success = ''
    state.retryKey = ''
    state.projection = ''
  }
  const confirmDiscard = () => !dirty.value || window.confirm(t('editor.discard'))
  let sequence = 0
  const list = async (page = 1) => {
    const requestId = ++sequence
    const project = projectId.value
    if (!projectId.value) return
    state.loading = true
    state.error = ''
    try {
      const result = await access.actions.request<{ items: SaasArticle[]; hasNext: boolean }>(
        base.value,
        { query: { q: state.query, page, pageSize: 20 } },
      )
      if (requestId !== sequence || project !== projectId.value) return
      state.items = result.items
      state.hasNext = result.hasNext
      state.page = page
    } catch (error) {
      if (requestId === sequence && project === projectId.value) fail(error)
    } finally {
      if (requestId === sequence) state.loading = false
    }
  }
  const open = async (id?: string, locale: SaasLocale = 'fr') => {
    if (!confirmDiscard()) return
    if (!id) {
      adopt(null, 'fr')
      return
    }
    const project = projectId.value
    const requestId = ++sequence
    state.loading = true
    try {
      const article = await access.actions.request<SaasArticle>(
        `${base.value}/${encodeURIComponent(id)}`,
      )
      if (requestId === sequence && project === projectId.value) adopt(article, locale)
    } catch (error) {
      if (requestId === sequence && project === projectId.value) fail(error)
    } finally {
      if (requestId === sequence) state.loading = false
    }
  }
  const changeLocale = (locale: SaasLocale) => {
    if (confirmDiscard()) adopt(state.article, locale)
  }
  const save = async () => {
    state.error = ''
    state.success = ''
    const parsed = saasArticleWriteSchema.safeParse(state.form)
    if (!parsed.success) {
      state.error = t('editor.invalid')
      return
    }
    state.pending = true
    try {
      const article = await access.actions.request<SaasArticle>(
        state.article
          ? `${base.value}/${state.article.id}/translations/${state.locale}`
          : base.value,
        {
          method: state.article ? 'PUT' : 'POST',
          body: parsed.data,
          headers: state.article ? { 'If-Match': state.article.revision } : {},
        },
      )
      adopt(article)
      state.success = t('editor.saved')
    } catch (error) {
      fail(error)
    } finally {
      state.pending = false
    }
  }
  const publication = async (action: 'publish' | 'unpublish') => {
    if (!status.value.canPublish || !state.article) return
    if (state.retryAction !== action || !state.retryKey) {
      state.retryKey = crypto.randomUUID()
      state.retryRevision = state.article.revision
    }
    state.retryAction = action
    state.pending = true
    state.error = ''
    state.success = ''
    try {
      const result = await access.actions.request<{
        revision: string
        projection: { state: 'pending' | 'applied' | 'failed' }
      }>(`${base.value}/${state.article.id}/translations/${state.locale}/publication`, {
        method: action === 'publish' ? 'POST' : 'DELETE',
        headers: { 'If-Match': state.retryRevision, 'Idempotency-Key': state.retryKey },
      })
      state.projection = result.projection.state
      state.article.revision = result.revision
      if (state.projection === 'applied') state.retryKey = ''
      const article = await access.actions.request<SaasArticle>(`${base.value}/${state.article.id}`)
      state.article = article
    } catch (error) {
      fail(error)
    } finally {
      state.pending = false
    }
  }
  const preview = () => {
    if (status.value.canPreview && state.article)
      window.open(
        `/api/saas${base.value}/${state.article.id}/translations/${state.locale}/preview`,
        '_blank',
        'noopener,noreferrer',
      )
  }
  const close = async () => {
    if (confirmDiscard()) {
      state.editing = false
      await list()
    }
  }
  return {
    state,
    projectId,
    dirty,
    status,
    actions: { list, open, save, changeLocale, publication, preview, close, confirmDiscard },
  }
}
