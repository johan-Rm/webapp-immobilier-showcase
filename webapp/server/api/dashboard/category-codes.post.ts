import type { LocaleCode } from '#shared/types/i18n'

import { projectCategoryCode } from '../../utils/dashboard/contentProjection'
import { getSymfonyServiceToken } from '../../utils/dashboard/symfonyAuth'
import { getProjectLocales } from '../../utils/projectLocales'

type CategoryCodeTranslationPayload = {
  locale: LocaleCode
  label: string
}

type SymfonyCategoryCodeTranslation = {
  locale?: string
  label?: string | null
}

type SymfonyCategoryCode = {
  '@id': string
  id?: string
  code?: string
  codeValue?: string
  inCodeSet: string
  label?: string
  translations?: SymfonyCategoryCodeTranslation[]
  metadata?: {
    isEnabled?: boolean
  }
}

type SymfonyFetchError = {
  message?: string
  response?: {
    _data?: unknown
    statusCode?: number
  }
  status?: number
  statusCode?: number
}

type CategoryCodeCreateRequest = {
  code?: string
  label?: string
  inCodeSet?: string
  locale?: string
  translations?: unknown
}

const DASHBOARD_LOCALES: LocaleCode[] = ['fr', 'en', 'es']

function getApiBase(): { apiUrl: string; projectId: string } {
  const { apiUrl, projectId } = useRuntimeConfig().symfony
  if (!apiUrl) throw new Error('SYMFONY_API_URL manquant')
  if (!projectId) throw new Error('SYMFONY_PROJECT_ID manquant')
  return { apiUrl, projectId }
}

const isLocaleCode = (value: unknown): value is LocaleCode =>
  typeof value === 'string' && DASHBOARD_LOCALES.includes(value as LocaleCode)

const normalizeLocale = (value: unknown): LocaleCode => (isLocaleCode(value) ? value : 'fr')

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const normalizeTranslations = (
  translations: unknown,
  fallbackLocale: LocaleCode,
  fallbackLabel: string,
): CategoryCodeTranslationPayload[] => {
  if (Array.isArray(translations)) {
    const normalized = translations
      .filter(isRecord)
      .map((translation): CategoryCodeTranslationPayload | null => {
        if (!isLocaleCode(translation.locale) || typeof translation.label !== 'string') return null
        return { locale: translation.locale, label: translation.label }
      })
      .filter((translation): translation is CategoryCodeTranslationPayload => translation !== null)

    if (normalized.length > 0) return normalized
  }

  return [{ locale: fallbackLocale, label: fallbackLabel }]
}

const getFallbackLabel = (body: CategoryCodeCreateRequest): string => {
  const directLabel = body.label?.trim() || body.code?.trim()
  if (directLabel) return directLabel
  if (!Array.isArray(body.translations)) return ''

  const firstTranslation = body.translations.find(
    (translation): translation is { label: string } =>
      isRecord(translation) &&
      typeof translation.label === 'string' &&
      translation.label.trim().length > 0,
  )

  return firstTranslation?.label.trim() ?? ''
}

const getSymfonyStatusCode = (error: unknown): number =>
  (error as SymfonyFetchError).response?.statusCode ??
  (error as SymfonyFetchError).status ??
  (error as SymfonyFetchError).statusCode ??
  502

const getSymfonyErrorMessage = (error: unknown): string => {
  const fetchErr = error as SymfonyFetchError
  const data = fetchErr.response?._data
  if (typeof data === 'object' && data !== null) return JSON.stringify(data)
  return fetchErr.message ?? 'Symfony category code error'
}

type DashboardCategoryCodeCreateResponse = SymfonyCategoryCode & {
  contentUpdated: boolean
  reconciliationRequired: boolean
}

const getCategoryCodeIdentifier = (item: SymfonyCategoryCode): string =>
  item.id ?? item['@id'].split('/').at(-1) ?? ''

export default defineEventHandler(async (event): Promise<DashboardCategoryCodeCreateResponse> => {
  await requireUserSession(event)

  const body = await readBody<CategoryCodeCreateRequest>(event)
  const label = getFallbackLabel(body)
  if (!label || !body?.inCodeSet) {
    throw createError({ statusCode: 400, statusMessage: 'label et inCodeSet sont requis' })
  }

  const { apiUrl, projectId } = getApiBase()
  const token = await getSymfonyServiceToken()

  // On ne pousse que des locales activees pour le projet (fallback locale source).
  const { enabledLocales, sourceLocale } = await getProjectLocales()
  const requestedLocale = normalizeLocale(body.locale)
  const fallbackLocale = enabledLocales.includes(requestedLocale) ? requestedLocale : sourceLocale
  const translations = normalizeTranslations(body.translations, fallbackLocale, label).filter(
    (translation) => enabledLocales.includes(translation.locale),
  )
  const safeTranslations =
    translations.length > 0 ? translations : [{ locale: sourceLocale, label }]
  const requestLocale = safeTranslations.at(0)?.locale ?? sourceLocale

  try {
    const created = await $fetch<SymfonyCategoryCode>(
      `${apiUrl}/api/projects/${projectId}/category-codes/translations`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        query: { locale: requestLocale },
        body: { inCodeSet: body.inCodeSet, translations: safeTranslations },
      },
    )

    const identifier = getCategoryCodeIdentifier(created)
    const codeValue = created.codeValue ?? created.code ?? body.code ?? ''
    let contentUpdated = false

    if (identifier && codeValue) {
      try {
        await projectCategoryCode({
          enabledLocales,
          translations: safeTranslations,
          fallbackLabel: label,
          categoryCode: {
            id: identifier,
            codeValue,
            inCodeSet: created.inCodeSet ?? body.inCodeSet,
            ...(created.metadata ? { metadata: created.metadata } : {}),
          },
        })
        contentUpdated = true
      } catch (error) {
        console.error('[content-projection] Echec projection CategoryCode:', error)
      }
    }

    return {
      ...created,
      contentUpdated,
      reconciliationRequired: !contentUpdated,
    }
  } catch (error: unknown) {
    throw createError({
      statusCode: getSymfonyStatusCode(error),
      statusMessage: getSymfonyErrorMessage(error),
    })
  }
})
