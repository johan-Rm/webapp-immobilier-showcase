import type { Accommodation, CategoryCode } from '@schemas/interfaces'
import type { MaybeRefOrGetter } from 'vue'

import { computed, toValue } from 'vue'

type SummaryItem = {
  key: string
  label: string
  value: string
  icon: string
}

const formatOfferPrice = (
  offer: Accommodation['offer'] | undefined,
  localeCode: string,
): string => {
  if (!offer) return '—'

  const parsedPrice =
    typeof offer.price === 'number'
      ? offer.price
      : typeof offer.price === 'string' && offer.price.trim().length > 0
        ? Number(offer.price)
        : Number.NaN
  const currency = typeof offer.priceCurrency === 'string' ? offer.priceCurrency : 'EUR'
  const formatter = new Intl.NumberFormat(localeCode, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  })

  const priceSpecification =
    typeof offer.priceSpecification === 'string' && offer.priceSpecification.length > 0
      ? offer.priceSpecification
      : '—'

  return Number.isFinite(parsedPrice) ? formatter.format(parsedPrice) : priceSpecification
}

const isCategoryCode = (value: unknown): value is CategoryCode =>
  typeof value === 'object' && value !== null && ('name' in value || 'codeValue' in value)

const getCategoryLabel = (value?: CategoryCode | string): string => {
  if (typeof value === 'string') return value
  if (isCategoryCode(value)) {
    return value.name ?? value.codeValue ?? '—'
  }
  return '—'
}

const formatFeature = (value?: CategoryCode | string): string => {
  const label = getCategoryLabel(value)
  return label === '—' ? '—' : label
}

const getFeatureKey = (value: CategoryCode | string | undefined, fallback: string): string => {
  if (typeof value === 'string' && value.length > 0) return value
  if (isCategoryCode(value)) {
    return value.codeValue ?? value.name ?? fallback
  }
  return fallback
}

const getPlaceLabel = (value?: Accommodation['place']): string => {
  if (!value) return '—'
  return value.name || value.slug || '—'
}

const getEntityLabel = (value: unknown): string => {
  if (typeof value === 'string' && value.trim().length > 0) return value
  if (typeof value === 'object' && value !== null) {
    const record = value as Record<string, unknown>
    if (typeof record.name === 'string' && record.name.trim().length > 0) return record.name
    if (typeof record.slug === 'string' && record.slug.trim().length > 0) return record.slug
  }
  return '—'
}

const normalizeMetric = (value?: number | string): number | null => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }

  if (typeof value === 'string') {
    const match = value.replace(',', '.').match(/[\d.]+/)
    if (!match) return null

    const parsed = Number(match[0])
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

const formatMetric = (value?: number | string, unit?: string): string => {
  if (typeof value === 'string' && value.includes('m²')) {
    return value
  }

  const normalized = normalizeMetric(value)
  if (normalized === null) return '—'

  return unit ? `${normalized} ${unit}` : String(normalized)
}

const formatTextMetric = (value?: number | string, unit?: string): string => {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return '—'
    return unit ? `${value} ${unit}` : String(value)
  }

  if (typeof value === 'string') {
    const trimmedValue = value.trim()
    if (!trimmedValue.length) return '—'

    return unit && !trimmedValue.includes(unit) ? `${trimmedValue} ${unit}` : trimmedValue
  }

  return '—'
}

export const usePropertyDetailPanelData = (
  propertySource: MaybeRefOrGetter<Accommodation | undefined>,
) => {
  const { accommodationUi, locale } = useApp()
  const property = computed(() => toValue(propertySource))
  const localeCode = computed(() => {
    const LOCALE_CODE_MAP: Record<string, string> = { en: 'en-US', es: 'es-ES', fr: 'fr-FR' }
    return LOCALE_CODE_MAP[locale.value] ?? 'fr-FR'
  })

  const placeLabel = computed(() => getPlaceLabel(property.value?.place))
  const offerLabel = computed(() => formatOfferPrice(property.value?.offer, localeCode.value))
  const listingLabel = computed(() => getEntityLabel(property.value?.realEstateListing))
  const categoryLabel = computed(() => getEntityLabel(property.value?.category))

  const accommodationLabels = computed(() => ({
    bathrooms: accommodationUi.value?.labels.bathrooms ?? 'Bathrooms',
    bedrooms: accommodationUi.value?.labels.bedrooms ?? 'Bedrooms',
    garages: accommodationUi.value?.labels.garages ?? 'Garages',
    price: accommodationUi.value?.labels.price ?? 'Price',
    propertyReference: accommodationUi.value?.labels.propertyReference ?? 'Reference',
    propertyStatus: accommodationUi.value?.labels.propertyStatus ?? 'Property status',
    propertyType: accommodationUi.value?.labels.propertyType ?? 'Property type',
    rooms: accommodationUi.value?.labels.rooms ?? 'Rooms',
    surface: accommodationUi.value?.labels.surface ?? 'Surface',
    surfaceHabitable: accommodationUi.value?.labels.surfaceHabitable ?? 'Living area',
    surfaceTerrain: accommodationUi.value?.labels.surfaceTerrain ?? 'Land area',
  }))

  const accommodationSections = computed(() => ({
    location: accommodationUi.value?.sections.location ?? 'Location',
    review: accommodationUi.value?.sections.review ?? 'Our view',
    visitGuide: accommodationUi.value?.sections.visitGuide ?? 'Guided tour / Description',
    wellness: accommodationUi.value?.sections.wellness ?? 'Comfort features',
  }))

  const detailSectionLabels = computed(() => ({
    visitGuide: accommodationSections.value.visitGuide,
    wellness: accommodationSections.value.wellness,
    location: accommodationSections.value.location,
    review: accommodationSections.value.review,
  }))

  const accommodationTexts = computed(() => ({
    noImageAvailable: accommodationUi.value?.texts.noImageAvailable ?? 'No image available',
    propertyVisual: accommodationUi.value?.texts.propertyVisual ?? 'Property visual',
  }))

  const summaryItems = computed<SummaryItem[]>(() => [
    {
      key: 'rooms',
      label: accommodationLabels.value.rooms,
      value: formatMetric(property.value?.numberOfRooms),
      icon: 'i-lucide-sofa',
    },
    {
      key: 'surface',
      label: accommodationLabels.value.surface,
      value: formatTextMetric(property.value?.floorSize, 'm²'),
      icon: 'i-lucide-move-diagonale',
    },
    {
      key: 'bedrooms',
      label: accommodationLabels.value.bedrooms,
      value: formatMetric(property.value?.numberOfBedrooms),
      icon: 'i-lucide-bed-double',
    },
    {
      key: 'bathrooms',
      label: accommodationLabels.value.bathrooms,
      value: formatMetric(property.value?.numberOfBathroomsTotal),
      icon: 'i-lucide-bath',
    },
    {
      key: 'reference',
      label: accommodationLabels.value.propertyReference,
      value: property.value?.identifier ?? '—',
      icon: 'i-lucide-hash',
    },
  ])

  const mobileQuickFacts = computed(() => summaryItems.value.slice(0, 3))
  const summaryBadges = computed(() =>
    summaryItems.value.filter((item) => item.key !== 'reference' && item.value !== '—'),
  )

  const detailItems = computed(() => [
    {
      label: accommodationLabels.value.propertyReference,
      value: property.value?.identifier ?? '—',
    },
    { label: accommodationLabels.value.price, value: offerLabel.value },
    {
      label: accommodationLabels.value.surfaceHabitable,
      value: formatTextMetric(property.value?.floorSize, 'm²'),
    },
    {
      label: accommodationLabels.value.surfaceTerrain,
      value: formatTextMetric(property.value?.landArea, 'm²'),
    },
    {
      label: accommodationLabels.value.bedrooms,
      value: formatMetric(property.value?.numberOfBedrooms),
    },
    { label: accommodationLabels.value.rooms, value: formatMetric(property.value?.numberOfRooms) },
    {
      label: accommodationLabels.value.bathrooms,
      value: formatMetric(property.value?.numberOfBathroomsTotal),
    },
    {
      label: accommodationLabels.value.garages,
      value: formatMetric(property.value?.numberOfGarages),
    },
    {
      label: accommodationLabels.value.propertyType,
      value: getEntityLabel(property.value?.category),
    },
    {
      label: accommodationLabels.value.propertyStatus,
      value: getEntityLabel(property.value?.realEstateListing),
    },
  ])

  const featureItems = computed(() =>
    (property.value?.amenityFeature ?? []).map((feature, index) => ({
      key: getFeatureKey(feature, `feature-${index}`),
      label: formatFeature(feature),
    })),
  )

  const panelData = computed(() => ({
    categoryLabel: categoryLabel.value,
    detailItems: detailItems.value,
    featureItems: featureItems.value,
    listingLabel: listingLabel.value,
    offerLabel: offerLabel.value,
    placeLabel: placeLabel.value,
    sections: detailSectionLabels.value,
    summaryItems: summaryItems.value,
  }))

  return {
    accommodationTexts,
    mobileQuickFacts,
    panelData,
    summaryBadges,
  }
}
