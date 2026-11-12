import type { H3Event } from 'h3'

import { getRouterParam, getQuery, setHeader } from 'h3'
import { z } from 'zod'

import { requireEditorProject } from '../articles/context'
import { readNativeEditorArticle } from '../articles/handlers'
import { mapNativeArticle } from '../articles/model'
import { inputParse, nativeParse } from '../articles/native'
import { saasResourceId } from '../auth/access'
import { saasEndpoint, saasConfig, saasFailure } from '../auth/runtime'
import { readSaasSession, authorizedSaasRequest } from '../auth/session'
import {
  publicationTarget,
  previewRendererOrigin,
  privateBridgeSecret,
} from '../publication/config'
import { releaseReferences, readPrivateResponse } from '../publication/resources'

import { saasLocaleSchema, saasWriteTranslationSchema } from '#shared/schemas'

const previewContext = async (event: H3Event) => {
  inputParse(z.object({}).strict(), getQuery(event))
  const projectId = saasResourceId(event, 'projectId')
  const articleId = saasResourceId(event, 'articleId')
  const locale = inputParse(saasLocaleSchema, getRouterParam(event, 'locale'))
  const project = await requireEditorProject(event, projectId)
  publicationTarget(projectId)
  if (!project.enabledLocales.includes(locale)) return saasFailure(400, 'locale_mismatch')
  const article = mapNativeArticle(
    await readNativeEditorArticle(event, projectId, articleId),
    projectId,
  )
  const edition = article.translations.find((t) => t.draft.locale === locale)
  if (!edition) return saasFailure(404, 'translation_not_found')
  const translation = nativeParse(saasWriteTranslationSchema.strip(), edition.draft)
  const references = await releaseReferences(event, project, {
    categoryIds: article.categoryIds,
    translation,
  })
  return { projectId, articleId, locale, revision: article.revision, translation, ...references }
}
export const saasPreview = (event: H3Event) =>
  saasEndpoint(event, async () => {
    const value = await previewContext(event)
    const origin = previewRendererOrigin()
    const secret = privateBridgeSecret('SAAS_PREVIEW_SECRET')
    let response: Response
    const mediaBase = `/api/saas/projects/${value.projectId}/articles/${value.articleId}/translations/${value.locale}/preview/media/`
    try {
      response = await fetch(origin + '/api/saas-preview', {
        method: 'POST',
        redirect: 'error',
        signal: AbortSignal.timeout(15000),
        headers: {
          Authorization: `Bearer ${secret}`,
          'Content-Type': 'application/json',
          Accept: 'text/html',
          'Cache-Control': 'no-store',
        },
        body: JSON.stringify({
          schemaVersion: 1,
          target: publicationTarget(value.projectId),
          projectId: value.projectId,
          articleId: value.articleId,
          locale: value.locale,
          revision: value.revision,
          translation: value.translation,
          categories: value.categories,
          media: value.assets.map((asset) => ({ id: asset.id, src: mediaBase + asset.id })),
        }),
      })
    } catch {
      return saasFailure(503, 'preview_unavailable')
    }
    if (!response.ok) return saasFailure(503, 'preview_unavailable')
    if (!response.headers.get('content-type')?.startsWith('text/html'))
      return saasFailure(502, 'bridge_invalid')
    const html = await readPrivateResponse(response, 2 * 1024 * 1024)
    setHeader(event, 'Content-Type', 'text/html; charset=utf-8')
    setHeader(event, 'X-Content-Type-Options', 'nosniff')
    setHeader(event, 'Referrer-Policy', 'no-referrer')
    setHeader(
      event,
      'Content-Security-Policy',
      `sandbox allow-same-origin; default-src 'none'; img-src 'self'; style-src 'self' ${origin} 'unsafe-inline'; font-src 'self' ${origin}; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`,
    )
    return html.toString('utf8')
  })
export const saasPreviewMedia = (event: H3Event) =>
  saasEndpoint(event, async () => {
    const value = await previewContext(event)
    const mediaId = saasResourceId(event, 'mediaId')
    const asset = value.assets.find((item) => item.id === mediaId)
    if (!asset) return saasFailure(404, 'not_found')
    const send = async () => {
      const session = await readSaasSession(event)
      try {
        return await fetch(saasConfig().api + asset.sourcePath, {
          redirect: 'error',
          signal: AbortSignal.timeout(15000),
          headers: { Authorization: `Bearer ${session.token}`, Accept: asset.mimeType },
        })
      } catch {
        return saasFailure(503, 'upstream_unavailable')
      }
    }
    let response = await send()
    if (response.status === 401) {
      await authorizedSaasRequest(event, '/api/projects')
      response = await send()
    }
    if (!response.ok) return saasFailure(response.status === 403 ? 403 : 502, 'media_unavailable')
    if (response.headers.get('content-type')?.split(';')[0] !== asset.mimeType)
      return saasFailure(502, 'upstream_invalid')
    const bytes = await readPrivateResponse(response, 12 * 1024 * 1024)
    setHeader(event, 'Content-Type', asset.mimeType)
    setHeader(event, 'X-Content-Type-Options', 'nosniff')
    return bytes
  })
