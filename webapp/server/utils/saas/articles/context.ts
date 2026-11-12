import type { H3Event } from 'h3'

import { z } from 'zod'

import { saasFailure } from '../auth/runtime'
import { authorizedSaasRequest } from '../auth/session'

import { editorCollection, nativeParse } from './native'

import { saasLocaleSchema } from '#shared/schemas'

const projectSchema = z.object({
  id: z.uuid(),
  sourceLocale: saasLocaleSchema,
  enabledLocales: z.array(z.string()),
})
export const requireEditorProject = async (event: H3Event, projectId: string) => {
  const items = await editorCollection(event, '/api/projects')
  const candidate = items.find(
    (item) => typeof item === 'object' && item !== null && 'id' in item && item.id === projectId,
  )
  if (!candidate) return saasFailure(404, 'not_found')
  const project = nativeParse(projectSchema, candidate)
  const enabledLocales = project.enabledLocales.flatMap((locale) => {
    const parsed = saasLocaleSchema.safeParse(locale)
    return parsed.success ? [parsed.data] : []
  })
  if (!enabledLocales.includes(project.sourceLocale)) return saasFailure(502, 'upstream_invalid')
  // Organization membership alone is not enough: native editorial access is checked as well.
  await authorizedSaasRequest(event, `/api/projects/${projectId}/articles?page=1&itemsPerPage=1`)
  return { ...project, enabledLocales }
}
