import type { AppNavigation } from '#shared/types/app'
import type { CreativeWork, MenuItem } from '#shared/types/content'
import type { WebPageDto } from '@schemas/dtos'
import type { Accommodation, CategoryCode, MediaObject, WebPage } from '@schemas/interfaces'

import { extractBodyComponents } from '@services/content/mdc'

import { isNonEmptyString } from '#shared/utils/guards'

/**
 * Mapper des pages éditoriales (`WebPageDto` -> `WebPage`).
 *
 * Rôle :
 * - homogénéiser les champs frontmatter/racine selon les sources de contenu
 * - résoudre les références de catégories, médias et liens de navigation
 * - reconstruire une arborescence `hasPart` stable à partir du body MDC
 *
 * Ce module est volontairement pur : aucune dépendance au runtime Vue/Pinia.
 */

/**
 * Représentation permissive d’un bloc MDC avant normalisation.
 */
type CreativeWorkDTO = Omit<CreativeWork, 'hasPart' | 'links'> & {
  links?: string[]
  hasPart?: CreativeWorkDTO[]
}

/**
 * Formes acceptées pour une image de page avant résolution dans le référentiel média.
 */
type WebPageImageReference = string | MediaObject
type UnknownRecord = Record<string, unknown>

/**
 * Sécurise l'accès au `body` afin que le mapper reste tolérant aux entrées partielles.
 *
 * @param page Page brute telle qu'elle sort du loader de contenu.
 * @returns Le corps Markdown exploitable, ou une chaîne vide si le champ est absent.
 */
const getBody = (page: WebPageDto): string => {
  return typeof page.body === 'string' ? page.body : ''
}

/**
 * Lit une valeur textuelle avec fallback explicite.
 *
 * @param value Valeur source.
 * @param fallback Valeur de repli si `value` n’est pas une chaîne.
 * @returns Chaîne normalisée.
 */
const getString = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback

/**
 * Vérifie qu’une valeur peut être traitée comme objet indexable.
 *
 * @param value Valeur à tester.
 * @returns `true` si la valeur est un objet non nul.
 */
const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null

/**
 * Récupère le frontmatter quand il est présent sur la page brute.
 *
 * @param page DTO de page potentiellement hétérogène selon le loader.
 * @returns Objet frontmatter normalisé ou objet vide.
 */
const getFrontmatter = (page: WebPageDto): UnknownRecord => {
  const candidate = (page as WebPageDto & { frontmatter?: unknown }).frontmatter
  return isRecord(candidate) ? candidate : {}
}

/**
 * Lit un champ de page avec fallback explicite sur le frontmatter.
 *
 * La priorité est donnée au champ racine pour préserver la compatibilité
 * avec les pages déjà aplaties au chargement.
 *
 * @param page DTO source.
 * @param key Clé recherchée.
 * @returns Valeur trouvée au niveau racine ou dans le frontmatter.
 */
const getWebPageField = (page: WebPageDto, key: string): unknown => {
  const topLevelValue = (page as UnknownRecord)[key]
  if (typeof topLevelValue !== 'undefined') {
    return topLevelValue
  }

  return getFrontmatter(page)[key]
}

/**
 * Construit des `CreativeWork` à partir des blocs déclarés dans le `body`.
 *
 * L'objectif n'est pas de reproduire tout le runtime MDC, mais de projeter un
 * sous-ensemble stable et synchrone vers `hasPart` pour les besoins du store.
 * Lorsque le contenu ne fournit pas explicitement `identifier`, on retombe sur
 * le nom du bloc afin de conserver une clé d'adressage fiable.
 *
 * @param page Page brute contenant éventuellement un `body` Markdown/MDC.
 * @returns Liste de composants normalisés, consommables via `hasPart`.
 */
const getComponents = (page: WebPageDto): CreativeWorkDTO[] => {
  return extractBodyComponents(getBody(page)).map((component) => {
    const props = component.props
    const identifier = typeof props.identifier === 'string' ? props.identifier : component.tag
    const rawProps = props as CreativeWorkDTO

    return {
      ...rawProps,
      hasPart: rawProps.hasPart,
      links: rawProps.links,
      identifier,
    }
  })
}

/**
 * Extrait un identifiant image depuis les formats supportés (string ou objet).
 *
 * @param image Valeur image brute issue du DTO ou d’un bloc MDC.
 * @returns Identifiant image exploitable, sinon `undefined`.
 */
const getImageIdentifier = (
  image: CreativeWork['image'] | WebPageImageReference,
): string | undefined => {
  if (isNonEmptyString(image)) {
    return image
  }

  if (
    image &&
    typeof image === 'object' &&
    'identifier' in image &&
    isNonEmptyString(image.identifier)
  ) {
    return image.identifier
  }

  return undefined
}

/**
 * Résout un média depuis son identifiant dans le référentiel des médias.
 *
 * @param identifier Identifiant image à retrouver.
 * @param mediaObjects Référentiel média courant.
 * @returns Objet média complet ou `undefined` si absent.
 */
const resolveMediaObject = (
  identifier: string | undefined,
  mediaObjects: MediaObject[],
): MediaObject | undefined => {
  if (!isNonEmptyString(identifier)) {
    return undefined
  }

  return mediaObjects.find((item) => item.identifier === identifier)
}

/**
 * Détermine si une valeur image est déjà un objet média.
 *
 * @param value Valeur image à tester.
 * @returns `true` si la valeur est un objet, sinon `false`.
 */
const isMediaObject = (value: WebPageImageReference | undefined): value is MediaObject => {
  return Boolean(value) && typeof value === 'object'
}

/**
 * Résout un code catégorie à partir de sa clé fonctionnelle.
 *
 * @param value Clé `codeValue` attendue.
 * @param categoryCodes Référentiel des catégories disponibles.
 * @returns Catégorie correspondante ou `undefined`.
 */
const resolveCategoryCode = (
  value: string | undefined,
  categoryCodes: CategoryCode[],
): CategoryCode | undefined => {
  if (!isNonEmptyString(value)) {
    return undefined
  }

  return categoryCodes.find((item) => item.codeValue === value)
}

/**
 * Construit un média de secours quand un identifiant n'est pas résolu.
 *
 * @param identifier Identifiant média brut.
 * @returns Objet `MediaObject` minimal garantissant la stabilité du contrat.
 */
const createFallbackMediaObject = (identifier: string): MediaObject => ({
  identifier,
  caption: '',
  url: identifier,
  mainEntity: 'ImageObject',
})

/**
 * Normalise la liste des images d’une page en objets `MediaObject`.
 *
 * Stratégie :
 * - résolution par identifiant dans le référentiel
 * - conservation de l’objet média s’il est déjà fourni
 * - fallback minimal lorsqu’un identifiant est présent mais non résolu
 *
 * @param images Champ image brut du DTO.
 * @param mediaObjects Référentiel média.
 * @returns Liste d’objets média prête à exposer dans `WebPage.associatedMedia`.
 */
const mapImages = (
  images: WebPageDto['associatedMedia'],
  mediaObjects: MediaObject[],
): WebPage['associatedMedia'] => {
  if (!Array.isArray(images)) {
    return []
  }

  const resolvedImages = images
    .map((image) => {
      const ref = image as unknown as WebPageImageReference
      const imageIdentifier = getImageIdentifier(ref)
      return (
        resolveMediaObject(imageIdentifier, mediaObjects) ??
        (isMediaObject(ref)
          ? ref
          : isNonEmptyString(imageIdentifier)
            ? createFallbackMediaObject(imageIdentifier)
            : undefined)
      )
    })
    .filter((image): image is MediaObject => typeof image !== 'undefined')

  return resolvedImages
}

/**
 * Résout la section éditoriale principale d’une page.
 *
 * @param value Valeur brute du champ `articleSection`.
 * @param categoryCodes Référentiel catégorie.
 * @returns Catégorie résolue ou objet fallback basé sur la valeur brute.
 */
const mapCategory = (value: unknown, categoryCodes: CategoryCode[]): WebPage['articleSection'] => {
  if (isNonEmptyString(value)) {
    return resolveCategoryCode(value, categoryCodes) ?? { id: {}, codeValue: value, name: value }
  }

  return undefined
}

/**
 * Résout la liste de mots-clés d’une page en `CategoryCode`.
 *
 * @param value Valeur brute du champ `keywords`.
 * @param categoryCodes Référentiel catégorie.
 * @returns Liste normalisée des catégories-clés ou `undefined`.
 */
const mapCategoryList = (value: unknown, categoryCodes: CategoryCode[]): WebPage['keywords'] => {
  if (!Array.isArray(value)) {
    return undefined
  }

  return value
    .map((entry): CategoryCode | undefined => {
      if (isNonEmptyString(entry)) {
        return (
          resolveCategoryCode(entry, categoryCodes) ?? { id: {}, codeValue: entry, name: entry }
        )
      }

      return undefined
    })
    .filter((entry): entry is CategoryCode => typeof entry !== 'undefined')
}

/**
 * Enrichit l’image d’un bloc `CreativeWork` depuis le référentiel média.
 *
 * @param part Bloc source.
 * @param mediaObjects Référentiel média.
 * @returns Bloc conservant sa structure et son image résolue si possible.
 */
const enrichCreativeWorkImage = (
  part: CreativeWorkDTO,
  mediaObjects: MediaObject[],
): CreativeWorkDTO => {
  const imageIdentifier = getImageIdentifier(part.image as CreativeWork['image'])
  const resolvedImage = resolveMediaObject(imageIdentifier, mediaObjects)

  return {
    ...part,
    image: resolvedImage ?? part.image,
  }
}

/**
 * Résout les identifiants de liens d’un bloc vers les items de navigation.
 *
 * @param part Bloc source contenant éventuellement `links`.
 * @param navigation Navigation indexée par identifiant.
 * @returns Liste de `MenuItem` valides (les identifiants inconnus sont ignorés).
 */
const resolveCreativeWorkLinks = (part: CreativeWorkDTO, navigation: AppNavigation): MenuItem[] => {
  if (!Array.isArray(part.links)) {
    return []
  }

  return part.links
    .map((identifier): MenuItem | undefined => {
      const item = navigation[identifier]
      if (!item) return undefined
      return { ...item, identifier }
    })
    .filter((item): item is MenuItem => item !== undefined)
}

/**
 * Résout l’URL d’un bloc à partir de la navigation quand la valeur est une clé.
 *
 * @param value URL ou identifiant de navigation.
 * @param navigation Navigation indexée.
 * @returns URL finale du bloc.
 */
const resolveComponentUrl = (
  value: CreativeWorkDTO['url'],
  navigation: AppNavigation,
): CreativeWork['url'] => {
  if (!isNonEmptyString(value)) {
    return value as string | undefined
  }

  return navigation[value]?.url ?? value
}

/**
 * Résout récursivement les sous-blocs `hasPart`.
 *
 * @param hasPart Liste de sous-blocs bruts.
 * @param mediaObjects Référentiel média.
 * @param navigation Navigation indexée.
 * @returns Arborescence `hasPart` normalisée.
 */
const resolveHasPart = (
  hasPart: CreativeWorkDTO['hasPart'],
  mediaObjects: MediaObject[],
  navigation: AppNavigation,
): CreativeWork['hasPart'] => {
  if (!Array.isArray(hasPart)) {
    return undefined
  }

  return hasPart.map((child) => mapComponent(child, mediaObjects, navigation))
}

/**
 * Mappe un bloc `CreativeWork` unitaire vers son contrat final.
 *
 * @param part Bloc brut extrait du contenu.
 * @param mediaObjects Référentiel média.
 * @param navigation Navigation indexée.
 * @returns Bloc normalisé, liens et sous-parties résolus.
 */
const mapComponent = (
  part: CreativeWorkDTO,
  mediaObjects: MediaObject[],
  navigation: AppNavigation,
): CreativeWork => {
  const enrichedPart = enrichCreativeWorkImage(part, mediaObjects)

  return {
    ...enrichedPart,
    hasPart: resolveHasPart(enrichedPart.hasPart, mediaObjects, navigation),
    links: resolveCreativeWorkLinks(enrichedPart, navigation),
    url: resolveComponentUrl(enrichedPart.url, navigation),
  }
}

/**
 * Mappe une page brute vers le contrat `WebPage` consommé côté app.
 *
 * @param page DTO source.
 * @param mediaObjects Référentiel média.
 * @param categoryCodes Référentiel catégorie.
 * @param navigation Navigation indexée.
 * @returns Page normalisée, avec composants et relations résolus.
 */
const mapWebPage = (
  page: WebPageDto,
  mediaObjects: MediaObject[],
  categoryCodes: CategoryCode[],
  navigation: AppNavigation,
): WebPage => {
  // Les composants sont reconstruits depuis le body MDC afin de fournir
  // une structure `hasPart` exploitable uniformément par les écrans.
  const components = getComponents(page)
  const slug = getString(getWebPageField(page, 'slug'))
  const headline = getString(getWebPageField(page, 'headline'))
  const metaTitle = getString(getWebPageField(page, 'metaTitle'), headline)

  return {
    slug,
    headline: headline || metaTitle,
    alternativeHeadline: getWebPageField(
      page,
      'alternativeHeadline',
    ) as WebPage['alternativeHeadline'],
    abstract: getWebPageField(page, 'highlight') as WebPage['abstract'],
    datePublished: getString(getWebPageField(page, 'datePublished')),
    dateCreated: getString(getWebPageField(page, 'dateCreated')),
    dateModified: getString(getWebPageField(page, 'dateModified')),
    articleSection: mapCategory(getWebPageField(page, 'articleSection'), categoryCodes),
    keywords: mapCategoryList(getWebPageField(page, 'keywords'), categoryCodes),
    associatedMedia: mapImages(
      getWebPageField(page, 'associatedMedia') as WebPageDto['associatedMedia'],
      mediaObjects,
    ),
    inLanguage: getWebPageField(page, 'inLanguage') as WebPage['inLanguage'],
    metaTitle,
    metaDescription: getString(getWebPageField(page, 'metaDescription')),
    body: getBody(page),
    text: getBody(page),
    hasPart: components.map((part) => mapComponent(part, mediaObjects, navigation)),
  }
}

/**
 * Transforme les DTO de pages en `WebPage` prêtes à être consommées par le store.
 *
 * Comportement :
 * - conserve les champs éditoriaux portés par `WebPageDto`
 * - résout `articleSection` et `keywords` vers des `CategoryCode`
 * - mappe les identifiants médias du frontmatter vers des `MediaObject`
 * - reconstruit `hasPart` à partir du `body` Markdown/MDC
 * - résout les liens de navigation référencés dans les blocs de contenu
 *
 * @param pages Liste brute provenant du loader de contenu.
 * @param categoryCodes Référentiel de catégories servant à résoudre les slugs du contenu.
 * @param mediaObjects Référentiel média servant à résoudre les UUID du contenu.
 * @param navigation Navigation applicative indexée par identifiant.
 * @returns Liste de pages prêtes à être exposées par les getters du store.
 *
 * @example
 * const pages = mapWebPages(state.list)
 * const home = pages.find((page) => page.slug === 'accueil')
 */
export const mapWebPages = (
  pages: WebPageDto[],
  categoryCodes: CategoryCode[] = [],
  mediaObjects: MediaObject[] = [],
  navigation: AppNavigation = {},
): WebPage[] => {
  return pages.map((page) => mapWebPage(page, mediaObjects, categoryCodes, navigation))
}

export const accommodationToWebPage = (item: Accommodation): WebPage => {
  const metaTitle = item.metaTitle || `${item.name} à Essaouira – Showcase Immobilier`
  const metaDescription = item.metaDescription || item.highlight || ''
  const now = new Date().toISOString()

  return {
    slug: item.slug,
    headline: item.name,
    alternativeHeadline: item.highlight,
    abstract: item.highlight,
    text: item.body || '',
    body: item.body || '',

    metaTitle,
    metaDescription,

    datePublished: item.dateCreated || now,
    dateCreated: item.dateCreated || now,
    dateModified: item.dateModified || item.dateCreated || now,

    inLanguage: 'fr',

    articleSection: item.category
      ? {
          id: {},
          codeValue: item.category.slug,
          name: item.category.name,
        }
      : undefined,

    keywords: item.tags,

    associatedMedia: item.associatedMedia.map((media) => media.image),

    hasPart: [],
  }
}
