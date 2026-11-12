import { timingSafeEqual } from 'node:crypto'

import { createError, defineEventHandler, getHeader, readRawBody, setHeader } from 'h3'
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { z } from 'zod'

import { renderArticle, articleStyles } from '../../app/utils/articleMarkup'
import { publicProject } from '../utils/projection'

import { saasLocaleSchema, saasWriteTranslationSchema } from '#shared/schemas'

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')
  setHeader(event, 'X-Robots-Tag', 'noindex, nofollow, noarchive')
  const secret = process.env.SAAS_PREVIEW_SECRET || ''
  const given = Buffer.from(getHeader(event, 'authorization') || '')
  const expected = Buffer.from('Bearer ' + secret)
  if (secret.length < 32) throw createError({ statusCode: 503 })
  if (given.length !== expected.length || !timingSafeEqual(given, expected))
    throw createError({ statusCode: 401 })
  const raw = await readRawBody(event)
  if (!raw || Buffer.byteLength(raw) > 2 * 1024 * 1024) throw createError({ statusCode: 413 })
  const schema = z.strictObject({
    schemaVersion: z.literal(1),
    target: z.literal('client2-immobilier'),
    projectId: z.uuid(),
    articleId: z.uuid(),
    locale: saasLocaleSchema,
    revision: z.string().min(1),
    translation: saasWriteTranslationSchema,
    categories: z.array(z.strictObject({ id: z.uuid(), label: z.string() })),
    media: z.array(z.strictObject({ id: z.uuid(), src: z.string() })),
  })
  let value: z.infer<typeof schema>
  try {
    value = schema.parse(JSON.parse(raw))
  } catch {
    throw createError({ statusCode: 400 })
  }
  if (value.projectId !== publicProject() || value.locale !== value.translation.locale)
    throw createError({ statusCode: 403 })
  const article = {
    ...value.translation,
    id: value.articleId,
    projectId: value.projectId,
    categories: value.categories,
  }
  const ids = new Set<string>()
  if (article.primaryImage) ids.add(article.primaryImage.mediaId)
  for (const block of article.content.blocks) {
    if (block.type === 'image') ids.add(block.mediaId)
    if (block.type === 'gallery') for (const item of block.items) ids.add(item.mediaId)
  }
  const prefix = `/api/saas/projects/${value.projectId}/articles/${value.articleId}/translations/${value.locale}/preview/media/`
  if (
    new Set(value.media.map((m) => m.id)).size !== value.media.length ||
    value.media.some((m) => m.src !== prefix + m.id || !ids.has(m.id)) ||
    [...ids].some((id) => !value.media.some((m) => m.id === id))
  )
    throw createError({ statusCode: 400 })
  const title = value.translation.metaTitle || value.translation.headline
  const escapedTitle = title.replace(/[&<>"']/g, (char) => '&#' + char.charCodeAt(0) + ';')
  setHeader(event, 'Content-Type', 'text/html; charset=utf-8')
  setHeader(event, 'X-Content-Type-Options', 'nosniff')
  setHeader(
    event,
    'Content-Security-Policy',
    "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  )
  const rendered = await renderToString(
    createSSRApp({
      render: () =>
        renderArticle(article, Object.fromEntries(value.media.map((m) => [m.id, m.src]))),
    }),
  )
  return (
    '<!doctype html><html lang="' +
    value.locale +
    '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>' +
    escapedTitle +
    '</title><style>body{font-family:system-ui;margin:0;padding:2rem;color:#0f172a;background:#f8fafc}' +
    articleStyles +
    '</style></head><body><p>Aperçu privé · ' +
    value.locale.toUpperCase() +
    '</p>' +
    rendered +
    '</body></html>'
  )
})
