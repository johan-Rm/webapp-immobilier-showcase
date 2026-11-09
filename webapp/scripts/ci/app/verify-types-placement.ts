/**
 * @rule app/README.md — Convention : Placement des types
 *
 * Vérifie que tout type TypeScript manuel partagé est défini dans shared/types/.
 * Les contrats générés sont exclus selon la règle YAML.
 * Détecte les doublons (même nom exporté dans ≥2 fichiers hors shared/types/)
 * et les types à migrer (importés par un fichier externe à leur fichier de définition).
 */

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, extname, join, resolve, relative, isAbsolute, sep } from 'node:path'

import { parse } from '@typescript-eslint/parser'

import { ROOT, listProjectFiles, loadValidationRule, projectPath } from './validation-rules'

type TypesPlacementRule = {
  name: string
  requiresManualReview: boolean
  sharedTypesDir?: string
  generatedTypesDirs?: string[]
  aliases?: Record<string, string>
}

const RULE = loadValidationRule<TypesPlacementRule>('app-types-placement')
const EXCLUDED = new Set(['node_modules', '.nuxt', 'dist', '.git', '.tmp-test'])
const DEFAULT_SHARED_TYPES_DIR = projectPath(RULE.sharedTypesDir ?? 'shared/types')
const GENERATED_TYPES_DIRS = (RULE.generatedTypesDirs ?? []).map(projectPath)

const isWithinDirectory = (file: string, directory: string): boolean => {
  const path = relative(directory, file)
  return path === '' || (!isAbsolute(path) && path !== '..' && !path.startsWith(`..${sep}`))
}

const ALIAS_MAP: [prefix: string, target: string][] = [
  ...Object.entries(
    RULE.aliases ?? {
      '~/': 'app',
      '@/': 'app',
      '#shared/': 'shared',
      '@schemas/': 'schemas',
      '@services/': 'services',
    },
  ).map(([prefix, target]) => [prefix, projectPath(target) + '/'] as [string, string]),
]

export type FilePath = string
export type TypeName = string
export type Definition = { name: TypeName; file: FilePath; exported: boolean }
export type Usage = { typeName: TypeName; importedFrom: FilePath; importedBy: FilePath }
export type Violation =
  | { kind: 'DUPLICATE'; name: TypeName; files: FilePath[] }
  | { kind: 'SHOULD_MIGRATE'; name: TypeName; definedIn: FilePath; importedBy: FilePath[] }

export function collectFiles(dirs: string[]): FilePath[] {
  const files: FilePath[] = []

  function walk(dir: string): void {
    let entries: string[]
    try {
      entries = readdirSync(dir)
    } catch {
      return
    }
    for (const entry of entries) {
      if (EXCLUDED.has(entry)) continue
      const full = join(dir, entry)
      try {
        if (statSync(full).isDirectory()) {
          walk(full)
        } else {
          const ext = extname(entry)
          if (ext === '.ts' || ext === '.vue') files.push(full)
        }
      } catch {
        /* skip unreadable */
      }
    }
  }

  for (const dir of dirs) walk(dir)
  return files
}
export function extractScriptContent(vueContent: string): string {
  const match =
    vueContent.match(/<script\b[^>]*\blang="ts"[^>]*>([\s\S]*?)<\/script>/i) ??
    vueContent.match(/<script\b[^>]*>([\s\S]*?)<\/script>/i)
  return match?.[1] ?? ''
}
export function extractDefinitions(content: string, file: FilePath): Definition[] {
  if (!content.trim()) return []
  let ast: ReturnType<typeof parse>
  try {
    ast = parse(content, { range: false, loc: false })
  } catch {
    return []
  }

  const defs: Definition[] = []
  for (const node of ast.body) {
    const isExported = node.type === 'ExportNamedDeclaration'
    const decl = isExported ? node.declaration : node
    if (!decl) continue
    if (decl.type === 'TSTypeAliasDeclaration' || decl.type === 'TSInterfaceDeclaration') {
      defs.push({ name: (decl as { id: { name: string } }).id.name, file, exported: isExported })
    }
  }
  return defs
}

export function resolveImportPath(importPath: string, fromFile: FilePath): FilePath | null {
  const isExternal =
    !importPath.startsWith('.') &&
    !importPath.startsWith('/') &&
    !ALIAS_MAP.some(([p]) => importPath.startsWith(p))
  if (isExternal) return null

  let base: string
  const aliasMatch = ALIAS_MAP.find(([prefix]) => importPath.startsWith(prefix))
  if (aliasMatch) {
    const [prefix, target] = aliasMatch
    base = target + importPath.slice(prefix.length)
  } else {
    base = resolve(dirname(fromFile), importPath)
  }

  for (const suffix of ['', '.ts', '/index.ts', '.vue']) {
    try {
      statSync(base + suffix)
      return base + suffix
    } catch {
      /* try next */
    }
  }
  return base.endsWith('.ts') || base.endsWith('.vue') ? base : base + '.ts'
}

export function extractUsages(content: string, file: FilePath): Usage[] {
  if (!content.trim()) return []
  let ast: ReturnType<typeof parse>
  try {
    ast = parse(content, { range: false, loc: false })
  } catch {
    return []
  }

  const usages: Usage[] = []
  for (const node of ast.body) {
    if (node.type !== 'ImportDeclaration') continue
    const isTypeImport = (node as { importKind?: string }).importKind === 'type'
    const importedFrom = resolveImportPath(node.source.value as string, file)
    if (!importedFrom) continue

    for (const spec of node.specifiers) {
      if (spec.type !== 'ImportSpecifier') continue
      const isTypeSpec = isTypeImport || (spec as { importKind?: string }).importKind === 'type'
      if (!isTypeSpec) continue
      usages.push({
        typeName: (spec as { imported: { name: string } }).imported.name,
        importedFrom,
        importedBy: file,
      })
    }
  }
  return usages
}
export function analyze(
  files: FilePath[],
  sharedTypesDir: string = DEFAULT_SHARED_TYPES_DIR,
  generatedTypesDirs: string[] = GENERATED_TYPES_DIRS,
): Violation[] {
  const allDefs: Definition[] = []
  const allUsages: Usage[] = []

  for (const file of files) {
    // Generated contracts belong to their schema layer; placement applies to handwritten types.
    if (generatedTypesDirs.some((directory) => isWithinDirectory(file, directory))) continue
    let content: string
    try {
      content = readFileSync(file, 'utf-8')
    } catch {
      continue
    }
    if (file.endsWith('.vue')) content = extractScriptContent(content)
    allDefs.push(...extractDefinitions(content, file))
    allUsages.push(...extractUsages(content, file))
  }

  const violations: Violation[] = []

  // Règle 3 — DUPLICATE : même nom exporté dans ≥2 fichiers hors shared/types/.
  // Les types locaux de composants comme Props/Emits peuvent légitimement partager un nom.
  const defsByName = new Map<TypeName, FilePath[]>()
  for (const def of allDefs) {
    if (isWithinDirectory(def.file, sharedTypesDir) || !def.exported) continue
    defsByName.set(def.name, [...(defsByName.get(def.name) ?? []), def.file])
  }
  for (const [name, filePaths] of defsByName) {
    if (filePaths.length >= 2) violations.push({ kind: 'DUPLICATE', name, files: filePaths })
  }

  // Règle 2 — SHOULD_MIGRATE : type hors shared/types/ importé par ≥1 autre fichier
  for (const def of allDefs) {
    if (isWithinDirectory(def.file, sharedTypesDir)) continue
    const importers = allUsages
      .filter(
        (u) => u.typeName === def.name && u.importedFrom === def.file && u.importedBy !== def.file,
      )
      .map((u) => u.importedBy)
    if (importers.length > 0) {
      violations.push({
        kind: 'SHOULD_MIGRATE',
        name: def.name,
        definedIn: def.file,
        importedBy: importers,
      })
    }
  }

  return violations
}

function relative(file: FilePath): string {
  return file.startsWith(ROOT) ? file.slice(ROOT.length + 1) : file
}

function report(violations: Violation[]): void {
  if (violations.length === 0) {
    process.stdout.write('✓ Types placement OK\n')
    return
  }

  process.stderr.write(`\n✗ ${violations.length} violation(s) détectée(s)\n\n`)

  for (const v of violations) {
    if (v.kind === 'SHOULD_MIGRATE') {
      process.stderr.write(`  SHOULD_MIGRATE  ${relative(v.definedIn)}\n`)
      process.stderr.write(
        `                  Type "${v.name}" importé par ${v.importedBy.map(relative).join(', ')}\n`,
      )
      process.stderr.write(`                  → Déplacer dans shared/types/\n\n`)
    } else {
      process.stderr.write(`  DUPLICATE       Type "${v.name}"\n`)
      process.stderr.write(
        `                  Défini dans : ${v.files.map(relative).join(' et ')}\n`,
      )
      process.stderr.write(
        `                  → Conserver une seule définition dans shared/types/\n\n`,
      )
    }
  }
}

if (import.meta.main) {
  const files = listProjectFiles(['.ts', '.vue']).filter((f) => !f.startsWith(ROOT + '/scripts/'))
  const violations = analyze(files)
  report(violations)
  process.exit(violations.length > 0 ? 1 : 0)
}
