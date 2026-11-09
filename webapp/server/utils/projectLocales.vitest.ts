import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getProjectLocales } from './projectLocales'

let contentRoot: string

const writeConfig = async (yaml: string): Promise<void> => {
  await writeFile(join(contentRoot, 'fr/ui/app.yaml'), yaml)
}

beforeEach(async () => {
  contentRoot = await mkdtemp(join(tmpdir(), 'project-locales-'))
  await mkdir(join(contentRoot, 'fr/ui'), { recursive: true })
  vi.stubEnv('CONTENT_PATH', contentRoot)
})

afterEach(async () => {
  vi.unstubAllEnvs()
  await rm(contentRoot, { recursive: true, force: true })
})

describe('langues du projet depuis le contenu local', () => {
  it('lit le fichier canonique même avec une autre langue source, sans configuration Symfony', async () => {
    vi.stubEnv('SYMFONY_API_URL', '')
    vi.stubEnv('SYMFONY_PROJECT_ID', '')
    await writeConfig('i18n:\n  sourceLocale: en\n  enabledLocales: [en, fr, en]\n')

    expect(await getProjectLocales()).toEqual({ sourceLocale: 'en', enabledLocales: ['en', 'fr'] })
  })

  it('relit les changements de contenu sans redémarrage', async () => {
    await writeConfig('i18n:\n  sourceLocale: fr\n  enabledLocales: [fr, en, es]\n')
    expect((await getProjectLocales()).enabledLocales).toEqual(['fr', 'en', 'es'])

    await writeConfig('i18n:\n  sourceLocale: fr\n  enabledLocales: [fr]\n')
    expect((await getProjectLocales()).enabledLocales).toEqual(['fr'])
  })

  it.each([
    'navigation: {}',
    'i18n: null',
    'i18n: { sourceLocale: de, enabledLocales: [fr] }',
    'i18n: { sourceLocale: fr, enabledLocales: [] }',
    'i18n: { sourceLocale: fr, enabledLocales: [en] }',
    'i18n: { sourceLocale: fr, enabledLocales: [fr, de] }',
    'i18n: { sourceLocale: fr, enabledLocales: [fr, 42] }',
  ])('rejette une configuration incohérente : %s', async (yaml) => {
    await writeConfig(yaml)
    await expect(getProjectLocales()).rejects.toThrow('Configuration i18n invalide')
  })
})
