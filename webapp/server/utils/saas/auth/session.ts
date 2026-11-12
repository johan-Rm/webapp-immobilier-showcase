import type { H3Event } from 'h3'

import { randomBytes, createHash } from 'node:crypto'
import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises'
import { resolve, join } from 'node:path'

import { getCookie, setCookie, deleteCookie } from 'h3'
import { z } from 'zod'

import { nativeRequest, saasConfig, saasFailure } from './runtime'

const cookieName = 'gd_saas'
const sessionSchema = z.object({
  email: z.email(),
  token: z.string().min(1),
  refreshToken: z.string(),
  tokenExpiresAt: z.number(),
  expiresAt: z.number(),
  platformAdmin: z.boolean(),
})
type PrivateSession = z.infer<typeof sessionSchema>
const queues = new Map<string, Promise<unknown>>()
const directory = () =>
  resolve(process.env.SAAS_SESSION_DIR || join(process.cwd(), '.data', 'saas-sessions'))
const file = (id: string) =>
  join(directory(), `${createHash('sha256').update(id).digest('hex')}.json`)
const sessionId = (event: H3Event) => {
  const id = getCookie(event, cookieName)
  if (!id || !/^[a-zA-Z0-9_-]{43}$/.test(id)) return saasFailure(401, 'authentication_required')
  return id
}
const locked = async <T>(id: string, operation: () => Promise<T>): Promise<T> => {
  const previous = queues.get(id) ?? Promise.resolve()
  const pending = previous.catch(() => undefined).then(operation)
  queues.set(id, pending)
  try {
    return await pending
  } finally {
    if (queues.get(id) === pending) queues.delete(id)
  }
}
const remove = async (id: string) => {
  try {
    await unlink(file(id))
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }
}
const load = async (id: string): Promise<PrivateSession> => {
  try {
    const session = sessionSchema.parse(JSON.parse(await readFile(file(id), 'utf8')))
    if (session.expiresAt <= Date.now()) {
      await remove(id)
      return saasFailure(401, 'authentication_required')
    }
    return session
  } catch (error) {
    if ((error as { statusCode?: number }).statusCode === 401) throw error
    return saasFailure(401, 'authentication_required')
  }
}
const persist = async (id: string, session: PrivateSession) => {
  await mkdir(directory(), { recursive: true, mode: 0o700 })
  const temporary = `${file(id)}.${randomBytes(12).toString('hex')}.tmp`
  try {
    await writeFile(temporary, JSON.stringify(session), { mode: 0o600, flag: 'wx' })
    await rename(temporary, file(id))
  } finally {
    try {
      await unlink(temporary)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    }
  }
}
const tokenData = (value: unknown, email: string, existingRefresh = '') => {
  const result = z
    .object({ token: z.string().min(1), refresh_token: z.string().optional() })
    .safeParse(value)
  if (!result.success) return saasFailure(502, 'upstream_invalid')
  try {
    const parts = result.data.token.split('.')
    if (parts.length !== 3) return saasFailure(502, 'upstream_invalid')
    const claims = z
      .object({
        exp: z.number(),
        username: z.string().optional(),
        roles: z.array(z.string()).optional(),
      })
      .parse(JSON.parse(Buffer.from(parts[1]!, 'base64url').toString()))
    if (
      claims.exp * 1000 <= Date.now() ||
      (claims.username && claims.username.toLowerCase() !== email)
    )
      return saasFailure(502, 'upstream_invalid')
    return {
      token: result.data.token,
      refreshToken: result.data.refresh_token ?? existingRefresh,
      tokenExpiresAt: claims.exp * 1000,
      platformAdmin:
        saasConfig().platformEmails.includes(email) ||
        Boolean(claims.roles?.includes('ROLE_SUPER_ADMIN')),
    }
  } catch {
    return saasFailure(502, 'upstream_invalid')
  }
}
const refresh = (id: string, previousToken: string) =>
  locked(id, async () => {
    const current = await load(id)
    if (current.token !== previousToken && current.tokenExpiresAt > Date.now() + 5000)
      return current
    if (!current.refreshToken) return saasFailure(401, 'authentication_required')
    const value = await nativeRequest('/api/auth/refresh', '', {
      method: 'POST',
      body: { refresh_token: current.refreshToken },
    })
    const session = { ...current, ...tokenData(value, current.email, current.refreshToken) }
    await persist(id, session)
    return session
  })
export const clearSaasSession = async (event: H3Event) => {
  const id = getCookie(event, cookieName)
  if (id && /^[a-zA-Z0-9_-]{43}$/.test(id)) await locked(id, () => remove(id))
  deleteCookie(event, cookieName, { path: '/api/saas' })
}
export const loginSaas = async (event: H3Event, email: string, password: string) => {
  const value = await nativeRequest('/api/auth/login', '', {
    method: 'POST',
    body: { email, password },
  })
  const privateTokens = tokenData(value, email)
  await clearSaasSession(event)
  const id = randomBytes(32).toString('base64url')
  await persist(id, { email, ...privateTokens, expiresAt: Date.now() + 8 * 60 * 60 * 1000 })
  setCookie(event, cookieName, id, {
    path: '/api/saas',
    httpOnly: true,
    sameSite: 'lax',
    secure: saasConfig().secure,
    maxAge: 8 * 60 * 60,
  })
  return { ok: true }
}
export const readSaasSession = async (event: H3Event) => {
  try {
    const id = sessionId(event)
    const session = await load(id)
    if (session.tokenExpiresAt <= Date.now() + 5000) return await refresh(id, session.token)
    return session
  } catch (error) {
    if ((error as { statusCode?: number }).statusCode === 401) await clearSaasSession(event)
    throw error
  }
}
export const authorizedSaasRequest = async (
  event: H3Event,
  path: string,
  options: { method?: string; body?: unknown } = {},
) => {
  const session = await readSaasSession(event)
  try {
    return await nativeRequest(path, session.token, options)
  } catch (error) {
    if ((error as { statusCode?: number }).statusCode !== 401) throw error
    try {
      const renewed = await refresh(sessionId(event), session.token)
      return await nativeRequest(path, renewed.token, options)
    } catch (refreshError) {
      if ((refreshError as { statusCode?: number }).statusCode === 401)
        await clearSaasSession(event)
      throw refreshError
    }
  }
}
