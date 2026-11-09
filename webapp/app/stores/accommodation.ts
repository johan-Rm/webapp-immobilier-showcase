import type { Accommodation } from '@schemas/interfaces'

import { mapAccommodations } from '@services/mapper/accommodation'

type AccommodationState = {
  list: Accommodation[]
}

/**
 * Récupère une chaîne issue d’un champ arbitraire d’un hébergement.
 *
 * @param item Hébergement dont on lit la propriété.
 * @param key Clé dynamique à extraire.
 * @returns Valeur string ou chaîne vide lorsqu’elle est absente.
 */
const getRecordValue = (item: Accommodation, key: string): string => {
  // Le contrat `Accommodation` contient des champs optionnels hétérogènes :
  // le cast reste local et sert uniquement à un accès dynamique contrôlé.
  const record = item as unknown as Record<string, unknown>
  const value = record[key]
  return typeof value === 'string' ? value : ''
}

/**
 * Store Pinia des hébergements.
 *
 * Responsabilités :
 * - conserver la liste brute chargée depuis le contenu
 * - exposer des getters enrichis via `mapAccommodations`
 * - proposer des filtres de lecture orientés parcours immobilier
 *
 * Le store ne porte pas le mapping métier complet ; il délègue cette responsabilité
 * aux services pour préserver une séparation claire entre état global et transformation.
 */
export const useAccommodationStore = defineStore('accommodation', {
  state: (): AccommodationState => ({
    list: [],
  }),

  getters: {
    /**
     * Retourne la liste complète des hébergements enrichis à partir de la liste brute.
     *
     * @param state État contenant `list`.
     *
     * @returns Liste des `Accommodation` étendus pour l’UI.
     */
    getAccommodations(state: AccommodationState): Accommodation[] {
      const metadataStore = useMetadataStore()
      return mapAccommodations(state.list, {
        categories: metadataStore.getAccommodationCategories,
        categoryCodes: metadataStore.getCategoryCodes,
        listings: metadataStore.getAccommodationRealEstateListings,
        places: metadataStore.getAccommodationPlaces,
        images: metadataStore.getImageObjects,
      }).filter((item) => item.isActive === true)
    },
    /**
     * Recherche un hébergement à partir de son slug.
     *
     * @param state État contenant l’index slug → accommodation.
     *
     * @returns Fonction qui prend un slug et renvoie l’`Accommodation` ou `undefined`.
     */
    getAccommodationBySlug(): (slug: string) => Accommodation | undefined {
      return (slug: string) => {
        if (!slug) return undefined
        return this.getAccommodations.find((item) => item.slug === slug)
      }
    },
    /**
     * Retourne les hébergements rattachés à un `realEstateListing` donné.
     *
     * @returns Fonction qui prend un slug de listing et renvoie les biens correspondants.
     */
    getAccommodationsByRealEstateListing(): (listingSlug: string) => Accommodation[] {
      return (listingSlug: string) => {
        if (!listingSlug) {
          return this.getAccommodations
        }

        const metadataStore = useMetadataStore()
        const knownEnabledListings = metadataStore.getAccommodationRealEstateListings
        const isKnownEnabledListing = knownEnabledListings.some((item) => item.slug === listingSlug)

        if (knownEnabledListings.length > 0 && !isKnownEnabledListing) {
          return []
        }

        return this.getAccommodations.filter((item) => item.realEstateListing?.slug === listingSlug)
      }
    },
    /**
     * Retourne les hébergements filtrés par `realEstateListing` et `accommodationCategory`.
     *
     * @returns Fonction qui prend les deux slugs et renvoie les biens correspondants.
     */
    getAccommodationsByRealEstateListingAndCategory(): (
      listingSlug: string,
      categorySlug: string,
    ) => Accommodation[] {
      return (listingSlug: string, categorySlug: string) => {
        const accommodations = this.getAccommodationsByRealEstateListing(listingSlug)

        if (!categorySlug) {
          return accommodations
        }

        return accommodations.filter((item) => item.category?.slug === categorySlug)
      }
    },
  },

  actions: {
    /**
     * Met à jour la liste des hébergements tout en conservant les références stables.
     *
     * @param items Liste brute d’hébergements entrante (API ou contenu).
     * @remarks Merge la liste via `mergeListByKey`, puis remappe les relations avec les metadata.
     */
    setList(items: Accommodation[]): void {
      const next = Array.isArray(items) ? items : []
      const getKey = (item: Accommodation) => {
        const identifier = getRecordValue(item, 'identifier')
        if (identifier) return identifier
        const name = getRecordValue(item, 'name')
        return name || ''
      }
      const merged = mergeListByKey(this.list, next, { getKey })
      this.list = merged
    },

    /**
     * Réinitialise tous les états du store (list).
     *
     * @returns `void`.
     */
    reset(): void {
      this.list = []
    },
  },
})
