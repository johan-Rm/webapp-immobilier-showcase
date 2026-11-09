import type { LocaleCode } from './i18n'
import type { MediaObject } from '@schemas/interfaces'

export const DASHBOARD_LOCALIZED_ACCOMMODATION_FIELDS = [
  'slug',
  'name',
  'label',
  'highlight',
  'body',
  'review',
  'metaTitle',
  'metaDescription',
] as const

export type DashboardLocalizedAccommodationField =
  (typeof DASHBOARD_LOCALIZED_ACCOMMODATION_FIELDS)[number]

export type DashboardAccommodationTranslationPayload = {
  locale: LocaleCode
} & Partial<Record<DashboardLocalizedAccommodationField, string | null>>

export type DashboardEditableValue =
  | string
  | number
  | boolean
  | null
  | DashboardEditableValue[]
  | { [key: string]: DashboardEditableValue }

export type DashboardEditableRecord = Record<string, DashboardEditableValue>

/** Média enrichi avec les métadonnées nécessaires aux écrans du dashboard. */
export type DashboardMediaObject = MediaObject & {
  dateModified?: string
}

// --- Screens du parcours (blocs hasPart) éditables dans le dashboard ---

/** Champs localisés d'un screen (édités par onglet de langue). */
export const DASHBOARD_LOCALIZED_SCREEN_FIELDS = ['name', 'headline', 'text'] as const

/** Média d'un screen : identifiant d'image + texte alternatif (réutilise le media picker). */
export type DashboardScreenMedia = {
  image: string
  caption?: string
}

/** Options d'affichage partagées d'un screen (non localisées). */
export type DashboardScreenMeta = {
  reverse?: boolean
  overlayMode?: 'dark' | 'light'
  imageOverlay?: 'none' | 'dark' | 'light'
}

/** Screen éditable du parcours (forme draft d'un bloc hasPart). */
export type DashboardAccommodationScreen = {
  /** Template d'espace (string, ex. SCREEN_ACCOMMODATION_FULL). */
  additionalType: string
  position: number
  name?: string
  headline?: string
  text?: string
  associatedMedia?: DashboardScreenMedia[]
  meta?: DashboardScreenMeta
}

/**
 * Écran de contact figé qui clôt tout parcours immersif. Il n'est pas stocké
 * dans `hasPart` (donnée éditoriale) : il est ajouté au rendu et présenté en
 * lecture seule dans l'éditeur. Contenu fixe, non localisé, non éditable.
 */
export const DASHBOARD_CONTACT_SCREEN = {
  name: 'Dernière étape',
  headline: 'Organisons votre visite',
  text: 'Laissez vos coordonnées pour organiser une visite privée.',
} as const

/** Templates d'espaces sélectionnables (hors contact, ajouté au rendu). */
export const DASHBOARD_SCREEN_TEMPLATES = [
  {
    value: 'SCREEN_ACCOMMODATION_FULL',
    label: 'Image plein écran',
    icon: 'i-lucide-image',
    maxMedia: 1,
  },
  {
    value: 'SCREEN_ACCOMMODATION_SPLIT',
    label: 'Split 50/50',
    icon: 'i-lucide-panel-left',
    maxMedia: 1,
  },
  {
    value: 'SCREEN_ACCOMMODATION_TRYPTIQUE',
    label: 'Triptyque',
    icon: 'i-lucide-layout-grid',
    maxMedia: 3,
  },
  {
    value: 'SCREEN_ACCOMMODATION_CAROUSEL',
    label: 'Carousel',
    icon: 'i-lucide-gallery-horizontal',
    maxMedia: 5,
  },
  {
    value: 'SCREEN_ACCOMMODATION_OVERLAY',
    label: 'Image + overlay',
    icon: 'i-lucide-layers',
    maxMedia: 1,
  },
  {
    value: 'SCREEN_ACCOMMODATION_DUO',
    label: 'Duo',
    icon: 'i-lucide-columns-2',
    maxMedia: 2,
  },
] as const

export type DashboardScreenTemplate = (typeof DASHBOARD_SCREEN_TEMPLATES)[number]['value']

export const getDashboardScreenMediaLimit = (additionalType: string): number =>
  DASHBOARD_SCREEN_TEMPLATES.find((template) => template.value === additionalType)?.maxMedia ?? 1

export type DashboardAccommodationMedia = {
  image: string
  imageUrl: string
  caption: string
  keywords: string[]
  representativeOfPage: boolean
}

export type DashboardAccommodationPreview = {
  identifier: string
  slug: string
  title: string
  description: string
  price: number | null
  priceCurrency: string
  priceSpecification: string
  placeSlug: string
  placeLabel: string
  categorySlug: string
  categoryLabel: string
  listingSlug: string
  listingLabel: string
  isActive: boolean
  floorSize: string | null
  landArea: string | null
  numberOfRooms: number | null
  numberOfBedrooms: number | null
  numberOfBathroomsTotal: number | null
  primaryImageUrl: string
  media: DashboardAccommodationMedia[]
}

export type DashboardAccommodation = {
  locale: string
  fileName: string
  slug: string
  identifier: string
  frontmatter: DashboardEditableRecord
  body: string
  preview: DashboardAccommodationPreview
}

export type DashboardAccommodationResolvedCategoryCodes = {
  category: string | null
  realEstateListing: string | null
  place: string | null
  amenityFeature: string[]
  tags: string[]
}

export type DashboardAccommodationSavePayload = DashboardAccommodation & {
  translations?: DashboardAccommodationTranslationPayload[]
  resolvedCategoryCodes?: DashboardAccommodationResolvedCategoryCodes
}

export type DashboardAccommodationTranslationsResponse = {
  translations: DashboardAccommodationTranslationPayload[]
}

export type DashboardFilterOption = {
  value: string
  label: string
  count: number
}

export type DashboardAccommodationFilters = {
  listings: DashboardFilterOption[]
  categories: DashboardFilterOption[]
  places: DashboardFilterOption[]
}

export type DashboardAccommodationsResponse = {
  items: DashboardAccommodation[]
  filters: DashboardAccommodationFilters
}

export type LocaleMarkdownResult =
  | { locale: string; updated: true; filePath: string }
  | { locale: string; updated: false; reason: string }
