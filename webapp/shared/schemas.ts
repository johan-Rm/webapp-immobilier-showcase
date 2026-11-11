import type { RichTextDocument, RichTextList } from './types/saas/richText'

import { z } from 'zod'

import { isEditorialLink } from './saas/links'

export const echoRequestSchema = z.object({
  message: z.string().trim().min(1).max(200),
})

export const echoResponseSchema = z.object({
  echoed: z.string(),
})

// DEM-005 target contracts (OPS-010); not DTOs for the current Symfony API.
export const saasLocaleSchema = z.enum(['fr', 'en', 'es'])
const uuid = z.uuid()
const uniqueIds = z.array(uuid).refine((ids) => new Set(ids).size === ids.length, 'duplicate_ids')
const mark = z.union([
  z.strictObject({ type: z.enum(['bold', 'italic']) }),
  z.strictObject({
    type: z.literal('link'),
    attrs: z.strictObject({ href: z.string().refine(isEditorialLink, 'unsafe_link') }),
  }),
])
const inline = z.union([
  z.strictObject({ type: z.literal('text'), text: z.string(), marks: z.array(mark).optional() }),
  z.strictObject({ type: z.literal('hardBreak') }),
])
const paragraph = z.strictObject({ type: z.literal('paragraph'), content: z.array(inline) })
const list: z.ZodType<RichTextList> = z.lazy(() =>
  z.strictObject({
    type: z.enum(['bulletList', 'orderedList']),
    content: z.array(
      z.strictObject({
        type: z.literal('listItem'),
        content: z.array(z.union([paragraph, list])),
      }),
    ),
  }),
)
const document: z.ZodType<RichTextDocument> = z.strictObject({
  type: z.literal('doc'),
  content: z.array(
    z.union([
      paragraph,
      list,
      z.strictObject({
        type: z.literal('heading'),
        attrs: z.strictObject({
          level: z.union([z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6)]),
        }),
        content: z.array(inline),
      }),
    ]),
  ),
})
const image = z.strictObject({ mediaId: uuid, alt: z.string() })
const galleryItem = image.extend({ caption: z.string() })
const blockId = z.string().trim().min(1)
export const saasContentSchema = z.strictObject({
  schemaVersion: z.literal(1),
  blocks: z
    .array(
      z.discriminatedUnion('type', [
        z.strictObject({ id: blockId, type: z.literal('text'), document }),
        galleryItem.extend({ id: blockId, type: z.literal('image') }),
        z.strictObject({
          id: blockId,
          type: z.literal('gallery'),
          items: z.array(galleryItem).min(1),
        }),
      ]),
    )
    .refine(
      (blocks) => new Set(blocks.map((block) => block.id)).size === blocks.length,
      'duplicate_block_ids',
    ),
})
export const saasWriteTranslationSchema = z.strictObject({
  locale: saasLocaleSchema,
  headline: z.string().trim().min(1).max(220),
  slug: z
    .string()
    .min(1)
    .max(180)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  summary: z.string(),
  primaryImage: image.nullable(),
  metaTitle: z.string(),
  metaDescription: z.string(),
  content: saasContentSchema,
})
export const saasArticleWriteSchema = z.strictObject({
  categoryIds: uniqueIds,
  translation: saasWriteTranslationSchema,
})
export const saasPublishedSnapshotSchema = z.strictObject({
  snapshotId: uuid,
  revision: z.string().min(1),
  publishedAt: z.iso.datetime(),
  categoryIds: uniqueIds,
  translation: saasWriteTranslationSchema,
})
const edition = z
  .strictObject({
    draft: saasWriteTranslationSchema.extend({ generated: z.boolean() }),
    published: saasPublishedSnapshotSchema.nullable(),
  })
  .refine(
    (value) =>
      value.published === null || value.published.translation.locale === value.draft.locale,
    'snapshot_locale_mismatch',
  )
export const saasArticleSchema = z.strictObject({
  id: uuid,
  projectId: uuid,
  revision: z.string().min(1),
  categoryIds: uniqueIds,
  translations: z
    .array(edition)
    .refine(
      (editions) => new Set(editions.map((value) => value.draft.locale)).size === editions.length,
      'duplicate_locales',
    ),
})
