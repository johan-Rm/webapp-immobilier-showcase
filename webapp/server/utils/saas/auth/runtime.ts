import type { H3Event } from 'h3'

import { createError, getHeader, setHeader, setResponseStatus } from 'h3'

import site from '#site'

export const saasFailure = (statusCode: number, code: string): never => {
  throw createError({ statusCode, statusMessage: code, data: { code } })
}

export const saasConfig = () => {
  if (site.id !== 'dashboard') saasFailure(404, 'not_found')
  try {
    const origin = new URL(process.env.SAAS_ORIGIN || process.env.SITE_URL || '')
    const api = new URL(process.env.SYMFONY_API_URL || '')
    for (const url of [origin, api]) {
      if (
        !['http:', 'https:'].includes(url.protocol) ||
        url.username ||
        url.password ||
        url.search ||
        url.hash
      )
        saasFailure(503, 'configuration_unavailable')
    }
    if (origin.pathname !== '/' || api.pathname !== '/')
      saasFailure(503, 'configuration_unavailable')
    const platformEmails = (process.env.SAAS_PLATFORM_ADMIN_EMAILS || '')
      .split(',')
      .map((v) => v.trim().toLowerCase())
      .filter(Boolean)
    return {
      origin: origin.origin,
      api: api.origin,
      secure: origin.protocol === 'https:',
      platformEmails,
    }
  } catch {
    return saasFailure(503, 'configuration_unavailable')
  }
}

export const saasEndpoint = async <T>(event: H3Event, operation: () => Promise<T>) => {
  setHeader(event, 'Cache-Control', 'private, no-store')
  setHeader(event, 'X-Robots-Tag', 'noindex, nofollow')
  try {
    const config = saasConfig()
    if (!['GET', 'HEAD'].includes(event.method) && getHeader(event, 'origin') !== config.origin)
      saasFailure(403, 'forbidden_origin')
    return await operation()
  } catch (error) {
    const failure = error as { statusCode?: number; data?: { code?: string } }
    const status = failure.statusCode ?? 502
    const code = failure.data?.code ?? (status === 400 ? 'invalid_request' : 'upstream_failed')
    setResponseStatus(event, status)
    return { error: { code, message: code } }
  }
}

export const nativeRequest = async (
  path: string,
  token = '',
  options: { method?: string; body?: unknown } = {},
) => {
  const { api } = saasConfig()
  const url = new URL(path, api)
  if (url.origin !== api || !url.pathname.startsWith('/api/') || url.username || url.password)
    saasFailure(502, 'upstream_invalid')
  let response: Response
  try {
    response = await fetch(url, {
      method: options.method ?? 'GET',
      redirect: 'error',
      headers: {
        Accept: 'application/ld+json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
      signal: AbortSignal.timeout(15000),
    })
  } catch {
    return saasFailure(503, 'upstream_unavailable')
  }
  if (!response.ok) {
    const status = [400, 401, 403, 404, 409, 422, 429].includes(response.status)
      ? response.status
      : 502
    const codes: Record<number, string> = {
      400: 'invalid_request',
      401: 'authentication_required',
      403: 'forbidden',
      404: 'not_found',
      409: 'conflict',
      422: 'validation_failed',
      429: 'rate_limited',
    }
    saasFailure(status, codes[status] ?? 'upstream_failed')
  }
  try {
    return (await response.json()) as unknown
  } catch {
    return saasFailure(502, 'upstream_invalid')
  }
}
