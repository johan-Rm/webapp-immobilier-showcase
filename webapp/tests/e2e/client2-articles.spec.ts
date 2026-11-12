import { randomUUID } from 'node:crypto'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { join, resolve, relative, dirname } from 'node:path'

import { expect, test } from '@playwright/test'

import { projectionConfig } from '../../scripts/saas/config'
import { digest, manifestSchema } from '../../scripts/saas/contract'
import { activateProjection } from '../../scripts/saas/storage'
import { saasWriteTranslationSchema } from '../../shared/schemas'

test.describe('articles Client 2 sur projection isolée', () => {
  test.skip(
    process.env.WEB005_E2E_FIXTURES !== '1',
    'Nécessite un SSR isolé configuré avec WEB005_E2E_FIXTURES=1 et SAAS_PROJECTION_ROOT=.tmp/web005-browser.',
  )
  test('SSR, SEO, blocs, aperçu privé et dépublication', async ({ page, request }) => {
    const projectId = '10000000-0000-4000-8000-000000000001',
      articleId = '10000000-0000-4000-8000-000000000002',
      mediaId = '10000000-0000-4000-8000-000000000003'
    const root = resolve(process.cwd(), process.env.SAAS_PROJECTION_ROOT || '')
    expect(relative(process.cwd(), root).startsWith('.tmp/web005-')).toBe(true)
    const secret = process.env.SAAS_PREVIEW_SECRET || ''
    const config = projectionConfig({
      SAAS_PROJECTION_PROJECT_ID: projectId,
      SAAS_PROJECTION_SECRET: secret,
      SAAS_PROJECTION_ROOT: root,
      SAAS_DASHBOARD_URL: 'http://fixture.invalid',
      SAAS_DASHBOARD_ORIGIN: 'http://fixture.invalid',
      SAAS_PROJECTION_SOURCE_ORIGIN: 'http://fixture.invalid',
    })
    const article = (locale: 'fr' | 'en') => ({
      id: articleId,
      projectId,
      snapshotId: locale === 'fr' ? articleId : mediaId,
      publishedAt: '2026-11-12T10:00:00.000Z',
      locale,
      headline: locale === 'fr' ? 'Article publié' : 'Published article',
      slug: 'article-publie',
      summary: 'Résumé public',
      primaryImage: { mediaId, alt: 'Image principale' },
      categories: [],
      metaTitle: locale === 'fr' ? 'Titre SEO publié' : 'Published SEO title',
      metaDescription: 'Description SEO publiée',
      content: {
        schemaVersion: 1,
        blocks: [
          {
            id: 'text',
            type: 'text',
            document: {
              type: 'doc',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Premier bloc' }] }],
            },
          },
          { id: 'image', type: 'image', mediaId, alt: 'Image du texte', caption: 'Légende' },
          {
            id: 'gallery',
            type: 'gallery',
            items: [{ mediaId, alt: 'Photo galerie', caption: 'Galerie' }],
          },
        ],
      },
    })
    const publish = async (locales: ('fr' | 'en')[], generation: number) => {
      const stage = join(root, 'client2-immobilier', '.stage-' + randomUUID())
      await mkdir(join(stage, 'media'), { recursive: true })
      const bytes = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aJe0AAAAASUVORK5CYII=',
        'base64',
      )
      const hash = digest(bytes)
      const path = `media/${mediaId}-${hash}.png`
      if (locales.length) await writeFile(join(stage, path), bytes)
      const articles = locales.map(article)
      await activateProjection(
        config,
        stage,
        manifestSchema.parse({
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
          media: locales.length
            ? [{ id: mediaId, path, mimeType: 'image/png', sha256: hash, bytes: bytes.length }]
            : [],
        }),
      )
    }
    const origins = new Set<string>()
    const errors: string[] = []
    page.on('request', (req) => origins.add(new URL(req.url()).origin))
    page.on('pageerror', (error) => errors.push(error.message))
    await mkdir(dirname(root), { recursive: true })
    await mkdir(root)
    try {
      await publish(['fr', 'en'], 1)
      expect((await page.goto('/fr/articles'))?.status()).toBe(200)
      await page.getByRole('link', { name: 'Article publié', exact: true }).click()
      await expect(page.getByRole('heading', { name: 'Article publié', exact: true })).toBeVisible()
      await expect(page).toHaveTitle('Titre SEO publié')
      await expect(page.locator('html')).toHaveAttribute('lang', 'fr')
      await expect(page.locator('meta[name="description"]')).toHaveAttribute(
        'content',
        'Description SEO publiée',
      )
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        'href',
        /\/fr\/articles\/article-publie$/,
      )
      await expect(page.getByAltText('Photo galerie')).toBeVisible()
      expect(await page.locator('.article-content img').count()).toBe(3)
      await expect
        .poll(() =>
          page
            .locator('.article-content img')
            .evaluateAll((images) =>
              images.every(
                (image) =>
                  image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0,
              ),
            ),
        )
        .toBe(true)
      const ssr = await request.get('/fr/articles/article-publie')
      expect(await ssr.text()).toContain('Premier bloc')
      expect(ssr.headers()['cache-control']).toBe('no-store')
      await page.goto('/en/articles/article-publie')
      await expect(page).toHaveTitle('Published SEO title')
      await expect(page.locator('html')).toHaveAttribute('lang', 'en')
      expect((await request.get('/es/articles/article-publie')).status()).toBe(404)
      const source = article('fr')
      const { id, projectId: project, categories } = source
      const translation = saasWriteTranslationSchema.strip().parse(source)
      translation.headline = 'Brouillon privé'
      const body = {
        schemaVersion: 1,
        target: 'client2-immobilier',
        projectId: project,
        articleId: id,
        locale: 'fr',
        revision: 'draft',
        translation,
        categories,
        media: [
          {
            id: mediaId,
            src: `/api/saas/projects/${project}/articles/${id}/translations/fr/preview/media/${mediaId}`,
          },
        ],
      }
      expect((await request.post('/api/saas-preview', { data: body })).status()).toBe(401)
      const preview = await request.post('/api/saas-preview', {
        data: body,
        headers: { Authorization: 'Bearer ' + secret },
      })
      expect(preview.status()).toBe(200)
      expect(await preview.text()).toContain('Brouillon privé')
      expect(preview.headers()['x-robots-tag']).toContain('noindex')
      expect(await (await request.get('/fr/articles/article-publie')).text()).not.toContain(
        'Brouillon privé',
      )
      await publish(['fr'], 2)
      expect((await request.get('/en/articles/article-publie')).status()).toBe(404)
      await publish([], 3)
      const removed = await request.get('/fr/articles/article-publie')
      expect(removed.status()).toBe(404)
      expect(await removed.text()).not.toContain('Titre SEO publié')
      await page.goto('/fr/articles')
      await expect(page.getByText('Aucun article publié pour le moment.')).toBeVisible()
      expect(errors).toEqual([])
      expect(origins.size).toBe(1)
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })
})
