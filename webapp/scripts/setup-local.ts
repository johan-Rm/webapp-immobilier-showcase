import { randomBytes } from 'node:crypto'
import { existsSync } from 'node:fs'
import { cp, mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import YAML from 'yaml'

const LOCALES = ['fr', 'en', 'es'] as const
const CATEGORY_KEYS = [
  'apartment',
  'riad',
  'guest-house',
  'golf-villa',
  'country-house',
  'town-house',
  'land',
  'commercial-business',
  'lease-management',
  'commercial-property',
  'dar',
  'guest-room',
] as const
const LISTING_KEYS = ['for-sale', 'seasonal-rental', 'long-term-rental'] as const
const DEMO_LABELS = {
  fr: { villa: 'Villa', place: 'Secteur de démonstration', title: 'Bien fictif' },
  en: { villa: 'Villa', place: 'Demonstration area', title: 'Fictional property' },
  es: { villa: 'Villa', place: 'Zona de demostración', title: 'Inmueble ficticio' },
} as const

type Fixture = { fileName: string; frontmatter: Record<string, unknown>; body: string }
type NavigationEntry = { name: string; url: string }

const readFixture = (fileName: string, raw: string): Fixture => {
  const match = raw.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/)
  if (!match?.[1]) throw new Error(`Frontmatter manquant : ${fileName}`)
  const frontmatter = YAML.parse(match[1]) as Record<string, unknown>
  return { fileName, frontmatter, body: raw.slice(match[0].length) }
}

const isDemoFixture = (value: unknown): boolean =>
  Array.isArray(value) &&
  value.some(
    (entry: { name?: string; value?: string }) =>
      entry.name === 'dataSource' && entry.value === 'fixture',
  )

/** Prépare exclusivement des données de démonstration ; refuse d'écraser un contenu réel. */
export const setupLocal = async (root = process.cwd()): Promise<void> => {
  const fixtureRoot = join(root, 'fixtures/accommodations')
  const fixtures = await Promise.all(
    (await readdir(fixtureRoot))
      .filter((name) => name.endsWith('.md') && name !== 'README.md')
      .map(async (name) => readFixture(name, await readFile(join(fixtureRoot, name), 'utf8'))),
  )

  // Valider tous les dossiers avant de commencer à écrire.
  for (const locale of LOCALES) {
    const directory = join(root, 'content', locale, 'accommodations')
    if (existsSync(directory)) {
      for (const name of await readdir(directory)) {
        if (!name.endsWith('.md')) continue
        const existing = readFixture(name, await readFile(join(directory, name), 'utf8'))
        if (!isDemoFixture(existing.frontmatter.additionalProperty)) {
          throw new Error(`Contenu non fictif présent : ${join(directory, name)}`)
        }
      }
    }
    for (const name of ['category-code.yaml', 'media-object.yaml']) {
      const path = join(root, 'content', locale, 'metadata', name)
      if (!existsSync(path)) continue
      const data = YAML.parse(await readFile(path, 'utf8')) as {
        items?: { id?: string }[]
        dataSource?: string
      }
      if (data.dataSource !== 'fixture') {
        throw new Error(`Métadonnées non fictives présentes : ${path}`)
      }
    }
  }

  if (!existsSync(join(root, '.env'))) {
    const template = await readFile(join(root, '.env.example'), 'utf8')
    await writeFile(
      join(root, '.env'),
      template.replace(
        /^NUXT_SESSION_PASSWORD=.*$/m,
        `NUXT_SESSION_PASSWORD=${randomBytes(48).toString('base64url')}`,
      ),
      { mode: 0o600, flag: 'wx' },
    )
  }

  for (const locale of LOCALES) {
    const directory = join(root, 'content', locale)
    const catalog = join(root, 'fixtures/catalog', locale)
    if (existsSync(catalog)) {
      await cp(catalog, directory, { recursive: true })
      for (const fixture of fixtures) {
        const frontmatter = {
          ...fixture.frontmatter,
          inLanguage: locale,
          additionalProperty: [
            ...(Array.isArray(fixture.frontmatter.additionalProperty)
              ? fixture.frontmatter.additionalProperty.filter(
                  (entry: { name?: string }) => entry.name !== 'dataSource',
                )
              : []),
            { name: 'dataSource', value: 'fixture' },
          ],
        }
        await writeFile(
          join(directory, 'accommodations', fixture.fileName),
          `---\n${YAML.stringify(frontmatter)}---\n${fixture.body}`,
        )
      }
      continue
    }
    const { navigation } = YAML.parse(await readFile(join(directory, 'ui/app.yaml'), 'utf8')) as {
      navigation: Record<string, NavigationEntry>
    }
    const labels = DEMO_LABELS[locale]
    const items = [
      ...CATEGORY_KEYS.map((key) => ({
        id: `demo-type-${key}`,
        inCodeSet: 'accommodation-type',
        codeValue: key,
        name: navigation[key]!.name,
      })),
      {
        id: 'demo-type-villa',
        inCodeSet: 'accommodation-type',
        codeValue: 'villa',
        name: labels.villa,
      },
      ...LISTING_KEYS.map((key) => ({
        id: `demo-listing-${key}`,
        inCodeSet: 'real-estate-listing',
        codeValue: navigation[key]!.url.split('/').at(-1),
        name: navigation[key]!.name,
      })),
      ...[...new Set(fixtures.map((fixture) => String(fixture.frontmatter.place)))].map(
        (place) => ({
          id: `demo-place-${place}`,
          inCodeSet: 'accommodation-place',
          codeValue: place,
          name: labels.place,
        }),
      ),
    ]
    await mkdir(join(directory, 'metadata'), { recursive: true })
    await writeFile(
      join(directory, 'metadata/category-code.yaml'),
      YAML.stringify({ dataSource: 'fixture', items }),
    )
    await writeFile(
      join(directory, 'metadata/media-object.yaml'),
      YAML.stringify({ dataSource: 'fixture', items: [] }),
    )
    await mkdir(join(directory, 'accommodations'), { recursive: true })
    for (const fixture of fixtures) {
      const additionalProperty = Array.isArray(fixture.frontmatter.additionalProperty)
        ? fixture.frontmatter.additionalProperty.filter(
            (entry: { name?: string }) => entry.name !== 'dataSource',
          )
        : []
      const frontmatter = {
        ...fixture.frontmatter,
        inLanguage: locale,
        metaTitle: `${fixture.frontmatter.name} — ${labels.title} | Showcase Immobilier`,
        additionalProperty: [...additionalProperty, { name: 'dataSource', value: 'fixture' }],
      }
      await writeFile(
        join(directory, 'accommodations', fixture.fileName),
        `---\n${YAML.stringify(frontmatter)}---\n${fixture.body}`,
      )
    }
  }
  await mkdir(join(root, '.data'), { recursive: true })
  await mkdir(join(root, 'public/images'), { recursive: true })
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await setupLocal()
  console.warn('[setup] Données fictives prêtes en fr, en et es ; aucune API appelée.')
}
