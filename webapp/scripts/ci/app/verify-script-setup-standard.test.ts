import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { afterEach, beforeEach, describe, expect, test } from 'bun:test'

import {
  checkFile,
  extractScriptBlock,
  findViolations,
  scanSections,
} from './verify-script-setup-standard'

const TMP = join(fileURLToPath(new URL('.', import.meta.url)), '.tmp-test-script-setup-standard')

function write(rel: string, content: string): string {
  const full = join(TMP, rel)
  mkdirSync(join(TMP, rel.split('/').slice(0, -1).join('/')), { recursive: true })
  writeFileSync(full, content, 'utf-8')
  return full
}

const ALL_SECTIONS = `
// 1. Imports
// 2. Types et constantes statiques
// 3. Props et emits
// 4. Composables, stores, routeur
// 5. Etat local
// 6. Data inputs
// 7. Validation et helpers purs
// 8. Computed UI-ready
// 9. Actions et handlers
// 10. Watch et watchEffect
// 11. Metadonnees ecran ou page
// 12. Lifecycle
`

beforeEach(() => mkdirSync(TMP, { recursive: true }))
afterEach(() => rmSync(TMP, { recursive: true, force: true }))

// --- extractScriptBlock ---

describe('extractScriptBlock', () => {
  test('extrait le bloc <script setup lang="ts"> et calcule le lineOffset', () => {
    const content = `<template><div/></template>\n<script setup lang="ts">\nconst x = 1\n</script>`
    const result = extractScriptBlock(content)
    expect(result).not.toBeNull()
    expect(result!.text).toContain('const x = 1')
    expect(result!.lineOffset).toBe(1)
  })

  test('retourne null si pas de bloc script', () => {
    expect(extractScriptBlock('<template><div/></template>')).toBeNull()
  })

  test('fonctionne sur un bloc <script> sans attributs (fallback)', () => {
    const result = extractScriptBlock('<script>\nconst y = 2\n</script>')
    expect(result).not.toBeNull()
    expect(result!.text).toContain('const y = 2')
  })
})

// --- scanSections ---

describe('scanSections', () => {
  test('détecte les 12 sections présentes', () => {
    const sections = scanSections(ALL_SECTIONS)
    expect(sections.size).toBe(12)
    for (let n = 1; n <= 12; n++) expect(sections.has(n)).toBe(true)
  })

  test('retourne une map vide si aucun commentaire de section', () => {
    expect(scanSections('const x = 1\nconst y = 2')).toEqual(new Map())
  })

  test('ignore les nombres hors plage 1-12', () => {
    const sections = scanSections('// 0. Before\n// 13. After\n// 1. Imports')
    expect(sections.has(0)).toBe(false)
    expect(sections.has(13)).toBe(false)
    expect(sections.has(1)).toBe(true)
  })

  test('conserve la première occurrence en cas de doublon', () => {
    const sections = scanSections('// 1. Imports\nconst a = 1\n// 1. Imports again')
    expect(sections.get(1)).toBe(1)
  })

  test('accepte les espaces avant le commentaire', () => {
    const sections = scanSections('  // 5. Etat local')
    expect(sections.has(5)).toBe(true)
  })

  test('enregistre le numéro de ligne correct (1-based)', () => {
    const sections = scanSections('\n// 1. Imports\n// 2. Types')
    expect(sections.get(1)).toBe(2)
    expect(sections.get(2)).toBe(3)
  })
})

// --- findViolations ---

describe('findViolations', () => {
  test("aucune violation si les 12 sections sont présentes dans l'ordre", () => {
    const sections = scanSections(ALL_SECTIONS)
    expect(findViolations(sections, 0, 'f.vue')).toHaveLength(0)
  })

  test('règle 1 — violation si des sections sont absentes', () => {
    const sections = new Map([
      [1, 1],
      [2, 2],
    ]) // sections 3-12 manquantes
    const v = findViolations(sections, 0, 'f.vue')
    expect(v).toHaveLength(1)
    expect(v[0]!.rule).toBe(1)
    expect(v[0]!.message).toContain('// 3.')
    expect(v[0]!.message).toContain('// 12.')
  })

  test('règle 1 — liste toutes les sections manquantes dans le message', () => {
    const sections = new Map([
      [1, 1],
      [3, 3],
      [5, 5],
    ])
    const v = findViolations(sections, 0, 'f.vue').filter((x) => x.rule === 1)
    expect(v[0]!.message).toContain('// 2.')
    expect(v[0]!.message).toContain('// 4.')
  })

  test('règle 2 — violation si une section apparaît avant une section de numéro inférieur', () => {
    // sections 1-12 présentes mais 5 apparaît après 6
    const sections = new Map<number, number>([
      [1, 1],
      [2, 2],
      [3, 3],
      [4, 4],
      [6, 5],
      [5, 6],
      [7, 7],
      [8, 8],
      [9, 9],
      [10, 10],
      [11, 11],
      [12, 12],
    ])
    const v = findViolations(sections, 0, 'f.vue')
    expect(v.some((x) => x.rule === 2)).toBe(true)
    const orderViolation = v.find((x) => x.rule === 2)!
    expect(orderViolation.message).toContain('// 5.')
    expect(orderViolation.message).toContain('// 6.')
  })

  test('lineOffset est ajouté au numéro de ligne absolu', () => {
    const sections = new Map([[1, 3]]) // section 1 à la ligne 3 du script
    const v = findViolations(sections, 10, 'f.vue').filter((x) => x.rule === 1)
    expect(v[0]!.line).toBe(11) // lineOffset(10) + 1 (début du bloc)
  })
})

// --- checkFile (intégration) ---

describe('checkFile', () => {
  test("aucune violation sur un fichier avec les 12 sections dans l'ordre", () => {
    const file = write(
      'components/Complete.vue',
      `<template><div/></template>\n<script setup lang="ts">${ALL_SECTIONS}</script>`,
    )
    expect(checkFile(file)).toHaveLength(0)
  })

  test("règle 1 — violation si le fichier n'a aucun commentaire de section", () => {
    const file = write(
      'components/Empty.vue',
      `<template><div/></template>\n<script setup lang="ts">\nconst x = 1\n</script>`,
    )
    const v = checkFile(file)
    expect(v).toHaveLength(1)
    expect(v[0]!.rule).toBe(1)
  })

  test('règle 2 — violation si les sections sont dans le mauvais ordre', () => {
    const outOfOrder = `
// 1. Imports
// 3. Props et emits
// 2. Types et constantes statiques
// 4. Composables, stores, routeur
// 5. Etat local
// 6. Data inputs
// 7. Validation et helpers purs
// 8. Computed UI-ready
// 9. Actions et handlers
// 10. Watch et watchEffect
// 11. Metadonnees ecran ou page
// 12. Lifecycle
`
    const file = write(
      'components/OutOfOrder.vue',
      `<template><div/></template>\n<script setup lang="ts">${outOfOrder}</script>`,
    )
    const v = checkFile(file)
    expect(v.some((x) => x.rule === 2)).toBe(true)
  })

  test("retourne [] si le fichier n'a pas de bloc script", () => {
    const file = write('components/NoScript.vue', '<template><div/></template>')
    expect(checkFile(file)).toHaveLength(0)
  })

  test('retourne [] si le fichier est illisible', () => {
    expect(checkFile('/nonexistent/File.vue')).toHaveLength(0)
  })
})
