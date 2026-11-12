import type { SaasArticleWrite } from '#shared/types/saas/article'
import type { nativeArticleSchema } from '../utils/saas/articles/model'
import type { AddressInfo } from 'node:net'
import type { z } from 'zod'

import { createHash, randomUUID } from 'node:crypto'
import { mkdir, mkdtemp, readFile, rm, stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { join } from 'node:path'

import { createApp, createRouter, toNodeListener } from 'h3'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import login from '../api/saas/auth/login.post'
import articleRead from '../api/saas/projects/[projectId]/articles/[articleId]/index.get'
import previewMedia from '../api/saas/projects/[projectId]/articles/[articleId]/translations/[locale]/preview/media/[mediaId].get'
import preview from '../api/saas/projects/[projectId]/articles/[articleId]/translations/[locale]/preview.get'
import unpublish from '../api/saas/projects/[projectId]/articles/[articleId]/translations/[locale]/publication.delete'
import publish from '../api/saas/projects/[projectId]/articles/[articleId]/translations/[locale]/publication.post'
import articleSave from '../api/saas/projects/[projectId]/articles/[articleId]/translations/[locale].put'
import ack from '../api/saas/projects/[projectId]/publication/ack.post'
import queue from '../api/saas/projects/[projectId]/publication/queue.get'

import { saasArticleSchema } from '#shared/schemas'

type NativeArticle = z.infer<typeof nativeArticleSchema>
vi.mock('#site', () => ({ default: { id: 'dashboard' } }))
const projectId = '11111111-1111-4111-8111-111111111111'
const articleId = '22222222-2222-4222-8222-222222222222'
const categoryId = '33333333-3333-4333-8333-333333333333'
const mediaId = '44444444-4444-4444-8444-444444444444'
const foreignId = '55555555-5555-4555-8555-555555555555'
const workerSecret = 'fixture-projection-secret-0123456789012345'
const previewSecret = 'fixture-preview-secret-012345678901234567'
const token = [
  Buffer.from('{}').toString('base64url'),
  Buffer.from(
    JSON.stringify({ username: 'editor@example.test', exp: Math.floor(Date.now() / 1000) + 3600 }),
  ).toString('base64url'),
  'fixture-signature',
].join('.')
const httpFetch = globalThis.fetch
const upstream = vi.fn<typeof fetch>()
const json = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } })
const imageBytes = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0])
const router = createRouter()
const prefix = '/api/saas/projects/:projectId'
router.post('/api/saas/auth/login', login)
router
  .get(prefix + '/articles/:articleId', articleRead)
  .put(prefix + '/articles/:articleId/translations/:locale', articleSave)
router
  .post(prefix + '/articles/:articleId/translations/:locale/publication', publish)
  .delete(prefix + '/articles/:articleId/translations/:locale/publication', unpublish)
router.get(prefix + '/articles/:articleId/translations/:locale/preview', preview)
router.get(
  prefix + '/articles/:articleId/translations/:locale/preview/media/:mediaId',
  previewMedia,
)
router.get(prefix + '/publication/queue', queue).post(prefix + '/publication/ack', ack)
const server = createServer(toNodeListener(createApp().use(router)))
let base = ''
let cookie = ''
let directory = ''
let article: NativeArticle
let serial = 0
let readable = true
let writable = true
let ready = true
let renderDown = false
let apiFailure: '' | 'before' | 'after' | 'mismatch' = ''
let categoryProject = projectId
let mediaPath = '/images/photo.png'
let rendered: Record<string, unknown> | null = null
let sawDurableIntent = false
const translation = (
  locale: 'fr' | 'en' | 'es',
  headline = `Brouillon ${locale.toUpperCase()}`,
): SaasArticleWrite['translation'] => ({
  locale,
  headline,
  slug: 'article-' + locale,
  summary: 'Résumé ' + locale,
  primaryImage: { mediaId, alt: 'Photo' },
  metaTitle: 'SEO ' + locale,
  metaDescription: 'Description ' + locale,
  content: {
    schemaVersion: 1,
    blocks: [
      {
        id: 'txt',
        type: 'text',
        document: {
          type: 'doc',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Texte ' + locale }] }],
        },
      },
    ],
  },
})
const path = (suffix = '') => `/projects/${projectId}${suffix}`
const pubPath = (locale = 'fr') => path(`/articles/${articleId}/translations/${locale}/publication`)
const previewPath = (locale = 'fr') => path(`/articles/${articleId}/translations/${locale}/preview`)
const journalPath = () => join(directory, projectId + '.json')
const call = async (
  route: string,
  options: {
    method?: string
    body?: unknown
    key?: string
    revision?: string
    worker?: boolean
    secret?: string
    cookie?: string
    origin?: string
  } = {},
) => {
  const response = await httpFetch(base + '/api/saas' + route, {
    method: options.method ?? 'GET',
    headers: {
      Origin: options.origin ?? 'http://dashboard.test',
      Cookie: options.cookie ?? cookie,
      ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(options.key ? { 'Idempotency-Key': options.key } : {}),
      ...(options.revision ? { 'If-Match': options.revision } : {}),
      ...(options.worker ? { Authorization: 'Bearer ' + (options.secret ?? workerSecret) } : {}),
    },
    ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
  })
  const bytes = Buffer.from(await response.arrayBuffer())
  const isJson = response.headers.get('content-type')?.includes('json')
  return {
    status: response.status,
    headers: response.headers,
    body: isJson ? JSON.parse(bytes.toString()) : bytes.toString(),
    bytes,
  }
}
const current = async () =>
  saasArticleSchema.parse((await call(path('/articles/' + articleId))).body)
const publication = async (
  locale = 'fr',
  action = 'publish',
  key = randomUUID(),
  revision?: string,
) =>
  call(pubPath(locale), {
    method: action === 'publish' ? 'POST' : 'DELETE',
    key,
    revision: revision ?? (await current()).revision,
  })
const putCount = () =>
  upstream.mock.calls.filter(
    ([url, init]) => String(url).includes('/articles/') && init?.method === 'PUT',
  ).length

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
  await mkdir(join(process.cwd(), '.data'), { recursive: true })
  directory = await mkdtemp(join(process.cwd(), '.data', 'saas-publication-test-'))
  vi.stubEnv('SAAS_ORIGIN', 'http://dashboard.test')
  vi.stubEnv('SYMFONY_API_URL', 'http://symfony.test')
  vi.stubEnv('SAAS_SESSION_DIR', join(directory, 'sessions'))
  vi.stubEnv('SAAS_PUBLICATION_DIR', directory)
  vi.stubEnv('SAAS_PUBLICATION_PROJECTS', JSON.stringify({ [projectId]: 'client2-immobilier' }))
  vi.stubEnv('SAAS_PROJECTION_SECRET', workerSecret)
  vi.stubEnv('SAAS_PREVIEW_SECRET', previewSecret)
  vi.stubEnv('SAAS_CLIENT2_PREVIEW_ORIGIN', 'http://client2.test')
  readable = true
  writable = true
  ready = true
  renderDown = false
  apiFailure = ''
  serial = 0
  categoryProject = projectId
  mediaPath = '/images/photo.png'
  rendered = null
  sawDurableIntent = false
  article = {
    id: articleId,
    project: projectId,
    status: 'draft',
    updatedAt: '2026-11-12T10:00:00Z',
    translations: ['fr', 'en', 'es'].map((value) => {
      const locale = value as 'fr' | 'en' | 'es'
      const t = translation(locale)
      return {
        locale,
        headline: t.headline,
        slug: t.slug,
        body: 'Texte ' + locale,
        schemaData: {
          external: { preserved: true },
          gdSaas: {
            schemaVersion: 1,
            categoryIds: [categoryId],
            authoredLocales: ['fr', 'en'],
            summary: t.summary,
            primaryImage: t.primaryImage,
            metaTitle: t.metaTitle,
            metaDescription: t.metaDescription,
            content: t.content,
            published: null,
          },
        },
      }
    }),
  }
  vi.stubGlobal('fetch', upstream)
  upstream.mockReset()
  upstream.mockImplementation(async (input, init) => {
    const url = new URL(String(input))
    if (url.origin === 'http://client2.test') {
      expect(url.pathname).toBe('/api/saas-preview')
      expect(init?.method).toBe('POST')
      expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer ' + previewSecret)
      rendered = JSON.parse(String(init?.body)) as Record<string, unknown>
      if (renderDown) throw new Error('Renderer unavailable')
      return new Response('<!doctype html><html lang="fr"><h1>Aperçu du brouillon</h1></html>', {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    }
    expect(url.origin).toBe('http://symfony.test')
    if (url.pathname === '/api/auth/login') return json({ token, refresh_token: 'private-refresh' })
    expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer ' + token)
    if (url.pathname === '/api/projects')
      return json({
        member: [{ id: projectId, sourceLocale: 'fr', enabledLocales: ['fr', 'en', 'es'] }],
      })
    if (!readable) return json({}, 403)
    if (url.pathname === '/images/photo.png')
      return new Response(imageBytes, { headers: { 'Content-Type': 'image/png' } })
    if (!url.pathname.startsWith(`/api/projects/${projectId}/`)) return json({}, 404)
    if (url.pathname.endsWith('/articles'))
      return json({ member: [{ id: articleId, project: projectId }] })
    if (url.pathname.includes('/category-codes/'))
      return json({
        id: categoryId,
        project: categoryProject,
        inCodeSet: 'article-category',
        updatedAt: 'now',
        translations: ['fr', 'en', 'es'].map((locale) => ({
          locale,
          label: 'Label ' + locale,
          text: 'Affichage ' + locale,
        })),
      })
    if (url.pathname.includes('/media-objects/'))
      return json({
        id: mediaId,
        project: projectId,
        mimeType: 'image/png',
        contentUrl: mediaPath,
        status: ready ? 'ready' : 'pending_analysis',
        caption: 'Photo',
        checksumSha256: createHash('sha256')
          .update('original upload before watermark')
          .digest('hex'),
      })
    if (url.pathname.includes('/articles/')) {
      if (init?.method === 'PUT') {
        const journal = JSON.parse(await readFile(journalPath(), 'utf8'))
        sawDurableIntent = Object.values(journal.jobs).some(
          (job) =>
            typeof job === 'object' && job !== null && 'phase' in job && job.phase === 'prepared',
        )
        if (!writable) return json({ detail: 'private diagnostic' }, 403)
        if (apiFailure === 'before') throw new Error('Network before write')
        const payload = JSON.parse(String(init.body)) as {
          translations: NativeArticle['translations']
        }
        for (const change of payload.translations) {
          const t = article.translations.find((t) => t.locale === change.locale)!
          if (apiFailure !== 'mismatch') Object.assign(t, structuredClone(change))
        }
        article.updatedAt = `2026-11-12T10:00:${String(++serial).padStart(2, '0')}Z`
        if (apiFailure === 'after') throw new Error('Network after write')
      }
      if (init?.method === 'POST') {
        const payload = JSON.parse(String(init.body)) as {
          translations: NativeArticle['translations']
        }
        for (const change of payload.translations)
          Object.assign(
            article.translations.find((t) => t.locale === change.locale)!,
            structuredClone(change),
          )
        article.updatedAt = `2026-11-12T10:00:${String(++serial).padStart(2, '0')}Z`
      }
      return json(structuredClone(article))
    }
    return json({}, 404)
  })
  const response = await httpFetch(base + '/api/saas/auth/login', {
    method: 'POST',
    headers: { Origin: 'http://dashboard.test', 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'editor@example.test', password: 'fixture-password' }),
  })
  expect(response.status).toBe(200)
  cookie = response.headers.get('set-cookie')!.split(';')[0]!
  upstream.mockClear()
})
afterEach(async () => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  await rm(directory, { recursive: true, force: true })
})

describe('Publication privée — vrais handlers H3, services simulés', () => {
  it('publie une seule langue en snapshot, journalise avant l’API et annonce seulement pending', async () => {
    const result = await publication()
    expect(result.status).toBe(202)
    expect(result.body.projection).toEqual({ generation: 1, state: 'pending', errorCode: null })
    expect(sawDurableIntent).toBe(true)
    const read = await current()
    expect(read.translations.find((t) => t.draft.locale === 'fr')?.published?.translation).toEqual(
      translation('fr'),
    )
    expect(
      read.translations.filter((t) => t.draft.locale !== 'fr').every((t) => t.published === null),
    ).toBe(true)
    expect(article.status).toBe('draft')
    expect((await stat(journalPath())).mode & 0o777).toBe(0o600)
    const stored = await readFile(journalPath(), 'utf8')
    expect(stored).not.toContain(token)
    expect(stored).not.toContain('private-refresh')
    expect(stored).not.toContain('Brouillon EN')
  })
  it('préserve le snapshot pendant l’édition puis dépublie une langue sans toucher les autres', async () => {
    await publication('fr')
    await publication('en')
    const before = await current()
    const write = { categoryIds: [categoryId], translation: translation('fr', 'SECRET NEW DRAFT') }
    const saved = await call(path(`/articles/${articleId}/translations/fr`), {
      method: 'PUT',
      body: write,
      revision: before.revision,
    })
    expect(saved.status).toBe(200)
    const read = await current()
    expect(
      read.translations.find((t) => t.draft.locale === 'fr')?.published?.translation.headline,
    ).toBe('Brouillon FR')
    const exported = await call(path('/publication/queue'), { worker: true, cookie: '' })
    expect(JSON.stringify(exported.body)).not.toContain('SECRET NEW DRAFT')
    const removed = await publication('fr', 'unpublish')
    expect(removed.status).toBe(202)
    expect(removed.body.publishedSnapshotId).toBeNull()
    const after = await current()
    expect(after.translations.find((t) => t.draft.locale === 'fr')?.published).toBeNull()
    expect(after.translations.find((t) => t.draft.locale === 'fr')?.draft.headline).toBe(
      'SECRET NEW DRAFT',
    )
    expect(after.translations.find((t) => t.draft.locale === 'en')?.published).not.toBeNull()
    const queue = await call(path('/publication/queue'), { worker: true, cookie: '' })
    expect(
      queue.body.entries.map((e: { article: { locale: string } }) => e.article.locale),
    ).toEqual(['en'])
  })
  it('rejoue une clé sans réécriture et refuse sa réutilisation pour une autre commande', async () => {
    const revision = (await current()).revision
    const key = randomUUID()
    const first = await publication('fr', 'publish', key, revision)
    const second = await publication('fr', 'publish', key, revision)
    expect(second.body).toEqual(first.body)
    expect(putCount()).toBe(1)
    expect((await publication('en', 'publish', key, revision)).body.error.code).toBe(
      'idempotency_conflict',
    )
    expect((await publication('fr', 'unpublish', key, revision)).status).toBe(409)
    expect((await publication('fr', 'publish', randomUUID(), revision)).body.error.code).toBe(
      'revision_conflict',
    )
  })
  it('sérialise les commandes concurrentes avec la même révision', async () => {
    const revision = (await current()).revision
    const results = await Promise.all([
      publication('fr', 'publish', randomUUID(), revision),
      publication('fr', 'publish', randomUUID(), revision),
    ])
    expect(results.map((r) => r.status).sort()).toEqual([202, 409])
    expect(putCount()).toBe(1)
  })
  it('réconcilie un timeout après écriture avec la même clé, sans publier deux fois', async () => {
    const revision = (await current()).revision
    const key = randomUUID()
    apiFailure = 'after'
    expect((await publication('fr', 'publish', key, revision)).status).toBe(503)
    const nativeId = (await current()).translations.find((t) => t.draft.locale === 'fr')?.published
      ?.snapshotId
    const hidden = await call(path('/publication/queue'), { worker: true })
    expect(hidden.body.entries).toEqual([])
    apiFailure = ''
    const retried = await publication('fr', 'publish', key, revision)
    expect(retried.status).toBe(202)
    expect(retried.body.publishedSnapshotId).toBe(nativeId)
    expect(putCount()).toBe(1)
  })
  it('alloue une nouvelle génération lorsqu’une commande incertaine est confirmée tardivement', async () => {
    const revision = (await current()).revision
    const key = randomUUID()
    apiFailure = 'after'
    expect((await publication('fr', 'publish', key, revision)).status).toBe(503)
    apiFailure = ''
    const english = await publication('en')
    expect(english.body.projection.generation).toBe(2)
    await call(path('/publication/ack'), {
      method: 'POST',
      worker: true,
      body: { generation: 2, state: 'applied' },
    })
    const recovered = await publication('fr', 'publish', key, revision)
    expect(recovered.body.projection.generation).toBe(3)
    expect(recovered.body.projection.state).toBe('pending')
    const exported = await call(path('/publication/queue'), { worker: true })
    expect(exported.body.generation).toBe(3)
    expect(exported.body.appliedGeneration).toBe(2)
    expect(exported.body.entries).toHaveLength(2)
  })

  it('reprend un échec avant écriture et conserve la génération de l’intention durable', async () => {
    const revision = (await current()).revision
    const key = randomUUID()
    apiFailure = 'before'
    expect((await publication('fr', 'publish', key, revision)).status).toBe(503)
    apiFailure = ''
    const result = await publication('fr', 'publish', key, revision)
    expect(result.status).toBe(202)
    expect(result.body.projection.generation).toBe(1)
    expect(putCount()).toBe(2)
  })
  it('ne transforme ni un refus natif ni une divergence de persistance en succès', async () => {
    const revision = (await current()).revision
    const key = randomUUID()
    writable = false
    const denied = await publication('fr', 'publish', key, revision)
    expect(denied.status).toBe(403)
    expect(JSON.stringify(denied.body)).not.toContain('private diagnostic')
    writable = true
    expect((await publication('fr', 'publish', key, revision)).status).toBe(403)
    expect(putCount()).toBe(1)
    apiFailure = 'mismatch'
    expect((await publication('fr', 'publish', randomUUID(), revision)).body.error.code).toBe(
      'persistence_mismatch',
    )
    expect((await call(path('/publication/queue'), { worker: true })).body.entries).toEqual([])
  })
  it('exige révision, clé, médias prêts, labels exacts et cible configurée', async () => {
    expect((await call(pubPath(), { method: 'POST' })).status).toBe(400)
    expect((await call(pubPath(), { method: 'POST', key: randomUUID() })).status).toBe(428)
    ready = false
    expect((await publication()).body.error.code).toBe('media_not_ready')
    ready = true
    categoryProject = foreignId
    expect((await publication()).status).toBe(502)
    categoryProject = projectId
    vi.stubEnv('SAAS_PUBLICATION_PROJECTS', '{}')
    expect((await publication()).status).toBe(503)
    expect(putCount()).toBe(0)
  })
  it('refuse un stockage sortant du worktree avant toute mutation Symfony', async () => {
    vi.stubEnv('SAAS_PUBLICATION_DIR', '/tmp/outside-publication')
    expect((await publication()).body.error.code).toBe('publication_storage_unavailable')
    expect(putCount()).toBe(0)
  })
  it('réserve export et accusés au projecteur authentifié et n’exporte aucun brouillon', async () => {
    await publication()
    expect((await call(path('/publication/queue'))).status).toBe(401)
    expect((await call(path('/publication/queue'), { worker: true, secret: 'wrong' })).status).toBe(
      401,
    )
    const exported = await call(path('/publication/queue'), { worker: true, cookie: '' })
    expect(exported.status).toBe(200)
    expect(exported.body.target).toBe('client2-immobilier')
    expect(exported.body.entries).toHaveLength(1)
    expect(Object.keys(exported.body.entries[0].article)).not.toContain('draft')
    expect(Object.keys(exported.body.entries[0].article)).not.toContain('generated')
    expect(exported.body.entries[0].assets[0]).toMatchObject({
      id: mediaId,
      sourcePath: '/images/photo.png',
    })
    expect(JSON.stringify(exported.body)).not.toContain('Brouillon EN')
  })
  it('ne marque applied qu’après un accusé courant et bloque les accusés régressifs', async () => {
    const revision = (await current()).revision
    const key = randomUUID()
    await publication('fr', 'publish', key, revision)
    const accepted = await call(path('/publication/ack'), {
      method: 'POST',
      worker: true,
      cookie: '',
      body: { generation: 1, state: 'applied' },
    })
    expect(accepted.status).toBe(200)
    const retried = await publication('fr', 'publish', key, revision)
    expect(retried.body.projection.state).toBe('applied')
    expect(retried.status).toBe(200)
    expect(
      (
        await call(path('/publication/ack'), {
          method: 'POST',
          worker: true,
          body: { generation: 1, state: 'failed' },
        })
      ).status,
    ).toBe(409)
    await publication('en')
    expect(
      (
        await call(path('/publication/ack'), {
          method: 'POST',
          worker: true,
          body: { generation: 1, state: 'applied' },
        })
      ).status,
    ).toBe(409)
  })
  it('expose un échec de projection puis sa reprise sans nouvelle écriture native', async () => {
    const revision = (await current()).revision
    const key = randomUUID()
    await publication('fr', 'publish', key, revision)
    await call(path('/publication/ack'), {
      method: 'POST',
      worker: true,
      body: { generation: 1, state: 'failed', errorCode: 'asset_unavailable' },
    })
    expect((await publication('fr', 'publish', key, revision)).body.projection).toEqual({
      generation: 1,
      state: 'failed',
      errorCode: 'asset_unavailable',
    })
    await call(path('/publication/ack'), {
      method: 'POST',
      worker: true,
      body: { generation: 1, state: 'applied' },
    })
    expect((await publication('fr', 'publish', key, revision)).body.projection.state).toBe(
      'applied',
    )
    expect(putCount()).toBe(1)
  })
  it('conserve l’accusé d’une génération appliquée lorsqu’une génération suivante échoue', async () => {
    const revision = (await current()).revision
    const key = randomUUID()
    await publication('fr', 'publish', key, revision)
    await call(path('/publication/ack'), {
      method: 'POST',
      worker: true,
      body: { generation: 1, state: 'applied' },
    })
    await publication('en')
    await call(path('/publication/ack'), {
      method: 'POST',
      worker: true,
      body: { generation: 2, state: 'failed', errorCode: 'projection_failed' },
    })
    expect((await publication('fr', 'publish', key, revision)).body.projection.state).toBe(
      'applied',
    )
    expect((await call(path('/publication/queue'), { worker: true })).body.appliedGeneration).toBe(
      1,
    )
  })

  it('rend un aperçu serveur privé avec données exactes et liens médias protégés', async () => {
    const result = await call(previewPath())
    expect(result.status).toBe(200)
    expect(result.body).toContain('Aperçu du brouillon')
    expect(result.headers.get('cache-control')).toContain('no-store')
    expect(result.headers.get('x-robots-tag')).toContain('noindex')
    expect(result.headers.get('content-security-policy')).toContain("default-src 'none'")
    expect(rendered).toMatchObject({
      projectId,
      articleId,
      locale: 'fr',
      translation: translation('fr'),
    })
    expect(JSON.stringify(rendered)).not.toContain(token)
    expect(JSON.stringify(rendered)).not.toContain('Brouillon EN')
    expect(JSON.stringify(rendered)).toContain(previewPath() + '/media/' + mediaId)
    const image = await call(previewPath() + '/media/' + mediaId)
    expect(image.status).toBe(200)
    expect(image.bytes).toEqual(imageBytes)
    expect(image.headers.get('cache-control')).toContain('no-store')
  })
  it('refuse aperçu et médias sans accès courant, sans fallback ni URL arbitraire', async () => {
    expect((await call(previewPath(), { cookie: '' })).status).toBe(401)
    expect(
      (await call(`/projects/${foreignId}/articles/${articleId}/translations/fr/preview`)).status,
    ).toBe(404)
    expect((await call(previewPath() + '/media/' + foreignId)).status).toBe(404)
    readable = false
    expect((await call(previewPath() + '/media/' + mediaId)).status).toBe(403)
    expect(rendered).toBeNull()
    readable = true
    mediaPath = '/images/../secret'
    expect((await call(previewPath())).status).toBe(502)
    mediaPath = '/images/photo.png'
    article.translations = article.translations.filter((t) => t.locale !== 'es')
    expect((await call(previewPath('es'))).body.error.code).toBe('translation_not_found')
  })
  it('signale le renderer absent et refuse les mutations cross-origin', async () => {
    renderDown = true
    expect((await call(previewPath())).body.error.code).toBe('preview_unavailable')
    expect(
      (
        await call(pubPath(), {
          method: 'POST',
          origin: 'https://evil.test',
          key: randomUUID(),
          revision: (await current()).revision,
        })
      ).status,
    ).toBe(403)
    expect(putCount()).toBe(0)
  })
})
