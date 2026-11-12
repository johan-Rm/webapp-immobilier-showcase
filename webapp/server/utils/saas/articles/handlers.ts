import type { H3Event } from 'h3'

import { getRouterParam } from 'h3'

import { parseArticleWrite } from '@services/saas/articles'

import { saasResourceId } from '../auth/access'
import { saasEndpoint, saasFailure } from '../auth/runtime'
import { authorizedSaasRequest } from '../auth/session'
import { editorCategories, readEditorCategory, mapEditorCategory } from '../categories/catalog'
import { readEditorMedia } from '../media/catalog'

import { requireEditorProject } from './context'
import { articleNativePayload, nativeArticleSchema, mapNativeArticle } from './model'
import {
  editorCollection,
  editorQuery,
  editorPage,
  editorLock,
  editorRevision,
  requireEditorRevision,
  readEditorJson,
  inputParse,
  nativeParse,
} from './native'

import { saasLocaleSchema, saasArticleWriteSchema } from '#shared/schemas'

export const readNativeEditorArticle = async (event: H3Event, projectId: string, id: string) => {
  const raw = nativeParse(
    nativeArticleSchema,
    await authorizedSaasRequest(event, `/api/projects/${projectId}/articles/${id}/translations`),
  )
  if (raw.id !== id) return saasFailure(502, 'upstream_invalid')
  mapNativeArticle(raw, projectId)
  return raw
}
export const saasArticleList = (event: H3Event) =>
  saasEndpoint(event, async () => {
    const query = editorQuery(event)
    const projectId = saasResourceId(event, 'projectId')
    await requireEditorProject(event, projectId)
    const rows = await editorCollection(event, `/api/projects/${projectId}/articles`)
    const articles = []
    for (const row of rows) {
      const identity = nativeParse(nativeArticleSchema.pick({ id: true }), row)
      articles.push(
        mapNativeArticle(await readNativeEditorArticle(event, projectId, identity.id), projectId),
      )
    }
    return editorPage(
      articles.filter((a) =>
        a.translations.some((t) => t.draft.headline.toLowerCase().includes(query.q.toLowerCase())),
      ),
      query,
    )
  })
export const saasArticleRead = (event: H3Event) =>
  saasEndpoint(event, async () => {
    const projectId = saasResourceId(event, 'projectId')
    const id = saasResourceId(event, 'articleId')
    await requireEditorProject(event, projectId)
    return mapNativeArticle(await readNativeEditorArticle(event, projectId, id), projectId)
  })
export const saasArticleSave = (event: H3Event) =>
  saasEndpoint(event, async () => {
    const projectId = saasResourceId(event, 'projectId')
    const id = event.method === 'PUT' ? saasResourceId(event, 'articleId') : null
    const project = await requireEditorProject(event, projectId)
    const write = inputParse(saasArticleWriteSchema, await readEditorJson(event))
    if (
      id &&
      inputParse(saasLocaleSchema, getRouterParam(event, 'locale')) !== write.translation.locale
    )
      return saasFailure(400, 'locale_mismatch')
    if (!project.enabledLocales.includes(write.translation.locale))
      return saasFailure(400, 'locale_mismatch')
    return editorLock(`${projectId}/articles/${id ?? 'create'}`, async () => {
      const previous = id ? await readNativeEditorArticle(event, projectId, id) : undefined
      if (previous) requireEditorRevision(event, mapNativeArticle(previous, projectId).revision)
      const categories = []
      for (const categoryId of write.categoryIds)
        categories.push(mapEditorCategory(await readEditorCategory(event, projectId, categoryId)))
      const mediaIds = new Set<string>()
      if (write.translation.primaryImage) mediaIds.add(write.translation.primaryImage.mediaId)
      for (const block of write.translation.content.blocks) {
        if (block.type === 'image') mediaIds.add(block.mediaId)
        if (block.type === 'gallery') for (const item of block.items) mediaIds.add(item.mediaId)
      }
      const media = []
      for (const mediaId of mediaIds) media.push(await readEditorMedia(event, projectId, mediaId))
      try {
        parseArticleWrite(
          write,
          { projectId, enabledLocales: project.enabledLocales, categories, media },
          write.translation.locale,
        )
      } catch {
        return saasFailure(422, 'reference_invalid')
      }
      const result = await authorizedSaasRequest(
        event,
        `/api/projects/${projectId}/articles/translations?locale=${write.translation.locale}`,
        {
          method: 'POST',
          body: {
            ...(id ? { resourceId: id } : { status: 'draft' }),
            translations: articleNativePayload(write, previous),
          },
        },
      )
      const created = nativeParse(nativeArticleSchema, result)
      const article = mapNativeArticle(created, projectId)
      if (id && article.id !== id) return saasFailure(502, 'upstream_invalid')
      // Confirm what Symfony actually persisted, including returned auto-generated translations.
      const edition = article.translations.find((t) => t.draft.locale === write.translation.locale)
      if (
        !edition ||
        editorRevision({ ...edition.draft, generated: undefined }) !==
          editorRevision({ ...write.translation, generated: undefined }) ||
        JSON.stringify(article.categoryIds) !== JSON.stringify(write.categoryIds)
      )
        return saasFailure(502, 'persistence_mismatch')
      return article
    })
  })
export const saasCategoryList = (event: H3Event) =>
  saasEndpoint(event, async () => {
    const query = editorQuery(event)
    const projectId = saasResourceId(event, 'projectId')
    await requireEditorProject(event, projectId)
    return editorPage(
      (await editorCategories(event, projectId)).filter((c) =>
        Object.values(c.labels).some((label) =>
          String(label).toLowerCase().includes(query.q.toLowerCase()),
        ),
      ),
      query,
    )
  })
