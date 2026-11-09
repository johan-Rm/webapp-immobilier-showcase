import type {
  DashboardAccommodationTranslationPayload,
  DashboardLocalizedAccommodationField,
} from '#shared/types/dashboardAccommodation'

import { DASHBOARD_LOCALIZED_ACCOMMODATION_FIELDS } from '#shared/types/dashboardAccommodation'
import { isLocaleCode } from '#shared/utils/locale'

type UnknownRecord = Record<string, unknown>

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export const getTranslationRecords = (response: unknown): UnknownRecord[] => {
  if (Array.isArray(response)) return response.filter(isRecord)
  if (!isRecord(response)) return []

  const translations = response.translations
  if (Array.isArray(translations)) return translations.filter(isRecord)

  const hydraMembers = response['hydra:member']
  if (Array.isArray(hydraMembers)) return hydraMembers.filter(isRecord)

  const members = response.member
  if (Array.isArray(members)) return members.filter(isRecord)

  return []
}

export const normalizeTranslation = (
  item: UnknownRecord,
): DashboardAccommodationTranslationPayload | null => {
  const locale = item.locale
  if (typeof locale !== 'string' || !isLocaleCode(locale)) return null

  const translation: DashboardAccommodationTranslationPayload = { locale }

  DASHBOARD_LOCALIZED_ACCOMMODATION_FIELDS.forEach(
    (field: DashboardLocalizedAccommodationField) => {
      if (!Object.hasOwn(item, field)) return
      const value = item[field]
      translation[field] = typeof value === 'string' ? value : null
    },
  )

  return translation
}

export const extractTranslations = (
  response: unknown,
): DashboardAccommodationTranslationPayload[] =>
  getTranslationRecords(response)
    .map(normalizeTranslation)
    .filter((t): t is DashboardAccommodationTranslationPayload => Boolean(t))
