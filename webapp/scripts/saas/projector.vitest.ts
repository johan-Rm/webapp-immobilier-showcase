import { mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { projectionConfig } from './config'
import { digest, publicArticleSchema, stableJson } from './contract'
import { runProjection } from './projector'
import { projectionPaths, readProjection } from './storage'

const projectId = '10000000-0000-4000-8000-000000000001'
const articleId = '10000000-0000-4000-8000-000000000002'
const mediaId = '10000000-0000-4000-8000-000000000003'
const roots: string[] = []
afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})
const fixture = async () => {
  const root = await mkdtemp(join(tmpdir(), 'saas-projector-'))
  roots.push(root)
  const config = projectionConfig(
    {
      SAAS_PROJECTION_PROJECT_ID: projectId,
      SAAS_PROJECTION_SECRET: 's'.repeat(32),
      SAAS_DASHBOARD_URL: 'http://dashboard.internal',
      SAAS_DASHBOARD_ORIGIN: 'https://dashboard.example.com',
      SAAS_PROJECTION_SOURCE_ORIGIN: 'https://api.example.com',
    },
    root,
  )
  const article = (locale: 'fr' | 'en' | 'es') =>
    publicArticleSchema.parse({
      id: articleId,
      projectId,
      snapshotId: `10000000-0000-4000-8000-00000000000${locale === 'fr' ? 4 : locale === 'en' ? 5 : 6}`,
      publishedAt: '2026-11-12T10:00:00.000Z',
      locale,
      headline: 'Titre',
      slug: 'titre',
      summary: 'Résumé',
      primaryImage: { mediaId, alt: 'Photo' },
      metaTitle: 'SEO',
      metaDescription: 'Description SEO',
      content: { schemaVersion: 1, blocks: [] },
      categories: [],
    })
  const asset = { id: mediaId, sourcePath: '/images/photo.png', mimeType: 'image/png' }
  const queue = {
    schemaVersion: 1,
    projectId,
    target: 'client2-immobilier',
    sourceOrigin: config.sourceOrigin,
    generation: 1,
    appliedGeneration: 0,
    entries: [
      { article: article('fr'), assets: [asset] },
      { article: article('en'), assets: [asset] },
    ],
    commands: [],
  }
  const bytes = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 1, 2, 3])
  const calls: { url: string; init?: RequestInit }[] = []
  let mediaOk = true,
    ackOk = true,
    refresh: (() => void) | undefined
  const transport = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    calls.push({ url, init })
    if (url.endsWith('/queue')) return Response.json(queue)
    if (url.endsWith('/ack')) {
      const body = JSON.parse(String(init?.body))
      return Response.json(body, { status: ackOk ? 200 : 503 })
    }
    if (url === config.sourceOrigin + asset.sourcePath) {
      refresh?.()
      return new Response(mediaOk ? bytes : 'bad', { headers: { 'Content-Type': 'image/png' } })
    }
    throw new Error('unexpected destination')
  }) as typeof fetch
  return {
    config,
    root,
    queue,
    bytes,
    calls,
    transport,
    article,
    setMedia: (ok: boolean) => {
      mediaOk = ok
    },
    setAck: (ok: boolean) => {
      ackOk = ok
    },
    onMedia: (fn: () => void) => {
      refresh = fn
    },
  }
}

describe('projection publiée atomique', () => {
  it('publie deux langues, index SEO et média partagé sans transmettre le secret à Symfony', async () => {
    const f = await fixture()
    expect((await runProjection(f.config, false, f.transport)).state).toBe('applied')
    const stored = await readProjection(f.config)
    expect(stored?.manifest.indexes.fr).toHaveLength(1)
    expect(stored?.manifest.indexes.en).toHaveLength(1)
    expect(stored?.manifest.indexes.es).toEqual([])
    expect(stored?.manifest.articles[0]?.metaTitle).toBe('SEO')
    expect(stored?.manifest.media).toHaveLength(1)
    expect(stored?.manifest.media[0]?.sha256).toBe(digest(f.bytes))
    const media = f.calls.find((c) => c.url.includes('/images/'))
    expect(media?.init?.headers).toEqual({ Accept: 'image/png' })
    expect(f.calls.find((c) => c.url.endsWith('/ack'))?.init?.headers).toMatchObject({
      Origin: f.config.dashboardOrigin,
      Authorization: `Bearer ${f.config.secret}`,
    })
  })
  it('conserve les blocs ordonnés et vérifie aussi les médias de galerie', async () => {
    const f = await fixture()
    const blocks = [
      {
        id: 'intro',
        type: 'text',
        document: {
          type: 'doc',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Article publié' }] }],
        },
      },
      { id: 'photo', type: 'image', mediaId, alt: 'Image', caption: 'Légende' },
      { id: 'gallery', type: 'gallery', items: [{ mediaId, alt: 'Galerie', caption: 'Suite' }] },
    ]
    for (const entry of f.queue.entries) {
      entry.article.primaryImage = null
      entry.article.content = publicArticleSchema.shape.content.parse({ schemaVersion: 1, blocks })
    }
    await runProjection(f.config, false, f.transport)
    expect((await readProjection(f.config))?.manifest.articles[0]?.content.blocks).toEqual(blocks)
    f.queue.generation = 2
    f.queue.entries[0]!.assets = []
    await expect(runProjection(f.config, false, f.transport)).rejects.toMatchObject({
      code: 'invalid_projection',
    })
  })
  it('dry-run valide sans écriture, média ni accusé', async () => {
    const f = await fixture()
    expect(await runProjection(f.config, true, f.transport)).toMatchObject({
      state: 'dry-run',
      articles: 2,
      media: 1,
    })
    expect(await readdir(f.root)).toEqual([])
    expect(f.calls).toHaveLength(1)
  })
  it('rejoue sans télécharger ni réécrire, même après échec de l’accusé', async () => {
    const f = await fixture()
    f.setAck(false)
    expect((await runProjection(f.config, false, f.transport)).state).toBe('ack-pending')
    const before = await readFile(projectionPaths(f.config).pointer, 'utf8')
    f.calls.length = 0
    f.setAck(true)
    expect((await runProjection(f.config, false, f.transport)).state).toBe('applied')
    expect(f.calls.map((c) => c.url.split('/').at(-1))).toEqual(['queue', 'ack'])
    expect(await readFile(projectionPaths(f.config).pointer, 'utf8')).toBe(before)
  })
  it('dépublie une langue puis toutes les traductions sans altérer l’ancienne version', async () => {
    const f = await fixture()
    await runProjection(f.config, false, f.transport)
    const previous = await readProjection(f.config)
    f.queue.generation = 2
    f.queue.entries = f.queue.entries.filter((e) => e.article.locale === 'fr')
    await runProjection(f.config, false, f.transport)
    expect((await readProjection(f.config))?.manifest.indexes.en).toEqual([])
    expect(
      JSON.parse(await readFile(join(previous!.release, 'manifest.json'), 'utf8')).articles,
    ).toHaveLength(2)
    f.queue.generation = 3
    f.queue.entries = []
    await runProjection(f.config, false, f.transport)
    expect((await readProjection(f.config))?.manifest).toMatchObject({
      articles: [],
      media: [],
      indexes: { fr: [], en: [], es: [] },
    })
  })
  it('garde le pointeur valide en cas de média invalide puis réussit la reprise', async () => {
    const f = await fixture()
    await runProjection(f.config, false, f.transport)
    const before = await readFile(projectionPaths(f.config).pointer, 'utf8')
    f.queue.generation = 2
    f.setMedia(false)
    await expect(runProjection(f.config, false, f.transport)).rejects.toMatchObject({
      code: 'asset_unavailable',
    })
    expect(await readFile(projectionPaths(f.config).pointer, 'utf8')).toBe(before)
    expect(JSON.parse(String(f.calls.at(-1)?.init?.body))).toMatchObject({
      generation: 2,
      state: 'failed',
      errorCode: 'asset_unavailable',
    })
    f.setMedia(true)
    expect((await runProjection(f.config, false, f.transport)).state).toBe('applied')
  })
  it('refuse une source modifiée pendant les téléchargements', async () => {
    const f = await fixture()
    f.onMedia(() => {
      f.queue.generation = 2
    })
    await expect(runProjection(f.config, false, f.transport)).rejects.toMatchObject({
      code: 'source_changed',
    })
    expect(await readProjection(f.config)).toBeNull()
  })
  it('refuse le retour à une génération antérieure et le changement silencieux du même numéro', async () => {
    const f = await fixture()
    await runProjection(f.config, false, f.transport)
    f.queue.entries[0]!.article.headline = 'Modification'
    await expect(runProjection(f.config, false, f.transport)).rejects.toMatchObject({
      code: 'generation_content_conflict',
    })
    f.queue.generation = 0
    f.queue.entries = []
    await expect(runProjection(f.config, false, f.transport)).rejects.toMatchObject({
      code: 'generation_regression',
    })
  })
  it.each(['project', 'origin', 'traversal', 'draft', 'duplicate', 'orphan'] as const)(
    'refuse un export invalide : %s',
    async (kind) => {
      const f = await fixture()
      if (kind === 'project') f.queue.projectId = '10000000-0000-4000-8000-000000000009'
      if (kind === 'origin') f.queue.sourceOrigin = 'https://foreign.example.com'
      if (kind === 'traversal') f.queue.entries[0]!.assets[0]!.sourcePath = '/images/../private'
      if (kind === 'draft') Object.assign(f.queue.entries[0]!.article, { generated: true })
      if (kind === 'duplicate') f.queue.entries.push(f.queue.entries[0]!)
      if (kind === 'orphan') f.queue.entries[0]!.article.primaryImage = null
      await expect(runProjection(f.config, false, f.transport)).rejects.toMatchObject({
        code: 'invalid_projection',
      })
      expect(await readdir(f.root)).toEqual([])
      expect(f.calls).toHaveLength(1)
    },
  )
  it('refuse les liens symboliques et les racines hors application', async () => {
    const f = await fixture()
    await symlink(f.root, join(f.root, '.data'))
    await expect(runProjection(f.config, false, f.transport)).rejects.toMatchObject({
      code: 'unsafe_path',
    })
    expect(() =>
      projectionConfig(
        {
          SAAS_PROJECTION_PROJECT_ID: projectId,
          SAAS_PROJECTION_SECRET: 's'.repeat(32),
          SAAS_PROJECTION_ROOT: '../outside',
        },
        f.root,
      ),
    ).toThrow('unsafe_path')
  })
  it('refuse un média actif corrompu avant de confirmer ou remplacer la projection', async () => {
    const f = await fixture()
    await runProjection(f.config, false, f.transport)
    const stored = await readProjection(f.config)
    await writeFile(join(stored!.release, stored!.manifest.media[0]!.path), 'corrupt')
    f.calls.length = 0
    await expect(runProjection(f.config, false, f.transport)).rejects.toMatchObject({
      code: 'invalid_current_projection',
    })
    expect(f.calls).toHaveLength(1)
  })
  it('reprend une version complète laissée sans pointeur après interruption', async () => {
    const f = await fixture()
    await runProjection(f.config, false, f.transport)
    const before = await readFile(projectionPaths(f.config).pointer, 'utf8')
    await rm(projectionPaths(f.config).pointer)
    await runProjection(f.config, false, f.transport)
    expect(await readFile(projectionPaths(f.config).pointer, 'utf8')).toBe(before)
    expect(await readdir(projectionPaths(f.config).releases)).toHaveLength(1)
  })
  it('sérialise les exécutions concurrentes et conserve le verrou étranger', async () => {
    const f = await fixture()
    let release!: () => void, entered!: () => void
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    const ready = new Promise<void>((resolve) => {
      entered = resolve
    })
    const delayed = (async (input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input).includes('/images/')) {
        entered()
        await gate
      }
      return f.transport(input, init)
    }) as typeof fetch
    const running = runProjection(f.config, false, delayed)
    await ready
    await expect(runProjection(f.config, false, f.transport)).rejects.toMatchObject({
      code: 'projection_busy',
    })
    expect(await readdir(projectionPaths(f.config).lock)).toEqual(['owner.json'])
    release()
    await running
    await expect(readdir(projectionPaths(f.config).lock)).rejects.toMatchObject({ code: 'ENOENT' })
  })
  it('rend la signature indépendante de l’ordre des propriétés JSON', () => {
    expect(stableJson({ b: 1, a: 2 })).toBe(stableJson({ a: 2, b: 1 }))
  })
})
