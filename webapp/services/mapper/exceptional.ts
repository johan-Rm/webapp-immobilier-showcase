import type {
  ExceptionalMedia,
  ExceptionalPropertyBadge,
  ExceptionalPropertySummary,
  ExceptionalScreen,
  ExceptionalScreenLayout,
  ExceptionalScreenTemplate,
} from '#shared/types/exceptional'
import type { Accommodation } from '@schemas/interfaces'

import { DASHBOARD_CONTACT_SCREEN } from '#shared/types/dashboardAccommodation'

/**
 * Mapper view-model du parcours immersif d'un bien d'exception.
 *
 * Dérive `Accommodation.hasPart` (blocs éditoriaux content-driven) en écrans
 * prêts pour le rendu (`ExceptionalScreen`), la synthèse fixe et les badges.
 *
 * Module pur : aucune dépendance Vue/Nuxt/Pinia. Distinct du mapper
 * d'ingestion `accommodation.ts` (qui, lui, normalise le DTO en domaine et
 * laisse `hasPart` traverser tel quel).
 */

type UnknownRecord = Record<string, unknown>

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const asRecord = (value: unknown): UnknownRecord => (isRecord(value) ? value : {})

const readString = (value: unknown): string => (typeof value === 'string' ? value.trim() : '')

const readNumber = (value: unknown): number | null => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

/**
 * Mapping type de screen (contrat partagé `hasPart`) → template visuel interne.
 * Le template `CONTACT` n'y figure pas : l'écran de contact n'est pas stocké
 * dans `hasPart`, il est ajouté en fin de parcours par `deriveExceptionalScreens`.
 */
const ADDITIONAL_TYPE_TO_TEMPLATE: Readonly<Record<string, ExceptionalScreenTemplate>> = {
  SCREEN_ACCOMMODATION_FULL: 'SCREEN_03',
  SCREEN_ACCOMMODATION_SPLIT: 'SCREEN_04',
  SCREEN_ACCOMMODATION_TRYPTIQUE: 'SCREEN_01',
  SCREEN_ACCOMMODATION_CAROUSEL: 'SCREEN_05',
  SCREEN_ACCOMMODATION_OVERLAY: 'SCREEN_02',
  SCREEN_ACCOMMODATION_DUO: 'SCREEN_06',
}

const FALLBACK_TEMPLATE: ExceptionalScreenTemplate = 'SCREEN_03'

/** Résolution template configurable → layout de rendu interne. */
const SCREEN_TEMPLATE_LAYOUTS: Readonly<
  Record<ExceptionalScreenTemplate, ExceptionalScreenLayout>
> = {
  SCREEN_01: 'triptych',
  SCREEN_02: 'full-overlay',
  SCREEN_03: 'full',
  SCREEN_04: 'split',
  SCREEN_05: 'carousel',
  SCREEN_06: 'duo',
  CONTACT: 'contact',
}

export const resolveExceptionalLayout = (
  template: ExceptionalScreenTemplate,
): ExceptionalScreenLayout => SCREEN_TEMPLATE_LAYOUTS[template]

/**
 * `headline` encode un éventuel mot accentué via le marqueur Markdown `**...**`.
 * On en dérive le couple (title, titleHighlight) attendu par le rendu.
 */
const parseHeadline = (headline: string): { title: string; titleHighlight?: string } => {
  const match = headline.match(/\*\*(.+?)\*\*/)
  const title = headline.replace(/\*\*(.+?)\*\*/g, '$1')
  return match?.[1] ? { title, titleHighlight: match[1] } : { title }
}

const slugify = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

const toMedia = (value: unknown): ExceptionalMedia | null => {
  const record = asRecord(value)
  const src = readString(record.url)
  return src ? { src, alt: readString(record.caption) } : null
}

const readTemplate = (part: UnknownRecord): ExceptionalScreenTemplate =>
  ADDITIONAL_TYPE_TO_TEMPLATE[readString(part.additionalType)] ?? FALLBACK_TEMPLATE

const readMedia = (part: UnknownRecord): ExceptionalMedia[] =>
  (Array.isArray(part.associatedMedia) ? part.associatedMedia : [])
    .map(toMedia)
    .filter((entry): entry is ExceptionalMedia => entry !== null)

/** Blocs `hasPart` triés par position. */
const sortedParts = (item: Accommodation | undefined): UnknownRecord[] =>
  (Array.isArray(item?.hasPart) ? item.hasPart : [])
    .map((part): UnknownRecord => asRecord(part))
    .sort((left, right) => (readNumber(left.position) ?? 0) - (readNumber(right.position) ?? 0))

/**
 * Écran de contact figé qui clôt tout parcours. Hors `hasPart` (donnée
 * éditoriale) : construit une fois depuis le contenu partagé `DASHBOARD_CONTACT_SCREEN`.
 */
const CONTACT_SCREEN: ExceptionalScreen = (() => {
  const { title, titleHighlight } = parseHeadline(DASHBOARD_CONTACT_SCREEN.headline)
  return {
    id: 'contact',
    label: DASHBOARD_CONTACT_SCREEN.name.toLowerCase(),
    template: 'CONTACT',
    eyebrow: DASHBOARD_CONTACT_SCREEN.name,
    title,
    ...(titleHighlight ? { titleHighlight } : {}),
    text: DASHBOARD_CONTACT_SCREEN.text,
    media: [],
  }
})()

/**
 * Convertit les blocs `hasPart` du bien en écrans internes du parcours, puis
 * ajoute systématiquement l'écran de contact figé en clôture.
 */
export const deriveExceptionalScreens = (item: Accommodation | undefined): ExceptionalScreen[] => [
  ...sortedParts(item).map((part, index): ExceptionalScreen => {
    const template = readTemplate(part)
    const eyebrow = readString(part.name)
    const { title, titleHighlight } = parseHeadline(readString(part.headline))
    const meta = asRecord(part.meta)
    const overlayMode =
      meta.overlayMode === 'light' || meta.overlayMode === 'dark' ? meta.overlayMode : undefined
    const imageOverlay =
      meta.imageOverlay === 'none' || meta.imageOverlay === 'light' || meta.imageOverlay === 'dark'
        ? meta.imageOverlay
        : 'dark'

    return {
      id: slugify(eyebrow) || `screen-${index + 1}`,
      label: eyebrow.toLowerCase(),
      template,
      eyebrow,
      title,
      ...(titleHighlight ? { titleHighlight } : {}),
      text: readString(part.text),
      media: readMedia(part),
      ...(typeof meta.reverse === 'boolean' ? { reverse: meta.reverse } : {}),
      ...(overlayMode ? { overlayMode } : {}),
      imageOverlay,
    }
  }),
  CONTACT_SCREEN,
]

/** Prix affiché dans la synthèse fixe, formaté depuis l'offre du bien. */
export const formatExceptionalPrice = (item: Accommodation | undefined): string => {
  const offer = asRecord(item?.offer)
  const price = readNumber(offer.price)
  if (price === null) return readString(offer.priceSpecification) || '—'
  return `${new Intl.NumberFormat('fr-FR').format(price)} DH`
}

/** Synthèse fixe du bien dérivée des champs de la fiche. */
export const deriveExceptionalSummary = (
  item: Accommodation | undefined,
  screens: readonly ExceptionalScreen[],
): ExceptionalPropertySummary => {
  const place = asRecord(item?.place)
  const firstMedia = screens.flatMap((screen) => screen.media)[0]?.src ?? ''
  return {
    name: readString(item?.name) || 'Villa des Alizés',
    location: readString(place.name) || 'Essaouira, Maroc',
    reference: readString(item?.slug) || 'villa-des-alizes',
    price: formatExceptionalPrice(item),
    contactImage: firstMedia,
  }
}

/**
 * Badges de la synthèse fixe : surface, pièces, chambres, salles de bains.
 * `full` = libellé complet (drawer + desktop) ; `short` = diminutif compact (mobile).
 */
export const deriveExceptionalBadges = (
  item: Accommodation | undefined,
): ExceptionalPropertyBadge[] => {
  const record = asRecord(item)
  const badges: ExceptionalPropertyBadge[] = []
  const surface = readNumber(record.floorSize)
  const rooms = readNumber(record.numberOfRooms)
  const bedrooms = readNumber(record.numberOfBedrooms)
  const bathrooms = readNumber(record.numberOfBathroomsTotal)
  if (surface !== null) badges.push({ full: `${surface} m²`, short: `${surface} m²` })
  if (rooms !== null) badges.push({ full: `${rooms} pièces`, short: `${rooms} p.` })
  if (bedrooms !== null) badges.push({ full: `${bedrooms} chambres`, short: `${bedrooms} ch.` })
  if (bathrooms !== null) {
    badges.push({ full: `${bathrooms} salles de bains`, short: `${bathrooms} sdb` })
  }
  return badges
}

/**
 * Garde d'activation du parcours immersif : vrai si le bien expose au moins un
 * écran d'espace (hors Contact) avec un `additionalType` reconnu et au moins un
 * média. Sinon faux → la page retombe sur la fiche détail classique.
 */
export const isExceptionalProperty = (item: Accommodation | undefined): boolean =>
  sortedParts(item).some((part) => {
    const additionalType = readString(part.additionalType)
    const template = ADDITIONAL_TYPE_TO_TEMPLATE[additionalType]
    return Boolean(template) && template !== 'CONTACT' && readMedia(part).length > 0
  })
