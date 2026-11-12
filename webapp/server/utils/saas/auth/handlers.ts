import type { H3Event } from 'h3'

import { readBody } from 'h3'
import { z } from 'zod'

import { requireSaasOrganization, saasResourceId } from './access'
import { saasEndpoint, saasFailure } from './runtime'
import { authorizedSaasRequest, clearSaasSession, loginSaas, readSaasSession } from './session'

export const saasLogin = (event: H3Event) =>
  saasEndpoint(event, async () => {
    const body = z
      .object({
        email: z.email().transform((v) => v.toLowerCase()),
        password: z.string().min(1).max(4096),
      })
      .strict()
      .safeParse(await readBody(event))
    if (!body.success) return saasFailure(400, 'invalid_request')
    return loginSaas(event, body.data.email, body.data.password)
  })
export const saasLogout = (event: H3Event) =>
  saasEndpoint(event, async () => {
    await clearSaasSession(event)
    return { ok: true }
  })
export const saasSession = (event: H3Event) =>
  saasEndpoint(event, async () => {
    await authorizedSaasRequest(event, '/api/organizations')
    const session = await readSaasSession(event)
    return {
      user: { id: session.email, email: session.email, platformAdmin: session.platformAdmin },
      capabilities: { invitations: false, passwordReset: false, memberRemoval: false },
    }
  })
export const unsupportedSaas = (event: H3Event) =>
  saasEndpoint(event, async () => saasFailure(501, 'unsupported_api'))

export const unsupportedSaasAdministration = (event: H3Event) =>
  saasEndpoint(event, async () => {
    await requireSaasOrganization(event, saasResourceId(event, 'organizationId'))
    return saasFailure(501, 'unsupported_api')
  })
