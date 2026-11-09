import { getSymfonyServiceToken } from '../../../utils/dashboard/symfonyAuth'

type SymfonyFetchError = {
  response?: { status?: number; statusCode?: number; _data?: unknown }
  status?: number
  statusCode?: number
  message?: string
}

function getApiBase(): { apiUrl: string; projectId: string } {
  const { apiUrl, projectId } = useRuntimeConfig().symfony
  if (!apiUrl) throw createError({ statusCode: 500, statusMessage: 'SYMFONY_API_URL manquant' })
  if (!projectId)
    throw createError({ statusCode: 500, statusMessage: 'SYMFONY_PROJECT_ID manquant' })
  return { apiUrl, projectId }
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

/**
 * Supprime un bien côté API Symfony. Utilisé pour purger un brouillon de création
 * abandonné (créé au premier POST puis non finalisé).
 */
export default defineEventHandler(async (event): Promise<{ success: true }> => {
  await requireUserSession(event)

  const identifier = getRouterParam(event, 'identifier')
  if (!identifier) {
    throw createError({ statusCode: 400, statusMessage: 'Missing accommodation identifier' })
  }

  const { apiUrl, projectId } = getApiBase()
  const token = await getSymfonyServiceToken()

  try {
    await $fetch(
      `${apiUrl}/api/projects/${projectId}/accommodations/${encodeURIComponent(identifier)}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      },
    )

    return { success: true }
  } catch (error: unknown) {
    throw createError({
      statusCode: getSymfonyErrorStatus(error),
      statusMessage: getSymfonyErrorMessage(error),
    })
  }
})
