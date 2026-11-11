import type { SaasReferenceContext } from '#shared/types/saas/article'

import { describe, expect, it } from 'vitest'

import { parseArticleWrite, projectPublishedArticle } from './articles'

import { isEditorialLink } from '#shared/saas/links'
import { saasArticleSchema, saasArticleWriteSchema } from '#shared/schemas'
import { resolveApplicationTarget, resolveSiteId } from '#shared/site/registry'

const projectId = '11111111-1111-4111-8111-111111111111'
const otherProject = '22222222-2222-4222-8222-222222222222'
const mediaId = '33333333-3333-4333-8333-333333333333'
const categoryId = '44444444-4444-4444-8444-444444444444'
const articleId = '55555555-5555-4555-8555-555555555555'
const snapshotId = '66666666-6666-4666-8666-666666666666'
const context: SaasReferenceContext = {
  projectId,
  enabledLocales: ['fr', 'en', 'es'],
  categories: [
    { id: categoryId, projectId, inCodeSet: 'article-category', labels: { fr: 'Voyage' } },
  ],
  media: [{ id: mediaId, projectId, kind: 'image', ready: true }],
}
const translation = () => ({
  locale: 'fr' as const,
  headline: 'Titre publié',
  slug: 'titre-publie',
  summary: 'Résumé publié',
  primaryImage: { mediaId, alt: 'Vue' },
  metaTitle: '',
  metaDescription: '',
  content: {
    schemaVersion: 1,
    blocks: [
      {
        id: 'intro',
        type: 'text',
        document: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Bonjour', marks: [{ type: 'bold' }] }],
            },
          ],
        },
      },
      { id: 'photo', type: 'image', mediaId, alt: 'Vue', caption: '' },
      { id: 'galerie', type: 'gallery', items: [{ mediaId, alt: '', caption: 'Détail' }] },
    ],
  },
})
const write = () => ({ categoryIds: [categoryId], translation: translation() })
const article = () => ({
  id: articleId,
  projectId,
  revision: 'r2',
  categoryIds: [],
  translations: [
    {
      draft: {
        ...translation(),
        headline: 'Secret brouillon',
        summary: 'Résumé secret',
        generated: true,
      },
      published: {
        snapshotId,
        revision: 'r1',
        publishedAt: '2026-11-11T12:00:00Z',
        categoryIds: [categoryId],
        translation: translation(),
      },
    },
  ],
})

describe('contrat article SaaS', () => {
  it('accepte titres, listes imbriquées, liens et sauts de ligne sans attributs supplémentaires', () => {
    const document = {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Titre' }] },
        {
          type: 'orderedList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: 'Lien',
                      marks: [{ type: 'link', attrs: { href: '/fr' } }],
                    },
                    { type: 'hardBreak' },
                  ],
                },
                {
                  type: 'bulletList',
                  content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [] }] }],
                },
              ],
            },
          ],
        },
      ],
    }
    const content = { schemaVersion: 1, blocks: [{ id: 'texte', type: 'text', document }] }
    const input = { ...write(), translation: { ...translation(), content } }
    expect(saasArticleWriteSchema.parse(input)).toEqual(input)
    const injected = {
      type: 'doc',
      content: [{ type: 'paragraph', content: [], attrs: { onclick: 'alert(1)' } }],
    }
    expect(() =>
      saasArticleWriteSchema.parse({
        ...input,
        translation: {
          ...input.translation,
          content: {
            schemaVersion: 1,
            blocks: [{ id: 'texte', type: 'text', document: injected }],
          },
        },
      }),
    ).toThrow()
  })
  it('conserve les blocs, leur ordre et les références après sérialisation', () => {
    const result = parseArticleWrite(JSON.parse(JSON.stringify(write())), context, 'fr')
    expect(result).toEqual(write())
    expect(result.translation.content.blocks.map((block) => block.id)).toEqual([
      'intro',
      'photo',
      'galerie',
    ])
  })

  it.each([{ extra: 'unknown' }, { revision: 'client-chosen' }, { projectId: otherProject }])(
    'refuse les champs injectés : %j',
    (extra) => {
      expect(() => saasArticleWriteSchema.parse({ ...write(), ...extra })).toThrow()
    },
  )

  it('refuse un état de génération fourni par le rédacteur', () => {
    expect(() =>
      saasArticleWriteSchema.parse({
        ...write(),
        translation: { ...translation(), generated: true },
      }),
    ).toThrow()
  })

  it.each([
    { schemaVersion: 2, blocks: [] },
    { schemaVersion: 1, blocks: [{ id: 'x', type: 'html', html: '<script />' }] },
    { schemaVersion: 1, blocks: [{ id: 'x', type: 'gallery', items: [] }] },
    {
      schemaVersion: 1,
      blocks: [translation().content.blocks[1], translation().content.blocks[1]],
    },
  ])('rejette un document invalide : %j', (content) => {
    expect(() =>
      saasArticleWriteSchema.parse({ ...write(), translation: { ...translation(), content } }),
    ).toThrow()
  })

  it('rejette les nœuds texte mal imbriqués', () => {
    const document = {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'paragraph', content: [] }] }],
    }
    const content = { schemaVersion: 1, blocks: [{ id: 'x', type: 'text', document }] }
    expect(() =>
      saasArticleWriteSchema.parse({ ...write(), translation: { ...translation(), content } }),
    ).toThrow()
  })

  it.each([
    'javascript:alert(1)',
    'data:text/html,x',
    '//evil.test',
    '/\\evil.test',
    'java\nscript:x',
    'https://u:p@example.test',
    'ftp://example.test',
  ])('refuse un lien dangereux : %s', (href) => {
    expect(isEditorialLink(href)).toBe(false)
    const node = { type: 'text', text: 'Lien', marks: [{ type: 'link', attrs: { href } }] }
    const document = { type: 'doc', content: [{ type: 'paragraph', content: [node] }] }
    const content = { schemaVersion: 1, blocks: [{ id: 'x', type: 'text', document }] }
    expect(() =>
      saasArticleWriteSchema.parse({ ...write(), translation: { ...translation(), content } }),
    ).toThrow()
  })

  it.each([
    'https://example.test/x',
    'mailto:a@example.test',
    'tel:+3312345',
    '#intro',
    '/fr/articles',
    'articles/exemple',
  ])('accepte un lien éditorial : %s', (href) => {
    expect(isEditorialLink(href)).toBe(true)
  })

  it('refuse les catégories étrangères, inconnues, du mauvais référentiel ou dupliquées', () => {
    for (const categories of [
      [],
      [{ ...context.categories[0]!, projectId: otherProject }],
      [{ ...context.categories[0]!, inCodeSet: 'other' }],
    ]) {
      expect(() => parseArticleWrite(write(), { ...context, categories }, 'fr')).toThrow(
        'category_reference_invalid',
      )
    }
    expect(() =>
      parseArticleWrite({ ...write(), categoryIds: [categoryId, categoryId] }, context, 'fr'),
    ).toThrow()
  })

  it('contrôle les médias et leur disponibilité publique', () => {
    for (const media of [
      [],
      [{ ...context.media[0]!, projectId: otherProject }],
      [{ ...context.media[0]!, kind: 'video' }],
    ]) {
      expect(() => parseArticleWrite(write(), { ...context, media }, 'fr')).toThrow(
        'media_reference_invalid',
      )
    }
    const pending = { ...context, media: [{ ...context.media[0]!, ready: false }] }
    expect(() => parseArticleWrite(write(), pending, 'fr')).not.toThrow()
    expect(() => projectPublishedArticle(article(), pending, 'fr')).toThrow('media_not_ready')
  })

  it('refuse la langue hors contexte, les slugs invalides et titres trop longs', () => {
    expect(() => parseArticleWrite(write(), context, 'en')).toThrow('locale_mismatch')
    expect(() => parseArticleWrite(write(), { ...context, enabledLocales: ['en'] }, 'fr')).toThrow(
      'locale_mismatch',
    )
    for (const invalid of [
      { headline: 'x'.repeat(221) },
      { headline: ' ' },
      { slug: '../path' },
      { slug: 'X' },
    ]) {
      expect(() =>
        saasArticleWriteSchema.parse({ ...write(), translation: { ...translation(), ...invalid } }),
      ).toThrow()
    }
  })

  it('projette le snapshot publié et les libellés partagés actuels sans muter la source', () => {
    const value = article()
    const before = JSON.stringify(value)
    const result = projectPublishedArticle(value, context, 'fr')!
    expect(result.headline).toBe('Titre publié')
    expect(result.metaDescription).toBe('Résumé publié')
    expect(result.metaTitle).toBe('Titre publié')
    expect(result.categories).toEqual([{ id: categoryId, label: 'Voyage' }])
    expect(JSON.stringify(result)).not.toContain('Secret')
    expect(result).not.toHaveProperty('draft')
    expect(result).not.toHaveProperty('revision')
    expect(result).not.toHaveProperty('generated')
    expect(JSON.stringify(value)).toBe(before)
    const renamed = {
      ...context,
      categories: [{ ...context.categories[0]!, labels: { fr: 'Nouveau' } }],
    }
    expect(projectPublishedArticle(value, renamed, 'fr')!.categories[0]!.label).toBe('Nouveau')
  })

  it('ne publie ni brouillon ni fallback et retire une traduction dépubliée', () => {
    expect(projectPublishedArticle(article(), context, 'en')).toBeNull()
    const value = {
      ...article(),
      translations: [{ draft: article().translations[0]!.draft, published: null }],
    }
    expect(projectPublishedArticle(value, context, 'fr')).toBeNull()
  })

  it('ne substitue pas un libellé d’une autre langue dans la projection', () => {
    const missing = {
      ...context,
      categories: [{ ...context.categories[0]!, labels: { en: 'Travel' } }],
    }
    expect(() => projectPublishedArticle(article(), missing, 'fr')).toThrow(
      'category_translation_missing',
    )
  })

  it('refuse les snapshots incohérents, traductions dupliquées et contextes étrangers', () => {
    expect(() =>
      projectPublishedArticle(article(), { ...context, projectId: otherProject }, 'fr'),
    ).toThrow('project_mismatch')
    const source = article()
    const published = source.translations[0]!.published
    const value = {
      ...source,
      translations: [
        {
          draft: source.translations[0]!.draft,
          published: { ...published, translation: { ...published.translation, locale: 'en' } },
        },
      ],
    }
    expect(() => saasArticleSchema.parse(value)).toThrow()
    source.translations.push(source.translations[0]!)
    expect(() => saasArticleSchema.parse(source)).toThrow()
  })
})

describe('registre des cibles', () => {
  it('conserve le site historique et distingue le dashboard sans utiliser Host', () => {
    expect(resolveApplicationTarget(undefined)).toEqual({
      id: 'showcase-immobilier',
      kind: 'site',
      root: 'sites/showcase-immobilier',
    })
    expect(resolveApplicationTarget('client2-immobilier').root).toBe('sites/client2-immobilier')
    expect(resolveApplicationTarget(' dashboard ')).toEqual({
      id: 'dashboard',
      kind: 'dashboard',
      root: 'dashboard',
    })
    expect(resolveSiteId('client2-immobilier')).toBe('client2-immobilier')
  })
  it.each(['../dashboard', '/dashboard', 'a/b', 'a\\b', 'a..b'])(
    'refuse une cible hors chemin : %s',
    (target) => {
      expect(() => resolveApplicationTarget(target)).toThrow()
    },
  )
})
