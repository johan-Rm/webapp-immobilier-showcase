import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import YAML from 'yaml'

import { loadContentFromFiles } from '../server/utils/content/loaders'

import { setupLocal } from './setup-local'

const roots: string[] = []

const createProject = async (): Promise<string> => {
  const root = await mkdtemp(join(tmpdir(), 'showcase-setup-test-'))
  roots.push(root)
  await mkdir(join(root, 'fixtures/accommodations'), { recursive: true })
  await writeFile(
    join(root, 'fixtures/accommodations/villa-demo.md'),
    '---\nname: Villa Demo\nslug: villa-demo\nplace: essaouira\nadditionalProperty: []\n---\nContenu fictif.\n',
  )
  await writeFile(join(root, '.env.example'), 'NUXT_SESSION_PASSWORD=placeholder\n')
  for (const locale of ['fr', 'en', 'es']) {
    const source = await readFile(
      join(process.cwd(), 'sites/showcase-immobilier/content', locale, 'ui/app.yaml'),
      'utf8',
    )
    await mkdir(join(root, 'sites/showcase-immobilier/content', locale, 'ui'), { recursive: true })
    await writeFile(join(root, 'sites/showcase-immobilier/content', locale, 'ui/app.yaml'), source)
  }
  return root
}

beforeEach(() => {
  vi.stubEnv('GD_TARGET', 'showcase-immobilier')
  vi.stubEnv('CONTENT_PATH', '')
  vi.stubEnv('CONTENT_SYNC_MEDIA_DIR', '')
})

afterEach(async () => {
  vi.unstubAllEnvs()
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})

describe('setup local de démonstration', () => {
  it('conserve le catalogue approuvé, ses localisations et ses images au rejeu', async () => {
    const root = await createProject()
    for (const locale of ['fr', 'en', 'es']) {
      const source = join(root, 'fixtures/catalog', locale)
      await mkdir(join(source, 'accommodations'), { recursive: true })
      await mkdir(join(source, 'metadata'), { recursive: true })
      await writeFile(
        join(source, 'accommodations/villa-originale.md'),
        '---\nname: Villa originale\nplace: ghazoua\nimage: /images/villa.jpg\nadditionalProperty:\n  - name: dataSource\n    value: fixture\n---\nDémo conservée.\n',
      )
      for (const name of ['category-code.yaml', 'media-object.yaml']) {
        await writeFile(join(source, 'metadata', name), 'dataSource: fixture\nitems: []\n')
      }
    }
    await setupLocal(root)
    await setupLocal(root)
    const raw = await readFile(
      join(root, 'sites/showcase-immobilier/content/fr/accommodations/villa-originale.md'),
      'utf8',
    )
    expect(raw).toContain('place: ghazoua')
    expect(raw).toContain('/images/villa.jpg')
  })
  it('ne publie les biens fictifs que lorsque le mode fixture est activé', async () => {
    const root = await createProject()
    await setupLocal(root)
    vi.stubEnv('CONTENT_PATH', join(root, 'sites/showcase-immobilier/content'))
    vi.stubEnv('NUXT_ACCOMMODATION_FIXTURES_ENABLED', 'false')
    vi.stubEnv('ACCOMMODATION_FIXTURES_ENABLED', 'true')
    expect(await loadContentFromFiles('accommodations', 'fr')).toHaveLength(1)
    vi.stubEnv('ACCOMMODATION_FIXTURES_ENABLED', 'false')
    expect(await loadContentFromFiles('accommodations', 'fr')).toHaveLength(0)
  })
  it('prépare les trois langues et rejoue sans modifier le secret ni dupliquer les fixtures', async () => {
    const root = await createProject()
    await setupLocal(root)
    const env = await readFile(join(root, '.env'), 'utf8')
    expect(env).not.toContain('placeholder')
    expect(env.split('=')[1]!.trim().length).toBeGreaterThanOrEqual(32)
    for (const locale of ['fr', 'en', 'es']) {
      const fixture = await readFile(
        join(root, 'sites/showcase-immobilier/content', locale, 'accommodations/villa-demo.md'),
        'utf8',
      )
      expect(fixture).toContain(`inLanguage: ${locale}`)
      expect(fixture).toContain('name: dataSource\n    value: fixture')
      const metadata = YAML.parse(
        await readFile(
          join(root, 'sites/showcase-immobilier/content', locale, 'metadata/category-code.yaml'),
          'utf8',
        ),
      ) as { items: { inCodeSet: string }[] }
      expect(
        metadata.items.filter((item) => item.inCodeSet === 'real-estate-listing'),
      ).toHaveLength(3)
      await setupLocal(root)
      expect(
        await readFile(
          join(root, 'sites/showcase-immobilier/content', locale, 'accommodations/villa-demo.md'),
          'utf8',
        ),
      ).toBe(fixture)
    }
    expect(await readFile(join(root, '.env'), 'utf8')).toBe(env)
  })

  it('refuse les données réelles avant toute écriture et les conserve', async () => {
    const root = await createProject()
    const directory = join(root, 'sites/showcase-immobilier/content/es/accommodations')
    await mkdir(directory, { recursive: true })
    const content = '---\nname: Bien existant\n---\nNe pas remplacer.\n'
    await writeFile(join(directory, 'existant.md'), content)
    await expect(setupLocal(root)).rejects.toThrow('Contenu non fictif présent')
    expect(await readFile(join(directory, 'existant.md'), 'utf8')).toBe(content)
    await expect(readFile(join(root, '.env'), 'utf8')).rejects.toMatchObject({ code: 'ENOENT' })
  })

  it('refuse un référentiel API et préserve un environnement déjà configuré', async () => {
    const root = await createProject()
    await writeFile(join(root, '.env'), 'NUXT_SESSION_PASSWORD=secret-existant\n')
    await setupLocal(root)
    expect(await readFile(join(root, '.env'), 'utf8')).toBe(
      'NUXT_SESSION_PASSWORD=secret-existant\n',
    )
    const path = join(root, 'sites/showcase-immobilier/content/en/metadata/category-code.yaml')
    await writeFile(path, 'items:\n  - id: reference-api\n')
    await expect(setupLocal(root)).rejects.toThrow('Métadonnées non fictives présentes')
    expect(await readFile(path, 'utf8')).toContain('reference-api')
  })
})
