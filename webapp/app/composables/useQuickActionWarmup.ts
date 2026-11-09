import type { Accommodation, WebPage } from '@schemas/interfaces'

type PropertyListItemLike = {
  image?: string
}

type QuickActionWarmupItem = {
  external?: boolean
  id: string
  to: string
}

type RouteLandingImageKind = 'page-hero' | 'property-list-hero' | 'gallery'

type RouteLandingImageDescriptor = {
  kind: RouteLandingImageKind
  src: string
}

const normalizeSlug = (value: string): string => value.trim().toLowerCase()

const normalizePath = (value: string): string => {
  const trimmed = value.trim()
  if (!trimmed) return '/'

  let pathname = trimmed

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      pathname = new URL(trimmed).pathname
    } catch {
      pathname = trimmed
    }
  }

  const [pathWithoutHash] = pathname.split('#')
  const pathWithoutQuery = (pathWithoutHash ?? pathname).split('?')[0] ?? ''
  const normalized = pathWithoutQuery.startsWith('/') ? pathWithoutQuery : `/${pathWithoutQuery}`

  return normalized.replace(/^\/[a-z]{2}(?=\/|$)/i, '') || '/'
}

const isLocalizedPath = (value: string): boolean => /^\/[a-z]{2}(?=\/|$)/i.test(value)

const getStringUrl = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

const getResolvedImageUrl = (value: unknown): string | undefined => {
  const directUrl = getStringUrl(value)
  if (directUrl) return directUrl

  if (!value || typeof value !== 'object') return undefined

  const candidate = value as { contentUrl?: unknown; url?: unknown }
  return getStringUrl(candidate.url) ?? getStringUrl(candidate.contentUrl)
}

const getCreativeWorkPrimaryImage = (
  value: CreativeWork | null | undefined,
): string | undefined => {
  if (!value) return undefined

  const directImage = getResolvedImageUrl(value.image)
  if (directImage) return directImage

  if (Array.isArray(value.image)) {
    for (const item of value.image) {
      const imageUrl = getResolvedImageUrl(item)
      if (imageUrl) return imageUrl
    }
  }

  if (!Array.isArray(value.hasPart)) return undefined

  for (const part of value.hasPart) {
    const nestedImage = getCreativeWorkPrimaryImage(part)
    if (nestedImage) return nestedImage
  }

  return undefined
}

const getAccommodationPrimaryImage = (
  accommodation: Accommodation | null | undefined,
): string | undefined => {
  return getAccommodationGalleryImage(accommodation)
}

const getAccommodationGalleryImage = (
  accommodation: Accommodation | null | undefined,
): string | undefined => {
  if (!accommodation || !Array.isArray(accommodation.associatedMedia)) return undefined

  return accommodation.associatedMedia
    .map((item) => getResolvedImageUrl(item.image))
    .find((image): image is string => typeof image === 'string')
}

const getPageBySlug = (pages: WebPage[], slug: string): WebPage | null => {
  const normalizedSlug = normalizeSlug(slug)
  return pages.find((page) => normalizeSlug(page.slug ?? '') === normalizedSlug) ?? null
}

const getPageLandingImage = (page: WebPage | null): RouteLandingImageDescriptor | null => {
  if (!page) return null

  const firstScreen = Array.isArray(page.hasPart) ? page.hasPart[0] : undefined
  const src =
    getCreativeWorkPrimaryImage(firstScreen) ??
    getCreativeWorkPrimaryImage(page as unknown as CreativeWork)

  return src ? { kind: 'page-hero', src } : null
}

const getPropertyListLandingImage = (
  propertyItems: PropertyListItemLike[][],
): RouteLandingImageDescriptor | null => {
  const src = getStringUrl(propertyItems[0]?.[0]?.image)
  return src ? { kind: 'property-list-hero', src } : null
}

const getAccommodationLandingImage = (
  accommodation: Accommodation | null | undefined,
): RouteLandingImageDescriptor | null => {
  if (!accommodation) return null

  const gallerySrc = getAccommodationGalleryImage(accommodation)
  if (gallerySrc) return { kind: 'gallery', src: gallerySrc }

  const heroSrc = getAccommodationPrimaryImage(accommodation)
  return heroSrc ? { kind: 'page-hero', src: heroSrc } : null
}

const getAccommodationListLandingImage = (
  accommodation: Accommodation | null | undefined,
): RouteLandingImageDescriptor | null => {
  const heroSrc = getAccommodationPrimaryImage(accommodation)
  return heroSrc ? { kind: 'property-list-hero', src: heroSrc } : null
}

const isAccommodationDetailPath = (segments: string[]): boolean => segments.length >= 3

export const useQuickActionWarmup = () => {
  registerImgFn(useImage())
  const localePath = useLocalePath()
  const { items: webPages } = useWebPage()
  const { itemsList, loadAccommodations } = useAccommodation()
  const accommodationStore = useAccommodationStore()
  const logger = useLogger({ module: 'quick-action-warmup' })

  const getTargetPath = (item: QuickActionWarmupItem): string => {
    const to = item.to || '#'
    if (item.external || to.startsWith('#')) return to

    if (isLocalizedPath(to)) return to

    return localePath(to)
  }

  const getListingLandingImage = (listingSlug: string): RouteLandingImageDescriptor | null => {
    if (!listingSlug) return getPropertyListLandingImage(itemsList.value)

    const listingAccommodations =
      accommodationStore.getAccommodationsByRealEstateListing(listingSlug)

    const firstAccommodation = listingAccommodations[0]
    const firstAccommodationImage = getAccommodationListLandingImage(firstAccommodation)

    if (firstAccommodationImage) return firstAccommodationImage

    return getPropertyListLandingImage(itemsList.value)
  }

  const resolveRouteLandingImage = (targetPath: string): RouteLandingImageDescriptor | null => {
    const normalizedTargetPath = normalizePath(targetPath)

    if (normalizedTargetPath === '/') {
      return getPageLandingImage(getPageBySlug(webPages.value, 'home'))
    }

    const segments = normalizedTargetPath.split('/').filter(Boolean)
    if (segments.length === 0) return null

    if (segments[0] === 'properties') {
      if (segments.length <= 3) return getListingLandingImage(segments[1] ?? '')

      const accommodationSlug = segments[3]
      if (!accommodationSlug) return null

      return getAccommodationLandingImage(
        accommodationStore.getAccommodationBySlug(accommodationSlug),
      )
    }

    if (isAccommodationDetailPath(segments)) {
      const accommodationSlug = segments[2] ?? ''
      const accommodationLandingImage = getAccommodationLandingImage(
        accommodationStore.getAccommodationBySlug(accommodationSlug),
      )

      if (accommodationLandingImage) return accommodationLandingImage
    }

    const pageSlug = segments[segments.length - 1] ?? ''
    return getPageLandingImage(getPageBySlug(webPages.value, pageSlug))
  }

  const shouldLoadAccommodationsForTarget = (targetPath: string): boolean => {
    const normalizedTargetPath = normalizePath(targetPath)
    const segments = normalizedTargetPath.split('/').filter(Boolean)

    return normalizedTargetPath.startsWith('/properties') || isAccommodationDetailPath(segments)
  }

  const warmQuickActionTarget = (item: QuickActionWarmupItem): void => {
    if (item.external || item.to.startsWith('#')) return

    const targetPath = getTargetPath(item)

    const runWarmup = async (): Promise<void> => {
      let landingImage = resolveRouteLandingImage(targetPath)

      if (!landingImage && shouldLoadAccommodationsForTarget(targetPath)) {
        await loadAccommodations()
        landingImage = resolveRouteLandingImage(targetPath)
      }

      const sourceUrl = landingImage?.src
      if (!sourceUrl) {
        logger.info('Quick action landing image missing', {
          itemId: item.id,
          targetPath,
        })
        return
      }

      const presetName = 'fullscreenCover'
      prefetchWithPreset(sourceUrl, presetName)

      logger.info('Quick action landing image prefetched', {
        itemId: item.id,
        targetPath,
        sourceUrl,
        imageKind: landingImage?.kind,
      })
    }

    void runWarmup()
  }

  return {
    warmQuickActionTarget,
  }
}
