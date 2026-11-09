import type { LocaleCode } from '#shared/types/i18n'

import { getSymfonyServiceToken } from '../../../utils/dashboard/symfonyAuth'

type CreatorRequest = {
  category?: string
  locale?: string
  place?: string
  realEstateListing?: string
}

type SymfonyAccommodationResponse = {
  '@id'?: string
  id?: string
  identifier?: string
  [key: string]: unknown
}

type CreatorResponse = {
  data: SymfonyAccommodationResponse
  identifier: string
  slug: string | null
  iri: string | null
}

type SymfonyFetchError = {
  response?: { status?: number; statusCode?: number; _data?: unknown }
  status?: number
  statusCode?: number
  message?: string
}

const DASHBOARD_LOCALES: LocaleCode[] = ['fr', 'en', 'es']

function getApiBase(): { apiUrl: string; projectId: string } {
  const { apiUrl, projectId } = useRuntimeConfig().symfony
  if (!apiUrl) throw createError({ statusCode: 500, statusMessage: 'SYMFONY_API_URL manquant' })
  if (!projectId)
    throw createError({ statusCode: 500, statusMessage: 'SYMFONY_PROJECT_ID manquant' })
  return { apiUrl, projectId }
}

const isLocaleCode = (value: unknown): value is LocaleCode =>
  typeof value === 'string' && DASHBOARD_LOCALES.includes(value as LocaleCode)

const normalizeLocale = (value: unknown): LocaleCode => (isLocaleCode(value) ? value : 'fr')

const getRequiredString = (
  body: CreatorRequest,
  key: 'category' | 'place' | 'realEstateListing',
): string => {
  const value = body[key]
  if (typeof value === 'string' && value.trim()) return value
  throw createError({ statusCode: 400, statusMessage: `${key} est requis` })
}

const getSymfonyErrorStatus = (error: unknown): number =>
  (error as SymfonyFetchError).response?.status ??
  (error as SymfonyFetchError).response?.statusCode ??
  (error as SymfonyFetchError).status ??
  (error as SymfonyFetchError).statusCode ??
  502

const getSymfonyErrorMessage = (error: unknown): string => {
  const fetchErr = error as SymfonyFetchError
  const data = fetchErr.response?._data
  if (typeof data === 'object' && data !== null) return JSON.stringify(data)
  return fetchErr.message ?? 'Symfony error'
}

const resolveIdentifier = (response: SymfonyAccommodationResponse): string | null =>
  typeof response.identifier === 'string' && response.identifier.trim() ? response.identifier : null

const resolveSlug = (response: SymfonyAccommodationResponse): string | null =>
  typeof response.slug === 'string' && response.slug.trim() ? response.slug : null

export default defineEventHandler(async (event): Promise<CreatorResponse> => {
  await requireUserSession(event)

  const body = await readBody<CreatorRequest>(event)
  const { apiUrl, projectId } = getApiBase()
  const token = await getSymfonyServiceToken()
  const locale = normalizeLocale(body.locale)

  const payload = {
    category: getRequiredString(body, 'category'),
    realEstateListing: getRequiredString(body, 'realEstateListing'),
    place: getRequiredString(body, 'place'),
    isActive: true,
    translations: [{ locale, body: '' }],
  }

  try {
    const data = await $fetch<SymfonyAccommodationResponse>(
      `${apiUrl}/api/projects/${projectId}/accommodations/translations?locale=${locale}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: payload,
      },
    )

    const identifier = resolveIdentifier(data)
    if (!identifier) {
      throw createError({
        statusCode: 502,
        statusMessage: 'Symfony creator: identifier absent de la réponse',
      })
    }

    return {
      data,
      identifier,
      slug: resolveSlug(data),
      iri: typeof data['@id'] === 'string' ? data['@id'] : null,
    }
  } catch (error: unknown) {
    throw createError({
      statusCode: getSymfonyErrorStatus(error),
      statusMessage: getSymfonyErrorMessage(error),
    })
  }
})
