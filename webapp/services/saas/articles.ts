import type {
  SaasArticleWrite,
  SaasLocale,
  SaasPublicArticle,
  SaasReferenceContext,
} from '#shared/types/saas/article'

import { saasArticleSchema, saasArticleWriteSchema } from '#shared/schemas'

/** Resource checks on an already authorized context; this is not an access-control guard. */
export const parseArticleWrite = (
  input: unknown,
  context: SaasReferenceContext,
  locale: SaasLocale,
  requireReadyMedia = false,
): SaasArticleWrite => {
  const value = saasArticleWriteSchema.parse(input)
  if (value.translation.locale !== locale || !context.enabledLocales.includes(locale)) {
    throw new Error('locale_mismatch')
  }
  for (const id of value.categoryIds) {
    if (
      !context.categories.some(
        (category) =>
          category.id === id &&
          category.projectId === context.projectId &&
          category.inCodeSet === 'article-category',
      )
    ) {
      throw new Error('category_reference_invalid')
    }
  }
  const ids: string[] = []
  if (value.translation.primaryImage) ids.push(value.translation.primaryImage.mediaId)
  for (const block of value.translation.content.blocks) {
    if (block.type === 'image') ids.push(block.mediaId)
    if (block.type === 'gallery') ids.push(...block.items.map((item) => item.mediaId))
  }
  for (const id of ids) {
    const media = context.media.find(
      (item) => item.id === id && item.projectId === context.projectId && item.kind === 'image',
    )
    if (!media) throw new Error('media_reference_invalid')
    if (requireReadyMedia && !media.ready) throw new Error('media_not_ready')
  }
  return value
}

/** Derive only the exact published locale. No fallback and no spread of a draft into public data. */
export const projectPublishedArticle = (
  input: unknown,
  context: SaasReferenceContext,
  locale: SaasLocale,
): SaasPublicArticle | null => {
  const article = saasArticleSchema.parse(input)
  if (article.projectId !== context.projectId) throw new Error('project_mismatch')
  if (!context.enabledLocales.includes(locale)) throw new Error('locale_mismatch')
  const published = article.translations.find(
    (edition) => edition.draft.locale === locale,
  )?.published
  if (!published) return null
  const value = parseArticleWrite(
    { categoryIds: published.categoryIds, translation: published.translation },
    context,
    locale,
    true,
  )
  const categories = value.categoryIds.map((id) => {
    const category = context.categories.find(
      (item) => item.id === id && item.projectId === context.projectId,
    )!
    const label = category.labels[locale]
    if (label === undefined) throw new Error('category_translation_missing')
    return { id, label }
  })
  const translation = value.translation
  return {
    id: article.id,
    projectId: article.projectId,
    snapshotId: published.snapshotId,
    publishedAt: published.publishedAt,
    locale,
    headline: translation.headline,
    slug: translation.slug,
    summary: translation.summary,
    primaryImage: translation.primaryImage,
    metaTitle: translation.metaTitle || translation.headline,
    metaDescription: translation.metaDescription || translation.summary,
    content: translation.content,
    categories,
  }
}
