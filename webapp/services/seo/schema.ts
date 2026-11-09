import type { AppOrganization } from '#shared/types/app'
import type { Accommodation, WebPage } from '@schemas/interfaces'

import { toAbsoluteUrl } from '#shared/utils/url'

export type BuildSeoMetaInput = {
  page: WebPage | null
  siteUrl: string
  path: string
  isIndexable: boolean
}

export type BuildJsonLdInput = {
  page: WebPage | null
  organization?: AppOrganization | null
  siteUrl: string
  path: string
  accommodations?: Accommodation[] | null
  accommodation?: Accommodation | null
}

type SchemaNode = Record<string, unknown>

export type JsonLdBreadcrumbItem = {
  name: string
  item: string
}

const getPageImageUrl = (page: WebPage | null): string | undefined => {
  const pageImage = page?.associatedMedia?.[0]
  return typeof pageImage?.url === 'string' ? pageImage.url : undefined
}

const getAccommodationImageUrl = (accommodation: Accommodation): string | undefined => {
  const media = accommodation.associatedMedia[0]?.image
  return typeof media?.url === 'string' ? media.url : undefined
}

const buildBreadcrumbItems = (input: BuildJsonLdInput): JsonLdBreadcrumbItem[] => {
  const items: JsonLdBreadcrumbItem[] = [
    {
      name: 'Accueil',
      item: '/',
    },
  ]

  if (input.page) {
    items.push({
      name: input.page.headline,
      item: input.path,
    })

    return items
  }

  if (input.accommodation) {
    items.push({
      name: input.accommodation.realEstateListing.name,
      item: `/${input.accommodation.realEstateListing.slug}`,
    })

    items.push({
      name: input.accommodation.category.name,
      item: `/${input.accommodation.realEstateListing.slug}/${input.accommodation.category.slug}`,
    })

    items.push({
      name: input.accommodation.name,
      item: input.path,
    })

    return items
  }

  const firstAccommodation = input.accommodations?.[0]

  if (!firstAccommodation) {
    return []
  }

  items.push({
    name: firstAccommodation.realEstateListing.name,
    item: `/${firstAccommodation.realEstateListing.slug}`,
  })

  items.push({
    name: firstAccommodation.category.name,
    item: `/${firstAccommodation.realEstateListing.slug}/${firstAccommodation.category.slug}`,
  })

  return items
}

const buildItemListNode = (accommodations: Accommodation[], siteUrl: string): SchemaNode => {
  const itemListElement = accommodations.map((accommodation, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    item: {
      '@type': 'Accommodation',
      name: accommodation.name,
      description: accommodation.metaDescription,
      url: toAbsoluteUrl(
        siteUrl,
        `/${accommodation.realEstateListing.slug}/${accommodation.category.slug}/${accommodation.slug}`,
      ),
      image: toAbsoluteUrl(siteUrl, getAccommodationImageUrl(accommodation)),
      offers: {
        '@type': 'Offer',
        price: accommodation.offer.price,
        priceCurrency: accommodation.offer.priceCurrency,
      },
      numberOfBedrooms: accommodation.numberOfBedrooms,
      numberOfBathroomsTotal: accommodation.numberOfBathroomsTotal,
      floorSize: accommodation.floorSize,
      address: accommodation.place.name,
    },
  }))

  return {
    '@type': 'ItemList',
    itemListElement,
    numberOfItems: itemListElement.length,
  }
}

const buildAccommodationNode = (
  accommodation: Accommodation,
  siteUrl: string,
  path: string,
): SchemaNode => {
  const canonicalUrl = toAbsoluteUrl(siteUrl, path)
  const imageUrl = toAbsoluteUrl(siteUrl, getAccommodationImageUrl(accommodation))

  return {
    '@type': 'Accommodation',
    '@id': `${canonicalUrl}#accommodation`, // 🔥 CRUCIAL
    name: accommodation.name,
    description: accommodation.metaDescription,
    url: canonicalUrl,
    image: imageUrl,

    datePosted: accommodation.dateCreated,

    offers: {
      '@type': 'Offer',
      price: accommodation.offer.price,
      priceCurrency: accommodation.offer.priceCurrency,
      availability: 'https://schema.org/InStock',
    },

    numberOfBedrooms: accommodation.numberOfBedrooms,
    numberOfBathroomsTotal: accommodation.numberOfBathroomsTotal,
    floorSize: accommodation.floorSize,

    address: {
      '@type': 'PostalAddress',
      addressLocality: accommodation.place.name,
      addressCountry: 'MA',
    },
  }
}

const buildOrganizationNode = (organization: AppOrganization, siteUrl: string): SchemaNode => ({
  '@type': 'Organization',
  '@id': `${siteUrl}#organization`,
  name: organization.fullName,
  alternateName: organization.alternateName,
  url: siteUrl,
  logo: organization.image ? toAbsoluteUrl(siteUrl, organization.image) : undefined,
  email: organization.email,
  telephone: organization.phoneNumbers[0],
  address: organization.location,
})

const buildWebSiteNode = (
  siteUrl: string,
  organization: AppOrganization | null | undefined,
): SchemaNode => ({
  '@type': 'WebSite',
  '@id': `${siteUrl}#website`,
  url: siteUrl,
  name: organization?.fullName ?? organization?.alternateName ?? siteUrl,
  inLanguage: 'fr',
  publisher: organization
    ? {
        '@id': `${siteUrl}#organization`,
      }
    : undefined,
})

const buildWebPageNode = (
  page: WebPage,
  canonicalUrl: string,
  imageUrl: string | undefined,
  siteUrl: string,
  hasBreadcrumb: boolean,
  hasAccommodation: boolean,
): SchemaNode => {
  const webPageNode: SchemaNode = {
    '@type': 'WebPage',
    '@id': `${canonicalUrl}#webpage`,
    url: canonicalUrl,
    name: page.metaTitle,
    description: page.metaDescription,
    datePublished: page.datePublished,
    dateModified: page.dateModified,
    inLanguage: page.inLanguage,

    isPartOf: {
      '@id': `${siteUrl}#website`,
    },

    potentialAction: [
      {
        '@type': 'ReadAction',
        target: [canonicalUrl],
      },
    ],
  }

  // ✅ LIAISON CRITIQUE
  if (hasAccommodation) {
    webPageNode.mainEntity = {
      '@id': `${canonicalUrl}#accommodation`,
    }
  }

  if (imageUrl) {
    webPageNode.primaryImageOfPage = {
      '@type': 'ImageObject',
      url: imageUrl,
    }
    webPageNode.image = imageUrl
  }

  if (hasBreadcrumb) {
    webPageNode.breadcrumb = {
      '@id': `${canonicalUrl}#breadcrumb`,
    }
  }

  return webPageNode
}

const buildBreadcrumbNode = (
  breadcrumbItems: JsonLdBreadcrumbItem[],
  siteUrl: string,
  canonicalUrl: string,
): SchemaNode => ({
  '@type': 'BreadcrumbList',
  '@id': `${canonicalUrl}#breadcrumb`,
  itemListElement: breadcrumbItems.map((breadcrumbItem, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: breadcrumbItem.name,
    item: toAbsoluteUrl(siteUrl, breadcrumbItem.item),
  })),
})

/**
 * Construit l'objet SEO standard d'une page éditoriale.
 *
 * Les données attendues doivent déjà être résolues et non réactives.
 *
 * @param input Données SEO normalisées de la page.
 * @returns Objet compatible avec `useSeoMeta`.
 */
export const buildSeoMeta = (input: BuildSeoMetaInput) => {
  const canonicalUrl = toAbsoluteUrl(input.siteUrl, input.path)
  const imageUrl = toAbsoluteUrl(input.siteUrl, getPageImageUrl(input.page))

  return {
    title: input.page?.metaTitle,
    description: input.page?.metaDescription,
    canonicalUrl,
    robots: input.isIndexable ? 'index, follow' : 'noindex, nofollow',
    ogTitle: input.page?.metaTitle,
    ogDescription: input.page?.metaDescription,
    ogUrl: canonicalUrl,
    ogType: 'website' as const,
    ogImage: imageUrl,
    twitterCard: imageUrl ? ('summary_large_image' as const) : ('summary' as const),
    twitterTitle: input.page?.metaTitle,
    twitterDescription: input.page?.metaDescription,
    twitterImage: imageUrl,
    articlePublishedTime: input.page?.datePublished,
    articleModifiedTime: input.page?.dateModified,
  }
}

/**
 * Construit les noeuds JSON-LD standards d'une page éditoriale.
 *
 * Les données métier doivent déjà être normalisées côté appelant.
 *
 * @param input Données nécessaires aux noeuds structurés.
 * @returns Noeuds prêts à être sérialisés en JSON-LD.
 */
export const buildJsonLd = (input: BuildJsonLdInput): SchemaNode[] => {
  const nodes: SchemaNode[] = []
  const canonicalUrl = toAbsoluteUrl(input.siteUrl, input.path) ?? input.siteUrl
  const imageUrl = toAbsoluteUrl(input.siteUrl, getPageImageUrl(input.page))
  const breadcrumbItems = buildBreadcrumbItems(input)

  if (input.organization) {
    nodes.push(buildOrganizationNode(input.organization, input.siteUrl))
  }

  nodes.push(buildWebSiteNode(input.siteUrl, input.organization))

  if (input.page) {
    nodes.push(
      buildWebPageNode(
        input.page,
        canonicalUrl,
        imageUrl,
        input.siteUrl,
        breadcrumbItems.length > 0,
        !!input.accommodation, // 🔥 IMPORTANT
      ),
    )
  }

  if (breadcrumbItems.length > 0) {
    nodes.push(buildBreadcrumbNode(breadcrumbItems, input.siteUrl, canonicalUrl))
  }

  if (Array.isArray(input.accommodations) && input.accommodations.length > 0) {
    nodes.push(buildItemListNode(input.accommodations, input.siteUrl))
  }

  if (input.accommodation) {
    nodes.push(buildAccommodationNode(input.accommodation, input.siteUrl, input.path))
  }

  return nodes
}
