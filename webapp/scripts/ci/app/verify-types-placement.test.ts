import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { afterEach, beforeEach, describe, expect, test } from 'bun:test'

import {
  analyze,
  collectFiles,
  extractDefinitions,
  extractScriptContent,
  extractUsages,
  resolveImportPath,
} from './verify-types-placement'

const TMP = join(fileURLToPath(new URL('.', import.meta.url)), '.tmp-test')

function write(rel: string, content: string): string {
  const full = join(TMP, rel)
  mkdirSync(dirname(full), { recursive: true })
  writeFileSync(full, content, 'utf-8')
  return full
}

beforeEach(() => mkdirSync(TMP, { recursive: true }))
afterEach(() => rmSync(TMP, { recursive: true, force: true }))

describe('collectFiles', () => {
  test('collecte les fichiers .ts et .vue', () => {
    write('app/Foo.vue', '')
    write('app/bar.ts', '')
    write('app/ignored.js', '')
    const files = collectFiles([join(TMP, 'app')])
    expect(files.some((f) => f.endsWith('Foo.vue'))).toBe(true)
    expect(files.some((f) => f.endsWith('bar.ts'))).toBe(true)
    expect(files.some((f) => f.endsWith('ignored.js'))).toBe(false)
  })

  test('ignore node_modules et .nuxt', () => {
    write('app/node_modules/foo.ts', '')
    write('app/.nuxt/types.ts', '')
    write('app/real.ts', '')
    const files = collectFiles([join(TMP, 'app')])
    expect(files.some((f) => f.includes('node_modules'))).toBe(false)
    expect(files.some((f) => f.includes('.nuxt'))).toBe(false)
    expect(files.some((f) => f.endsWith('real.ts'))).toBe(true)
  })
})

describe('extractScriptContent', () => {
  test('extrait le contenu du bloc <script setup lang="ts">', () => {
    const vue = `<template><div/></template>\n<script setup lang="ts">\ntype Foo = string\n</script>`
    expect(extractScriptContent(vue)).toContain('type Foo = string')
  })

  test('extrait un bloc <script> simple sans lang', () => {
    const vue = `<script>\nconst x = 1\n</script>`
    expect(extractScriptContent(vue)).toContain('const x = 1')
  })

  test('retourne une chaîne vide si pas de bloc script', () => {
    expect(extractScriptContent('<template><div/></template>')).toBe('')
  })
})

describe('extractDefinitions', () => {
  test('extrait un type alias', () => {
    const defs = extractDefinitions(`type Foo = string`, '/tmp/foo.ts')
    expect(defs).toEqual([{ name: 'Foo', file: '/tmp/foo.ts', exported: false }])
  })

  test('extrait un type alias exporté', () => {
    const defs = extractDefinitions(`export type Bar = 'a' | 'b'`, '/tmp/bar.ts')
    expect(defs).toEqual([{ name: 'Bar', file: '/tmp/bar.ts', exported: true }])
  })

  test('extrait une interface', () => {
    const defs = extractDefinitions(`interface Baz { id: number }`, '/tmp/baz.ts')
    expect(defs).toEqual([{ name: 'Baz', file: '/tmp/baz.ts', exported: false }])
  })

  test('ignore les fonctions et variables', () => {
    expect(extractDefinitions(`const x = 1\nfunction foo() {}`, '/tmp/misc.ts')).toEqual([])
  })

  test("retourne [] en cas d'erreur de parsing", () => {
    expect(extractDefinitions(`{{{{ invalid TS`, '/tmp/bad.ts')).toEqual([])
  })
})

describe('resolveImportPath', () => {
  test('résout un chemin relatif .ts', () => {
    const fromFile = write('app/Foo.ts', '')
    write('app/Bar.ts', '')
    const resolved = resolveImportPath('./Bar', fromFile)
    expect(resolved).toContain('Bar.ts')
  })

  test('retourne null pour un package externe', () => {
    const fromFile = write('app/Foo.ts', '')
    expect(resolveImportPath('vue', fromFile)).toBeNull()
    expect(resolveImportPath('vue-router', fromFile)).toBeNull()
  })
})

describe('extractUsages', () => {
  test('détecte import type { Foo }', () => {
    write('app/Bar.ts', `export type Bar = string`)
    const fooFile = write('app/Foo.ts', `import type { Bar } from './Bar'`)
    const usages = extractUsages(`import type { Bar } from './Bar'`, fooFile)
    expect(usages).toHaveLength(1)
    expect(usages[0]!.typeName).toBe('Bar')
    expect(usages[0]!.importedBy).toBe(fooFile)
    expect(usages[0]!.importedFrom).toContain('Bar.ts')
  })

  test('détecte import { type Foo } (inline type)', () => {
    write('app/Baz.ts', `export type Baz = number`)
    const fooFile = write('app/Foo.ts', `import { type Baz } from './Baz'`)
    const usages = extractUsages(`import { type Baz } from './Baz'`, fooFile)
    expect(usages).toHaveLength(1)
    expect(usages[0]!.typeName).toBe('Baz')
  })

  test('ignore les imports de valeurs (non-type)', () => {
    const fooFile = write('app/Foo.ts', `import { ref } from 'vue'`)
    const usages = extractUsages(`import { ref } from 'vue'`, fooFile)
    expect(usages).toHaveLength(0)
  })
})

describe('analyze', () => {
  test('aucune violation si le type est local (non importé)', () => {
    const f = write('app/Foo.ts', `type Foo = string`)
    expect(analyze([f], join(TMP, 'shared', 'types'))).toEqual([])
  })

  test('SHOULD_MIGRATE si le type est importé par un autre fichier', () => {
    const a = write('app/a.ts', `export type Status = 'on' | 'off'`)
    const b = write('app/b.ts', `import type { Status } from './a'`)
    const violations = analyze([a, b], join(TMP, 'shared', 'types'))
    expect(violations).toHaveLength(1)
    expect(violations[0]!.kind).toBe('SHOULD_MIGRATE')
    expect((violations[0] as { name: string }).name).toBe('Status')
    expect((violations[0] as { definedIn: string }).definedIn).toBe(a)
    expect((violations[0] as { importedBy: string[] }).importedBy).toContain(b)
  })

  test('DUPLICATE si le même nom est exporté dans deux fichiers hors shared/types/', () => {
    const a = write('app/a.ts', `export type Status = 'on'`)
    const b = write('services/b.ts', `export type Status = 'off'`)
    const violations = analyze([a, b], join(TMP, 'shared', 'types'))
    expect(violations).toHaveLength(1)
    expect(violations[0]!.kind).toBe('DUPLICATE')
    expect((violations[0] as { name: string }).name).toBe('Status')
  })

  test('aucune violation si deux types locaux non exportés ont le même nom', () => {
    const a = write('app/a.ts', `type Props = { label: string }`)
    const b = write('services/b.ts', `type Props = { id: string }`)
    const violations = analyze([a, b], join(TMP, 'shared', 'types'))
    expect(violations).toHaveLength(0)
  })

  test('aucune violation si le type est dans shared/types/ et importé ailleurs', () => {
    const a = write('shared/types/app.ts', `export type AppLink = '_blank' | '_self'`)
    const b = write('app/b.ts', `import type { AppLink } from '../shared/types/app'`)
    const violations = analyze([a, b], join(TMP, 'shared', 'types'))
    expect(violations).toHaveLength(0)
  })

  test('aucune violation si le type est dans shared/types/ avec le même nom dans un autre fichier shared/types/', () => {
    const a = write('shared/types/app.ts', `export type AppLink = '_blank'`)
    const b = write('shared/types/links.ts', `export type AppLink = '_self'`)
    const violations = analyze([a, b], join(TMP, 'shared', 'types'))
    expect(violations).toHaveLength(0)
  })
})
