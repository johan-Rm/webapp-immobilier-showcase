import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { nativeRequest } from '../utils/saas/auth/runtime'

vi.mock('#site', () => ({ default: { id: 'dashboard' } }))

const upstream = vi.fn<typeof fetch>()

beforeEach(() => {
  vi.stubEnv('SAAS_ORIGIN', 'http://dashboard.test')
  vi.stubEnv('SYMFONY_API_URL', 'http://upstream.test')
  vi.stubGlobal('fetch', upstream)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  upstream.mockReset()
})

describe('frontière HTTP du BFF avec un amont simulé', () => {
  it.each([401, 403, 404, 409, 422, 429])('conserve le refus métier HTTP %i', async (status) => {
    upstream.mockResolvedValue(new Response('{}', { status }))
    await expect(nativeRequest('/api/projects', 'fixture-token')).rejects.toMatchObject({
      statusCode: status,
    })
  })

  it('distingue indisponibilité réseau et erreur serveur amont', async () => {
    upstream.mockRejectedValueOnce(new TypeError('fixture connection unavailable'))
    await expect(nativeRequest('/api/projects')).rejects.toMatchObject({
      statusCode: 503,
      data: { code: 'upstream_unavailable' },
    })
    upstream.mockResolvedValueOnce(new Response('{}', { status: 500 }))
    await expect(nativeRequest('/api/projects')).rejects.toMatchObject({ statusCode: 502 })
  })

  it.each(['https://foreign.test/api/projects', '//foreign.test/api/projects', '/private'])(
    'ne contacte pas une destination hors contrat : %s',
    async (path) => {
      await expect(nativeRequest(path)).rejects.toMatchObject({
        statusCode: 502,
        data: { code: 'upstream_invalid' },
      })
      expect(upstream).not.toHaveBeenCalled()
    },
  )

  it('transmet le jeton seulement à l’amont prévu et refuse les redirections', async () => {
    upstream.mockResolvedValue(new Response('{"items":[]}', { status: 200 }))
    await expect(nativeRequest('/api/projects', 'fixture-token')).resolves.toEqual({ items: [] })
    expect(upstream).toHaveBeenCalledWith(
      new URL('http://upstream.test/api/projects'),
      expect.objectContaining({
        redirect: 'error',
        headers: expect.objectContaining({ Authorization: 'Bearer fixture-token' }),
      }),
    )
  })
})
