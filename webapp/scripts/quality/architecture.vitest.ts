import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

import { afterEach, describe, expect, it, vi } from 'vitest'

import { analyzeArchitecture, assessGraph } from './architecture'

const roots: string[] = []
afterEach(() => {
  vi.unstubAllEnvs()
  roots.splice(0).forEach((root) => rmSync(root, { recursive: true, force: true }))
})
const fixture = (source: string) => {
  const root = mkdtempSync(join(tmpdir(), 'architecture-fixture-'))
  roots.push(root)
  mkdirSync(join(root, 'services'))
  writeFileSync(join(root, 'services/example.ts'), source)
  symlinkSync(resolve(import.meta.dirname, '../../node_modules'), join(root, 'node_modules'), 'dir')
  return root
}
describe('couverture dependency-cruiser des services', () => {
  it('découvre les sources depuis le Git monté et analyse une copie sans métadonnées Git', () => {
    const catalog = mkdtempSync(join(tmpdir(), 'architecture-git-'))
    roots.push(catalog)
    execFileSync('git', ['init', '--quiet', catalog])
    mkdirSync(join(catalog, 'webapp/services'), { recursive: true })
    writeFileSync(join(catalog, 'webapp/services/example.ts'), 'export const value=1')
    vi.stubEnv('VERIFY_GIT_ROOT', catalog)
    const result = analyzeArchitecture(fixture('export const value=1'))
    expect(result.entryModules).toBe(1)
    expect(result.summary.violations).toHaveLength(0)
  })
  it('accepte un module sans dépendance, mais jamais un graphe vide', () => {
    const result = analyzeArchitecture(fixture('export const value=1'), ['services/example.ts'])
    expect(result.summary.dependencies).toBe(0)
    expect(result.summary.violations).toHaveLength(0)
    expect(() => assessGraph({ modules: [], summary: { violations: [] } })).toThrow()
    expect(() => analyzeArchitecture('.', [])).toThrow()
  })
  it.each([
    'import { ref } from "vue"; export const value=ref(1)',
    'import type { Ref } from "vue"; export type Value=Ref<string>',
    'export { ref } from "vue"',
    'export const promise = import("vue")',
    'import "vue/dist/vue.runtime.esm-bundler.js"',
  ])('refuse le framework, y compris types, réexports, dynamique et sous-chemins', (source) => {
    expect(
      analyzeArchitecture(fixture(source), ['services/example.ts']).summary.violations.length,
    ).toBeGreaterThan(0)
  })
  it('résout les alias et détecte un alias pointant vers Vue', () => {
    const root = fixture('import {ref} from "#shared"; export const value=ref(1)')
    symlinkSync(resolve(import.meta.dirname, '../../node_modules/vue'), join(root, 'shared'), 'dir')
    expect(
      analyzeArchitecture(root, ['services/example.ts']).summary.violations.length,
    ).toBeGreaterThan(0)
  })
  it('rend visible un import non résolu sans inventer une nouvelle interdiction', () => {
    const result = analyzeArchitecture(fixture('export { value } from "./absent"'), [
      'services/example.ts',
    ])
    expect(result.summary.unresolved).toHaveLength(1)
    expect(result.summary.violations).toHaveLength(0)
  })
})
