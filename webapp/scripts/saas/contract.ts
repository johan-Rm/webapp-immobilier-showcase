import { createHash } from 'node:crypto'

import { z } from 'zod'

import { saasWriteTranslationSchema, saasLocaleSchema } from '../../shared/schemas'

export const projectionFailure = (code: string): never => {
  throw Object.assign(new Error(code), { code })
}
export const checked = <T>(schema: z.ZodType<T>, value: unknown): T => {
  const result = schema.safeParse(value)
  return result.success ? result.data : projectionFailure('invalid_projection')
}
const canonical = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonical)
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => [key, canonical(item)]),
    )
  return value
}
export const stableJson = (value: unknown) => JSON.stringify(canonical(value)) + '\n'
export const digest = (bytes: string | Uint8Array) =>
  createHash('sha256').update(bytes).digest('hex')
export const mimeSchema = z.enum([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/avif',
])
export const publicArticleSchema = saasWriteTranslationSchema.extend({
  id: z.uuid(),
  projectId: z.uuid(),
  snapshotId: z.uuid(),
  publishedAt: z.iso.datetime(),
  categories: z.array(z.object({ id: z.uuid(), label: z.string().min(1) }).strict()),
})
export const sourceAssetSchema = z
  .object({
    id: z.uuid(),
    sourcePath: z
      .string()
      .regex(/^\/images\/[a-zA-Z0-9_./-]+$/)
      .refine((path) => !path.split('/').includes('..')),
    mimeType: mimeSchema,
  })
  .strict()
export const exportSchema = z
  .object({
    schemaVersion: z.literal(1),
    projectId: z.uuid(),
    target: z.literal('client2-immobilier'),
    sourceOrigin: z.string(),
    generation: z.number().int().nonnegative(),
    appliedGeneration: z.number().int().nonnegative(),
    entries: z.array(
      z.object({ article: publicArticleSchema, assets: z.array(sourceAssetSchema) }).strict(),
    ),
    commands: z.array(
      z
        .object({
          id: z.string().regex(/^[a-f0-9]{64}$/),
          generation: z.number().int().positive(),
          articleId: z.uuid(),
          locale: saasLocaleSchema,
          action: z.enum(['publish', 'unpublish']),
        })
        .strict(),
    ),
  })
  .strict()
export const mediaIds = (article: z.infer<typeof publicArticleSchema>) => {
  const ids = new Set<string>()
  if (article.primaryImage) ids.add(article.primaryImage.mediaId)
  for (const block of article.content.blocks) {
    if (block.type === 'image') ids.add(block.mediaId)
    if (block.type === 'gallery') for (const item of block.items) ids.add(item.mediaId)
  }
  return ids
}
export const validatedExport = (input: unknown, projectId: string, sourceOrigin: string) => {
  const value = checked(exportSchema, input)
  if (
    value.projectId !== projectId ||
    value.sourceOrigin !== sourceOrigin ||
    value.appliedGeneration > value.generation ||
    value.commands.some((c) => c.generation > value.generation) ||
    (value.generation === 0 && value.entries.length)
  )
    return projectionFailure('invalid_projection')
  const identities = new Set<string>()
  const slugs = new Set<string>()
  const snapshots = new Set<string>()
  const assets = new Map<string, z.infer<typeof sourceAssetSchema>>()
  for (const entry of value.entries) {
    const article = entry.article
    const identity = article.id + '/' + article.locale
    const slug = article.locale + '/' + article.slug
    if (
      article.projectId !== projectId ||
      identities.has(identity) ||
      slugs.has(slug) ||
      snapshots.has(article.snapshotId)
    )
      return projectionFailure('invalid_projection')
    identities.add(identity)
    slugs.add(slug)
    snapshots.add(article.snapshotId)
    if (new Set(article.categories.map((c) => c.id)).size !== article.categories.length)
      return projectionFailure('invalid_projection')
    const needed = mediaIds(article)
    const provided = new Set<string>()
    for (const asset of entry.assets) {
      if (!needed.has(asset.id) || provided.has(asset.id))
        return projectionFailure('invalid_projection')
      provided.add(asset.id)
      const prior = assets.get(asset.id)
      if (prior && stableJson(prior) !== stableJson(asset))
        return projectionFailure('invalid_projection')
      assets.set(asset.id, asset)
    }
    if ([...needed].some((id) => !provided.has(id))) return projectionFailure('invalid_projection')
  }
  value.entries.sort(
    (a, b) =>
      a.article.locale.localeCompare(b.article.locale) || a.article.id.localeCompare(b.article.id),
  )
  for (const entry of value.entries) entry.assets.sort((a, b) => a.id.localeCompare(b.id))
  const sourceVersion = digest(
    stableJson({
      projectId,
      target: value.target,
      sourceOrigin,
      generation: value.generation,
      entries: value.entries,
    }),
  )
  return {
    value,
    assets: [...assets.values()].sort((a, b) => a.id.localeCompare(b.id)),
    sourceVersion,
  }
}
export const pointerSchema = z
  .object({
    schemaVersion: z.literal(1),
    projectId: z.uuid(),
    target: z.literal('client2-immobilier'),
    generation: z.number().int().nonnegative(),
    version: z.string().regex(/^[a-f0-9]{64}$/),
    release: z.string().regex(/^g[0-9]+-[a-f0-9]{64}$/),
  })
  .strict()
export const storedMediaSchema = z
  .object({
    id: z.uuid(),
    path: z.string().regex(/^media\/[a-f0-9-]{36}-[a-f0-9]{64}\.(jpg|png|gif|webp|avif)$/),
    mimeType: mimeSchema,
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
    bytes: z
      .number()
      .int()
      .positive()
      .max(12 * 1024 * 1024),
  })
  .strict()
const indexSchema = z.array(
  z.object({ id: z.uuid(), slug: z.string(), snapshotId: z.uuid() }).strict(),
)
export const manifestSchema = z
  .object({
    schemaVersion: z.literal(1),
    projectId: z.uuid(),
    target: z.literal('client2-immobilier'),
    generation: z.number().int().nonnegative(),
    sourceVersion: z.string().regex(/^[a-f0-9]{64}$/),
    articles: z.array(publicArticleSchema),
    indexes: z.object({ fr: indexSchema, en: indexSchema, es: indexSchema }).strict(),
    media: z.array(storedMediaSchema),
  })
  .strict()
