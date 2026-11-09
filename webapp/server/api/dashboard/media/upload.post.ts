import type { DashboardMediaObject } from '#shared/types/dashboardAccommodation'
import type { LocaleCode } from '#shared/types/i18n'

import { normalizeMediaUrl, projectMediaObject } from '../../../utils/dashboard/contentProjection'
import { getSymfonyServiceToken } from '../../../utils/dashboard/symfonyAuth'
import { getProjectLocales } from '../../../utils/projectLocales'

type MediaObjectTranslationPayload = {
  locale: LocaleCode
  caption: string
}

type SymfonyMediaTranslationResponse = {
  id?: string
  locale?: string
  caption?: string | null
}

type SymfonyMediaResponse = {
  '@id'?: string
  id?: string
  identifier?: string
  name?: string
  originalFilename?: string | null
  url?: string
  contentUrl?: string
  caption?: string
  mainEntity?: string
  updatedAt?: string
  translations?: SymfonyMediaTranslationResponse[]
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

const getStringEntry = (value: FormDataEntryValue | null): string | null =>
  typeof value === 'string' ? value : null

const getQueryString = (value: unknown): string | null =>
  typeof value === 'string' ? value : Array.isArray(value) ? getQueryString(value.at(0)) : null

const createCaptionFromFilename = (filename: string): string =>
  filename
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const normalizeLocale = (value: unknown): LocaleCode => (isLocaleCode(value) ? value : 'fr')

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const parseTranslations = (
  value: FormDataEntryValue | null,
  fallbackLocale: LocaleCode,
  fallbackCaption: string,
): MediaObjectTranslationPayload[] => {
  const raw = getStringEntry(value)
  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        const translations = parsed
          .filter(isRecord)
          .map((item): MediaObjectTranslationPayload | null => {
            if (!isLocaleCode(item.locale) || typeof item.caption !== 'string') return null
            return { locale: item.locale, caption: item.caption }
          })
          .filter((item): item is MediaObjectTranslationPayload => item !== null)

        if (translations.length > 0) return translations
      }
    } catch {
      throw createError({ statusCode: 400, statusMessage: 'Payload translations invalide' })
    }
  }

  return [{ locale: fallbackLocale, caption: fallbackCaption }]
}

const resolveCaption = (
  response: SymfonyMediaResponse,
  locale: LocaleCode,
  fallbackCaption: string,
): string =>
  response.caption ??
  response.translations?.find((translation) => translation.locale === locale)?.caption ??
  response.translations?.find((translation) => translation.caption)?.caption ??
  fallbackCaption

type DashboardMediaUploadResponse = DashboardMediaObject & {
  contentUpdated: boolean
  reconciliationRequired: boolean
}

const resolveMediaIdentifier = (response: SymfonyMediaResponse): string =>
  response.identifier ??
  response.id ??
  response['@id']?.split('/').at(-1) ??
  response.originalFilename?.replace(/\.[^.]+$/, '') ??
  ''

export default defineEventHandler(async (event): Promise<DashboardMediaUploadResponse> => {
  await requireUserSession(event)

  const form = await readFormData(event)
  const file = form.get('file') as File | null

  // Locale d'upload restreinte aux locales activees du projet (fallback source).
  const { enabledLocales, sourceLocale } = await getProjectLocales()
  const requestedLocale = normalizeLocale(
    getStringEntry(form.get('locale')) ?? getQueryString(getQuery(event).locale),
  )
  const locale = enabledLocales.includes(requestedLocale) ? requestedLocale : sourceLocale
  const fallbackCaption =
    getStringEntry(form.get('caption'))?.trim() ||
    (file ? createCaptionFromFilename(file.name) : '')

  if (!file || file.size === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Fichier manquant ou vide' })
  }

  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    throw createError({ statusCode: 400, statusMessage: 'Type de fichier non supporté' })
  }

  const { apiUrl, projectId } = getApiBase()
  const token = await getSymfonyServiceToken()

  const parsedTranslations = parseTranslations(form.get('translations'), locale, fallbackCaption)
  const enabledTranslations = parsedTranslations.filter((translation) =>
    enabledLocales.includes(translation.locale),
  )
  const translations =
    enabledTranslations.length > 0 ? enabledTranslations : [{ locale, caption: fallbackCaption }]

  const symfonyForm = new FormData()
  symfonyForm.append('file', file, file.name)
  symfonyForm.append('translations', JSON.stringify(translations))

  const raw = await $fetch<SymfonyMediaResponse>(
    `${apiUrl}/api/projects/${projectId}/media-objects/translations`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Language': locale,
        Authorization: `Bearer ${token}`,
      },
      body: symfonyForm,
    },
  )

  const identifier = resolveMediaIdentifier(raw)
  const caption = resolveCaption(raw, locale, fallbackCaption)
  const url = normalizeMediaUrl(raw.url ?? raw.contentUrl ?? '')
  const mainEntity = raw.mainEntity ?? 'ImageObject'
  const dateModified = raw.updatedAt ?? new Date().toISOString()

  let contentUpdated = false
  try {
    await projectMediaObject({
      enabledLocales,
      translations,
      fallbackCaption: caption,
      media: { identifier, url, mainEntity, dateModified },
    })
    contentUpdated = true
  } catch (error) {
    console.error('[content-projection] Echec projection media:', error)
  }

  return {
    identifier,
    url,
    caption,
    mainEntity,
    dateModified,
    contentUpdated,
    reconciliationRequired: !contentUpdated,
  }
})
