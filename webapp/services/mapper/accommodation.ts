import type {
  Accommodation,
  AccommodationCategory,
  AccommodationComponent,
  AccommodationMedia,
  AccommodationPlace,
  CategoryCode,
  MediaObject,
  RealEstateListing,
} from '@schemas/interfaces'

/**
 * Mapper de normalisation des biens immobiliers.
 *
 * Objectif :
 * - accepter des entrées hétérogènes (slugs, objets partiels, champs optionnels)
 * - résoudre les références via des index en mémoire (catégories, lieux, médias)
 * - produire un contrat `Accommodation` stable pour les stores et l'UI
 *
 * Le module ne réalise aucun accès I/O : il applique uniquement des transformations pures.
 */

/**
 * Collections référentielles passées au mapper pour enrichir les relations d'un bien.
 */
export type AccommodationMetadata = {
  categoryCodes?: CategoryCode[]
  categories?: AccommodationCategory[]
  places?: AccommodationPlace[]
  listings?: RealEstateListing[]
  images?: MediaObject[]
}

/**
 * Index internes calculés une seule fois pour éviter des recherches linéaires répétées.
 */
type AccommodationMetadataIndexes = {
  categoryCodes: Map<string, CategoryCode>
  categories: Map<string, AccommodationCategory>
  places: Map<string, AccommodationPlace>
  listings: Map<string, RealEstateListing>
  images: Map<string, MediaObject>
}

type UnknownRecord = Record<string, unknown>
type AccommodationMediaWithRepresentativeFlag = AccommodationMedia & {
  representativeOfPage?: boolean
}

const IMAGE_EXTENSION_REGEX = /\.(avif|webp|png|jpe?g|gif|svg)(?:[?#].*)?$/i

/**
 * Détecte si la valeur peut être traitée comme un objet simple.
 *
 * @param value Valeur à vérifier.
 * @returns `true` si la valeur est un objet non nul, sinon `false`.
 */
const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null

/**
 * Lit une valeur textuelle avec fallback.
 *
 * @param value Valeur source.
 * @param fallback Valeur de secours lorsque `value` n'est pas une chaîne.
 * @returns Chaîne validée ou fallback.
 */
const getString = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback

const isDirectImageUrl = (value: string): boolean => {
  if (value.startsWith('/images/')) return true
  if (value.startsWith('/_ipx/')) return true
  if (value.startsWith('http://') || value.startsWith('https://')) return true
  if (value.startsWith('/')) return IMAGE_EXTENSION_REGEX.test(value)
  return IMAGE_EXTENSION_REGEX.test(value)
}

/**
 * Normalise une liste de chaînes en supprimant les valeurs vides/non textuelles.
 *
 * @param value Valeur source potentiellement non typée.
 * @returns Tableau de chaînes filtrées, ou `undefined` si aucune valeur exploitable.
 */
const getStringArray = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) return undefined
  const items = value.filter((item): item is string => typeof item === 'string' && item.length > 0)
  return items.length ? items : undefined
}

/**
 * Transforme un enregistrement brut en objet `CategoryCode` tolérant plusieurs formats.
 *
 * @param value Source contenant `codeValue`, `slug` et/ou `name`.
 * @returns Instance `CategoryCode` construite à partir des champs disponibles.
 */
const toCategoryCode = (value: UnknownRecord): CategoryCode => ({
  id: isRecord(value.id) ? value.id : {},
  codeValue: getString(value.codeValue, getString(value.slug)),
  name: getString(value.name, getString(value.codeValue, getString(value.slug))),
})

/**
 * Crée un objet `AccommodationPlace` à partir d’un record partiel.
 *
 * @param value Données brutes contenant un slug et/ou un nom.
 * @returns Instance minimale de `AccommodationPlace` réutilisable dans les index.
 */
const toAccommodationPlace = (value: UnknownRecord): AccommodationPlace => ({
  slug: getString(value.codeValue, getString(value.slug, getString(value.name))),
  name: getString(value.name, getString(value.codeValue, getString(value.slug))),
})

const getRealEstateListingIsEnabled = (value: UnknownRecord): boolean | undefined => {
  if (isRecord(value.metadata) && typeof value.metadata.isEnabled === 'boolean') {
    return value.metadata.isEnabled
  }

  return typeof value.isEnabled === 'boolean' ? value.isEnabled : undefined
}

/**
 * Crée un objet `RealEstateListing` compact à partir d’une source générique.
 *
 * @param value Données brutes pouvant être un slug ou un objet complet.
 * @returns Objet `RealEstateListing` contenant les champs clés.
 */
const toRealEstateListing = (value: UnknownRecord): RealEstateListing => {
  const isEnabled = getRealEstateListingIsEnabled(value)

  return {
    slug: getString(value.codeValue, getString(value.slug, getString(value.name))),
    name: getString(value.name, getString(value.codeValue, getString(value.slug))),
    ...(typeof value.text === 'string' ? { text: value.text } : {}),
    ...(typeof isEnabled === 'boolean' ? { isEnabled } : {}),
  }
}

/**
 * Normalise le bloc `offer` pour garantir un contrat stable côté UI.
 *
 * La fonction force notamment :
 * - un `price` sérialisé en string (quelle que soit la source)
 * - une devise par défaut (`EUR`) lorsque l'information est absente
 *
 * @param value Valeur brute issue du contenu.
 * @returns Offre homogène compatible avec le contrat `Accommodation`.
 */
const mapOffer = (value: unknown): Accommodation['offer'] => {
  if (!isRecord(value)) {
    return { price: '', priceCurrency: 'EUR' }
  }

  const rawPrice = value.price
  const price = typeof rawPrice === 'number' ? String(rawPrice) : getString(rawPrice)

  const priceSpecification = getString(value.priceSpecification)

  return {
    price,
    priceCurrency: getString(value.priceCurrency, 'EUR'),
    ...(priceSpecification ? { priceSpecification } : {}),
  }
}

/**
 * Indexe une collection à l’aide d’une clé optionnelle afin de permettre un lookup rapide.
 *
 * @param items Collection à indexer.
 * @param getKey Fonction qui retourne la clé unique pour chaque élément.
 * @returns Map des éléments indexés par leur clé.
 */
const buildIndex = <T>(
  items: readonly T[],
  getKey: (item: T) => string | undefined,
): Map<string, T> => {
  const index = new Map<string, T>()
  for (const item of items) {
    const key = getKey(item)
    if (key) {
      index.set(key, item)
    }
  }
  return index
}

/**
 * Génère tous les index utiles à partir des métadonnées et facilite la résolution des relations.
 *
 * @param metadata Métadonnées contenant les listes référentielles (catégories, lieux, médias, etc.).
 * @returns Objet contenant les Maps prêtes à être utilisées par les mappers.
 */
const buildIndexes = (metadata: AccommodationMetadata): AccommodationMetadataIndexes => ({
  categoryCodes: buildIndex(metadata.categoryCodes ?? [], (item) => item.codeValue),
  categories: buildIndex(metadata.categories ?? [], (item) => item.slug),
  places: buildIndex(metadata.places ?? [], (item) => item.slug),
  listings: buildIndex(metadata.listings ?? [], (item) => item.slug),
  images: buildIndex(metadata.images ?? [], (item) => item.identifier),
})

const normalizeMediaObject = (value: MediaObject): MediaObject => {
  const record = value as unknown as UnknownRecord
  const url = getString(record.url, getString(record.contentUrl))
  return { ...value, url }
}

/**
 * Résout un champ `category` en transformant un slug en objet enrichi ou vice-versa.
 *
 * @param value Chaîne ou objet brut représentant une catégorie.
 * @param indexes Index pré-calculés pour retrouver les objets complets.
 * @returns `AccommodationCategory` enrichi ou `undefined` si rien n’est trouvé.
 */
const mapCategory = (
  value: unknown,
  indexes: AccommodationMetadataIndexes,
): Accommodation['category'] => {
  if (typeof value !== 'string') {
    if (!isRecord(value)) {
      return { slug: '', name: '' }
    }

    return {
      slug: getString(value.codeValue, getString(value.slug)),
      name: getString(value.name, getString(value.codeValue, getString(value.slug))),
    }
  }

  const category = indexes.categories.get(value)
  if (category) {
    return {
      slug: category.slug,
      name: category.name,
    }
  }

  const categoryCode = indexes.categoryCodes.get(value)

  return {
    slug: categoryCode?.codeValue ?? value,
    name: categoryCode?.name ?? value,
  }
}

/**
 * Transforme une liste de catégories slugs/objets en objets `CategoryCode` validés.
 *
 * @param value Liste brute de slugs ou d’objets partiels.
 * @param indexes Index de références permettant de enrichir les slugs.
 * @returns Liste filtrée ne contenant que des `CategoryCode` ou des slugs valides.
 */
const mapCategoryList = (
  value: unknown,
  indexes: AccommodationMetadataIndexes,
): Accommodation['amenityFeature'] => {
  if (!Array.isArray(value)) return undefined
  return value
    .map((entry): CategoryCode | undefined => {
      if (typeof entry === 'string') {
        return indexes.categoryCodes.get(entry) ?? { id: {}, codeValue: entry, name: entry }
      }
      if (isRecord(entry)) {
        return toCategoryCode(entry)
      }
      return undefined
    })
    .filter((entry): entry is CategoryCode => typeof entry !== 'undefined')
}

/**
 * Résout le lieu (`place`) à partir d’un slug ou d’un objet partiel.
 *
 * @param value Chaîne ou objet décrivant un lieu.
 * @param indexes Index des lieux disponibles.
 * @returns `AccommodationPlace`, slug ou `undefined`.
 */
const mapPlace = (
  value: unknown,
  indexes: AccommodationMetadataIndexes,
): Accommodation['place'] => {
  if (typeof value !== 'string') {
    return isRecord(value) ? toAccommodationPlace(value) : { slug: '', name: '' }
  }
  return indexes.places.get(value) ?? { slug: value, name: value }
}

/**
 * Résout le champ `realEstateListing`, en supportant les slugs ou les objets.
 *
 * @param value Slug ou objet d’annonce immobilière.
 * @param indexes Index des annonces disponibles.
 * @returns `RealEstateListing` enrichi ou le slug original.
 */
const mapListing = (
  value: unknown,
  indexes: AccommodationMetadataIndexes,
): Accommodation['realEstateListing'] => {
  if (typeof value !== 'string') {
    return isRecord(value) ? toRealEstateListing(value) : { slug: '', name: '' }
  }
  return indexes.listings.get(value) ?? { slug: value, name: value }
}

/**
 * Résout une image brute vers un `MediaObject` homogène.
 *
 * @param value Identifiant, URL ou objet image brut.
 * @param indexes Index des objets `ImageObject`.
 * @returns `MediaObject` normalisé ou `undefined`.
 */
const mapMediaObject = (
  value: unknown,
  indexes: AccommodationMetadataIndexes,
): MediaObject | undefined => {
  if (typeof value === 'string') {
    if (!value.length) return undefined
    const image = indexes.images.get(value)
    if (image) return normalizeMediaObject(image)
    const url = isDirectImageUrl(value) ? value : ''
    return {
      identifier: value,
      caption: '',
      url,
      mainEntity: 'ImageObject',
    }
  }

  if (!isRecord(value)) return undefined

  const identifier = getString(value.identifier, getString(value.url, getString(value.name)))
  if (identifier) {
    const image = indexes.images.get(identifier)
    if (image) return normalizeMediaObject(image)
  }

  const rawUrl = getString(value.url)
  const url = isDirectImageUrl(rawUrl) ? rawUrl : ''
  const name = getString(value.name, identifier)
  const caption = getString(value.caption, name)
  const mainEntity = getString(value.mainEntity, 'ImageObject')

  if (!identifier && !url && !caption && !mainEntity) {
    return undefined
  }

  return {
    identifier,
    url,
    caption,
    mainEntity,
  }
}

/**
 * Transforme `associatedMedia` du DTO en galerie exploitable par l’UI.
 *
 * @param value Liste d’objets média DTO.
 * @param indexes Index des objets `ImageObject`.
 * @returns Liste de médias enrichis avec URL résolue.
 */
const mapAssociatedMedia = (
  value: unknown,
  indexes: AccommodationMetadataIndexes,
): Accommodation['associatedMedia'] => {
  if (!Array.isArray(value)) return []

  const mapped: Accommodation['associatedMedia'] = []

  for (const entry of value) {
    if (!isRecord(entry)) continue

    const media = mapMediaObject(entry.image, indexes)
    if (!media) continue

    // Contenu POC : un item de galerie peut porter un identifiant lisible (`image`)
    // ET une `url` directe ; on complète l'url quand l'identifiant ne résout pas un média.
    const directUrl = getString(entry.url)
    const url = media.url || (isDirectImageUrl(directUrl) ? directUrl : '')
    const resolved: MediaObject = url === media.url ? media : { ...media, url }

    const caption = getString(entry.caption, resolved.caption)
    const keywords = getStringArray(entry.keywords)
    const representativeOfPage =
      typeof entry.representativeOfPage === 'boolean' ? entry.representativeOfPage : undefined

    mapped.push({
      image: resolved,
      caption,
      keywords,
      ...(typeof representativeOfPage === 'boolean' ? { representativeOfPage } : {}),
    } satisfies AccommodationMediaWithRepresentativeFlag)
  }

  return mapped
}

/**
 * Indexe la galerie `associatedMedia` du bien par identifiant de média, afin que
 * les écrans (`hasPart`) puissent référencer une image par son seul identifiant
 * (modèle dashboard 032), sans dupliquer l'url. Seules les entrées résolues
 * (url non vide) sont indexées.
 */
const buildGalleryIndex = (media: Accommodation['associatedMedia']): Map<string, MediaObject> => {
  const index = new Map<string, MediaObject>()
  for (const item of media) {
    const identifier = item.image?.identifier
    if (identifier && item.image.url) {
      index.set(identifier, { ...item.image, caption: getString(item.caption, item.image.caption) })
    }
  }
  return index
}

/**
 * Résout les médias d'un screen (`hasPart`). Chaque entrée référence, par ordre
 * de priorité : un identifiant présent dans la galerie `associatedMedia` du bien
 * (modèle dashboard 032), sinon un identifiant d'image global, sinon une url
 * directe (contenu). Le résultat est un `MediaObject` avec url, afin que le mapper
 * du parcours immersif (`services/mapper/exceptional.ts`) lise des url prêtes à l'emploi.
 */
const mapScreenMedia = (
  value: unknown,
  indexes: AccommodationMetadataIndexes,
  galleryIndex?: Map<string, MediaObject>,
): MediaObject[] => {
  if (!Array.isArray(value)) return []

  const mapped: MediaObject[] = []
  for (const entry of value) {
    // L'entrée peut être un identifiant brut (modèle API `uuid[]` / liste plate de
    // filenames résolue par content-sync) ou un objet `{ image?, url?, caption? }`
    // (contenu POC / brouillon dashboard).
    const reference =
      typeof entry === 'string'
        ? entry
        : isRecord(entry) && typeof entry.image === 'string'
          ? entry.image
          : ''
    const directUrl = isRecord(entry) ? entry.url : undefined
    const fromGallery = reference ? galleryIndex?.get(reference) : undefined
    const media = fromGallery ?? mapMediaObject(reference || directUrl, indexes)
    if (!media?.url) continue
    const caption = isRecord(entry) ? getString(entry.caption, media.caption) : media.caption
    mapped.push({ ...media, caption })
  }
  return mapped
}

/**
 * Normalise les blocs `hasPart` (écrans du parcours) : conserve la structure et
 * résout les médias internes. `position`, `additionalType`, textes et `meta`
 * restent inchangés.
 */
const mapHasPart = (
  value: unknown,
  indexes: AccommodationMetadataIndexes,
  galleryIndex?: Map<string, MediaObject>,
): AccommodationComponent[] | undefined => {
  if (!Array.isArray(value)) return undefined
  return value.map((part): AccommodationComponent => {
    if (!isRecord(part)) return part as AccommodationComponent
    return {
      ...(part as unknown as AccommodationComponent),
      associatedMedia: mapScreenMedia(part.associatedMedia, indexes, galleryIndex),
    }
  })
}

/**
 * Applique tous les mappers sur un bien en utilisant les index déjà construits.
 *
 * @param item Bien qui sera enrichi par les références.
 * @param indexes Index partagés pour éviter de reconstruire les Maps à chaque appel.
 * @returns Bien transformé avec les relations résolues.
 */
const mapAccommodationWithIndexes = (
  item: Accommodation,
  indexes: AccommodationMetadataIndexes,
): Accommodation => {
  // Les loaders injectent parfois des structures partielles ; le record local
  // permet de lire ces variantes sans casser le contrat de sortie.
  const record = item as unknown as UnknownRecord

  // Galerie résolue d'abord : sert d'index pour les références d'image des écrans.
  const associatedMedia = mapAssociatedMedia(record.associatedMedia, indexes)
  const galleryIndex = buildGalleryIndex(associatedMedia)

  return {
    ...item,
    name: getString(record.name, getString(record.metaTitle, getString(record.slug))),
    body: getString(record.body, getString(record.description)),
    identifier: getString(record.identifier, getString(record.slug)),
    category: mapCategory(record.category, indexes),
    offer: mapOffer(record.offer),
    place: mapPlace(record.place, indexes),
    amenityFeature: mapCategoryList(record.amenityFeature, indexes),
    qualities: Array.isArray(record.qualities) ? record.qualities : undefined,
    associatedMedia,
    hasPart: mapHasPart(record.hasPart, indexes, galleryIndex),
    realEstateListing: mapListing(record.realEstateListing, indexes),
    isActive: typeof record.isActive === 'boolean' ? record.isActive : false,

    tags: mapCategoryList(record.tags, indexes),
    metaTitle: getString(record.metaTitle, getString(record.name, getString(record.slug))),
    metaDescription: getString(record.metaDescription, getString(record.description)),
    slug: getString(record.slug, getString(record.identifier)),
  }
}

/**
 * Enrichit un bien avec les collections référentielles (catégories, listings,
 * images) afin de transformer les slugs en objets complets et
 * d’unifier les champs métier utilisés dans l’UI.
 *
 * @param item Bien brut provenant d’un CMS ou d’un loader.
 * @param metadata Collections de référence servant d’index pour le mapping.
 * @returns Une version du bien dont les relations sont résolues.
 */
export const mapAccommodation = (
  item: Accommodation,
  metadata: AccommodationMetadata = {},
): Accommodation => {
  // Cas unitaire : index construits à la volée pour garder une API simple
  // lorsque le mapper est utilisé hors pipeline liste.
  const indexes = buildIndexes(metadata)
  return mapAccommodationWithIndexes(item, indexes)
}

/**
 * Applique `mapAccommodation` sur chaque élément d’une liste, en réutilisant
 * les mêmes métadonnées pour les index.
 *
 * @param items Liste de biens à transformer.
 * @param metadata Métadonnées partagées (categories, listings, etc.).
 * @returns Liste de biens enrichis.
 */
export const mapAccommodations = (
  items: Accommodation[],
  metadata: AccommodationMetadata = {},
): Accommodation[] => {
  const list = Array.isArray(items) ? items : []
  if (!list.length) return []
  // Cas liste : mutualisation des index pour réduire le coût CPU
  // lorsque de nombreux biens partagent les mêmes référentiels.
  const indexes = buildIndexes(metadata)
  return list.map((item) => mapAccommodationWithIndexes(item, indexes))
}
