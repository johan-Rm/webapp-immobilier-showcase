import type { H3Event } from 'h3'

import { createError, readBody } from 'h3'

import { isSymfonyProjectMember } from '../../utils/auth/symfonyProjectMember'

const normalizeEmail = (email: string) => email.trim().toLowerCase()

export default defineEventHandler(async (event: H3Event) => {
  const body = await readBody(event)
  const email = normalizeEmail(String(body?.email ?? ''))
  const password = String(body?.password ?? '')

  if (!email || !password) {
    throw createError({ statusCode: 400, message: 'Email et mot de passe requis.' })
  }

  const { apiUrl } = useRuntimeConfig(event).symfony

  if (!apiUrl) {
    throw createError({ statusCode: 503, message: 'Service indisponible.' })
  }

  try {
    await $fetch(`${apiUrl}/api/auth/login`, {
      method: 'POST',
      body: { email, password },
    })
  } catch {
    throw createError({ statusCode: 401, message: 'Identifiants invalides.' })
  }

  const isMember = await isSymfonyProjectMember(event, email)
  if (!isMember) {
    throw createError({ statusCode: 403, message: 'Accès non autorisé à ce projet.' })
  }

  await setUserSession(event, {
    user: { email },
    loggedInAt: Date.now(),
  })

  return { ok: true }
})
