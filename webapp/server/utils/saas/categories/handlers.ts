import type { H3Event } from 'h3'

import { z } from 'zod'

import { requireEditorProject } from '../articles/context'
import { readNativeEditorArticle } from '../articles/handlers'
import { mapNativeArticle } from '../articles/model'
import {
  nativeParse,
  editorLock,
  editorPage,
  editorQuery,
  editorCollection,
  inputParse,
  readEditorJson,
  requireEditorRevision,
} from '../articles/native'
import { saasResourceId } from '../auth/access'
import { saasEndpoint, saasFailure } from '../auth/runtime'
import { authorizedSaasRequest } from '../auth/session'

import { readEditorCategory, mapEditorCategory } from './catalog'

const labelsSchema = z
  .object({
    labels: z
      .object({
        fr: z.string().trim().min(1).max(180).optional(),
        en: z.string().trim().min(1).max(180).optional(),
        es: z.string().trim().min(1).max(180).optional(),
      })
      .strict()
      .refine((v) => Object.keys(v).length > 0),
  })
  .strict()
export const saasCategorySave = (event: H3Event) =>
  saasEndpoint(event, async () => {
    const projectId = saasResourceId(event, 'projectId')
    const id = event.method === 'PUT' ? saasResourceId(event, 'categoryId') : null
    const project = await requireEditorProject(event, projectId)
    const { labels } = inputParse(labelsSchema, await readEditorJson(event))
    if (
      Object.keys(labels).some(
        (locale) => !project.enabledLocales.includes(locale as 'fr' | 'en' | 'es'),
      )
    )
      return saasFailure(400, 'locale_mismatch')
    return editorLock(`${projectId}/categories/${id ?? 'create'}`, async () => {
      const previous = id ? await readEditorCategory(event, projectId, id) : null
      if (previous) requireEditorRevision(event, mapEditorCategory(previous).revision)
      if (!id && !labels[project.sourceLocale]) return saasFailure(422, 'source_label_required')
      const translations = Object.entries(labels).map(([locale, value]) => ({
        locale,
        ...(!id ? { label: value } : {}),
        text: value,
      }))
      const raw = await authorizedSaasRequest(
        event,
        `/api/projects/${projectId}/category-codes/${id ? id + '/translations' : 'translations'}?locale=${project.sourceLocale}`,
        {
          method: id ? 'PUT' : 'POST',
          body: { ...(!id ? { inCodeSet: 'article-category' } : {}), translations },
        },
      )
      const result = nativeParse(z.object({ id: z.uuid() }), raw)
      if (id && result.id !== id) return saasFailure(502, 'upstream_invalid')
      const saved = mapEditorCategory(await readEditorCategory(event, projectId, result.id))
      for (const [locale, label] of Object.entries(labels))
        if (saved.labels[locale] !== label) return saasFailure(502, 'persistence_mismatch')
      return saved
    })
  })
export const saasCategoryUsages = (event: H3Event) =>
  saasEndpoint(event, async () => {
    const query = editorQuery(event)
    const projectId = saasResourceId(event, 'projectId')
    const categoryId = saasResourceId(event, 'categoryId')
    await requireEditorProject(event, projectId)
    await readEditorCategory(event, projectId, categoryId)
    const rows = await editorCollection(event, `/api/projects/${projectId}/articles`)
    const usages = []
    for (const row of rows) {
      const { id } = nativeParse(z.object({ id: z.uuid() }), row)
      const article = mapNativeArticle(
        await readNativeEditorArticle(event, projectId, id),
        projectId,
      )
      if (
        article.categoryIds.includes(categoryId) ||
        article.translations.some((t) => t.published?.categoryIds.includes(categoryId))
      )
        usages.push({ id: article.id, headline: article.translations[0]?.draft.headline ?? '' })
    }
    return editorPage(
      usages.filter((item) => item.headline.toLowerCase().includes(query.q.toLowerCase())),
      query,
    )
  })
