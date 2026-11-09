import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { analyze } from './verify-types-placement'

const roots: string[] = []

const project = async () => {
  const root = await mkdtemp(join(tmpdir(), 'types-placement-'))
  roots.push(root)
  const file = async (name: string, content: string) => {
    const path = join(root, name)
    await mkdir(join(path, '..'), { recursive: true })
    await writeFile(path, content)
    return path
  }
  return {
    root,
    file,
    shared: join(root, 'shared/types'),
    generated: join(root, 'schemas/interfaces'),
  }
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})

describe('placement des types', () => {
  it('autorise les contrats générés et leurs imports sans imposer shared/types', async () => {
    const { file, shared, generated } = await project()
    const first = await file(
      'schemas/interfaces/first.ts',
      'export type PropertyValue = { value: string }',
    )
    const second = await file(
      'schemas/interfaces/second.ts',
      'export type PropertyValue = { value: number }',
    )
    const consumer = await file(
      'app/consumer.ts',
      "import type { PropertyValue } from '../schemas/interfaces/first'",
    )
    expect(analyze([first, second, consumer], shared, [generated])).toEqual([])
  })

  it('détecte toujours les doublons et imports de types manuels', async () => {
    const { file, shared, generated } = await project()
    const first = await file('services/first.ts', 'export type Result = { value: string }')
    const second = await file('services/second.ts', 'export type Result = { value: number }')
    const consumer = await file(
      'app/consumer.ts',
      "import type { Result } from '../services/first'",
    )
    expect(analyze([first, second, consumer], shared, [generated])).toEqual([
      { kind: 'DUPLICATE', name: 'Result', files: [first, second] },
      { kind: 'SHOULD_MIGRATE', name: 'Result', definedIn: first, importedBy: [consumer] },
    ])
  })

  it('n’exempte pas un dossier voisin portant le même préfixe que les contrats générés', async () => {
    const { file, shared, generated } = await project()
    const definition = await file(
      'schemas/interfaces-custom/result.ts',
      'export type Result = string',
    )
    const consumer = await file(
      'app/consumer.ts',
      "import type { Result } from '../schemas/interfaces-custom/result'",
    )
    expect(analyze([definition, consumer], shared, [generated])).toEqual([
      { kind: 'SHOULD_MIGRATE', name: 'Result', definedIn: definition, importedBy: [consumer] },
    ])
  })

  it('autorise les types partagés sans exempter les dossiers au préfixe similaire', async () => {
    const { file, shared } = await project()
    const allowed = await file('shared/types/result.ts', 'export type Result = string')
    const misplaced = await file(
      'shared/types-legacy/result.ts',
      'export type LegacyResult = string',
    )
    const consumer = await file(
      'app/consumer.ts',
      "import type { Result } from '../shared/types/result'\nimport type { LegacyResult } from '../shared/types-legacy/result'",
    )
    expect(analyze([allowed, misplaced, consumer], shared, [])).toEqual([
      {
        kind: 'SHOULD_MIGRATE',
        name: 'LegacyResult',
        definedIn: misplaced,
        importedBy: [consumer],
      },
    ])
  })
})
