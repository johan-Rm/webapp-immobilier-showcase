import { getSymfonyServiceToken } from '../../utils/dashboard/symfonyAuth'

type SymfonyStatus = { available: boolean; error?: string }

export default defineEventHandler(async (event): Promise<SymfonyStatus> => {
  await requireUserSession(event)

  const { apiUrl, serviceEmail } = useRuntimeConfig().symfony
  if (!apiUrl || !serviceEmail) {
    return { available: false, error: 'Variables SYMFONY_* manquantes dans la configuration' }
  }

  try {
    await getSymfonyServiceToken()
    return { available: true }
  } catch {
    return { available: false }
  }
})
