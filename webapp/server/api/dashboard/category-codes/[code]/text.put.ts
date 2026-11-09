import type { LocaleCode } from '#shared/types/i18n'

import {
  findProjectedCategoryCode,
  updateProjectedCategoryCodeText,
} from '../../../../utils/dashboard/contentProjection'
import { getSymfonyServiceToken } from '../../../../utils/dashboard/symfonyAuth'
import { getProjectLocales } from '../../../../utils/projectLocales'

type SymfonyCategoryCodeTranslationPayload = {
  locale: LocaleCode
  text: string
}

type UpdatePlaceTextBody = {
  locale?: unknown
  text?: unknown
}

type UpdatePlaceTextResponse = {
  codeValue: string
  name: string
  inCodeSet: 'accommodation-place'
  text: string
  contentUpdated: boolean
  reconciliationRequired: boolean
}

const DASHBOARD_LOCALES: LocaleCode[] = ['fr', 'en', 'es']
const PLACE_CODE_SET = 'accommodation-place'

const isLocaleCode = (value: unknown): value is LocaleCode =>
  typeof value === 'string' && DASHBOARD_LOCALES.includes(value as LocaleCode)

const getApiBase = (): { apiUrl: string; projectId: string } => {
  const { apiUrl, projectId } = useRuntimeConfig().symfony
  if (!apiUrl) throw new Error('SYMFONY_API_URL manquant')
  if (!projectId) throw new Error('SYMFONY_PROJECT_ID manquant')
  return { apiUrl, projectId }
}

const isDebugEnabled = (): boolean => process.env.DASHBOARD_SAVE_DEBUG === '1'

const debugPlaceTextSave = (label: string, data: Record<string, unknown>): void => {
  if (!isDebugEnabled()) return
  console.warn(`[dashboard-place-text] ${label}`, JSON.stringify(data, null, 2))
}

export default defineEventHandler(async (event): Promise<UpdatePlaceTextResponse> => {
  await requireUserSession(event)

  const code = getRouterParam(event, 'code')
  if (!code) {
    throw createError({ statusCode: 400, statusMessage: 'Code lieu manquant' })
  }

  const body = await readBody<UpdatePlaceTextBody>(event)
  if (!isLocaleCode(body.locale)) {
    throw createError({ statusCode: 400, statusMessage: 'Locale invalide' })
  }
  if (typeof body.text !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Texte du lieu invalide' })
  }

  const { enabledLocales } = await getProjectLocales()
  if (!enabledLocales.includes(body.locale)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Locale ${body.locale} non activée pour ce projet`,
    })
  }

  const projectedCategoryCode = await findProjectedCategoryCode(body.locale, PLACE_CODE_SET, code)
  if (!projectedCategoryCode?.id) {
    throw createError({
      statusCode: 409,
      statusMessage: `CategoryCode ${code} absent de la projection content`,
    })
  }

  const { apiUrl, projectId } = getApiBase()
  const token = await getSymfonyServiceToken()
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }

  const text = body.text.trim()
  const translation: SymfonyCategoryCodeTranslationPayload = {
    locale: body.locale,
    text,
  }
  const symfonyUrl = `${apiUrl}/api/projects/${projectId}/category-codes/${projectedCategoryCode.id}/translations`

  debugPlaceTextSave('request', {
    url: symfonyUrl,
    locale: body.locale,
    inCodeSet: PLACE_CODE_SET,
    code,
    uuid: projectedCategoryCode.id,
    textLength: text.length,
  })

  await $fetch(symfonyUrl, {
    method: 'PUT',
    headers,
    query: { locale: body.locale },
    body: {
      inCodeSet: PLACE_CODE_SET,
      translations: [translation],
    },
  })

  let contentUpdated = false
  try {
    await updateProjectedCategoryCodeText({
      locale: body.locale,
      codeValue: code,
      inCodeSet: PLACE_CODE_SET,
      text,
    })
    contentUpdated = true
  } catch (error) {
    console.error('[content-projection] Echec projection texte CategoryCode:', error)
  }

  return {
    codeValue: code,
    name: projectedCategoryCode.name,
    inCodeSet: PLACE_CODE_SET,
    text,
    contentUpdated,
    reconciliationRequired: !contentUpdated,
  }
})
