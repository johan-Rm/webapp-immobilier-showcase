import { execFileSync } from 'node:child_process'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, expect, it } from 'vitest'

import { prepareShowcaseMediaFixtures } from './fixture-server'
import { webappRoot } from './run'

const temporary: string[] = []
afterEach(async () => {
  await Promise.all(temporary.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})
const publicFolder = async () => {
  const root = await mkdtemp(join(tmpdir(), 'showcase-media-'))
  temporary.push(root)
  return root
}

it('fournit les images en erreur au vrai transformateur IPX sans remplacer les originaux', async () => {
  const root = await publicFolder()
  const images = await prepareShowcaseMediaFixtures(webappRoot, root)
  const expected = [
    'maison-mid-century-los-angeles.jpg',
    'essaouira-ruelle-de-la-medina.jpg',
    'medina-dessaouira-cote-port.jpg',
    'portrait-lifestyle-en-lumiere-naturelle.jpg',
    'essaouira-porte-de-bab-sbah.jpg',
    'essaouira-ruelle-porte-bleue-artisanat.jpg',
    'essaouira-navigation-hero.jpg',
  ]
  expect(images).toEqual(expect.arrayContaining(expected))
  // IPX vérifie Uint8Array : un processus Node évite les objets provenant du contexte Vitest.
  const result = execFileSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `
    import { createIPX, ipxFSStorage } from 'ipx';
    const ipx = createIPX({ storage: ipxFSStorage({ dir: process.argv[1] }) });
    const results = [];
    for (const image of JSON.parse(process.argv[2])) {
      const transformed = await ipx('/images/' + image, {
        w: image.startsWith('maison-') ? '2048' : '600', f: 'webp', q: '80', fit: 'cover',
      }).process();
      results.push({ format: transformed.format, bytes: transformed.data.length });
    }
    console.log(JSON.stringify(results));
  `,
      root,
      JSON.stringify(expected),
    ],
    { cwd: webappRoot, encoding: 'utf8' },
  )
  for (const transformed of JSON.parse(result)) {
    expect(transformed.format).toBe('webp')
    expect(transformed.bytes).toBeGreaterThan(0)
  }
})

it('conserve les médias existants et les fichiers étrangers après plusieurs préparations', async () => {
  const root = await publicFolder()
  await mkdir(join(root, 'images'))
  const original = join(root, 'images/maison-mid-century-los-angeles.jpg')
  const foreign = join(root, 'images/existing-unrelated.jpg')
  await writeFile(original, 'original à préserver')
  await writeFile(foreign, 'fichier étranger')
  await prepareShowcaseMediaFixtures(webappRoot, root)
  await prepareShowcaseMediaFixtures(webappRoot, root)
  expect(await readFile(original, 'utf8')).toBe('original à préserver')
  expect(await readFile(foreign, 'utf8')).toBe('fichier étranger')
})
