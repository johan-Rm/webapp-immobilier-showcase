import type { Accommodation, WebPage } from '@schemas/interfaces'
import type { ComputedRef } from 'vue'

import { computed } from 'vue'

import { buildJsonLd, buildSeoMeta } from '@services/seo/schema'

import { AVAILABLES_LOCALES, FALLBACK_LOCALE } from '#shared/utils/locale'

type UsePageSeoReturn = {
  seoMeta: ComputedRef<ReturnType<typeof buildSeoMeta>>
  jsonLd: ComputedRef<ReturnType<typeof buildJsonLd>>
}

type AlternateLink = {
  rel: 'alternate'
  hreflang: string
  href: string
}

const buildAlternateLinks = (
  siteUrl: string,
  switchLocalePath: ReturnType<typeof useSwitchLocalePath>,
): AlternateLink[] => {
  const links = Object.values(AVAILABLES_LOCALES)
    .map((locale) => {
      const localizedPath = switchLocalePath(locale.code)
      const href = localizedPath ? toAbsoluteUrl(siteUrl, localizedPath) : undefined

      if (!href) {
        return null
      }

      return {
        rel: 'alternate' as const,
        hreflang: locale.iso.toLowerCase(),
        href,
      }
    })
    .filter((item): item is AlternateLink => item !== null)

  const fallbackPath = switchLocalePath(FALLBACK_LOCALE)
  const fallbackHref = fallbackPath ? toAbsoluteUrl(siteUrl, fallbackPath) : undefined

  if (fallbackHref) {
    links.push({
      rel: 'alternate',
      hreflang: 'x-default',
      href: fallbackHref,
    })
  }

  return links
}

/**
 * Branche le SEO d'une page depuis des sources réactives.
 *
 * Ce composable porte la logique UI/réactive :
 * - lecture de la route courante
 * - résolution du `runtimeConfig`
 * - application de `useSeoMeta()` et de l'injection JSON-LD via `useHead()`
 *
 * Les transformations SEO pures restent déléguées à `services/seo/schema.ts`.
 *
 * Contrat d'appel :
 * - les arguments réactifs doivent être passés sous forme de `ComputedRef`
 * - l'entry point reste responsable de ne fournir que les données qui doivent
 *   réellement être exposées en JSON-LD
 *
 * @see ../../docs/8.seo/index.md
 * @see ../../docs/2.architecture/5.responsibility-boundaries.md
 *
 * @param page Page éditoriale source, fournie en `ComputedRef`.
 * @param accommodations Liste de biens à exposer en `ItemList`, fournie en `ComputedRef`.
 * @param accommodation Bien unique à exposer en `Accommodation`, fourni en `ComputedRef`.
 * @returns Objets SEO réactifs utiles au debug ou à la réutilisation.
 */
export const usePageSeo = (
  page?: ComputedRef<WebPage | null>,
  accommodations?: ComputedRef<Accommodation[] | null | undefined>,
  accommodation?: ComputedRef<Accommodation | null | undefined>,
): UsePageSeoReturn => {
  const route = useRoute()
  const config = useRuntimeConfig()
  const switchLocalePath = useSwitchLocalePath()
  const isIndexable = computed(() => config.public.isIndexable === true)
  const siteName = config.public.siteName
  const appConfig = useAppConfig()
  const organization = computed(() => appConfig.organization)

  const seoMeta = computed(() =>
    buildSeoMeta({
      page: page?.value ?? null,
      siteUrl: config.public.siteUrl,
      path: route.path,
      isIndexable: isIndexable.value,
    }),
  )

  const jsonLd = computed(() =>
    buildJsonLd({
      page: page?.value ?? null,
      organization: organization.value,
      siteUrl: config.public.siteUrl,
      path: route.path,
      accommodations: accommodations?.value ?? null,
      accommodation: accommodation?.value ?? null,
    }),
  )

  const alternateLinks = computed(() =>
    buildAlternateLinks(config.public.siteUrl, switchLocalePath),
  )

  useSeoMeta({
    title: () => seoMeta.value.title,
    description: () => seoMeta.value.description,
    robots: () => seoMeta.value.robots,
    ogTitle: () => seoMeta.value.ogTitle,
    ogDescription: () => seoMeta.value.ogDescription,
    ogSiteName: siteName,
    ogUrl: () => seoMeta.value.ogUrl,
    ogType: 'website',
    ogImage: () => seoMeta.value.ogImage,
    twitterCard: () => seoMeta.value.twitterCard,
    twitterTitle: () => seoMeta.value.twitterTitle,
    twitterDescription: () => seoMeta.value.twitterDescription,
    twitterImage: () => seoMeta.value.twitterImage,
    articlePublishedTime: () => seoMeta.value.articlePublishedTime,
    articleModifiedTime: () => seoMeta.value.articleModifiedTime,
  })

  useHead(() => ({
    link: [
      ...(seoMeta.value.canonicalUrl
        ? [{ rel: 'canonical' as const, href: seoMeta.value.canonicalUrl }]
        : []),
      ...alternateLinks.value,
    ],
    script: jsonLd.value.length
      ? [
          {
            key: 'schema-org-graph',
            type: 'application/ld+json',
            innerHTML: JSON.stringify(
              {
                '@context': 'https://schema.org',
                '@graph': jsonLd.value,
              },
              null,
              2,
            ),
          },
        ]
      : [],
  }))

  return {
    seoMeta,
    jsonLd,
  }
}
