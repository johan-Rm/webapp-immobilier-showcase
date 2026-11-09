type TokenCache = {
  token: string
  expiresAt: number
}

// JWT TTL Symfony = 900s — on renouvelle à 800s pour absorber la latence réseau
const TOKEN_TTL_MS = 800_000

let cache: TokenCache | null = null

function getConfig() {
  const config = useRuntimeConfig()
  const { apiUrl, serviceEmail, servicePassword } = config.symfony

  if (!apiUrl) throw new Error('SYMFONY_API_URL est absent de la configuration serveur')
  if (!serviceEmail) throw new Error('SYMFONY_SERVICE_EMAIL est absent de la configuration serveur')
  if (!servicePassword)
    throw new Error('SYMFONY_SERVICE_PASSWORD est absent de la configuration serveur')

  return { apiUrl, serviceEmail, servicePassword }
}

async function fetchToken(apiUrl: string, email: string, password: string): Promise<string> {
  const response = await $fetch<{ token: string }>(`${apiUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { email, password },
  })

  if (!response?.token) {
    throw new Error('Symfony auth: réponse inattendue — token absent')
  }

  return response.token
}

export async function getSymfonyServiceToken(): Promise<string> {
  const now = Date.now()

  if (cache && cache.expiresAt > now) {
    return cache.token
  }

  const { apiUrl, serviceEmail, servicePassword } = getConfig()
  const token = await fetchToken(apiUrl, serviceEmail, servicePassword)

  cache = { token, expiresAt: now + TOKEN_TTL_MS }

  return token
}

export function invalidateSymfonyToken(): void {
  cache = null
}
