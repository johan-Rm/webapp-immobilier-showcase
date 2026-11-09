import type {
  DashboardAccommodation,
  DashboardAccommodationSavePayload,
  DashboardAccommodationTranslationPayload,
  LocaleMarkdownResult,
} from '#shared/types/dashboardAccommodation'

import { mapToApiPlatform } from '../../../utils/dashboard/accommodationMapper'
import {
  loadDashboardAccommodations,
  loadDashboardAccommodationTranslations,
} from '../../../utils/dashboard/accommodations'
import { resolveCategoryCodes } from '../../../utils/dashboard/categoryCodeResolver'
import { exportAllLocales, propagateGlobalFields } from '../../../utils/dashboard/markdownExporter'
import { getSymfonyServiceToken } from '../../../utils/dashboard/symfonyAuth'
import { extractTranslations } from '../../../utils/dashboard/translationNormalizer'
import { getProjectLocales } from '../../../utils/projectLocales'

function getApiBase(): { apiUrl: string; projectId: string } {
  const { apiUrl, projectId } = useRuntimeConfig().symfony
  if (!apiUrl) throw new Error('SYMFONY_API_URL manquant')
  if (!projectId) throw new Error('SYMFONY_PROJECT_ID manquant')
  return { apiUrl, projectId }
}

type SymfonyAccommodationResponse = {
  '@id'?: string
  id?: string
  identifier?: string
  [key: string]: unknown
}

type SymfonyFetchError = {
  response?: { status?: number; statusCode?: number; _data?: unknown }
  status?: number
  statusCode?: number
  message?: string
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

const resolveSymfonyIdentifier = (
  response: SymfonyAccommodationResponse,
  fallbackIdentifier: string,
): string =>
  response.id ?? response.identifier ?? response['@id']?.split('/').at(-1) ?? fallbackIdentifier

const getString = (value: unknown): string | null => (typeof value === 'string' ? value : null)

const applyString = (fm: Record<string, unknown>, key: string, value: unknown): void => {
  const str = getString(value)
  if (str) fm[key] = str
}

const mergeFromSymfonyResponse = (
  accommodation: DashboardAccommodationSavePayload,
  symfony: SymfonyAccommodationResponse,
): DashboardAccommodationSavePayload => {
  const fm: Record<string, unknown> = { ...accommodation.frontmatter }

  applyString(fm, 'identifier', symfony.identifier)
  applyString(fm, 'slug', symfony.slug)
  applyString(fm, 'name', symfony.name)
  applyString(fm, 'label', symfony.label)
  applyString(fm, 'category', symfony.category)
  applyString(fm, 'realEstateListing', symfony.realEstateListing)
  applyString(fm, 'place', symfony.place)
  applyString(fm, 'floorSize', symfony.floorSize)
  applyString(fm, 'dateCreated', symfony.createdAt)
  applyString(fm, 'dateModified', symfony.updatedAt)

  if (typeof symfony.numberOfBedrooms === 'number') fm.numberOfBedrooms = symfony.numberOfBedrooms
  if (Array.isArray(symfony.amenityFeature)) fm.amenityFeature = symfony.amenityFeature
  if (Array.isArray(symfony.tags)) fm.tags = symfony.tags
  if (typeof symfony.status === 'string' && typeof fm.isActive !== 'boolean') {
    fm.isActive = symfony.status === 'published'
  }
  if (symfony.offer && typeof symfony.offer === 'object' && !Array.isArray(symfony.offer)) {
    fm.offer = symfony.offer
  }

  const body = getString(symfony.body) ?? accommodation.body

  return {
    ...accommodation,
    frontmatter: fm as DashboardAccommodationSavePayload['frontmatter'],
    body,
  }
}

const isSaveDebugEnabled = (): boolean => process.env.DASHBOARD_SAVE_DEBUG === '1'

const debugSave = (label: string, data: unknown): void => {
  if (!isSaveDebugEnabled()) return
  console.warn(`[dashboard-save] ${label}`, JSON.stringify(data, null, 2))
}

export default defineEventHandler(
  async (
    event,
  ): Promise<{
    success: true
    uuid: string
    markdownUpdated: boolean
    markdownResults: LocaleMarkdownResult[]
    contentUpdated: boolean
    reconciliationRequired: boolean
    data: SymfonyAccommodationResponse
    freshAccommodation: DashboardAccommodation | null
    freshTranslations: DashboardAccommodationTranslationPayload[]
  }> => {
    await requireUserSession(event)

    const identifier = getRouterParam(event, 'identifier')
    if (!identifier) {
      throw createError({ statusCode: 400, statusMessage: 'Missing accommodation identifier' })
    }

    const accommodation = await readBody<DashboardAccommodationSavePayload>(event)
    if (!accommodation?.frontmatter) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid accommodation payload' })
    }

    const { apiUrl, projectId } = getApiBase()
    const token = await getSymfonyServiceToken()

    // Locale transmise au backend pour la résolution des relations (LocaleResolver lit
    // `?locale=` en priorité) ; fallback sur la locale du payload.
    const localeQuery = getQuery(event).locale
    const locale =
      typeof localeQuery === 'string' && localeQuery ? localeQuery : accommodation.locale
    const localeParam = locale ? `?locale=${encodeURIComponent(locale)}` : ''
    const { enabledLocales } = await getProjectLocales()

    let payload: Awaited<ReturnType<typeof mapToApiPlatform>>
    try {
      const resolvedCategoryCodes = resolveCategoryCodes({
        locale,
        frontmatter: accommodation.frontmatter,
        apiUrl,
        projectId,
      })
      payload = await mapToApiPlatform(
        { ...accommodation, resolvedCategoryCodes },
        { apiUrl, projectId },
      )
    } catch (error) {
      throw createError({ statusCode: 400, statusMessage: (error as Error).message })
    }

    debugSave('payload', payload)

    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }

    let uuid: string
    let savedData: SymfonyAccommodationResponse

    const callSymfony = async (
      url: string,
      method: 'PUT' | 'POST',
      label: string,
    ): Promise<SymfonyAccommodationResponse> => {
      debugSave('request', { label, method, url, body: payload })
      const response = await $fetch<SymfonyAccommodationResponse>(url, {
        method,
        headers,
        body: payload,
      })
      debugSave('response', { label, response })
      return response
    }

    try {
      const updated = await callSymfony(
        `${apiUrl}/api/projects/${projectId}/accommodations/${identifier}/translations${localeParam}`,
        'PUT',
        'translations',
      )
      savedData = updated
      uuid = resolveSymfonyIdentifier(updated, identifier)
    } catch (updateError: unknown) {
      if (getSymfonyErrorStatus(updateError) !== 404) {
        throw createError({
          statusCode: getSymfonyErrorStatus(updateError),
          statusMessage: getSymfonyErrorMessage(updateError),
        })
      }

      try {
        const created = await callSymfony(
          `${apiUrl}/api/projects/${projectId}/accommodations/translations${localeParam}`,
          'POST',
          'create',
        )
        savedData = created
        uuid = resolveSymfonyIdentifier(created, identifier)
      } catch (createErrorResponse: unknown) {
        throw createError({
          statusCode: getSymfonyErrorStatus(createErrorResponse),
          statusMessage: getSymfonyErrorMessage(createErrorResponse),
        })
      }
    }

    const merged = mergeFromSymfonyResponse(accommodation, savedData)

    const symfonyTranslations = extractTranslations(savedData)
    const translations =
      symfonyTranslations.length > 0 ? symfonyTranslations : (accommodation.translations ?? [])
    const markdownResults = await exportAllLocales({ ...merged, translations })
    const markdownUpdated = markdownResults.some((result) => result.updated)
    let propagationFailed = false
    if (markdownUpdated) {
      try {
        await propagateGlobalFields(merged.frontmatter, identifier, merged.locale, enabledLocales)
      } catch (error) {
        propagationFailed = true
        console.error('[markdown-export] Echec propagation des champs globaux:', error)
      }
    }
    const reconciliationRequired =
      propagationFailed ||
      markdownResults.some((result) => !result.updated && result.reason === 'write_error')
    const contentUpdated = markdownUpdated && !reconciliationRequired

    let freshAccommodation: DashboardAccommodation | null = null
    if (markdownUpdated) {
      try {
        const fresh = await loadDashboardAccommodations(accommodation.locale, { force: true })
        freshAccommodation = fresh.items.find((item) => item.identifier === identifier) ?? null
      } catch {
        // Non-bloquant : le client peut se rafraîchir manuellement
      }
    }

    const freshTranslations = markdownUpdated
      ? await loadDashboardAccommodationTranslations(identifier, enabledLocales)
      : symfonyTranslations

    return {
      success: true,
      uuid,
      markdownUpdated,
      markdownResults,
      contentUpdated,
      reconciliationRequired,
      data: savedData,
      freshAccommodation,
      freshTranslations,
    }
  },
)
