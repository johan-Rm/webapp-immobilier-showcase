import type { SaasArticle, SaasArticleWrite } from '#shared/types/saas/article'

import { z } from 'zod'

import { saasFailure } from '../auth/runtime'

import { checkProject, editorRevision, nativeParse } from './native'

import {
  saasArticleSchema,
  saasArticleWriteSchema,
  saasLocaleSchema,
  saasPublishedSnapshotSchema,
} from '#shared/schemas'

export const nativeArticleSchema = z.object({
  id: z.uuid(),
  project: z.string(),
  status: z.enum(['draft', 'published', 'archived']),
  updatedAt: z.string(),
  translations: z.array(
    z
      .object({
        locale: z.string(),
        headline: z.string(),
        slug: z.string(),
        body: z.string().nullable().optional(),
        schemaData: z.record(z.string(), z.unknown()).nullable().optional(),
      })
      .passthrough(),
  ),
})
type NativeArticle = z.infer<typeof nativeArticleSchema>
export const articleMetadataSchema = saasArticleWriteSchema.shape.translation
  .omit({ locale: true, headline: true, slug: true })
  .extend({
    schemaVersion: z.literal(1),
    categoryIds: saasArticleWriteSchema.shape.categoryIds,
    authoredLocales: z.array(saasLocaleSchema),
    published: saasPublishedSnapshotSchema.nullable(),
  })
export const articleMetadata = (translation: NativeArticle['translations'][number]) => {
  const value = translation.schemaData?.gdSaas
  return value === undefined ? null : nativeParse(articleMetadataSchema, value)
}
const nativeContent = (body?: string | null) => ({
  schemaVersion: 1 as const,
  blocks: body
    ? [
        {
          id: 'native-body',
          type: 'text' as const,
          document: {
            type: 'doc' as const,
            content: [
              { type: 'paragraph' as const, content: [{ type: 'text' as const, text: body }] },
            ],
          },
        },
      ]
    : [],
})
export const mapNativeArticle = (raw: unknown, projectId: string): SaasArticle => {
  const native = nativeParse(nativeArticleSchema, raw)
  checkProject(native.project, projectId)
  if (new Set(native.translations.map((t) => t.locale)).size !== native.translations.length)
    return saasFailure(502, 'upstream_invalid')
  const metadata = native.translations.flatMap((t) => {
    const m = articleMetadata(t)
    return m ? [m] : []
  })
  const shared = metadata[0]
  for (const value of metadata) {
    if (
      JSON.stringify(value.categoryIds) !== JSON.stringify(shared!.categoryIds) ||
      JSON.stringify(value.authoredLocales) !== JSON.stringify(shared!.authoredLocales)
    )
      return saasFailure(502, 'upstream_invalid')
  }
  const value = {
    id: native.id,
    projectId,
    categoryIds: shared?.categoryIds ?? [],
    revision: editorRevision({
      id: native.id,
      project: native.project,
      status: native.status,
      updatedAt: native.updatedAt,
      translations: [...native.translations].sort((a, b) => a.locale.localeCompare(b.locale)),
    }),
    translations: native.translations.flatMap((t) => {
      const locale = saasLocaleSchema.safeParse(t.locale)
      if (!locale.success) return []
      const stored = articleMetadata(t)
      return [
        {
          draft: {
            locale: locale.data,
            headline: t.headline,
            slug: t.slug,
            summary: stored?.summary ?? '',
            primaryImage: stored?.primaryImage ?? null,
            metaTitle: stored?.metaTitle ?? '',
            metaDescription: stored?.metaDescription ?? '',
            content: stored?.content ?? nativeContent(t.body),
            generated: shared ? !shared.authoredLocales.includes(locale.data) : false,
          },
          published: stored?.published ?? null,
        },
      ]
    }),
  }
  return nativeParse(saasArticleSchema, value)
}
const textContent = (node: unknown): string => {
  if (!node || typeof node !== 'object') return ''
  const value = node as { text?: string; content?: unknown[]; type?: string }
  if (typeof value.text === 'string') return value.text
  return (value.content ?? [])
    .map(textContent)
    .join(value.type === 'doc' || value.type === 'listItem' ? '\n' : '')
}
export const articleNativePayload = (write: SaasArticleWrite, existing?: NativeArticle) => {
  const previous = existing?.translations ?? []
  const common = previous.map(articleMetadata).find((m) => m !== null)
  const authoredLocales = [
    ...new Set([
      ...(common?.authoredLocales ??
        previous.flatMap((t) => {
          const p = saasLocaleSchema.safeParse(t.locale)
          return p.success ? [p.data] : []
        })),
      write.translation.locale,
    ]),
  ].sort()
  const rows = [...previous]
  if (!rows.some((t) => t.locale === write.translation.locale))
    rows.push({ locale: write.translation.locale, headline: '', slug: '' })
  return rows.flatMap((t) => {
    const locale = saasLocaleSchema.safeParse(t.locale)
    if (!locale.success) return []
    const stored = articleMetadata(t)
    const isEdited = t.locale === write.translation.locale
    const { headline, slug, summary, primaryImage, metaTitle, metaDescription, content } =
      write.translation
    const fields = { summary, primaryImage, metaTitle, metaDescription, content }
    // All metadata copies carry the same aggregate associations; unrelated JSON is preserved.
    const fallback = {
      summary: '',
      primaryImage: null,
      metaTitle: '',
      metaDescription: '',
      content: nativeContent(t.body),
    }
    const metadata = {
      ...(stored ?? fallback),
      ...(isEdited ? fields : {}),
      schemaVersion: 1,
      categoryIds: write.categoryIds,
      authoredLocales,
      published: stored?.published ?? null,
    }
    return [
      {
        locale: t.locale,
        ...(isEdited
          ? {
              headline,
              slug,
              body: fields.content.blocks
                .filter((b) => b.type === 'text')
                .map((b) => textContent(b.document))
                .join('\n\n'),
            }
          : {}),
        schemaData: { ...t.schemaData, gdSaas: metadata },
      },
    ]
  })
}
