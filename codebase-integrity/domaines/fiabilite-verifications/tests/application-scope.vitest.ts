import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  classifySource,
  discoverApplicationFiles,
  escapeGlobPath,
  selectApplicationFiles,
} from '../../../commun/application-scope'

const files = [
  'webapp/base/real-estate/components/Test.vue',
  'webapp/server/api/contact.ts',
  'webapp/services/example.ts',
  'webapp/shared/example.ts',
  'webapp/shared/types.d.ts',
  'webapp/server/tests/example.vitest.ts',
  'webapp/sites/showcase-immobilier/app/index.vue',
  'webapp/sites/client2-immobilier/app/index.vue',
  'webapp/dashboard/app/index.vue',
  'webapp/dashboard/.nuxt/generated.ts',
  'webapp/scripts/quality/run.ts',
]

describe('périmètre applicatif', () => {
  it('préserve les crochets littéraux des routes dans les motifs', () => {
    expect(escapeGlobPath('server/[id].ts')).toBe('server/\\[id\\].ts')
  })
  it.each(['showcase-immobilier', 'client2-immobilier', 'dashboard'])(
    'ajoute le partagé et distingue les autres cibles : %s',
    (target) => {
      const result = selectApplicationFiles(files, target)
      expect(result.source).toContain('webapp/server/api/contact.ts')
      expect(result.source).toContain('webapp/base/real-estate/components/Test.vue')
      expect(result.source).toHaveLength(5)
      expect(result.comparison).toHaveLength(2)
      expect(result.source).not.toContain('webapp/scripts/quality/run.ts')
    },
  )
  it('classe les tests, types et fichiers générés', () => {
    expect(classifySource('webapp/shared/types.d.ts')).toBe('types')
    expect(classifySource('webapp/server/tests/example.vitest.ts')).toBe('test')
    expect(classifySource('webapp/dashboard/.nuxt/generated.ts')).toBe('generated')
  })
  it('inclut un nouveau fichier donné par l’inventaire et refuse une cible inconnue', () => {
    const newFile = 'webapp/dashboard/app/new.vue'
    expect(selectApplicationFiles([...files, newFile, newFile], 'dashboard').source).toContain(
      newFile,
    )
    expect(
      selectApplicationFiles([...files, newFile, newFile], 'dashboard').source.filter(
        (p) => p === newFile,
      ),
    ).toHaveLength(1)
    expect(() => selectApplicationFiles(files, 'unknown')).toThrow('Cible inconnue')
  })
  it('découvre les fichiers suivis et non suivis sans inclure les fichiers ignorés', () => {
    const root = mkdtempSync(join(tmpdir(), 'application-scope-'))
    try {
      execFileSync('git', ['init', '-q', root])
      mkdirSync(join(root, 'webapp/dashboard/app'), { recursive: true })
      writeFileSync(join(root, '.gitignore'), 'ignored.vue\n')
      writeFileSync(join(root, 'webapp/dashboard/app/tracked.vue'), '')
      execFileSync('git', ['-C', root, 'add', 'webapp/dashboard/app/tracked.vue'])
      writeFileSync(join(root, 'webapp/dashboard/app/new.vue'), '')
      writeFileSync(join(root, 'webapp/dashboard/app/ignored.vue'), '')
      expect(discoverApplicationFiles(root, 'dashboard').source).toEqual([
        'webapp/dashboard/app/new.vue',
        'webapp/dashboard/app/tracked.vue',
      ])
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})
