export default defineEventHandler((event) => {
  const config = useRuntimeConfig()
  const isIndexable = config.public.isIndexable === true
  const siteUrl = config.public.siteUrl

  const lines = isIndexable ? ['User-agent: *', 'Allow: /'] : ['User-agent: *', 'Disallow: /']

  if (isIndexable && typeof siteUrl === 'string' && siteUrl.length > 0) {
    lines.push(`Sitemap: ${siteUrl.replace(/\/$/, '')}/sitemap.xml`)
  }

  setHeader(event, 'Content-Type', 'text/plain; charset=utf-8')

  return `${lines.join('\n')}\n`
})
