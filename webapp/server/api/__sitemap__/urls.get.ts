import { loadContentFromFiles } from '../../utils/content/loaders'

/**
 * Résout le slug d'une référence pouvant arriver sous forme de chaîne ou d'objet.
 *
 * Les ressources liées (type d'annonce, catégorie) sont normalisées en objets
 * `{ slug, name, … }` par le mapper. Les interpoler directement produisait
 * `[object Object]` dans les URL du sitemap.
 *
 * @param value Valeur brute issue du contenu.
 * @returns Le slug si résoluble, sinon `null`.
 */
const resolveSlug = (value: unknown): string | null => {
  if (typeof value === 'string') return value.trim() || null

  if (value && typeof value === 'object' && 'slug' in value) {
    const { slug } = value as { slug?: unknown }
    return typeof slug === 'string' && slug.trim() ? slug.trim() : null
  }

  return null
}

export default defineEventHandler(async () => {
  const [accommodations, pages] = await Promise.all([
    loadContentFromFiles<Record<string, unknown>[]>('accommodations', 'fr'),
    loadContentFromFiles<Record<string, unknown>[]>('web-pages', 'fr'),
  ])

  const propertyUrls = accommodations
    .filter((item) => item.isActive !== false)
    .map((item) => {
      const listing = resolveSlug(item.realEstateListing)
      const category = resolveSlug(item.category)
      const slug = resolveSlug(item.slug)

      // Une URL incomplète serait invalide : mieux vaut l'omettre du sitemap.
      if (!listing || !category || !slug) return null

      return {
        loc: `/fr/properties/${listing}/${category}/${slug}`,
        lastmod: item.dateModified,
        changefreq: 'weekly',
        priority: 0.8,
      }
    })
    .filter((url) => url !== null)

  const pageUrls = pages.map((page) => ({
    loc: page.slug === 'home' ? '/fr' : `/fr/${page.slug}`,
    lastmod: page.dateModified,
    changefreq: 'monthly',
    priority: page.slug === 'home' ? 1 : 0.7,
  }))

  return [...pageUrls, ...propertyUrls]
})
