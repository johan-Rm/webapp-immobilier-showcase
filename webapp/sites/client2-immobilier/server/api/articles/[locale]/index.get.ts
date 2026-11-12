import { createError, defineEventHandler, getRouterParam, setHeader } from 'h3'

import { publishedRelease, publicMedia } from '../../../utils/projection'

import { saasLocaleSchema } from '#shared/schemas'
export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')
  const locale = saasLocaleSchema.safeParse(getRouterParam(event, 'locale'))
  if (!locale.success) throw createError({ statusCode: 404 })
  const value = await publishedRelease()
  return {
    articles: value?.manifest.articles.filter((a) => a.locale === locale.data) ?? [],
    media: value ? publicMedia(value) : {},
  }
})
