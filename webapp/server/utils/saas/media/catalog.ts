import type { H3Event } from 'h3'

import { z } from 'zod'

import { editorCollection, nativeParse, checkProject } from '../articles/native'
import { saasFailure } from '../auth/runtime'
import { authorizedSaasRequest } from '../auth/session'

const mediaSchema = z.object({
  id: z.uuid(),
  project: z.string(),
  mimeType: z.string().nullable(),
  status: z.enum(['pending_watermark', 'pending_analysis', 'ready', 'archived']),
  caption: z.string().nullable().optional(),
  translations: z
    .array(z.object({ locale: z.string(), caption: z.string().nullable() }))
    .optional(),
})
export const mapEditorMedia = (raw: unknown, projectId: string, locale?: string) => {
  const value = nativeParse(mediaSchema, raw)
  checkProject(value.project, projectId)
  return {
    id: value.id,
    projectId,
    kind: value.mimeType?.startsWith('image/') ? 'image' : 'document',
    ready: value.status === 'ready',
    caption: value.translations?.find((t) => t.locale === locale)?.caption ?? value.caption ?? '',
    status: value.status,
  }
}
export const readEditorMedia = async (event: H3Event, projectId: string, id: string) => {
  const result = mapEditorMedia(
    await authorizedSaasRequest(event, `/api/projects/${projectId}/media-objects/${id}`),
    projectId,
  )
  if (result.id !== id || result.status === 'archived') return saasFailure(404, 'not_found')
  return result
}
export const editorMedia = async (event: H3Event, projectId: string) => {
  const rows = await editorCollection(event, `/api/projects/${projectId}/media-objects`)
  return rows
    .map((row) => mapEditorMedia(row, projectId))
    .filter((row) => row.status !== 'archived')
}
