import type { SaasArticleWrite, SaasReferenceContext } from '#shared/types/saas/article'
import type { requireEditorProject } from '../articles/context'
import type { H3Event } from 'h3'

import { z } from 'zod'

import { parseArticleWrite } from '@services/saas/articles'

import { nativeParse } from '../articles/native'
import { saasConfig, saasFailure } from '../auth/runtime'
import { authorizedSaasRequest } from '../auth/session'
import { readEditorCategory, mapEditorCategory } from '../categories/catalog'
import { mapEditorMedia } from '../media/catalog'

import { releaseAssetSchema } from './store'

export const releaseReferences = async (
  event: H3Event,
  project: Awaited<ReturnType<typeof requireEditorProject>>,
  write: SaasArticleWrite,
) => {
  const categories = []
  for (const id of write.categoryIds)
    categories.push(mapEditorCategory(await readEditorCategory(event, project.id, id)))
  const ids = new Set<string>()
  if (write.translation.primaryImage) ids.add(write.translation.primaryImage.mediaId)
  for (const block of write.translation.content.blocks) {
    if (block.type === 'image') ids.add(block.mediaId)
    if (block.type === 'gallery') for (const item of block.items) ids.add(item.mediaId)
  }
  const media = []
  const assets = []
  for (const id of ids) {
    const raw = await authorizedSaasRequest(
      event,
      `/api/projects/${project.id}/media-objects/${id}`,
    )
    const item = mapEditorMedia(raw, project.id)
    if (item.id !== id) return saasFailure(502, 'upstream_invalid')
    if (!item.ready || item.kind !== 'image') return saasFailure(422, 'media_not_ready')
    const source = nativeParse(
      z.object({
        contentUrl: z.string(),
        mimeType: releaseAssetSchema.shape.mimeType,
      }),
      raw,
    )
    if (
      !/^\/images\/[a-zA-Z0-9_./-]+$/.test(source.contentUrl) ||
      source.contentUrl.split('/').includes('..')
    )
      return saasFailure(502, 'upstream_invalid')
    const path = new URL(source.contentUrl, saasConfig().api).pathname
    if (!path.startsWith('/images/')) return saasFailure(502, 'upstream_invalid')
    assets.push(
      nativeParse(releaseAssetSchema, {
        id,
        sourcePath: path,
        mimeType: source.mimeType,
      }),
    )
    media.push(item)
  }
  const context: SaasReferenceContext = {
    projectId: project.id,
    enabledLocales: project.enabledLocales,
    categories,
    media,
  }
  try {
    parseArticleWrite(write, context, write.translation.locale, true)
  } catch {
    return saasFailure(422, 'reference_invalid')
  }
  const labels = categories.map((c) => {
    const label = c.labels[write.translation.locale]
    if (!label?.trim()) return saasFailure(422, 'category_translation_missing')
    return { id: c.id, label }
  })
  return { context, categories: labels, assets }
}
export const readPrivateResponse = async (response: Response, limit: number) => {
  const reader = response.body?.getReader()
  if (!reader) return saasFailure(502, 'bridge_invalid')
  const chunks: Uint8Array[] = []
  let length = 0
  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      length += value.length
      if (length > limit) {
        await reader.cancel()
        return saasFailure(502, 'bridge_invalid')
      }
      chunks.push(value)
    }
  } catch {
    return saasFailure(502, 'bridge_invalid')
  }
  return Buffer.concat(chunks)
}
