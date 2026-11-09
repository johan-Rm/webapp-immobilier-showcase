import type { H3Event } from 'h3'

import { getSymfonyServiceToken } from '../dashboard/symfonyAuth'

type ProjectMemberCheckResponse = {
  member: boolean
  role?: string
  user?: { email: string }
}

type Fetcher = (url: string, options: { headers: Record<string, string> }) => Promise<unknown>

export async function checkProjectMembership(
  apiUrl: string,
  projectId: string,
  token: string,
  email: string,
  fetcher: Fetcher,
): Promise<boolean> {
  const url = `${apiUrl}/api/projects/${projectId}/members/check?email=${encodeURIComponent(email)}`

  try {
    const response = (await fetcher(url, {
      headers: { Authorization: `Bearer ${token}` },
    })) as ProjectMemberCheckResponse

    return response.member === true
  } catch (error: unknown) {
    const status =
      error && typeof error === 'object' && 'statusCode' in error
        ? (error as { statusCode: number }).statusCode
        : null

    if (status === 404) return false

    throw error
  }
}

export async function isSymfonyProjectMember(event: H3Event, email: string): Promise<boolean> {
  const { apiUrl, projectId } = useRuntimeConfig(event).symfony

  if (!apiUrl) throw new Error('SYMFONY_API_URL est absent de la configuration serveur')
  if (!projectId) throw new Error('SYMFONY_PROJECT_ID est absent de la configuration serveur')

  const token = await getSymfonyServiceToken()

  // `$fetch` porte le type de toutes les routes Nitro : le comparer au type
  // simple `Fetcher` fait exploser la profondeur d'inférence (TS2321).
  // On le réduit au contrat `Fetcher` attendu par `checkProjectMembership`.
  return checkProjectMembership(apiUrl, projectId, token, email, $fetch as unknown as Fetcher)
}
