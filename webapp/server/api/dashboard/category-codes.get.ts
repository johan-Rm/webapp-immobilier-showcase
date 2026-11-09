import { loadContentFromFiles } from '../../utils/content/loaders'

type ContentCategoryCode = {
  id?: unknown
  codeValue?: string
  inCodeSet?: string
  name?: string
  metadata?: {
    isEnabled?: boolean
  }
}

export type DashboardCategoryCodeIri = {
  iri: string
  code: string
  inCodeSet: string
  label: string
  metadata?: {
    isEnabled?: boolean
  }
}

export default defineEventHandler(async (event): Promise<DashboardCategoryCodeIri[]> => {
  await requireUserSession(event)

  const queryLocale = getQuery(event).locale
  const locale = typeof queryLocale === 'string' && queryLocale ? queryLocale : 'fr'
  const { projectId } = useRuntimeConfig().symfony
  if (!projectId) {
    throw createError({ statusCode: 500, statusMessage: 'SYMFONY_PROJECT_ID manquant' })
  }

  const items = await loadContentFromFiles<ContentCategoryCode[]>('category-code', locale)

  return items.flatMap((item) => {
    if (typeof item.id !== 'string' || !item.id || !item.codeValue || !item.inCodeSet) {
      return []
    }

    return [
      {
        iri: `/api/projects/${projectId}/category-codes/${item.id}`,
        code: item.codeValue,
        inCodeSet: item.inCodeSet,
        label: item.name ?? item.codeValue,
        ...(item.metadata ? { metadata: item.metadata } : {}),
      },
    ]
  })
})
