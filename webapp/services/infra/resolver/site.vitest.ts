import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it, vi } from 'vitest'

import { packageSite } from '../../../scripts/build/site'
import { loadContentFromFiles } from '../../../server/utils/content/loaders'
import { resolveContentRoot } from '../../../server/utils/dashboard/markdownExporter'
import { currentSiteContentRoot } from '../../../server/utils/site'
import { resolveSiteId } from '../../../shared/site/registry'

import { siteContentRoot, siteMediaRoot } from './site'

import site from '#site'

const roots: string[] = []

afterEach(async () => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})

const createRoot = async (): Promise<string> => {
  const root = await mkdtemp(join(tmpdir(), 'site-layers-'))
  roots.push(root)
  return root
}

describe('isolation des layers clients', () => {
  it('conserve la cible historique par défaut et refuse les chemins traversants', () => {
    expect(resolveSiteId(undefined)).toBe('showcase-immobilier')
    expect(resolveSiteId(' agence-test ')).toBe('agence-test')
    for (const id of ['../client', '/tmp/client', 'client/a', 'Client', 'a_b']) {
      expect(() => resolveSiteId(id)).toThrow('Identifiant invalide')
    }
  })

  it('isole les destinations des outils entre deux clients', async () => {
    const root = await createRoot()
    vi.stubEnv('CONTENT_PATH', '')
    vi.stubEnv('CONTENT_SYNC_MEDIA_DIR', '')
    vi.stubEnv('GD_TARGET', 'agence-a')
    expect(siteContentRoot(root)).toBe(join(root, 'sites/agence-a/content'))
    expect(siteMediaRoot(root)).toBe(join(root, 'sites/agence-a/public/images'))
    vi.stubEnv('GD_TARGET', 'agence-b')
    expect(siteContentRoot(root)).toBe(join(root, 'sites/agence-b/content'))
    expect(siteMediaRoot(root)).toBe(join(root, 'sites/agence-b/public/images'))
  })

  it('fige le client serveur et utilise le même dossier pour lecture et écriture', async () => {
    const root = await createRoot()
    const expected = join(root, 'sites', site.id, 'content')
    await mkdir(join(expected, 'fr/ui'), { recursive: true })
    await writeFile(join(expected, 'fr/ui/app.yaml'), 'name: client-compile\n')
    const other = join(root, 'sites/autre-client/content/fr/ui')
    await mkdir(other, { recursive: true })
    await writeFile(join(other, 'app.yaml'), 'name: autre-client\n')
    vi.spyOn(process, 'cwd').mockReturnValue(root)
    vi.stubEnv('CONTENT_PATH', '')
    vi.stubEnv('GD_TARGET', 'autre-client')
    expect(currentSiteContentRoot()).toBe(expected)
    expect(resolveContentRoot()).toBe(expected)
    expect(await loadContentFromFiles('app', 'fr')).toEqual({ name: 'client-compile' })
    // Un dossier absent ne doit jamais provoquer un repli vers le contenu voisin.
    await rm(expected, { recursive: true })
    await expect(loadContentFromFiles('app', 'fr')).rejects.toThrow('Dossier du client introuvable')
  })

  it('respecte une projection externe explicite pour lecture et écriture', async () => {
    const root = await createRoot()
    vi.spyOn(process, 'cwd').mockReturnValue(root)
    vi.stubEnv('CONTENT_PATH', 'projection-externe')
    expect(currentSiteContentRoot()).toBe(join(root, 'projection-externe'))
    expect(resolveContentRoot()).toBe(join(root, 'projection-externe'))
    expect(siteContentRoot(root)).toBe(join(root, 'projection-externe'))
  })

  it('embarque seulement les contenus et le thème de la cible construite', async () => {
    const root = await createRoot()
    for (const id of ['agence-a', 'agence-b']) {
      const site = join(root, 'sites', id)
      await mkdir(join(site, 'content/fr'), { recursive: true })
      await writeFile(join(site, 'content/fr/page.md'), id)
      await writeFile(join(site, 'themes.yaml'), `name: ${id}\n`)
    }
    const output = join(root, '.output')
    const source = join(root, 'sites/agence-a')
    await packageSite(source, output, 'agence-a', join(source, 'content'))
    expect(await readdir(join(output, 'site'))).toEqual(['agence-a'])
    expect(await readFile(join(output, 'site/agence-a/content/fr/page.md'), 'utf8')).toBe(
      'agence-a',
    )
    expect(await readFile(join(output, 'site/agence-a/themes.yaml'), 'utf8')).toBe(
      'name: agence-a\n',
    )
  })
})
