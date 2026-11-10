import type { ComputedRef } from 'vue'

type AccommodationCategoryOption = {
  slug: string
  name: string
  count: number
  disabled: boolean
}

type RealEstateListingSelectOption = {
  label: string
  value: string
  count: number
  disabled: boolean
}

type UsePropertyListOptionsReturn = {
  accommodationCategories: ComputedRef<AccommodationCategoryOption[]>
  realEstateListingOptions: ComputedRef<RealEstateListingSelectOption[]>
}

export const usePropertyListOptions = (
  sourcePropertyItems: ComputedRef<PropertyItem[]>,
): UsePropertyListOptionsReturn => {
  const metadataStore = useMetadataStore()
  const accommodationStore = useAccommodationStore()

  const categoryCountBySlug = computed<Map<string, number>>(() => {
    const counts = new Map<string, number>()
    for (const item of sourcePropertyItems.value) {
      if (!item.categorySlug) continue
      counts.set(item.categorySlug, (counts.get(item.categorySlug) ?? 0) + 1)
    }
    return counts
  })

  const accommodationCategories = computed<AccommodationCategoryOption[]>(() => {
    const categoryItems = metadataStore.getAccommodationCategories

    return [
      { slug: 'all', name: 'Tout', count: sourcePropertyItems.value.length },
      ...categoryItems.map((category) => ({
        slug: category.slug ?? '',
        name: category.name,
        count: categoryCountBySlug.value.get(category.slug ?? '') ?? 0,
      })),
    ].map((category) => ({
      ...category,
      disabled: category.count === 0,
    }))
  })

  const realEstateListingOptions = computed<RealEstateListingSelectOption[]>(() =>
    metadataStore.getAccommodationRealEstateListings
      .filter((listing) => listing.slug && listing.name)
      .map((listing) => {
        const slug = String(listing.slug)
        const count = accommodationStore.getAccommodationsByRealEstateListing(slug).length

        return {
          label: String(listing.name),
          value: slug,
          count,
          disabled: count === 0,
        }
      }),
  )

  return { accommodationCategories, realEstateListingOptions }
}
