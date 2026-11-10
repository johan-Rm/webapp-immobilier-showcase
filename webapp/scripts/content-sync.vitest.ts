import { spawnSync } from 'node:child_process'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import YAML from 'yaml'

let root: string
let appPath: string
const initialYaml =
  '# Navigation éditoriale\nnavigation:\n  contact:\n    name: Contact\n    url: /contact\ni18n:\n  sourceLocale: fr\n  enabledLocales: [fr]\n'

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'content-sync-locales-'))
  appPath = join(root, 'content/fr/ui/app.yaml')
  await mkdir(join(root, 'content/fr/ui'), { recursive: true })
  await writeFile(appPath, initialYaml)
  await writeFile(
    join(root, 'mock-fetch.ts'),
    `
    globalThis.fetch = async (input) => {
      const path = new URL(String(input)).pathname
      if (path === '/api/auth/login') return Response.json({ token: 'test-token' })
      if (path === '/api/projects/test') return Response.json({
        id: 'test', name: 'Test', sourceLocale: 'en', enabledLocales: ['fr', 'en', 'es']
      })
      if (process.env.TEST_SYNC_FAILURE === 'true') return new Response('indisponible', { status: 503 })
      return Response.json({ member: [] })
    }
  `,
  )
})

afterEach(async () => {
  await rm(root, { recursive: true, force: true })
})

const sync = (args: string[] = [], fail = false) =>
  spawnSync(
    'bun',
    [
      '--preload',
      join(root, 'mock-fetch.ts'),
      fileURLToPath(new URL('./content-sync.ts', import.meta.url)),
      ...args,
    ],
    {
      cwd: root,
      encoding: 'utf8',
      env: {
        ...process.env,
        CONTENT_PATH: join(root, 'content'),
        CONTENT_SYNC_MEDIA_DIR: join(root, 'media'),
        SYMFONY_API_URL: 'http://sync.test',
        SYMFONY_PROJECT_ID: 'test',
        SYMFONY_SERVICE_EMAIL: 'test@example.com',
        SYMFONY_SERVICE_PASSWORD: 'fixture-only',
        TEST_SYNC_FAILURE: String(fail),
      },
    },
  )

describe('synchronisation de la configuration des langues', () => {
  it('publie toutes les langues du projet même avec --locale= et préserve le contenu éditorial', async () => {
    const result = sync(['--locale=en'])
    expect(result.status, result.stderr).toBe(0)
    const raw = await readFile(appPath, 'utf8')
    expect(YAML.parse(raw)).toEqual({
      navigation: { contact: { name: 'Contact', url: '/contact' } },
      i18n: { sourceLocale: 'en', enabledLocales: ['fr', 'en', 'es'] },
    })
    expect(raw).toContain('# Navigation éditoriale')
  })

  it('ne modifie pas app.yaml en dry-run', async () => {
    const result = sync(['--dry-run'])
    expect(result.status, result.stderr).toBe(0)
    expect(result.stdout).toContain('[dry-run]')
    expect(await readFile(appPath, 'utf8')).toBe(initialYaml)
  })

  it('conserve la configuration précédente si la récupération des contenus échoue', async () => {
    expect(sync([], true).status).toBe(1)
    expect(await readFile(appPath, 'utf8')).toBe(initialYaml)
  })

  it('refuse un YAML existant invalide avant toute synchronisation', async () => {
    await writeFile(appPath, 'navigation: [')
    expect(sync().status).toBe(1)
    expect(await readFile(appPath, 'utf8')).toBe('navigation: [')
  })

  it('crée la configuration canonique si le fichier est absent', async () => {
    await rm(appPath)
    const result = sync(['--locale=en'])
    expect(result.status, result.stderr).toBe(0)
    expect(YAML.parse(await readFile(appPath, 'utf8')).i18n).toEqual({
      sourceLocale: 'en',
      enabledLocales: ['fr', 'en', 'es'],
    })
  })
})
