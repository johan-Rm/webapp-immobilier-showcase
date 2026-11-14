import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'

// Contract doubles only: these tests prove UI behavior, not real API security or persistence.
const ids = {
  project: '11111111-1111-4111-8111-111111111111',
  other: '22222222-2222-4222-8222-222222222222',
  article: '33333333-3333-4333-8333-333333333333',
  category: '44444444-4444-4444-8444-444444444444',
  media: '55555555-5555-4555-8555-555555555555',
}
const setup = async (page: Page) => {
  const empty = (locale = 'fr', headline = 'Article initial') => ({
    locale,
    headline,
    slug: 'article-initial',
    summary: 'Résumé initial',
    primaryImage: null,
    metaTitle: '',
    metaDescription: '',
    content: { schemaVersion: 1, blocks: [] },
  })
  const article = {
    id: ids.article,
    projectId: ids.project,
    revision: 'r1',
    categoryIds: [] as string[],
    translations: [{ draft: { ...empty(), generated: false }, published: null as unknown }],
  }
  const data = {
    article,
    saved: null as unknown,
    failCategory: false,
    failUpload: false,
    mediaReady: true,
    conflict: false,
    projection: 'applied',
    categoryLabel: 'Actualités',
    publicationKeys: [] as string[],
    publicationRevisions: [] as string[],
    calls: [] as { path: string; method: string }[],
  }
  await page.context().route('**/api/saas/**', async (route) => {
    const req = route.request()
    const url = new URL(req.url())
    const path = url.pathname
    const method = req.method()
    data.calls.push({ path, method })
    const json = (value: unknown, status = 200) => route.fulfill({ json: value, status })
    const collection = (items: unknown[]) =>
      json({ items, page: 1, pageSize: 20, total: items.length, hasNext: false })
    if (path.endsWith('/auth/session'))
      return json({ user: { id: 'user', email: 'editor@example.test', platformAdmin: false } })
    if (path.endsWith('/organizations'))
      return collection([{ id: 'org', name: 'Client pilote', canManageMembers: false }])
    if (path.endsWith('/projects'))
      return collection([
        { id: ids.project, name: 'Client 2' },
        { id: ids.other, name: 'Autre site' },
      ])
    if (path.includes(ids.other)) return collection([])
    if (path.endsWith('/preview'))
      return route.fulfill({
        contentType: 'text/html; charset=utf-8',
        body: '<h1>Aperçu privé simulé</h1>',
      })
    if (path.endsWith('/publication')) {
      data.publicationKeys.push(req.headers()['idempotency-key']!)
      data.publicationRevisions.push(req.headers()['if-match']!)
      const edition = article.translations.find((v) =>
        path.includes(`/translations/${v.draft.locale}/`),
      )!
      edition.published =
        method === 'POST'
          ? {
              snapshotId: ids.article,
              revision: article.revision,
              publishedAt: '2026-11-12T09:00:00Z',
              categoryIds: [...article.categoryIds],
              translation: edition.draft,
            }
          : null
      article.revision = 'published-revision'
      return json(
        {
          articleId: ids.article,
          locale: edition.draft.locale,
          revision: article.revision,
          publishedSnapshotId: method === 'POST' ? ids.article : null,
          projection: { generation: 1, state: data.projection, errorCode: null },
        },
        data.projection === 'pending' ? 202 : 200,
      )
    }
    if (path.endsWith('/usages'))
      return collection([
        { id: ids.article, headline: 'Article initial' },
        { id: 'another', headline: 'Autre article concerné' },
      ])
    if (path.includes('/categories')) {
      if (method === 'GET')
        return collection([
          { id: ids.category, revision: 'c1', labels: { fr: data.categoryLabel } },
        ])
      if (data.failCategory) return json({ error: { code: 'validation_failed' } }, 422)
      const body = req.postDataJSON()
      data.categoryLabel = body.labels.fr
      return json({ id: ids.category, revision: 'c2', labels: body.labels })
    }
    if (path.endsWith('/media')) {
      const media = {
        id: ids.media,
        caption: 'Photo pilote',
        ready: data.mediaReady,
        kind: 'image',
      }
      if (method === 'GET') return collection([media])
      if (data.failUpload) return json({ error: { code: 'validation_failed' } }, 422)
      expect(req.headers()['content-type']).toContain('multipart/form-data')
      return json(media)
    }
    if (path.endsWith('/articles') && method === 'GET') return collection([article])
    if (
      (path.includes('/translations/') && method === 'PUT') ||
      (path.endsWith('/articles') && method === 'POST')
    ) {
      if (data.conflict)
        return json({ error: { code: 'revision_conflict', currentRevision: 'r99' } }, 412)
      if (method === 'PUT') expect(req.headers()['if-match']).toBe(article.revision)
      const body = req.postDataJSON()
      data.saved = body
      article.categoryIds = body.categoryIds
      article.revision = `r-${Date.now()}`
      const previous = article.translations.find((v) => v.draft.locale === body.translation.locale)
      if (previous) previous.draft = { ...body.translation, generated: false }
      else
        article.translations.push({
          draft: { ...body.translation, generated: false },
          published: null,
        })
      return json(article)
    }
    if (path.endsWith(`/articles/${ids.article}`)) return json(article)
    return json({ error: { code: 'not_found' } }, 404)
  })
  await page.goto('/articles')
  await page.waitForFunction(() =>
    Boolean(
      (document.getElementById('__nuxt') as HTMLElement & { __vue_app__?: unknown })?.__vue_app__,
    ),
  )
  await expect(page.getByRole('button', { name: 'Nouvel article' })).toBeVisible()
  return data
}
const open = async (page: Page) => {
  await page.getByRole('button', { name: 'Article initial', exact: true }).click()
  await expect(page.getByLabel('Titre de l’article', { exact: true })).toHaveValue(
    'Article initial',
  )
}
const save = async (page: Page) => {
  await page.getByRole('button', { name: 'Enregistrer le brouillon', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('Le brouillon a été enregistré.')
}
const closeResources = async (page: Page) => {
  await page.getByRole('button', { name: 'Revenir à l’article', exact: true }).click()
  await expect(page.getByRole('dialog')).not.toBeVisible()
}
const selectMedia = async (page: Page) => {
  await page.getByRole('button', { name: 'Sélectionner Photo pilote', exact: true }).click()
  await expect(page.getByRole('dialog')).not.toBeVisible()
}

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(colorScheme, () => {
    test.use({ colorScheme })
    test('création, blocs mis en forme, médias, catégories et réouverture sans perte', async ({
      page,
    }) => {
      const data = await setup(page)
      const errors: string[] = []
      page.on('pageerror', (error) => errors.push(error.message))
      await page.getByRole('button', { name: 'Nouvel article' }).click()
      await page.getByLabel('Titre de l’article', { exact: true }).fill('Carnet pilote')
      await page.getByLabel('Adresse de page (slug)').fill('carnet-pilote')
      await page.getByLabel('Résumé', { exact: true }).fill('Un résumé conservé')
      await page.getByLabel('Titre SEO').fill('SEO pilote')
      await page.getByLabel('Méta-description').fill('Description pilote')
      await page.getByRole('button', { name: 'Ajouter un texte', exact: true }).click()
      await page.getByRole('button', { name: 'Gras', exact: true }).click()
      await page.getByRole('textbox', { name: 'Texte du bloc' }).fill('Contenu conservé')
      await page.getByRole('textbox', { name: 'Texte du bloc' }).press('ControlOrMeta+a')
      await page.getByLabel('Adresse du lien', { exact: true }).fill('https://example.test/article')
      await page.getByRole('button', { name: 'Ajouter le lien', exact: true }).click()
      await page.getByRole('button', { name: 'Ajouter une image', exact: true }).click()
      await page.getByRole('button', { name: 'Choisir un média', exact: true }).click()
      await selectMedia(page)
      await page.getByLabel('Texte alternatif', { exact: true }).fill('Vue de la ville')
      await page.getByRole('button', { name: 'Ajouter une galerie', exact: true }).click()
      await page.getByRole('button', { name: 'Choisir un média', exact: true }).last().click()
      await selectMedia(page)
      await page
        .locator('[data-block-type="gallery"]')
        .getByRole('button', { name: 'Monter', exact: true })
        .first()
        .click()
      await page.getByRole('button', { name: 'Choisir l’image principale' }).click()
      await selectMedia(page)
      await page.getByRole('button', { name: 'Gérer les catégories' }).click()
      await page.getByLabel('Libellé de la catégorie').fill('Voyages')
      await page.getByRole('button', { name: 'Enregistrer la catégorie' }).click()
      await expect(page.getByRole('checkbox', { name: 'Voyages', exact: true })).toBeChecked()
      await closeResources(page)
      await expect(page.getByLabel('Résumé', { exact: true })).toHaveValue('Un résumé conservé')
      await save(page)
      expect(data.saved).toMatchObject({
        categoryIds: [ids.category],
        translation: {
          headline: 'Carnet pilote',
          primaryImage: { mediaId: ids.media },
          content: { blocks: [{ type: 'text' }, { type: 'gallery' }, { type: 'image' }] },
        },
      })
      await page.getByRole('button', { name: 'Retour à la liste' }).click()
      await page.getByRole('button', { name: 'Carnet pilote', exact: true }).click()
      await expect(page.getByLabel('Titre SEO')).toHaveValue('SEO pilote')
      await expect(page.getByRole('textbox', { name: 'Texte du bloc' })).toHaveText(
        'Contenu conservé',
      )
      expect(
        await page
          .locator('[data-block-type]')
          .evaluateAll((nodes) => nodes.map((n) => n.getAttribute('data-block-type'))),
      ).toEqual(['text', 'gallery', 'image'])
      await page.screenshot({ path: test.info().outputPath('editor.png') })
      expect(errors).toEqual([])
    })

    test('catégorie partagée avertie, validation et import échoués conservent toutes les saisies', async ({
      page,
    }) => {
      const data = await setup(page)
      await open(page)
      await page.getByLabel('Résumé', { exact: true }).fill('Ne pas perdre')
      await page.getByRole('button', { name: 'Gérer les catégories' }).click()
      await page.getByRole('checkbox', { name: 'Actualités', exact: true }).check()
      await page.getByRole('button', { name: 'Modifier Actualités', exact: true }).click()
      await expect(page.getByText('Autre article concerné', { exact: true })).toBeVisible()
      await expect(page.getByRole('alert')).toContainText('2 article(s)')
      await expect(page.getByRole('button', { name: 'Enregistrer la catégorie' })).toBeDisabled()
      await page.getByLabel('Je confirme la modification partagée').check()
      await page.getByLabel('Libellé de la catégorie').fill('Nouveau libellé')
      data.failCategory = true
      await page.getByRole('button', { name: 'Enregistrer la catégorie' }).click()
      await expect(page.getByRole('alert').first()).toContainText(
        'Votre article et votre saisie sont conservés.',
      )
      await expect(page.getByLabel('Libellé de la catégorie')).toHaveValue('Nouveau libellé')
      data.failCategory = false
      await page.getByRole('button', { name: 'Enregistrer la catégorie' }).click()
      await expect(
        page.getByRole('checkbox', { name: 'Nouveau libellé', exact: true }),
      ).toBeChecked()
      await closeResources(page)
      await page.getByRole('button', { name: 'Choisir l’image principale' }).click()
      const imageInput = page.getByLabel('Fichier image')
      await imageInput.setInputFiles({
        name: 'photo.png',
        mimeType: 'image/png',
        buffer: Buffer.from('test-double'),
      })
      await page.getByLabel('Légende', { exact: true }).fill('Légende conservée')
      data.failUpload = true
      await page.getByRole('button', { name: 'Importer le fichier' }).click()
      await expect(page.getByRole('alert')).toContainText(
        'Votre article et votre saisie sont conservés.',
      )
      await expect(page.getByLabel('Légende', { exact: true })).toHaveValue('Légende conservée')
      data.failUpload = false
      data.mediaReady = false
      await page.getByRole('button', { name: 'Importer le fichier' }).click()
      await expect(page.getByRole('alert')).toContainText('Le fichier est en cours de traitement.')
      data.mediaReady = true
      await page.getByRole('button', { name: 'Rechercher', exact: true }).last().click()
      await selectMedia(page)
      await expect(page.getByLabel('Résumé', { exact: true })).toHaveValue('Ne pas perdre')
      await save(page)
    })

    test('conflit concurrent bloqué sans écrasement et saisie conservée', async ({ page }) => {
      const data = await setup(page)
      await open(page)
      await page.getByLabel('Titre de l’article', { exact: true }).fill('Ma version locale')
      data.conflict = true
      await page.getByRole('button', { name: 'Enregistrer le brouillon' }).click()
      await expect(page.getByRole('alert')).toContainText('Une autre personne a enregistré')
      await expect(page.getByLabel('Titre de l’article', { exact: true })).toHaveValue(
        'Ma version locale',
      )
      await expect(page.getByRole('button', { name: 'Enregistrer le brouillon' })).toBeDisabled()
      expect(data.article.translations[0]!.draft.headline).toBe('Article initial')
    })

    test('départs, langue et projet protégés ; abandon explicite seulement', async ({ page }) => {
      await setup(page)
      await open(page)
      await page.getByLabel('Résumé', { exact: true }).fill('Saisie locale')
      page.once('dialog', (dialog) => dialog.dismiss())
      await page.getByRole('button', { name: 'Retour à la liste' }).click()
      await expect(page.getByLabel('Résumé', { exact: true })).toHaveValue('Saisie locale')
      await page.getByRole('combobox', { name: 'Langue de l’article' }).click()
      page.once('dialog', (dialog) => dialog.dismiss())
      await page.getByRole('option', { name: 'English', exact: true }).click()
      await expect(page.getByLabel('Résumé', { exact: true })).toHaveValue('Saisie locale')
      await page.getByRole('combobox', { name: 'Projet / site' }).click()
      page.once('dialog', (dialog) => dialog.dismiss())
      await page.getByRole('option', { name: 'Autre site', exact: true }).click()
      await expect(page.getByRole('combobox', { name: 'Projet / site' })).toContainText('Client 2')
      await expect(page.getByLabel('Résumé', { exact: true })).toHaveValue('Saisie locale')
      await page.getByRole('combobox', { name: 'Projet / site' }).click()
      page.once('dialog', (dialog) => dialog.accept())
      await page.getByRole('option', { name: 'Autre site', exact: true }).click()
      await expect(page.getByText('Aucun article trouvé.', { exact: true })).toBeVisible()
    })

    test('brouillon distinct du publié, langues indépendantes, aperçu et dépublication', async ({
      page,
    }) => {
      const data = await setup(page)
      await open(page)
      await save(page)
      await page.getByRole('button', { name: 'Publier cette langue', exact: true }).click()
      await expect(page.getByRole('status')).toContainText('Synchronisation publique appliquée.')
      const published = structuredClone(data.article.translations[0]!.published)
      await page.getByLabel('Titre de l’article', { exact: true }).fill('Brouillon suivant')
      await expect(page.getByRole('button', { name: 'Prévisualiser', exact: true })).toBeDisabled()
      await save(page)
      expect(data.article.translations[0]!.published).toEqual(published)
      const popupPromise = page.waitForEvent('popup')
      await page.getByRole('button', { name: 'Prévisualiser', exact: true }).click()
      const popup = await popupPromise
      await expect(popup.getByRole('heading')).toHaveText('Aperçu privé simulé')
      await popup.close()
      await page.getByRole('combobox', { name: 'Langue de l’article' }).click()
      await page.getByRole('option', { name: 'English', exact: true }).click()
      await page.getByLabel('Titre de l’article', { exact: true }).fill('English draft')
      await page.getByLabel('Adresse de page (slug)').fill('english-draft')
      await save(page)
      expect(data.article.translations.find((v) => v.draft.locale === 'en')!.published).toBeNull()
      expect(data.article.translations[0]!.published).toEqual(published)
      await page.getByRole('combobox', { name: 'Langue de l’article' }).click()
      await page.getByRole('option', { name: 'Français', exact: true }).click()
      await page.getByRole('button', { name: 'Dépublier cette langue', exact: true }).click()
      await expect(page.getByRole('status')).toContainText('Synchronisation publique appliquée.')
      expect(data.article.translations[0]!.published).toBeNull()
      await expect(page.getByLabel('Titre de l’article', { exact: true })).toHaveValue(
        'Brouillon suivant',
      )
    })

    test('projection échouée visible et reprise avec la même clé et révision', async ({ page }) => {
      const data = await setup(page)
      await open(page)
      data.projection = 'failed'
      await page.getByRole('button', { name: 'Publier cette langue', exact: true }).click()
      await expect(page.getByRole('status')).toContainText('Échec de synchronisation')
      data.projection = 'applied'
      await page.getByRole('button', { name: 'Réessayer la synchronisation', exact: true }).click()
      await expect(page.getByRole('status')).toContainText('Synchronisation publique appliquée.')
      expect(data.publicationKeys).toHaveLength(2)
      expect(data.publicationKeys[0]).toBe(data.publicationKeys[1])
      expect(data.publicationRevisions[0]).toBe(data.publicationRevisions[1])
      data.projection = 'pending'
      await page.getByRole('button', { name: 'Publier cette langue', exact: true }).click()
      await expect(page.getByRole('status')).toContainText('synchronisation publique en attente.')
    })
  })
}
