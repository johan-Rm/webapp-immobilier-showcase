import type {
  saasArticleSchema,
  saasArticleWriteSchema,
  saasContentSchema,
  saasLocaleSchema,
  saasPublishedSnapshotSchema,
} from '../../schemas'
import type { z } from 'zod'

export type SaasLocale = z.infer<typeof saasLocaleSchema>
export type SaasContent = z.infer<typeof saasContentSchema>
export type SaasArticleWrite = z.infer<typeof saasArticleWriteSchema>
export type SaasArticle = z.infer<typeof saasArticleSchema>
export type SaasPublishedSnapshot = z.infer<typeof saasPublishedSnapshotSchema>

export type SaasReferenceContext = {
  projectId: string
  enabledLocales: readonly SaasLocale[]
  categories: readonly {
    id: string
    projectId: string
    inCodeSet: string
    labels: Partial<Record<SaasLocale, string>>
  }[]
  media: readonly { id: string; projectId: string; kind: string; ready: boolean }[]
}

/** Public DTO intentionally has neither draft nor aggregate revision/generated state. */
export type SaasPublicArticle = {
  id: string
  projectId: string
  snapshotId: string
  publishedAt: string
  locale: SaasLocale
  headline: string
  slug: string
  summary: string
  primaryImage: SaasArticleWrite['translation']['primaryImage']
  metaTitle: string
  metaDescription: string
  content: SaasContent
  categories: { id: string; label: string }[]
}
