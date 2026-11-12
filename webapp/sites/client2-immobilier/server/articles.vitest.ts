import type { AddressInfo } from 'node:net'

import { randomUUID } from 'node:crypto'
import { mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { join } from 'node:path'

import { createApp, createRouter, toNodeListener } from 'h3'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { projectionConfig } from '../../../scripts/saas/config'
import { manifestSchema, digest } from '../../../scripts/saas/contract'
import { activateProjection } from '../../../scripts/saas/storage'

import detail from './api/articles/[locale]/[slug].get'
import list from './api/articles/[locale]/index.get'
import preview from './api/saas-preview.post'
import mediaHandler from './routes/article-media/[release]/[file].get'

import { saasWriteTranslationSchema } from '#shared/schemas'

const projectId = '10000000-0000-4000-8000-000000000001'
const articleId = '10000000-0000-4000-8000-000000000002'
const mediaId = '10000000-0000-4000-8000-000000000003'
const secret = 'preview-secret-fixture-012345678901234567'
const httpFetch = fetch
const router = createRouter()
  .get('/api/articles/:locale', list)
  .get('/api/articles/:locale/:slug', detail)
  .post('/api/saas-preview', preview)
  .get('/article-media/:release/:file', mediaHandler)
const server = createServer(toNodeListener(createApp().use(router)))
let base = '',
  directory = ''
const article = (locale: 'fr' | 'en' = 'fr') => ({
  id: articleId,
  projectId,
  snapshotId: locale === 'fr' ? articleId : mediaId,
  publishedAt: '2026-11-12T10:00:00.000Z',
  locale,
  headline: 'Titre <script>alert(1)</script>',
  slug: 'titre',
  summary: 'Résumé',
  primaryImage: { mediaId, alt: 'Une image' },
  metaTitle: 'SEO publié',
  metaDescription: 'Description SEO',
  categories: [{ id: articleId, label: 'Actualités' }],
  content: {
    schemaVersion: 1 as const,
    blocks: [
      {
        id: 'intro',
        type: 'text' as const,
        document: {
          type: 'doc' as const,
          content: [
            {
              type: 'paragraph' as const,
              content: [{ type: 'text' as const, text: 'Contenu publié' }],
            },
          ],
        },
      },
      { id: 'image', type: 'image' as const, mediaId, alt: 'Image du texte', caption: 'Légende' },
      {
        id: 'gallery',
        type: 'gallery' as const,
        items: [{ mediaId, alt: 'Galerie', caption: 'Suite' }],
      },
    ],
  },
})
const prepare = async (articles: ReturnType<typeof article>[] = [article()], generation = 1) => {
  const root = join(process.cwd(), directory, 'client2-immobilier')
  const stage = join(root, '.stage-' + randomUUID())
  await mkdir(join(stage, 'media'), { recursive: true })
  const bytes = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 1, 2, 3])
  const sha256 = digest(bytes)
  const path = `media/${mediaId}-${sha256}.png`
  if (articles.length) await writeFile(join(stage, path), bytes)
  const manifest = manifestSchema.parse({
    schemaVersion: 1,
    projectId,
    target: 'client2-immobilier',
    generation,
    sourceVersion: 'a'.repeat(64),
    articles,
    indexes: {
      fr: articles
        .filter((a) => a.locale === 'fr')
        .map((a) => ({ id: a.id, slug: a.slug, snapshotId: a.snapshotId })),
      en: articles
        .filter((a) => a.locale === 'en')
        .map((a) => ({ id: a.id, slug: a.slug, snapshotId: a.snapshotId })),
      es: [],
    },
    media: articles.length
      ? [{ id: mediaId, path, mimeType: 'image/png', sha256, bytes: bytes.length }]
      : [],
  })
  const config = projectionConfig({
    SAAS_PROJECTION_PROJECT_ID: projectId,
    SAAS_PROJECTION_SECRET: secret,
    SAAS_PROJECTION_ROOT: directory,
    SAAS_DASHBOARD_URL: 'http://fixture.invalid',
    SAAS_DASHBOARD_ORIGIN: 'http://fixture.invalid',
    SAAS_PROJECTION_SOURCE_ORIGIN: 'http://fixture.invalid',
  })
  return activateProjection(config, stage, manifest)
}
const payload = () => {
  const source = article()
  const { id, projectId: project, categories } = source
  const translation = saasWriteTranslationSchema.strip().parse(source)
  return {
    schemaVersion: 1,
    target: 'client2-immobilier',
    projectId: project,
    articleId: id,
    locale: 'fr',
    revision: 'revision-fixture',
    translation,
    categories,
    media: [
      {
        id: mediaId,
        src: `/api/saas/projects/${project}/articles/${id}/translations/fr/preview/media/${mediaId}`,
      },
    ],
  }
}
const post = (value: unknown, authorization = 'Bearer ' + secret) =>
  httpFetch(base + '/api/saas-preview', {
    method: 'POST',
    headers: { Authorization: authorization, 'Content-Type': 'application/json' },
    body: JSON.stringify(value),
  })
beforeAll(async () => {
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  base = 'http://127.0.0.1:' + (server.address() as AddressInfo).port
})
afterAll(async () => {
  server.closeAllConnections()
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  )
})
beforeEach(() => {
  directory = '.tmp/client2-' + randomUUID()
  vi.stubEnv('SAAS_PROJECTION_ROOT', directory)
  vi.stubEnv('SAAS_PROJECTION_PROJECT_ID', projectId)
  vi.stubEnv('SAAS_PREVIEW_SECRET', secret)
})
afterEach(async () => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
  await rm(join(process.cwd(), directory), { recursive: true, force: true })
})

describe('articles Client 2', () => {
  it('liste et ouvre seulement les traductions publiées, sans appel réseau amont', async () => {
    await prepare([article('fr'), article('en')])
    const upstream = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('API interdite'))
    const response = await httpFetch(base + '/api/articles/fr/titre')
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    const value = await response.json()
    expect(value.article.metaTitle).toBe('SEO publié')
    expect(value.locales).toHaveLength(2)
    expect(value.article.content.blocks.map((b: { id: string }) => b.id)).toEqual([
      'intro',
      'image',
      'gallery',
    ])
    expect((await (await httpFetch(base + '/api/articles/en')).json()).articles).toHaveLength(1)
    expect((await httpFetch(base + '/api/articles/es/titre')).status).toBe(404)
    expect((await httpFetch(base + '/api/articles/de')).status).toBe(404)
    expect((await httpFetch(base + '/api/articles/fr/inconnu')).status).toBe(404)
    expect(upstream).not.toHaveBeenCalled()
  })
  it('sert les octets vérifiés avec cache immuable et refuse les fichiers inconnus', async () => {
    const pointer = await prepare()
    const value = await (await httpFetch(base + '/api/articles/fr/titre')).json()
    const response = await httpFetch(base + value.media[mediaId])
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('image/png')
    expect(response.headers.get('cache-control')).toContain('immutable')
    expect(
      (await httpFetch(base + '/article-media/' + pointer.release + '/foreign.png')).status,
    ).toBe(404)
  })
  it('dépublication retire la fiche et la liste sans fallback', async () => {
    await prepare()
    await prepare([], 2)
    expect((await httpFetch(base + '/api/articles/fr/titre')).status).toBe(404)
    expect((await (await httpFetch(base + '/api/articles/fr')).json()).articles).toEqual([])
  })
  it('remplace le slug sans conserver une ancienne route publique', async () => {
    await prepare()
    const changed = article()
    changed.slug = 'nouveau-slug'
    await prepare([changed], 2)
    expect((await httpFetch(base + '/api/articles/fr/titre')).status).toBe(404)
    expect((await httpFetch(base + '/api/articles/fr/nouveau-slug')).status).toBe(200)
  })
  it('refuse une projection corrompue ou appartenant à un autre projet', async () => {
    const pointer = await prepare()
    const file = join(
      process.cwd(),
      directory,
      'client2-immobilier/releases',
      pointer.release,
      'manifest.json',
    )
    await writeFile(file, (await readFile(file, 'utf8')) + ' ')
    expect((await httpFetch(base + '/api/articles/fr')).status).toBe(503)
    vi.stubEnv('SAAS_PROJECTION_PROJECT_ID', mediaId)
    expect((await httpFetch(base + '/api/articles/fr')).status).toBe(503)
  })
  it('refuse un dossier symbolique', async () => {
    await mkdir(join(process.cwd(), directory), { recursive: true })
    await symlink(process.cwd(), join(process.cwd(), directory, 'client2-immobilier'))
    expect((await httpFetch(base + '/api/articles/fr')).status).toBe(503)
  })
  it('rend le brouillon privé avec les mêmes blocs et échappe le HTML', async () => {
    const response = await post(payload())
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(response.headers.get('x-robots-tag')).toContain('noindex')
    const html = await response.text()
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
    expect(html).not.toContain('<script>')
    expect(html).toContain('article-gallery')
    expect(html).toContain('preview/media/' + mediaId)
    expect(html).not.toContain('revision-fixture')
    expect(html).not.toContain('rel="canonical"')
  })
  it.each(['', 'Bearer incorrect'])('refuse l’aperçu sans secret valide : %s', async (auth) => {
    expect((await post(payload(), auth)).status).toBe(401)
  })
  it('refuse projet étranger, langue incohérente et média externe', async () => {
    const foreign = payload()
    foreign.projectId = mediaId
    expect((await post(foreign)).status).toBe(403)
    const language = payload()
    language.locale = 'en'
    expect((await post(language)).status).toBe(403)
    const external = payload()
    external.media[0]!.src = 'https://external.invalid/image.png'
    expect((await post(external)).status).toBe(400)
  })
  it('refuse un lien exécutable dans le texte', async () => {
    const value = payload()
    Object.assign(value.translation.content.blocks[0]!, {
      document: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'clic',
                marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }],
              },
            ],
          },
        ],
      },
    })
    expect((await post(value)).status).toBe(400)
  })
})
