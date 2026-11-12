import { createError, defineEventHandler, getRouterParam, setHeader } from 'h3'

import { publishedRelease, publicMedia } from '../../../utils/projection'

import { saasLocaleSchema } from '#shared/schemas'
export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')
  const locale = saasLocaleSchema.safeParse(getRouterParam(event, 'locale'))
  if (!locale.success) throw createError({ statusCode: 404 })
  const value = await publishedRelease()
  const article = value?.manifest.articles.find(
    (a) => a.locale === locale.data && a.slug === getRouterParam(event, 'slug'),
  )
  if (!article || !value) throw createError({ statusCode: 404 })
  return {
    article,
    media: publicMedia(value),
    locales: value.manifest.articles
      .filter((a) => a.id === article.id)
      .map((a) => ({ locale: a.locale, slug: a.slug })),
  }
})
