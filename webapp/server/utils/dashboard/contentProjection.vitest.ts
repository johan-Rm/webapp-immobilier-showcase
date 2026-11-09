import type { DashboardAccommodationSavePayload } from '#shared/types/dashboardAccommodation'

import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import YAML from 'yaml'

import {
  normalizeMediaUrl,
  projectCategoryCode,
  projectMediaObject,
  updateProjectedCategoryCodeText,
} from './contentProjection'
import { exportAllLocales } from './markdownExporter'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const readYamlItems = async (filePath: string): Promise<unknown[]> => {
  const document: unknown = YAML.parse(await readFile(filePath, 'utf8'))
  if (!isRecord(document) || !Array.isArray(document.items)) {
    throw new Error(`Document YAML invalide: ${filePath}`)
  }
  return document.items
}

const getStringField = (value: unknown, field: string): string =>
  isRecord(value) && typeof value[field] === 'string' ? value[field] : ''

describe.sequential('contentProjection', () => {
  let contentRoot = ''
  let previousContentPath: string | undefined

  beforeEach(async () => {
    previousContentPath = process.env.CONTENT_PATH
    contentRoot = await mkdtemp(join(tmpdir(), 'content-projection-'))
    process.env.CONTENT_PATH = contentRoot
  })

  afterEach(async () => {
    if (previousContentPath === undefined) delete process.env.CONTENT_PATH
    else process.env.CONTENT_PATH = previousContentPath
    await rm(contentRoot, { recursive: true, force: true })
  })

  it('normalise une URL media absolue en chemin public relatif', () => {
    expect(normalizeMediaUrl('http://localhost:3000/images/photo.jpg?cache=1')).toBe(
      '/images/photo.jpg',
    )
  })

  it('projette les medias localises et les trie par date de modification descendante', async () => {
    await projectMediaObject({
      enabledLocales: ['fr', 'en'],
      translations: [{ locale: 'fr', caption: 'Premiere image' }],
      fallbackCaption: 'First image',
      media: {
        identifier: 'media-old',
        url: '/images/old.jpg',
        mainEntity: 'ImageObject',
        dateModified: '2026-01-01T00:00:00.000Z',
      },
    })
    await projectMediaObject({
      enabledLocales: ['fr', 'en'],
      translations: [{ locale: 'fr', caption: 'Image recente' }],
      fallbackCaption: 'Recent image',
      media: {
        identifier: 'media-new',
        url: '/images/new.jpg',
        mainEntity: 'ImageObject',
        dateModified: '2026-06-01T00:00:00.000Z',
      },
    })

    const frenchItems = await readYamlItems(join(contentRoot, 'fr/metadata/media-object.yaml'))
    const englishItems = await readYamlItems(join(contentRoot, 'en/metadata/media-object.yaml'))

    expect(frenchItems.map((item) => getStringField(item, 'identifier'))).toEqual([
      'media-new',
      'media-old',
    ])
    expect(getStringField(englishItems.at(0), 'caption')).toBe('Recent image')
  })

  it('projette puis met a jour le texte localise d un CategoryCode', async () => {
    await projectCategoryCode({
      enabledLocales: ['fr', 'en'],
      translations: [{ locale: 'fr', label: 'Medina' }],
      fallbackLabel: 'Medina',
      categoryCode: {
        id: 'category-medina',
        codeValue: 'medina',
        inCodeSet: 'accommodation-place',
      },
    })
    await updateProjectedCategoryCodeText({
      locale: 'fr',
      codeValue: 'medina',
      inCodeSet: 'accommodation-place',
      text: 'Coeur historique de la ville.',
    })

    const items = await readYamlItems(join(contentRoot, 'fr/metadata/category-code.yaml'))
    expect(items).toEqual([
      expect.objectContaining({
        id: 'category-medina',
        text: 'Coeur historique de la ville.',
      }),
    ])
  })

  it('fusionne une traduction partielle avec le fichier localise existant', async () => {
    const englishDirectory = join(contentRoot, 'en/accommodations')
    await mkdir(englishDirectory, { recursive: true })
    await writeFile(
      join(englishDirectory, 'existing-slug.md'),
      `---\nidentifier: TEST001\nslug: existing-slug\nname: Existing name\ncategory: old-category\n---\n\nExisting body\n`,
      'utf8',
    )

    const accommodation = {
      locale: 'fr',
      fileName: 'test001.md',
      slug: 'test001',
      identifier: 'TEST001',
      frontmatter: {
        identifier: 'TEST001',
        slug: 'test001',
        name: 'Nom francais',
        category: 'villa',
      },
      body: 'Corps francais',
      preview: {
        identifier: 'TEST001',
        slug: 'test001',
        title: 'Nom francais',
        description: '',
        price: null,
        priceCurrency: 'EUR',
        priceSpecification: '',
        placeSlug: '',
        placeLabel: '',
        categorySlug: 'villa',
        categoryLabel: 'Villa',
        listingSlug: '',
        listingLabel: '',
        isActive: true,
        floorSize: null,
        landArea: null,
        numberOfRooms: null,
        numberOfBedrooms: null,
        numberOfBathroomsTotal: null,
        primaryImageUrl: '',
        media: [],
      },
      translations: [{ locale: 'en', name: 'Updated name' }],
    } satisfies DashboardAccommodationSavePayload

    const results = await exportAllLocales(accommodation)
    const raw = await readFile(join(englishDirectory, 'existing-slug.md'), 'utf8')

    expect(results).toEqual([expect.objectContaining({ locale: 'en', updated: true })])
    expect(raw).toContain('slug: existing-slug')
    expect(raw).toContain('name: Updated name')
    expect(raw).toContain('category: villa')
    expect(raw).toContain('Existing body')
  })
})
