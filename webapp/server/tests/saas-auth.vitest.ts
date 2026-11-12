import type { AddressInfo } from 'node:net'

import { createHash } from 'node:crypto'
import { mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { createApp, createRouter, toNodeListener } from 'h3'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import login from '../api/saas/auth/login.post'
import logout from '../api/saas/auth/logout.post'
import forgot from '../api/saas/auth/password/forgot.post'
import session from '../api/saas/auth/session.get'
import invite from '../api/saas/organizations/[organizationId]/invitations.post'
import members from '../api/saas/organizations/[organizationId]/members.get'
import projects from '../api/saas/organizations/[organizationId]/projects.get'
import organizations from '../api/saas/organizations/index.get'
import createOrganization from '../api/saas/organizations/index.post'
import createProject from '../api/saas/projects/index.post'

const target = vi.hoisted(() => ({ id: 'dashboard' }))
vi.mock('#site', () => ({ default: target }))
const org = '11111111-1111-4111-8111-111111111111'
const otherOrg = '22222222-2222-4222-8222-222222222222'
const project = '33333333-3333-4333-8333-333333333333'
const deniedProject = '44444444-4444-4444-8444-444444444444'
const userId = '55555555-5555-4555-8555-555555555555'
const email = 'editor@example.test'
const requestFetch = globalThis.fetch
const upstream = vi.fn<typeof fetch>()
const jwt = (who = email, seconds = 3600) =>
  [
    Buffer.from('{}').toString('base64url'),
    Buffer.from(
      JSON.stringify({
        username: who,
        exp: Math.floor(Date.now() / 1000) + seconds,
        roles: ['ROLE_USER'],
      }),
    ).toString('base64url'),
    'fixture-signature',
  ].join('.')
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
const router = createRouter()
router
  .post('/api/saas/auth/login', login)
  .post('/api/saas/auth/logout', logout)
  .get('/api/saas/auth/session', session)
router.post('/api/saas/auth/password/forgot', forgot)
router
  .get('/api/saas/organizations', organizations)
  .post('/api/saas/organizations', createOrganization)
router.get('/api/saas/organizations/:organizationId/projects', projects)
router.get('/api/saas/organizations/:organizationId/members', members)
router.post('/api/saas/organizations/:organizationId/invitations', invite)
router.post('/api/saas/projects', createProject)
const server = createServer(toNodeListener(createApp().use(router)))
let base = ''
let directory = ''
let token = ''
const call = async (
  path: string,
  options: { method?: string; body?: unknown; cookie?: string; origin?: string } = {},
) => {
  const response = await requestFetch(base + '/api/saas' + path, {
    method: options.method ?? 'GET',
    headers: {
      Origin: options.origin ?? 'http://dashboard.test',
      ...(options.cookie ? { Cookie: options.cookie } : {}),
      ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
  })
  return { response, body: await response.json() }
}
const loginAs = async (who = email) => {
  const result = await call('/auth/login', {
    method: 'POST',
    body: { email: who, password: 'fixture-password' },
  })
  expect(result.response.status).toBe(200)
  return result.response.headers.get('set-cookie')!.split(';')[0]!
}
const storedPath = (cookie: string) =>
  join(directory, createHash('sha256').update(cookie.split('=')[1]!).digest('hex') + '.json')

beforeAll(async () => {
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
})
afterAll(async () => {
  server.closeAllConnections()
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  )
})
beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), 'saas-auth-'))
  vi.stubEnv('SAAS_ORIGIN', 'http://dashboard.test')
  vi.stubEnv('SYMFONY_API_URL', 'http://symfony.test')
  vi.stubEnv('SAAS_SESSION_DIR', directory)
  vi.stubEnv('SAAS_PLATFORM_ADMIN_EMAILS', 'admin@example.test')
  vi.stubGlobal('fetch', upstream)
  target.id = 'dashboard'
  token = jwt()
  upstream.mockReset()
  upstream.mockImplementation(async (input, init) => {
    const url = new URL(String(input))
    expect(url.origin).toBe('http://symfony.test')
    if (url.pathname === '/api/auth/login') {
      const body = JSON.parse(String(init?.body))
      token = jwt(body.email)
      return json({ token, refresh_token: 'private-refresh' })
    }
    expect(new Headers(init?.headers).get('Authorization')).toBe(`Bearer ${token}`)
    if (url.pathname === '/api/organizations')
      return json({ member: [{ id: org, name: 'Client A' }] })
    if (url.pathname.endsWith('/members')) return json({ detail: 'denied' }, 403)
    return json({ detail: 'not found' }, 404)
  })
})
afterEach(async () => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  await rm(directory, { recursive: true, force: true })
})

describe('SaaS BFF — vrais handlers H3, API native simulée', () => {
  it('garde les jetons hors du navigateur et écrit une session privée', async () => {
    const result = await call('/auth/login', {
      method: 'POST',
      body: { email, password: 'fixture-password' },
    })
    expect(result.body).toEqual({ ok: true })
    const cookie = result.response.headers.get('set-cookie')!
    expect(cookie).toMatch(/gd_saas=[A-Za-z0-9_-]{43};/)
    expect(cookie).toContain('HttpOnly')
    expect(cookie).toContain('SameSite=Lax')
    expect(cookie).toContain('Path=/api/saas')
    expect(cookie).not.toContain(token)
    const stored = JSON.parse(await readFile(storedPath(cookie.split(';')[0]!), 'utf8'))
    expect(stored.token).toBe(token)
    expect(stored).not.toHaveProperty('password')
    expect((await stat(storedPath(cookie.split(';')[0]!))).mode & 0o777).toBe(0o600)
    const view = await call('/auth/session', { cookie: cookie.split(';')[0] })
    expect(view.body).toEqual({
      user: { id: email, email, platformAdmin: false },
      capabilities: { invitations: false, passwordReset: false, memberRemoval: false },
    })
    expect(view.response.headers.get('cache-control')).toContain('no-store')
  })

  it('refuse CSRF, paramètres supplémentaires et cibles publiques avant appel API', async () => {
    expect(
      (await call('/auth/login', { method: 'POST', origin: 'https://evil.test', body: {} }))
        .response.status,
    ).toBe(403)
    expect(
      (
        await call('/auth/login', {
          method: 'POST',
          body: { email, password: 'p', apiUrl: 'https://evil.test' },
        })
      ).response.status,
    ).toBe(400)
    target.id = 'showcase-immobilier'
    expect((await call('/auth/session')).response.status).toBe(404)
    expect(upstream).not.toHaveBeenCalled()
  })

  it('ne masque pas un mauvais mot de passe ni une panne et ne divulgue pas la réponse amont', async () => {
    upstream.mockResolvedValue(json({ detail: 'secret upstream diagnostic' }, 401))
    const denied = await call('/auth/login', { method: 'POST', body: { email, password: 'wrong' } })
    expect(denied.response.status).toBe(401)
    expect(JSON.stringify(denied.body)).not.toContain('secret')
    upstream.mockResolvedValue(json({ detail: 'secret' }, 500))
    expect(
      (await call('/auth/login', { method: 'POST', body: { email, password: 'p' } })).response
        .status,
    ).toBe(502)
    expect(await readdir(directory)).toEqual([])
  })

  it('filtre les projets par organisation ET accès éditorial natif', async () => {
    const cookie = await loginAs()
    upstream.mockImplementation(async (input) => {
      const path = new URL(String(input)).pathname
      if (path === '/api/organizations') return json([{ id: org, name: 'Client A' }])
      if (path === '/api/projects')
        return json({
          'hydra:member': [
            { id: project, name: 'Allowed', organization: `/api/organizations/${org}` },
            { id: deniedProject, name: 'Denied', organization: `/api/organizations/${org}` },
            { id: userId, name: 'Other', organization: `/api/organizations/${otherOrg}` },
          ],
        })
      return path.includes(project) ? json({ member: [] }) : json({}, 403)
    })
    const result = await call(`/organizations/${org}/projects`, { cookie })
    expect(result.body).toEqual({
      items: [{ id: project, name: 'Allowed' }],
      page: 1,
      pageSize: 20,
      total: 1,
      hasNext: false,
    })
    expect((await call(`/organizations/${otherOrg}/projects`, { cookie })).response.status).toBe(
      404,
    )
    expect((await call(`/organizations/${org}/members`, { cookie })).response.status).toBe(403)
  })

  it('suit la pagination Hydra relative et refuse une destination étrangère', async () => {
    const cookie = await loginAs()
    upstream.mockImplementation(async (input) => {
      const url = new URL(String(input))
      if (url.pathname.endsWith('/members')) return json([], 200)
      return json({
        member: [{ id: url.search ? otherOrg : org, name: 'Client' }],
        view: url.search ? {} : { next: '?page=2' },
      })
    })
    const result = await call('/organizations?page=2&pageSize=1', { cookie })
    expect(result.body).toEqual({
      items: [{ id: otherOrg, name: 'Client', canManageMembers: true }],
      total: 2,
      page: 2,
      pageSize: 1,
      hasNext: false,
    })
    upstream.mockResolvedValue(
      json({ member: [], view: { next: 'https://evil.test/api/organizations' } }),
    )
    expect((await call('/organizations', { cookie })).response.status).toBe(502)
    expect(
      upstream.mock.calls.every(([url]) => String(url).startsWith('http://symfony.test/')),
    ).toBe(true)
  })

  it('réserve les créations à l’équipe et transmet une IRI native pour le projet', async () => {
    const cookie = await loginAs()
    expect(
      (await call('/organizations', { cookie, method: 'POST', body: { name: 'New' } })).response
        .status,
    ).toBe(403)
    const admin = await loginAs('admin@example.test')
    upstream.mockImplementation(async (input, init) => {
      const path = new URL(String(input)).pathname
      if (init?.method === 'POST') {
        if (path === '/api/projects')
          expect(JSON.parse(String(init.body))).toEqual({
            name: 'New project',
            organization: `/api/organizations/${org}`,
          })
        return json(
          { id: project, name: path === '/api/projects' ? 'New project' : 'New org' },
          201,
        )
      }
      return json([{ id: org, name: 'Client' }])
    })
    expect(
      (await call('/organizations', { cookie: admin, method: 'POST', body: { name: 'New org' } }))
        .body,
    ).toEqual({ id: project, name: 'New org' })
    expect(
      (
        await call('/projects', {
          cookie: admin,
          method: 'POST',
          body: { name: 'New project', organizationId: org },
        })
      ).response.status,
    ).toBe(200)
    upstream.mockResolvedValue(json({}, 403))
    expect(
      (await call('/organizations', { cookie: admin, method: 'POST', body: { name: 'New' } }))
        .response.status,
    ).toBe(403)
  })

  it('renouvelle une seule fois les jetons simultanés et persiste leur rotation', async () => {
    const cookie = await loginAs()
    const path = storedPath(cookie)
    const stored = JSON.parse(await readFile(path, 'utf8'))
    stored.tokenExpiresAt = Date.now() - 1
    await writeFile(path, JSON.stringify(stored))
    upstream.mockImplementation(async (input, init) => {
      if (String(input).endsWith('/auth/refresh')) {
        expect(JSON.parse(String(init?.body))).toEqual({ refresh_token: 'private-refresh' })
        await new Promise((resolve) => setTimeout(resolve, 20))
        token = jwt(email, 7200)
        return json({ token, refresh_token: 'rotated-private-refresh' })
      }
      expect(new Headers(init?.headers).get('Authorization')).toBe(`Bearer ${token}`)
      return json([])
    })
    const results = await Promise.all([
      call('/auth/session', { cookie }),
      call('/auth/session', { cookie }),
    ])
    expect(results.map((result) => result.response.status)).toEqual([200, 200])
    expect(
      upstream.mock.calls.filter(([url]) => String(url).endsWith('/auth/refresh')),
    ).toHaveLength(1)
    expect(JSON.parse(await readFile(path, 'utf8')).refreshToken).toBe('rotated-private-refresh')
  })

  it('supprime une session dont le renouvellement est refusé', async () => {
    const cookie = await loginAs()
    const path = storedPath(cookie)
    const stored = JSON.parse(await readFile(path, 'utf8'))
    stored.tokenExpiresAt = Date.now() - 1
    await writeFile(path, JSON.stringify(stored))
    upstream.mockResolvedValue(json({}, 401))
    const result = await call('/auth/session', { cookie })
    expect(result.response.status).toBe(401)
    expect(result.response.headers.get('set-cookie')).toContain('Max-Age=0')
    expect(await readdir(directory)).toEqual([])
  })

  it('retente après un 401 natif puis efface la session si le jeton renouvelé est refusé', async () => {
    const cookie = await loginAs()
    upstream.mockImplementation(async (input) =>
      String(input).endsWith('/auth/refresh') ? json({ token: jwt(email, 7200) }) : json({}, 401),
    )
    expect((await call('/auth/session', { cookie })).response.status).toBe(401)
    expect(await readdir(directory)).toEqual([])
    expect(
      upstream.mock.calls.filter(([url]) => String(url).endsWith('/auth/refresh')),
    ).toHaveLength(1)
  })

  it('invalide la session au logout et refuse sa réutilisation', async () => {
    const cookie = await loginAs()
    expect((await call('/auth/logout', { method: 'POST', cookie })).body).toEqual({ ok: true })
    expect((await call('/auth/session', { cookie })).response.status).toBe(401)
    expect(await readdir(directory)).toEqual([])
  })

  it('ne simule pas les invitations et récupérations absentes de l’API', async () => {
    expect(
      (await call(`/organizations/${org}/invitations`, { method: 'POST', body: {} })).response
        .status,
    ).toBe(401)
    const cookie = await loginAs()
    upstream.mockClear()
    expect(
      (await call(`/organizations/${org}/invitations`, { method: 'POST', cookie, body: {} }))
        .response.status,
    ).toBe(501)
    expect(
      (await call('/auth/password/forgot', { method: 'POST', body: { email } })).response.status,
    ).toBe(501)
    expect(upstream.mock.calls.every(([, init]) => init?.method === 'GET')).toBe(true)
  })

  it('revérifie les accès natifs et refuse un contexte étranger même sur une action indisponible', async () => {
    const cookie = await loginAs()
    expect(
      (await call(`/organizations/${otherOrg}/invitations`, { method: 'POST', cookie, body: {} }))
        .response.status,
    ).toBe(404)
    upstream.mockImplementation(async () => json([], 200))
    expect((await call(`/organizations/${org}/projects`, { cookie })).response.status).toBe(404)
    expect((await call('/organizations?pageSize=101', { cookie })).response.status).toBe(400)
  })

  it('efface une session expirée et refuse un cookie forgé sans contacter Symfony', async () => {
    const cookie = await loginAs()
    const path = storedPath(cookie)
    const stored = JSON.parse(await readFile(path, 'utf8'))
    stored.expiresAt = Date.now() - 1
    await writeFile(path, JSON.stringify(stored))
    upstream.mockClear()
    expect((await call('/auth/session', { cookie })).response.status).toBe(401)
    expect((await call('/auth/session', { cookie: 'gd_saas=forged' })).response.status).toBe(401)
    expect(await readdir(directory)).toEqual([])
    expect(upstream).not.toHaveBeenCalled()
  })

  it('active Secure en HTTPS et refuse un JWT amont incohérent', async () => {
    vi.stubEnv('SAAS_ORIGIN', 'https://dashboard.test')
    const result = await call('/auth/login', {
      origin: 'https://dashboard.test',
      method: 'POST',
      body: { email, password: 'p' },
    })
    expect(result.response.headers.get('set-cookie')).toContain('Secure')
    upstream.mockResolvedValue(json({ token: jwt('someone-else@example.test') }))
    expect(
      (
        await call('/auth/login', {
          origin: 'https://dashboard.test',
          method: 'POST',
          body: { email, password: 'p' },
        })
      ).response.status,
    ).toBe(502)
  })
})
