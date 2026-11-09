import type {
  DashboardAccommodation,
  DashboardAccommodationFilters,
  DashboardAccommodationMedia,
  DashboardAccommodationTranslationPayload,
  DashboardAccommodationsResponse,
  DashboardEditableRecord,
  DashboardEditableValue,
  DashboardFilterOption,
} from '#shared/types/dashboardAccommodation'
import type { LocaleCode } from '#shared/types/i18n'
import type { Accommodation, CategoryCode, MediaObject } from '@schemas/interfaces'

import { basename } from 'node:path'

import { mapAccommodations } from '@services/mapper/accommodation'

import { loadContentFromFiles } from '../content/loaders'

import { DASHBOARD_LOCALIZED_ACCOMMODATION_FIELDS } from '#shared/types/dashboardAccommodation'

type UnknownRecord = Record<string, unknown>

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const toEditableValue = (value: unknown): DashboardEditableValue => {
  if (value === null) return null

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value
  }

  if (Array.isArray(value)) {
    return value.map((item) => toEditableValue(item))
  }

  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, toEditableValue(item)]),
    )
  }

  return null
}

const toEditableRecord = (value: UnknownRecord): DashboardEditableRecord =>
  Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, toEditableValue(item)]),
  ) satisfies DashboardEditableRecord

const getString = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback

const getNumber = (value: unknown): number | null => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value !== 'string') return null

  const parsed = Number(value.trim())
  return Number.isFinite(parsed) ? parsed : null
}

const getSlugLabel = (value: unknown): { slug: string; label: string } => {
  if (typeof value === 'string') return { slug: value, label: value }
  if (!isRecord(value)) return { slug: '', label: '' }

  const slug = getString(value.slug, getString(value.codeValue))
  const label = getString(value.name, slug)

  return { slug, label }
}

const getOfferRecord = (value: unknown): UnknownRecord => (isRecord(value) ? value : {})

const getMediaUrl = (value: unknown): string => {
  if (!isRecord(value)) return ''
  return getString(value.url, getString(value.contentUrl))
}

const getMediaIdentifier = (value: unknown): string => {
  if (typeof value === 'string') return value
  if (!isRecord(value)) return ''
  return getString(value.identifier, getString(value.name, getString(value.url)))
}

const normalizeAssociatedMedia = (item: Accommodation): DashboardAccommodationMedia[] => {
  const list = Array.isArray(item.associatedMedia) ? item.associatedMedia : []

  return list.map((entry) => ({
    image: getMediaIdentifier(entry.image),
    imageUrl: getMediaUrl(entry.image),
    caption: getString(entry.caption),
    keywords: Array.isArray(entry.keywords)
      ? entry.keywords.filter((keyword): keyword is string => typeof keyword === 'string')
      : [],
    representativeOfPage:
      isRecord(entry) && typeof entry.representativeOfPage === 'boolean'
        ? entry.representativeOfPage
        : false,
  }))
}

const getPrimaryImageUrl = (media: DashboardAccommodationMedia[]): string => {
  const representative = media.find((item) => item.representativeOfPage && item.imageUrl)
  if (representative?.imageUrl) return representative.imageUrl

  return media.find((item) => item.imageUrl)?.imageUrl ?? ''
}

const incrementCount = (
  counts: Map<string, DashboardFilterOption>,
  value: string,
  label: string,
) => {
  if (!value) return

  const current = counts.get(value)
  if (current) {
    current.count += 1
    return
  }

  counts.set(value, { value, label: label || value, count: 1 })
}

const toSortedOptions = (counts: Map<string, DashboardFilterOption>): DashboardFilterOption[] =>
  [...counts.values()].sort((left, right) => left.label.localeCompare(right.label, 'fr'))

const buildFilters = (items: DashboardAccommodation[]): DashboardAccommodationFilters => {
  const listings = new Map<string, DashboardFilterOption>()
  const categories = new Map<string, DashboardFilterOption>()
  const places = new Map<string, DashboardFilterOption>()

  items.forEach((item) => {
    incrementCount(listings, item.preview.listingSlug, item.preview.listingLabel)
    incrementCount(categories, item.preview.categorySlug, item.preview.categoryLabel)
    incrementCount(places, item.preview.placeSlug, item.preview.placeLabel)
  })

  return {
    listings: toSortedOptions(listings),
    categories: toSortedOptions(categories),
    places: toSortedOptions(places),
  }
}

type CacheEntry = { data: DashboardAccommodationsResponse; expiresAt: number }

const cache = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 30_000

export const loadDashboardAccommodations = async (
  locale: string,
  { force = false } = {},
): Promise<DashboardAccommodationsResponse> => {
  if (!force) {
    const hit = cache.get(locale)
    if (hit && Date.now() < hit.expiresAt) return hit.data
  }

  const [rawAccommodations, allCodes, images] = await Promise.all([
    loadContentFromFiles<Accommodation[]>('accommodations', locale),
    loadContentFromFiles<CategoryCode[]>('category-code', locale),
    loadContentFromFiles<MediaObject[]>('media-object', locale),
  ])

  const categories = allCodes
    .filter((c) => c.inCodeSet === 'accommodation-type')
    .map(({ codeValue, name, text }) => ({ slug: codeValue, name, text }))
  const places = allCodes
    .filter((c) => c.inCodeSet === 'accommodation-place')
    .map(({ codeValue, name, text }) => ({ slug: codeValue, name, text }))
  const listings = allCodes
    .filter((c) => c.inCodeSet === 'real-estate-listing')
    .map((item) => {
      const isEnabled = item.metadata?.isEnabled

      return {
        slug: item.codeValue,
        name: item.name,
        text: item.text,
        ...(typeof isEnabled === 'boolean' ? { isEnabled } : {}),
      }
    })

  const mapped = mapAccommodations(rawAccommodations, {
    categories,
    places,
    listings,
    images,
  })

  const items = mapped
    .map((item, index): DashboardAccommodation => {
      const raw = rawAccommodations[index] as Accommodation & UnknownRecord
      const rawRecord = { ...raw }
      const body = getString(rawRecord.body)
      delete rawRecord.body
      delete rawRecord._fileName

      const offer = getOfferRecord(item.offer)
      const place = getSlugLabel(item.place)
      const category = getSlugLabel(item.category)
      const listing = getSlugLabel(item.realEstateListing)
      const media = normalizeAssociatedMedia(item)
      const slug = getString(item.slug, getString(raw.slug))
      const identifier = getString(item.identifier, slug)
      const sourceFileName = getString(raw._fileName)

      return {
        locale,
        fileName:
          sourceFileName || `${basename(slug || identifier || `accommodation-${index + 1}`)}.md`,
        slug,
        identifier,
        frontmatter: toEditableRecord(rawRecord),
        body,
        preview: {
          identifier,
          slug,
          title: getString(item.name, slug),
          description: getString(item.highlight, getString(item.label)),
          price: getNumber(offer.price),
          priceCurrency: getString(offer.priceCurrency, 'EUR'),
          priceSpecification: getString(offer.priceSpecification),
          placeSlug: place.slug,
          placeLabel: place.label,
          categorySlug: category.slug,
          categoryLabel: category.label,
          listingSlug: listing.slug,
          listingLabel: listing.label,
          isActive: item.isActive === true,
          floorSize: getString(raw.floorSize),
          landArea: getString(raw.landArea),
          numberOfRooms: getNumber(raw.numberOfRooms),
          numberOfBedrooms: getNumber(raw.numberOfBedrooms),
          numberOfBathroomsTotal: getNumber(raw.numberOfBathroomsTotal),
          primaryImageUrl: getPrimaryImageUrl(media),
          media,
        },
      }
    })
    .sort((left, right) => left.identifier.localeCompare(right.identifier, 'fr'))

  const result: DashboardAccommodationsResponse = {
    items,
    filters: buildFilters(items),
  }

  cache.set(locale, { data: result, expiresAt: Date.now() + CACHE_TTL_MS })

  return result
}

export const loadDashboardAccommodationTranslations = async (
  identifier: string,
  locales: LocaleCode[],
): Promise<DashboardAccommodationTranslationPayload[]> => {
  const localeItems = await Promise.all(
    locales.map(async (locale) => {
      try {
        const response = await loadDashboardAccommodations(locale, { force: true })
        return {
          locale,
          accommodation: response.items.find((item) => item.identifier === identifier),
        }
      } catch {
        return { locale, accommodation: undefined }
      }
    }),
  )

  return localeItems.flatMap(({ locale, accommodation }) => {
    if (!accommodation) return []

    const translation: DashboardAccommodationTranslationPayload = {
      locale,
    }
    DASHBOARD_LOCALIZED_ACCOMMODATION_FIELDS.forEach((field) => {
      if (field === 'body') {
        translation.body = accommodation.body
        return
      }
      const value = accommodation.frontmatter[field]
      translation[field] = typeof value === 'string' ? value : null
    })
    return [translation]
  })
}
