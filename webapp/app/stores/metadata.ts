import type { DashboardMediaObject } from '#shared/types/dashboardAccommodation'
import type {
  AccommodationCategory,
  AccommodationPlace,
  CategoryCode,
  RealEstateListing,
} from '@schemas/interfaces'

import { defineStore } from 'pinia'

type MetadataState = {
  app: App | null
  accommodationForm: AccommodationForm | null
  dashboardContent: DashboardContent | null
  accommodationUi: AppAccommodation | null
  realEstateListings: RealEstateListing[]
  accommodationCategories: AccommodationCategory[]
  categoryCodes: CategoryCode[]
  accommodationPlaces: AccommodationPlace[]
  amenityFeatures: CategoryCode[]
  tags: CategoryCode[]
  imageObjects: DashboardMediaObject[]
}

const CATEGORY_CODE_SETS = new Set(['accommodation-category', 'accommodation-type'])

const upsertCategoryCode = <TItem extends { codeValue?: string; inCodeSet?: string }>(
  items: TItem[],
  item: TItem,
): TItem[] => {
  const index = items.findIndex(
    (current) => current.codeValue === item.codeValue && current.inCodeSet === item.inCodeSet,
  )
  if (index < 0) return [...items, item]

  return items.map((current, currentIndex) => (currentIndex === index ? item : current))
}

const upsertSlugOption = <TItem extends { slug?: string }>(
  items: TItem[],
  item: TItem,
): TItem[] => {
  const index = items.findIndex((current) => current.slug === item.slug)
  if (index < 0) return [...items, item]

  return items.map((current, currentIndex) => (currentIndex === index ? item : current))
}

const isEnabledOption = (item: { isEnabled?: boolean }): boolean => item.isEnabled !== false

const sortMediaByModificationDate = (
  left: DashboardMediaObject,
  right: DashboardMediaObject,
): number => {
  const leftTime = Date.parse(left.dateModified ?? '')
  const rightTime = Date.parse(right.dateModified ?? '')
  return (Number.isNaN(rightTime) ? 0 : rightTime) - (Number.isNaN(leftTime) ? 0 : leftTime)
}

const getCategoryCodeIsEnabled = (item: {
  isEnabled?: unknown
  metadata?: { isEnabled?: unknown }
}): boolean | undefined => {
  if (typeof item.metadata?.isEnabled === 'boolean') return item.metadata.isEnabled
  return typeof item.isEnabled === 'boolean' ? item.isEnabled : undefined
}

const toRealEstateListing = (item: CategoryCode): RealEstateListing => {
  const isEnabled = getCategoryCodeIsEnabled(item)

  return {
    slug: item.codeValue,
    name: item.name,
    text: item.text,
    ...(typeof isEnabled === 'boolean' ? { isEnabled } : {}),
  }
}

export const useMetadataStore = defineStore('metadata', {
  state: (): MetadataState => ({
    app: null,
    accommodationForm: null,
    dashboardContent: null,
    accommodationUi: null,
    realEstateListings: [],
    accommodationCategories: [],
    categoryCodes: [],
    accommodationPlaces: [],
    amenityFeatures: [],
    tags: [],
    imageObjects: [],
  }),

  getters: {
    /**
     * Retourne les contenus globaux d'application chargés.
     *
     * @param state État contenant `app`.
     *
     * @returns Objet `App` ou `null` si non chargé.
     */
    getApp(state: MetadataState): App | null {
      return state.app
    },

    /**
     * Retourne les listes d’annonces immobilières disponibles dans le store.
     *
     * @param state État contenant `realEstateListings`.
     *
     * @returns Tableau d’annonces immobilières stockées.
     */
    getAccommodationForm(state: MetadataState): AccommodationForm | null {
      return state.accommodationForm
    },

    getDashboardContent(state: MetadataState): DashboardContent | null {
      return state.dashboardContent
    },

    getAccommodationUi(state: MetadataState): AppAccommodation | null {
      return state.accommodationUi
    },

    getAccommodationRealEstateListings(state: MetadataState): RealEstateListing[] {
      return state.realEstateListings.filter(isEnabledOption)
    },

    /**
     * Renvoie les catégories d’hébergements chargées.
     *
     * @param state État contenant `accommodationCategories`.
     *
     * @returns Tableau des catégories d’hébergement.
     */
    getAccommodationCategories(state: MetadataState): AccommodationCategory[] {
      return state.accommodationCategories
    },

    /**
     * Accès aux codes de catégories utilitaires (amenities, tags, etc.).
     *
     * @param state État contenant `categoryCodes`.
     *
     * @returns Tableau des codes.
     */
    getCategoryCodes(state: MetadataState): CategoryCode[] {
      return state.categoryCodes
    },

    /**
     * Liste des lieux d’hébergement référencés.
     *
     * @param state État contenant `accommodationPlaces`.
     *
     * @returns Table des `AccommodationPlace` chargés.
     */
    getAccommodationPlaces(state: MetadataState): AccommodationPlace[] {
      return state.accommodationPlaces
    },

    /**
     * Retourne les services (`amenityFeature`) disponibles.
     *
     * @param state État contenant `amenityFeatures`.
     *
     * @returns Liste des `CategoryCode` utilisés comme services.
     */
    getAmenityFeatures(state: MetadataState): CategoryCode[] {
      return state.amenityFeatures
    },

    /**
     * Fournit les tags métier liés aux hébergements.
     *
     * @param state État contenant `tags`.
     *
     * @returns Liste des `CategoryCode` utilisés comme tags.
     */
    getTags(state: MetadataState): CategoryCode[] {
      return state.tags
    },

    /**
     * Accès aux objets médias (images, vidéos) disponibles.
     *
     * @param state État contenant `mediaObjects`.
     *
     * @returns Liste des `MediaObject` chargés.
     */
    getImageObjects(state: MetadataState): DashboardMediaObject[] {
      return state.imageObjects
    },

    /**
     * Index des `MediaObject` par `identifier`, filtré sur les entrées valides.
     *
     * @param state État contenant `imageObjects`.
     *
     * @returns Map `identifier → MediaObject`.
     */
    getImageObjectsByIdentifier(state: MetadataState): Map<string, DashboardMediaObject> {
      return new Map(
        state.imageObjects
          .filter((item): item is DashboardMediaObject & { identifier: string } =>
            Boolean(item.identifier),
          )
          .map((item) => [item.identifier, item] as const),
      )
    },

    getOptionsForCodeSet(
      state: MetadataState,
    ): (inCodeSet: string) => { label: string; value: string }[] {
      return (inCodeSet: string) => {
        const slugged: Record<string, Array<{ name: string; slug: string }>> = {
          'accommodation-category': state.accommodationCategories,
          'accommodation-type': state.accommodationCategories,
          'accommodation-place': state.accommodationPlaces,
          'real-estate-listing': state.realEstateListings.filter(isEnabledOption),
        }
        if (inCodeSet in slugged) {
          return (slugged[inCodeSet] ?? []).map((c) => ({ label: c.name, value: c.slug }))
        }
        return [...state.amenityFeatures, ...state.tags, ...state.categoryCodes]
          .filter((c) => c.inCodeSet === inCodeSet)
          .map((c) => ({ label: c.name, value: c.codeValue }))
      }
    },
  },

  actions: {
    /**
     * Met à jour le contenu global d'application.
     *
     * @param item Donnée d'application à stocker.
     *
     * @returns `void`.
     */
    setApp(item: App | null): void {
      this.app = item && typeof item === 'object' ? item : null
    },

    /**
     * Remplace les annonces immobilières par celles fournies.
     *
     * @param items Données entrantes potentiellement non tabulaires.
     *
     * @returns `void`.
     */
    setAccommodationForm(item: AccommodationForm | null): void {
      this.accommodationForm = item && typeof item === 'object' ? item : null
    },

    setDashboardContent(item: DashboardContent | null): void {
      this.dashboardContent = item && typeof item === 'object' ? item : null
    },

    setAccommodationUi(item: AppAccommodation | null): void {
      this.accommodationUi = item && typeof item === 'object' ? item : null
    },

    setCategoryCodes(items: CategoryCode[]): void {
      if (!Array.isArray(items)) return
      const SLUG_SETS = new Set([
        'accommodation-category',
        'accommodation-type',
        'accommodation-place',
        'real-estate-listing',
        'amenity-feature',
        'tag',
      ])
      this.accommodationCategories = items
        .filter((c) => CATEGORY_CODE_SETS.has(c.inCodeSet ?? ''))
        .map(({ codeValue, name, text }) => ({ slug: codeValue, name, text }))
      this.accommodationPlaces = items
        .filter((c) => c.inCodeSet === 'accommodation-place')
        .map(({ codeValue, name, text }) => ({ slug: codeValue, name, text }))
      this.realEstateListings = items
        .filter((c) => c.inCodeSet === 'real-estate-listing')
        .map(toRealEstateListing)
      this.amenityFeatures = items.filter((c) => c.inCodeSet === 'amenity-feature')
      this.tags = items.filter((c) => c.inCodeSet === 'tag')
      this.categoryCodes = items.filter((c) => !SLUG_SETS.has(c.inCodeSet ?? ''))
    },

    /**
     * Actualise les objets médias référencés.
     *
     * @param items Médias à conserver (images, vidéos).
     *
     * @returns `void`.
     */
    setMediaObjects(items: DashboardMediaObject[]): void {
      this.imageObjects = Array.isArray(items) ? [...items].sort(sortMediaByModificationDate) : []
    },

    /**
     * Réinitialise tous les tableaux du store à l’état vide.
     *
     * @returns `void`.
     */
    addMediaObject(item: DashboardMediaObject): void {
      this.imageObjects = [...this.imageObjects, item].sort(sortMediaByModificationDate)
    },

    addCategoryCode(item: CategoryCode): void {
      switch (item.inCodeSet) {
        case 'accommodation-category':
        case 'accommodation-type':
          this.accommodationCategories = upsertSlugOption(this.accommodationCategories, {
            slug: item.codeValue,
            name: item.name,
            text: item.text,
          })
          break
        case 'accommodation-place':
          this.accommodationPlaces = upsertSlugOption(this.accommodationPlaces, {
            slug: item.codeValue,
            name: item.name,
            text: item.text,
          })
          break
        case 'real-estate-listing':
          this.realEstateListings = upsertSlugOption(
            this.realEstateListings,
            toRealEstateListing(item),
          )
          break
        case 'amenity-feature':
          this.amenityFeatures = upsertCategoryCode(this.amenityFeatures, item)
          break
        case 'tag':
          this.tags = upsertCategoryCode(this.tags, item)
          break
        default:
          this.categoryCodes = upsertCategoryCode(this.categoryCodes, item)
      }
    },

    updateAccommodationPlaceText(code: string, text: string): void {
      this.accommodationPlaces = this.accommodationPlaces.map((item) =>
        item.slug === code ? { ...item, text } : item,
      )
    },

    reset(): void {
      this.app = null
      this.accommodationForm = null
      this.dashboardContent = null
      this.accommodationUi = null
      this.realEstateListings = []
      this.accommodationCategories = []
      this.categoryCodes = []
      this.accommodationPlaces = []
      this.amenityFeatures = []
      this.tags = []
      this.imageObjects = []
    },
  },
})
