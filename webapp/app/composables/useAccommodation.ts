import type { Accommodation } from '@schemas/interfaces'
import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'

import { computed, toValue } from 'vue'

import { useAccommodationStore } from '~/stores/accommodation'
import { loadContentResource } from '~/utils/loadContentResource'

type UseAccommodationReturn = {
  loadAccommodations: () => Promise<void>
  getItemsByRealEstateListing: (listingSlug: string) => ComputedRef<Accommodation[]>
  getItemsListByAccommodations: (
    accommodations: MaybeRefOrGetter<Accommodation[]>,
  ) => ComputedRef<PropertyItem[][]>
  setViewModeList: (mode: ViewModeList) => void
  items: ComputedRef<Accommodation[]>
  itemsList: ComputedRef<PropertyItem[][]>
  viewModeList: Ref<ViewModeList>
}

const DEFAULT_CURRENCY = 'EUR'

type UnknownRecord = Record<string, unknown>

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null

const hasRepresentativeOfPageFlag = (value: unknown): boolean => {
  return isRecord(value) && value.representativeOfPage === true
}

const getMediaImageUrl = (value: unknown): string => {
  if (!isRecord(value)) return ''

  const url = value.url
  return typeof url === 'string' ? url.trim() : ''
}

const chunk = <T>(arr: T[], size: number): T[][] => {
  if (size <= 0) return []
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

const getAddressCity = (accommodation: Accommodation): string => {
  const place = accommodation.place
  return typeof place?.name === 'string' ? place.name : ''
}

const getPrimaryImage = (accommodation: Accommodation): string => {
  const representative = accommodation.associatedMedia.find(
    (item) => hasRepresentativeOfPageFlag(item) && getMediaImageUrl(item.image).length > 0,
  )

  const representativeUrl = getMediaImageUrl(representative?.image)
  if (representativeUrl) return representativeUrl

  const primary = accommodation.associatedMedia.find((item) => getMediaImageUrl(item.image).length)
  const primaryUrl = getMediaImageUrl(primary?.image)
  if (primaryUrl) return primaryUrl

  return ''
}

const getOfferPrice = (accommodation: Accommodation): number | undefined => {
  const offer = isRecord(accommodation.offer) ? accommodation.offer : undefined
  const price = offer?.price
  if (typeof price === 'number' && !Number.isNaN(price)) {
    return price
  }
  if (typeof price === 'string' && price.trim().length > 0) {
    const parsedPrice = Number(price)
    return Number.isFinite(parsedPrice) ? parsedPrice : undefined
  }
  return undefined
}

const getOfferCurrency = (accommodation: Accommodation): string | undefined => {
  const offer = isRecord(accommodation.offer) ? accommodation.offer : undefined
  return typeof offer?.priceCurrency === 'string' ? offer.priceCurrency : undefined
}

const getTags = (accommodation: Accommodation): string[] => {
  const tags = Array.isArray(accommodation.tags) ? accommodation.tags : []
  return tags
    .map((item) => {
      if (typeof item === 'string') return item
      if (isRecord(item)) {
        if (typeof item.name === 'string') return item.name
        if (typeof item.codeValue === 'string') return item.codeValue
      }
      return ''
    })
    .filter((item) => item.length > 0)
}

const formatPrice = (value?: number, currency?: string): string => {
  if (typeof value !== 'number' || Number.isNaN(value)) return ''
  const normalizedCurrency =
    typeof currency === 'string' && currency.length > 0 ? currency : DEFAULT_CURRENCY
  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: normalizedCurrency,
      maximumFractionDigits: 0,
    }).format(value)
  } catch {
    return `${value} ${normalizedCurrency}`
  }
}

const getAccommodationHref = (accommodation: Accommodation): string => {
  const listingSlug = accommodation.realEstateListing?.slug ?? ''
  const categorySlug = accommodation.category?.slug ?? ''
  const accommodationSlug = accommodation.slug ?? ''

  if (!listingSlug || !categorySlug || !accommodationSlug) {
    return '/'
  }

  return `/${listingSlug}/${categorySlug}/${accommodationSlug}`
}

const toPropertyItem = (accommodation: Accommodation): PropertyItem => ({
  categorySlug: accommodation.category?.slug ?? '',
  city: getAddressCity(accommodation),
  title: accommodation.name ?? 'Hébergement',
  price: formatPrice(getOfferPrice(accommodation), getOfferCurrency(accommodation)),
  meta: accommodation.body ?? '',
  tags: getTags(accommodation),
  image: getPrimaryImage(accommodation),
  href: getAccommodationHref(accommodation),
  numberOfBedrooms: accommodation.numberOfBedrooms,
  floorSize: accommodation.floorSize != null ? String(accommodation.floorSize) : undefined,
  identifier: accommodation.identifier,
  place: accommodation.place?.name,
})

export const useAccommodation = (): UseAccommodationReturn => {
  const { localeSetting } = useLang()
  const locale = computed(() => localeSetting.value)
  const store = useAccommodationStore()

  const items = computed<Accommodation[]>(() => store.getAccommodations)
  const getItemsByRealEstateListing = (listingSlug: string): ComputedRef<Accommodation[]> =>
    computed(() => store.getAccommodationsByRealEstateListing(listingSlug))
  const viewModeList = useState<ViewModeList>('ui.viewModeList', () => 'single')

  const setViewModeList = (mode: ViewModeList): void => {
    if (mode === viewModeList.value) return
    viewModeList.value = mode
  }

  const chunkSize = computed(() => (viewModeList.value === 'single' ? 1 : 4))

  const itemsList = computed<PropertyItem[][]>(() => {
    return chunk(items.value.map(toPropertyItem), chunkSize.value)
  })

  const getItemsListByAccommodations = (
    accommodations: MaybeRefOrGetter<Accommodation[]>,
  ): ComputedRef<PropertyItem[][]> =>
    computed(() => chunk(toValue(accommodations).map(toPropertyItem), chunkSize.value))

  const loadAccommodations = async (): Promise<void> => {
    const accommodations = await loadContentResource<Accommodation[]>(
      'accommodations',
      locale.value,
    )
    store.setList(Array.isArray(accommodations) ? accommodations : [])
  }

  return {
    loadAccommodations,
    getItemsByRealEstateListing,
    getItemsListByAccommodations,
    setViewModeList,
    items,
    itemsList,
    viewModeList,
  }
}
