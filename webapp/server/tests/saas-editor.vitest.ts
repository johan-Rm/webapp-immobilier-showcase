import type { SaasArticleWrite } from '#shared/types/saas/article'
import type { nativeArticleSchema } from '../utils/saas/articles/model'
import type { AddressInfo } from 'node:net'
import type { z } from 'zod'

import { mkdtemp, rm } from 'node:fs/promises'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { createApp, createRouter, toNodeListener } from 'h3'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import login from '../api/saas/auth/login.post'
import articleRead from '../api/saas/projects/[projectId]/articles/[articleId]/index.get'
import articleSave from '../api/saas/projects/[projectId]/articles/[articleId]/translations/[locale].put'
import articleList from '../api/saas/projects/[projectId]/articles/index.get'
import articleCreate from '../api/saas/projects/[projectId]/articles/index.post'
import categorySave from '../api/saas/projects/[projectId]/categories/[categoryId]/index.put'
import categoryUsages from '../api/saas/projects/[projectId]/categories/[categoryId]/usages.get'
import categoryList from '../api/saas/projects/[projectId]/categories/index.get'
import categoryCreate from '../api/saas/projects/[projectId]/categories/index.post'
import mediaList from '../api/saas/projects/[projectId]/media/index.get'
import mediaUpload from '../api/saas/projects/[projectId]/media/index.post'

import { saasArticleSchema } from '#shared/schemas'

type NativeArticle = z.infer<typeof nativeArticleSchema>

vi.mock('#site', () => ({ default: { id: 'dashboard' } }))
const projectId = '11111111-1111-4111-8111-111111111111'
const foreignProject = '22222222-2222-4222-8222-222222222222'
const articleId = '33333333-3333-4333-8333-333333333333'
const categoryId = '44444444-4444-4444-8444-444444444444'
const mediaId = '55555555-5555-4555-8555-555555555555'
const newCategoryId = '66666666-6666-4666-8666-666666666666'
const organization = '77777777-7777-4777-8777-777777777777'
const token = [
  Buffer.from('{}').toString('base64url'),
  Buffer.from(
    JSON.stringify({ username: 'editor@example.test', exp: Math.floor(Date.now() / 1000) + 3600 }),
  ).toString('base64url'),
  'fixture-signature',
].join('.')
const httpFetch = globalThis.fetch
const upstream = vi.fn<typeof fetch>()
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
const copy = <T>(value: T): T => structuredClone(value)
const router = createRouter()
router.post('/api/saas/auth/login', login)
const prefix = '/api/saas/projects/:projectId'
router.get(prefix + '/articles', articleList).post(prefix + '/articles', articleCreate)
router
  .get(prefix + '/articles/:articleId', articleRead)
  .put(prefix + '/articles/:articleId/translations/:locale', articleSave)
router.get(prefix + '/categories', categoryList).post(prefix + '/categories', categoryCreate)
router
  .put(prefix + '/categories/:categoryId', categorySave)
  .get(prefix + '/categories/:categoryId/usages', categoryUsages)
router.get(prefix + '/media', mediaList).post(prefix + '/media', mediaUpload)
const server = createServer(toNodeListener(createApp().use(router)))
let base = ''
let directory = ''
let cookie = ''
let serial = 0
let accessible = true
let readable = true
let writable = true
let failWrites = false
let articles: Map<string, NativeArticle>
type Category = {
  id: string
  project: string
  inCodeSet: string
  updatedAt: string
  translations: { locale: string; label: string; text: string | null }[]
}
let categories: Map<string, Category>
let media: {
  id: string
  project: string
  mimeType: string
  status: string
  caption: string
  contentUrl: string
}[]
const path = (suffix = '') => `/projects/${projectId}${suffix}`
const call = async (
  route: string,
  options: {
    method?: string
    body?: unknown
    revision?: string
    cookie?: string
    origin?: string
    multipart?: FormData
  } = {},
) => {
  const response = await httpFetch(base + '/api/saas' + route, {
    method: options.method ?? 'GET',
    headers: {
      Origin: options.origin ?? 'http://dashboard.test',
      Cookie: options.cookie ?? cookie,
      ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(options.revision ? { 'If-Match': options.revision } : {}),
    },
    ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
    ...(options.multipart ? { body: options.multipart } : {}),
  })
  return { status: response.status, body: await response.json() }
}
const write = (headline = 'Article français'): SaasArticleWrite => ({
  categoryIds: [categoryId],
  translation: {
    locale: 'fr',
    headline,
    slug: 'article-francais',
    summary: 'Résumé',
    primaryImage: { mediaId, alt: 'Image principale' },
    metaTitle: 'SEO',
    metaDescription: 'Description SEO',
    content: {
      schemaVersion: 1,
      blocks: [
        {
          id: 'text-1',
          type: 'text',
          document: {
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Texte en français', marks: [{ type: 'bold' }] }],
              },
            ],
          },
        },
        { id: 'image-1', type: 'image', mediaId, alt: 'Détail', caption: 'Photo' },
        { id: 'gallery-1', type: 'gallery', items: [{ mediaId, alt: 'Galerie', caption: 'Vue' }] },
      ],
    },
  },
})
const createArticle = async () => {
  const result = await call(path('/articles'), { method: 'POST', body: write() })
  expect(result.status).toBe(200)
  return saasArticleSchema.parse(result.body)
}
const nativeMutationCount = () =>
  upstream.mock.calls.filter(([, init]) => init?.method === 'POST' || init?.method === 'PUT').length

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
  directory = await mkdtemp(join(tmpdir(), 'saas-editor-'))
  vi.stubEnv('SAAS_ORIGIN', 'http://dashboard.test')
  vi.stubEnv('SYMFONY_API_URL', 'http://symfony.test')
  vi.stubEnv('SAAS_SESSION_DIR', directory)
  vi.stubGlobal('fetch', upstream)
  upstream.mockReset()
  accessible = true
  readable = true
  writable = true
  failWrites = false
  serial = 0
  articles = new Map()
  categories = new Map([
    [
      categoryId,
      {
        id: categoryId,
        project: projectId,
        inCodeSet: 'article-category',
        updatedAt: '2026-11-12T10:00:00Z',
        translations: [{ locale: 'fr', label: 'Voyage', text: 'Voyage' }],
      },
    ],
  ])
  media = [
    {
      id: mediaId,
      project: projectId,
      mimeType: 'image/png',
      status: 'ready',
      caption: 'Image',
      contentUrl: '/media/image.png',
    },
  ]
  upstream.mockImplementation(async (input, init) => {
    const url = new URL(String(input))
    expect(url.origin).toBe('http://symfony.test')
    if (url.pathname === '/api/auth/login') return json({ token, refresh_token: 'fixture-refresh' })
    expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer ' + token)
    if (url.pathname === '/api/projects')
      return json({
        member: accessible
          ? [
              {
                id: projectId,
                organization,
                sourceLocale: 'fr',
                enabledLocales: ['fr', 'en', 'es'],
              },
            ]
          : [],
      })
    const segments = url.pathname.split('/').filter(Boolean)
    if (segments[2] !== projectId) return json({}, 404)
    if (!readable) return json({}, 403)
    const kind = segments[3]
    const id = segments[4]
    if (init?.method === 'POST' || init?.method === 'PUT') {
      if (!writable) return json({ detail: 'private diagnostic' }, 403)
      if (failWrites) return json({ detail: 'private diagnostic' }, 500)
      if (kind === 'articles') {
        const payload = JSON.parse(String(init.body)) as {
          resourceId?: string
          status?: 'draft'
          translations: NativeArticle['translations']
        }
        const existing = payload.resourceId ? articles.get(payload.resourceId) : undefined
        if (payload.resourceId && !existing) return json({}, 404)
        const native: NativeArticle = existing ?? {
          id: articleId,
          project: projectId,
          status: payload.status ?? 'draft',
          updatedAt: '',
          translations: [],
        }
        for (const translation of payload.translations) {
          const found = native.translations.find((t) => t.locale === translation.locale)
          if (found) Object.assign(found, copy(translation))
          else native.translations.push(copy(translation))
        }
        // Simulates the existing API's missing-translation pipeline, not a real translation service.
        const source = native.translations.find((t) => t.locale === 'fr')
        if (source)
          for (const locale of ['en', 'es'])
            if (!native.translations.some((t) => t.locale === locale))
              native.translations.push({
                locale,
                headline: `Generated ${locale}`,
                slug: `generated-${locale}`,
                body: `Generated body ${locale}`,
                schemaData: null,
              })
        native.updatedAt = `2026-11-12T10:00:${String(++serial).padStart(2, '0')}Z`
        articles.set(native.id, native)
        return json(copy(native), 201)
      }
      if (kind === 'category-codes') {
        const payload = JSON.parse(String(init.body)) as {
          inCodeSet?: string
          translations: Category['translations']
        }
        const current =
          id === 'translations'
            ? {
                id: newCategoryId,
                project: projectId,
                inCodeSet: payload.inCodeSet!,
                updatedAt: '',
                translations: [] as Category['translations'],
              }
            : categories.get(id!)!
        for (const translation of payload.translations) {
          const existing = current.translations.find((t) => t.locale === translation.locale)
          if (id !== 'translations') expect(translation).not.toHaveProperty('label')
          if (existing) Object.assign(existing, translation)
          else current.translations.push(copy(translation))
        }
        current.updatedAt = `2026-11-12T11:00:${String(++serial).padStart(2, '0')}Z`
        categories.set(current.id, current)
        return json(copy(current))
      }
      if (kind === 'media-objects') {
        expect(init.body).toBeInstanceOf(FormData)
        const body = init.body as FormData
        expect(JSON.parse(String(body.get('translations')))).toEqual([
          { locale: 'fr', caption: 'Nouvelle photo' },
        ])
        expect((body.get('file') as File).type).toBe('image/png')
        return json(
          {
            ...media[0],
            status: 'pending_watermark',
            caption: undefined,
            translations: [{ locale: 'fr', caption: 'Nouvelle photo' }],
          },
          201,
        )
      }
    }
    if (kind === 'articles') {
      if (!id)
        return json({
          member: copy([...articles.values()].map((a) => ({ id: a.id, project: a.project }))),
        })
      return articles.has(id) ? json(copy(articles.get(id))) : json({}, 404)
    }
    if (kind === 'category-codes')
      return id
        ? categories.has(id)
          ? json(copy(categories.get(id)))
          : json({}, 404)
        : json({
            member: copy(
              [...categories.values()].map((c) => ({
                id: c.id,
                project: c.project,
                inCodeSet: c.inCodeSet,
              })),
            ),
          })
    if (kind === 'media-objects')
      return id
        ? media.some((m) => m.id === id)
          ? json(copy(media.find((m) => m.id === id)))
          : json({}, 404)
        : json({ member: copy(media) })
    return json({}, 404)
  })
  const logged = await httpFetch(base + '/api/saas/auth/login', {
    method: 'POST',
    headers: { Origin: 'http://dashboard.test', 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'editor@example.test', password: 'fixture-password' }),
  })
  expect(logged.status).toBe(200)
  cookie = logged.headers.get('set-cookie')!.split(';')[0]!
  upstream.mockClear()
})
afterEach(async () => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  await rm(directory, { recursive: true, force: true })
})

describe('BFF édition — routes H3 et API native simulée', () => {
  it('crée puis rouvre les champs, références et blocs ordonnés sans publier les traductions générées', async () => {
    const article = await createArticle()
    expect(article.categoryIds).toEqual([categoryId])
    expect(article.translations).toHaveLength(3)
    expect(article.translations.every((t) => t.published === null)).toBe(true)
    expect(article.translations.find((t) => t.draft.locale === 'fr')?.draft).toEqual({
      ...write().translation,
      generated: false,
    })
    expect(article.translations.find((t) => t.draft.locale === 'en')?.draft.generated).toBe(true)
    expect(articles.get(articleId)?.status).toBe('draft')
    const reopened = await call(path('/articles/' + articleId))
    expect(reopened.body).toEqual(article)
    expect((await call(path('/articles?q=fran&pageSize=1'))).body.items).toHaveLength(1)
    expect((await call(path('/articles?q=absent'))).body.items).toEqual([])
  })
  it('préserve JSON externe, snapshots et autres langues lors d’une modification de slug et de blocs', async () => {
    const article = await createArticle()
    const native = articles.get(articleId)!
    const french = native.translations.find((t) => t.locale === 'fr')!
    french.schemaData!.external = { keep: ['untouched'] }
    const snapshot = {
      snapshotId: organization,
      revision: 'published-revision',
      publishedAt: '2026-11-12T09:00:00Z',
      categoryIds: [categoryId],
      translation: write().translation,
    }
    ;(french.schemaData!.gdSaas as Record<string, unknown>).published = snapshot
    native.status = 'published'

    const opened = saasArticleSchema.parse((await call(path('/articles/' + article.id))).body)
    const changed = write('Nouveau titre')
    changed.translation.slug = 'nouveau-slug'
    changed.translation.content.blocks.reverse()
    const saved = await call(path(`/articles/${articleId}/translations/fr`), {
      method: 'PUT',
      body: changed,
      revision: opened.revision,
    })
    expect(saved.status).toBe(200)
    expect(
      saved.body.translations.find((t: { draft: { locale: string } }) => t.draft.locale === 'fr')
        .published,
    ).toEqual(snapshot)
    expect(articles.get(articleId)!.status).toBe('published')

    expect(
      saved.body.translations.find((t: { draft: { locale: string } }) => t.draft.locale === 'fr')
        .draft.slug,
    ).toBe('nouveau-slug')
    expect(
      articles.get(articleId)?.translations.find((t) => t.locale === 'fr')?.schemaData?.external,
    ).toEqual({ keep: ['untouched'] })
    expect(
      saved.body.translations.find((t: { draft: { locale: string } }) => t.draft.locale === 'en')
        .draft.content.blocks[0].document.content[0].content[0].text,
    ).toBe('Generated body en')
    expect((await call(path('/articles/' + articleId))).body).toEqual(saved.body)
  })
  it('bloque les écritures sans révision et les versions périmées', async () => {
    const article = await createArticle()
    upstream.mockClear()
    const route = path(`/articles/${articleId}/translations/fr`)
    const required = await call(route, { method: 'PUT', body: write() })
    expect(required.status).toBe(428)
    expect(required.body.error.code).toBe('revision_required')
    const first = await call(route, {
      method: 'PUT',
      body: write('Premier'),
      revision: article.revision,
    })
    expect(first.status).toBe(200)
    const stale = await call(route, {
      method: 'PUT',
      body: write('Second'),
      revision: article.revision,
    })
    expect(stale.status).toBe(409)
    expect(stale.body.error.code).toBe('revision_conflict')
    expect(nativeMutationCount()).toBe(1)
  })
  it('sérialise deux sauvegardes concurrentes dans le même processus', async () => {
    const article = await createArticle()
    upstream.mockClear()
    const responses = await Promise.all(
      ['Alice', 'Bob'].map((headline) =>
        call(path(`/articles/${articleId}/translations/fr`), {
          method: 'PUT',
          body: write(headline),
          revision: article.revision,
        }),
      ),
    )
    expect(responses.map((r) => r.status).sort()).toEqual([200, 409])
    expect(nativeMutationCount()).toBe(1)
  })
  it('refuse références étrangères et mauvais code set avant la mutation', async () => {
    categories.get(categoryId)!.project = foreignProject
    expect((await call(path('/articles'), { method: 'POST', body: write() })).status).toBe(502)
    categories.get(categoryId)!.project = projectId
    categories.get(categoryId)!.inCodeSet = 'amenity-feature'
    expect((await call(path('/articles'), { method: 'POST', body: write() })).status).toBe(404)
    categories.get(categoryId)!.inCodeSet = 'article-category'
    media[0]!.project = foreignProject
    expect((await call(path('/articles'), { method: 'POST', body: write() })).status).toBe(502)
    expect(nativeMutationCount()).toBe(0)
  })
  it('refuse une locale incohérente, les blocs invalides et les liens dangereux', async () => {
    const bad = write()
    bad.translation.content.blocks = [
      {
        id: 'bad',
        type: 'text',
        document: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'x',
                  marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }],
                },
              ],
            },
          ],
        },
      },
    ]
    expect((await call(path('/articles'), { method: 'POST', body: bad })).status).toBe(400)
    const article = await createArticle()
    upstream.mockClear()
    expect(
      (
        await call(path(`/articles/${articleId}/translations/es`), {
          method: 'PUT',
          body: write(),
          revision: article.revision,
        })
      ).status,
    ).toBe(400)
    expect(nativeMutationCount()).toBe(0)
  })
  it('réévalue les accès natifs et cache les projets étrangers', async () => {
    expect((await call(path('/articles'), { cookie: '' })).status).toBe(401)
    expect((await call(`/projects/${foreignProject}/articles`)).status).toBe(404)
    readable = false
    expect((await call(path('/categories'))).status).toBe(403)
    readable = true
    accessible = false
    expect((await call(path('/media'))).status).toBe(404)
    expect(nativeMutationCount()).toBe(0)
  })
  it('relaie un refus d’écriture et une panne sans succès fictif ni détail privé', async () => {
    writable = false
    const forbidden = await call(path('/articles'), { method: 'POST', body: write() })
    expect(forbidden.status).toBe(403)
    expect(JSON.stringify(forbidden.body)).not.toContain('private diagnostic')
    writable = true
    failWrites = true
    expect((await call(path('/articles'), { method: 'POST', body: write() })).status).toBe(502)
    expect(articles.size).toBe(0)
  })
  it('crée une catégorie du bon ensemble, la recherche puis modifie son texte sans changer son identité', async () => {
    const created = await call(path('/categories'), {
      method: 'POST',
      body: { labels: { fr: 'Nature', en: 'Nature EN' } },
    })
    expect(created.status).toBe(200)
    expect(created.body.labels).toEqual({ fr: 'Nature', en: 'Nature EN' })
    expect((await call(path('/categories?q=Nature'))).body.items[0].id).toBe(newCategoryId)
    const changed = await call(path('/categories/' + newCategoryId), {
      method: 'PUT',
      revision: created.body.revision,
      body: { labels: { fr: 'Nature modifiée', en: 'Nature EN' } },
    })
    expect(changed.status).toBe(200)
    expect(changed.body.labels.fr).toBe('Nature modifiée')
    expect(categories.get(newCategoryId)?.translations.find((t) => t.locale === 'fr')?.label).toBe(
      'Nature',
    )
    expect(
      (
        await call(path('/categories/' + newCategoryId), {
          method: 'PUT',
          revision: created.body.revision,
          body: { labels: { fr: 'Écrasement' } },
        })
      ).status,
    ).toBe(409)
  })
  it('exige le libellé source à la création et affiche les usages réels avant modification', async () => {
    expect(
      (
        await call(path('/categories'), {
          method: 'POST',
          body: { labels: { en: 'English only' } },
        })
      ).body.error.code,
    ).toBe('source_label_required')
    await createArticle()
    const result = await call(path(`/categories/${categoryId}/usages`))
    expect(result.body.items).toEqual([{ id: articleId, headline: 'Article français' }])
  })
  it('importe une image native et conserve son état de traitement', async () => {
    const form = new FormData()
    form.set('locale', 'fr')
    form.set('caption', 'Nouvelle photo')
    form.set(
      'file',
      new Blob([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0])], {
        type: 'image/png',
      }),
      'image.png',
    )
    const result = await call(path('/media'), { method: 'POST', multipart: form })
    expect(result.status).toBe(200)
    expect(result.body).toMatchObject({
      id: mediaId,
      projectId,
      caption: 'Nouvelle photo',
      kind: 'image',
      ready: false,
    })
    expect((await call(path('/media?q=Image'))).body.items[0].ready).toBe(true)
  })
  it('laisse Symfony générer la légende lorsque le champ est vide', async () => {
    const original = upstream.getMockImplementation()!
    upstream.mockImplementation(async (input, init) => {
      if (String(input).includes('/media-objects/translations') && init?.method === 'POST') {
        const form = init.body as FormData
        expect(JSON.parse(String(form.get('translations')))).toEqual([{ locale: 'fr' }])
        return json(
          {
            ...media[0],
            caption: undefined,
            translations: [{ locale: 'fr', caption: 'Légende native' }],
          },
          201,
        )
      }
      return original(input, init)
    })
    const form = new FormData()
    form.set('locale', 'fr')
    form.set('caption', '   ')
    form.set(
      'file',
      new Blob([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])], { type: 'image/png' }),
      'photo.png',
    )
    expect((await call(path('/media'), { method: 'POST', multipart: form })).body.caption).toBe(
      'Légende native',
    )
  })

  it('refuse SVG, faux MIME, champs multipart étrangers et fichiers trop grands', async () => {
    for (const [bytes, mime] of [
      [new TextEncoder().encode('<svg onload="alert(1)"/>'), 'image/svg+xml'],
      [new Uint8Array([1, 2, 3]), 'image/png'],
    ] as const) {
      const form = new FormData()
      form.set('locale', 'fr')
      form.set('file', new Blob([bytes], { type: mime }), 'file.png')
      expect((await call(path('/media'), { method: 'POST', multipart: form })).status).toBe(415)
    }
    const large = new FormData()
    large.set('locale', 'fr')
    large.set(
      'file',
      new Blob([new Uint8Array(12 * 1024 * 1024 + 1)], { type: 'image/png' }),
      'large.png',
    )
    expect((await call(path('/media'), { method: 'POST', multipart: large })).status).toBe(413)
    const extra = new FormData()
    extra.set('locale', 'fr')
    extra.set('projectId', foreignProject)
    expect((await call(path('/media'), { method: 'POST', multipart: extra })).status).toBe(400)
    expect(nativeMutationCount()).toBe(0)
  })
  it('suit les pages natives et refuse qu’un lien Hydra change de projet', async () => {
    await createArticle()
    const original = upstream.getMockImplementation()!
    upstream.mockImplementation(async (input, init) => {
      const url = new URL(String(input))
      if (url.pathname.endsWith('/articles') && (!init?.method || init.method === 'GET')) {
        return url.searchParams.get('page') === '2'
          ? json({ member: [] })
          : json({ member: [{ id: articleId }], view: { next: '?page=2' } })
      }
      return original(input, init)
    })
    expect((await call(path('/articles'))).body.total).toBe(1)
    upstream.mockImplementation(async (input, init) => {
      const url = new URL(String(input))
      if (url.pathname.endsWith('/articles') && (!init?.method || init.method === 'GET'))
        return json({ member: [], view: { next: `/api/projects/${foreignProject}/articles` } })
      return original(input, init)
    })
    const refused = await call(path('/articles'))
    expect(refused.status).toBe(502)
    expect(upstream.mock.calls.every(([url]) => !String(url).includes(foreignProject))).toBe(true)
  })

  it('refuse CSRF et les réponses API inter-projets au chargement', async () => {
    expect(
      (
        await call(path('/articles'), {
          method: 'POST',
          origin: 'https://evil.test',
          body: write(),
        })
      ).status,
    ).toBe(403)
    await createArticle()
    articles.get(articleId)!.project = foreignProject
    expect((await call(path('/articles/' + articleId))).status).toBe(502)
  })
})
