import type { H3Event } from 'h3'

import { z } from 'zod'

import { checkProject, editorCollection, editorRevision, nativeParse } from '../articles/native'
import { saasFailure } from '../auth/runtime'
import { authorizedSaasRequest } from '../auth/session'

import { saasLocaleSchema } from '#shared/schemas'

const categorySchema = z.object({
  id: z.uuid(),
  project: z.string(),
  inCodeSet: z.string(),
  updatedAt: z.string(),
  translations: z.array(
    z.object({ locale: z.string(), label: z.string(), text: z.string().nullable().optional() }),
  ),
})
export const readEditorCategory = async (event: H3Event, projectId: string, id: string) => {
  const raw = nativeParse(
    categorySchema,
    await authorizedSaasRequest(
      event,
      `/api/projects/${projectId}/category-codes/${id}/translations`,
    ),
  )
  checkProject(raw.project, projectId)
  if (raw.id !== id || raw.inCodeSet !== 'article-category') return saasFailure(404, 'not_found')
  return raw
}
export const mapEditorCategory = (raw: z.infer<typeof categorySchema>) => ({
  id: raw.id,
  projectId: raw.project.split('/').at(-1)!,
  inCodeSet: raw.inCodeSet,
  revision: editorRevision({
    ...raw,
    translations: [...raw.translations].sort((a, b) => a.locale.localeCompare(b.locale)),
  }),
  labels: Object.fromEntries(
    raw.translations.flatMap((t) =>
      saasLocaleSchema.safeParse(t.locale).success ? [[t.locale, t.text?.trim() || t.label]] : [],
    ),
  ),
})
export const editorCategories = async (event: H3Event, projectId: string) => {
  const rows = await editorCollection(event, `/api/projects/${projectId}/category-codes`)
  const result = []
  for (const value of rows) {
    const row = nativeParse(
      z.object({ id: z.uuid(), project: z.string(), inCodeSet: z.string() }),
      value,
    )
    checkProject(row.project, projectId)
    if (row.inCodeSet === 'article-category')
      result.push(mapEditorCategory(await readEditorCategory(event, projectId, row.id)))
  }
  return result
}
