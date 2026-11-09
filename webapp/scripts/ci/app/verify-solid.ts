/**
 * @rule README.md — SOLID SRP : Composants larges (warning)
 * @rule README.md — SOLID ISP : Types et interfaces larges (warning)
 * @rule README.md — SOLID SRP : Composables avec beaucoup de retours (warning)
 *
 * Mode : warning uniquement (exit 0)
 */

import { readFileSync } from 'node:fs'
import { basename, extname, relative } from 'node:path'

import { parse } from '@typescript-eslint/parser'

import { ROOT, listProjectFiles, loadValidationRule } from './validation-rules'

type LargeComponentRule = { maxLines?: number }
type LargeTypeRule = { maxFields?: number }
type ComposableReturnsRule = { maxReturns?: number }

const LARGE_COMPONENT_RULE = loadValidationRule<
  LargeComponentRule & { name: string; requiresManualReview: boolean }
>('app-large-component')
const LARGE_TYPE_RULE = loadValidationRule<
  LargeTypeRule & { name: string; requiresManualReview: boolean }
>('app-large-type')
const COMPOSABLE_RETURNS_RULE = loadValidationRule<
  ComposableReturnsRule & { name: string; requiresManualReview: boolean }
>('app-composable-many-returns')

const MAX_LINES = LARGE_COMPONENT_RULE.maxLines ?? 200
const MAX_FIELDS = LARGE_TYPE_RULE.maxFields ?? 8
const MAX_RETURNS = COMPOSABLE_RETURNS_RULE.maxReturns ?? 8

type FilePath = string
type Violation = { file: FilePath; rule: string; message: string }

function extractScriptContent(content: string): string {
  return content.match(/<script\b[^>]*>([\s\S]*?)<\/script>/i)?.[1] ?? ''
}

// --- Large component ---

export function checkLargeComponents(): Violation[] {
  const files = listProjectFiles(['.vue']).filter((f) =>
    relative(ROOT, f).startsWith('app/components/'),
  )
  return files.flatMap((file) => {
    let content: string
    try {
      content = readFileSync(file, 'utf-8')
    } catch {
      return []
    }
    const lines = content.split('\n').length
    if (lines <= MAX_LINES) return []
    return [
      {
        file,
        rule: 'app-large-component',
        message: `${lines} lignes (seuil : ${MAX_LINES}) — découper en composants plus petits`,
      },
    ]
  })
}

// --- Large types ---

type TypeInfo = { name: string; fields: number }

function extractTypesFromContent(content: string): TypeInfo[] {
  if (!content.trim()) return []
  let ast: ReturnType<typeof parse>
  try {
    ast = parse(content, { range: false, loc: false })
  } catch {
    return []
  }

  const types: TypeInfo[] = []
  for (const node of ast.body) {
    const decl =
      node.type === 'ExportNamedDeclaration'
        ? (node as { declaration?: unknown }).declaration
        : node

    if (!decl) continue

    if ((decl as { type: string }).type === 'TSInterfaceDeclaration') {
      const iface = decl as {
        id: { name: string }
        body: { body: unknown[] }
      }
      types.push({ name: iface.id.name, fields: iface.body.body.length })
    }

    if ((decl as { type: string }).type === 'TSTypeAliasDeclaration') {
      const alias = decl as {
        id: { name: string }
        typeAnnotation: { type: string; members?: unknown[] }
      }
      if (alias.typeAnnotation.type === 'TSTypeLiteral') {
        types.push({ name: alias.id.name, fields: alias.typeAnnotation.members?.length ?? 0 })
      }
    }
  }
  return types
}

export function checkLargeTypes(): Violation[] {
  const files = listProjectFiles(['.ts', '.vue'])
  const violations: Violation[] = []

  for (const file of files) {
    let raw: string
    try {
      raw = readFileSync(file, 'utf-8')
    } catch {
      continue
    }
    const content = extname(file) === '.vue' ? extractScriptContent(raw) : raw
    const types = extractTypesFromContent(content)
    for (const t of types) {
      if (t.fields > MAX_FIELDS) {
        violations.push({
          file,
          rule: 'app-large-type',
          message: `"${t.name}" — ${t.fields} champs (seuil : ${MAX_FIELDS}) — envisager ISP`,
        })
      }
    }
  }
  return violations
}

// --- Composable many returns ---

function countReturnKeys(content: string): number {
  const lines = content.split('\n')
  let returnStart = -1
  for (let i = lines.length - 1; i >= 0; i--) {
    if (/^\s*return\s*\{/.test(lines[i])) {
      returnStart = i
      break
    }
  }
  if (returnStart === -1) return 0

  let depth = 0
  const block: string[] = []
  for (let i = returnStart; i < lines.length; i++) {
    const line = lines[i]
    for (const ch of line) {
      if (ch === '{') depth++
      if (ch === '}') depth--
    }
    block.push(line)
    if (block.length > 1 && depth === 0) break
  }

  return block
    .slice(1, -1)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('//') && !l.startsWith('*')).length
}

export function checkComposableManyReturns(): Violation[] {
  const files = listProjectFiles(['.ts']).filter((f) => {
    const rel = relative(ROOT, f)
    return rel.startsWith('app/composables/') && basename(f).startsWith('use')
  })
  const violations: Violation[] = []

  for (const file of files) {
    let content: string
    try {
      content = readFileSync(file, 'utf-8')
    } catch {
      continue
    }
    const count = countReturnKeys(content)
    if (count > MAX_RETURNS) {
      violations.push({
        file,
        rule: 'app-composable-many-returns',
        message: `${count} valeurs exposées (seuil : ${MAX_RETURNS}) — découper en composables spécialisés`,
      })
    }
  }
  return violations
}

function rel(file: FilePath): string {
  return relative(ROOT, file)
}

function report(violations: Violation[]): void {
  if (violations.length === 0) {
    process.stdout.write('✓ SOLID OK\n')
    return
  }

  process.stderr.write(`\n⚠  ${violations.length} violation(s) SOLID (revue manuelle requise)\n\n`)
  for (const v of violations) {
    process.stderr.write(`  [${v.rule}] ${rel(v.file)}\n`)
    process.stderr.write(`  ${v.message}\n\n`)
  }
}

if (import.meta.main) {
  const violations = [
    ...checkLargeComponents(),
    ...checkLargeTypes(),
    ...checkComposableManyReturns(),
  ]
  report(violations)
  process.exit(0)
}
