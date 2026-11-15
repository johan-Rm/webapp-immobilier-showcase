/**
 * @rule README.md — SOLID SRP : Composants larges (warning)
 * @rule README.md — SOLID ISP : Types et interfaces larges (warning)
 * @rule README.md — SOLID SRP : Composables avec beaucoup de retours (erreur si comptage certain)
 *
 * Mode : avertissements, sauf dépassement certain des retours ou erreur de lecture/analyse.
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, extname, join, relative } from 'node:path'

import { parse } from '@typescript-eslint/parser'

import { diagnosticLimit, sourceContext } from '../../../commun/console-context'
import {
  ROOT,
  isFrontendFile,
  listProjectFiles,
  loadValidationRule,
} from '../../../commun/validation-rules'

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
type Violation = { file: FilePath; rule: string; message: string; severity?: 'error' | 'warning' }

function extractScriptContent(content: string): string {
  return content.match(/<script\b[^>]*>([\s\S]*?)<\/script>/i)?.[1] ?? ''
}

// --- Large component ---

export function checkLargeComponents(): Violation[] {
  const files = listProjectFiles(['.vue']).filter((f) => isFrontendFile(f, ['components']))
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
        types.push({
          name: alias.id.name,
          fields: alias.typeAnnotation.members?.length ?? 0,
        })
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

type Node = { type: string; [key: string]: unknown }
type ReturnSize = { name: string; count: number; complete: boolean }
const functionTypes = new Set([
  'FunctionDeclaration',
  'FunctionExpression',
  'ArrowFunctionExpression',
])

export function countComposableReturns(content: string): ReturnSize[] {
  const ast = parse(content, { range: false, loc: false }) as unknown as Node
  const results: ReturnSize[] = []
  const visit = (node: Node, action: (node: Node) => boolean) => {
    if (!action(node)) return
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) {
        for (const child of value)
          if (child && typeof child === 'object' && 'type' in child) visit(child as Node, action)
      } else if (value && typeof value === 'object' && 'type' in value) visit(value as Node, action)
    }
  }
  const top = new Map<string, Node>()
  for (const entry of ast.body as Node[]) {
    const node = (entry.declaration as Node | undefined) ?? entry
    if (node.type === 'VariableDeclaration' && node.kind === 'const') {
      for (const decl of node.declarations as Node[]) {
        const id = decl.id as Node
        if (id.type === 'Identifier' && decl.init) top.set(id.name as string, decl.init as Node)
      }
    }
  }
  const analyze = (fn: Node, name: string) => {
    if (!/^use[A-Z0-9_]/.test(name)) return
    const bindings = new Map(top)
    const body = fn.body as Node
    if (body.type === 'BlockStatement') {
      for (const node of body.body as Node[]) {
        if (node.type !== 'VariableDeclaration' || node.kind !== 'const') continue
        for (const decl of node.declarations as Node[]) {
          const id = decl.id as Node
          if (id.type === 'Identifier' && decl.init)
            bindings.set(id.name as string, decl.init as Node)
        }
      }
    }
    // Des mutations ou appels peuvent changer un objet lié : ne pas inventer sa taille finale.
    const shadowed = new Set<string>()
    visit(fn, (node) => {
      if (node.type === 'VariableDeclarator' && (node.id as Node).type === 'Identifier')
        shadowed.add((node.id as Node).name as string)
      return true
    })
    for (const parameter of fn.params as Node[])
      visit(parameter, (node) => {
        if (node.type === 'Identifier') bindings.delete(node.name as string)
        return true
      })
    visit(ast, (node) => {
      const target = (node.left ?? node.argument) as Node | undefined
      if (
        ['AssignmentExpression', 'UpdateExpression', 'UnaryExpression'].includes(node.type) &&
        target?.type === 'MemberExpression'
      )
        bindings.clear()
      if (node.type === 'CallExpression') {
        const callee = node.callee as Node
        if (
          callee.type === 'MemberExpression' &&
          bindings.has((callee.object as Node).name as string)
        )
          bindings.clear()
        if (
          (node.arguments as Node[]).some(
            (arg) => arg.type === 'Identifier' && bindings.has(arg.name as string),
          )
        )
          bindings.clear()
        if (callee.type === 'Identifier' && shadowed.has(callee.name as string)) bindings.clear()
      }
      return true
    })
    const keys = (
      node: Node | undefined,
      seen = new Set<string>(),
    ): { keys: Set<string>; complete: boolean } => {
      if (!node) return { keys: new Set(), complete: false }
      if (['TSAsExpression', 'TSSatisfiesExpression', 'TSNonNullExpression'].includes(node.type))
        return keys(node.expression as Node, seen)
      if (node.type === 'Identifier') {
        const id = node.name as string
        if (seen.has(id)) return { keys: new Set(), complete: false }
        return keys(bindings.get(id), new Set([...seen, id]))
      }
      if (node.type !== 'ObjectExpression') return { keys: new Set(), complete: false }
      const found = new Set<string>()
      let complete = true
      for (const prop of node.properties as Node[]) {
        if (prop.type === 'SpreadElement') {
          const spread = keys(prop.argument as Node, seen)
          spread.keys.forEach((key) => found.add(key))
          complete &&= spread.complete
        } else {
          const key = prop.key as Node
          if (!prop.computed && key.type === 'Identifier') found.add(key.name as string)
          else if (key.type === 'Literal' && ['string', 'number'].includes(typeof key.value))
            found.add(String(key.value))
          else complete = false
        }
      }
      return { keys: found, complete }
    }
    const record = (value: Node | undefined) => {
      const result = keys(value)
      results.push({ name, count: result.keys.size, complete: result.complete })
    }
    if (body.type !== 'BlockStatement') record(body)
    else
      visit(body, (node) => {
        if (functionTypes.has(node.type)) return false
        if (node.type === 'ReturnStatement') {
          record(node.argument as Node | undefined)
          return false
        }
        return true
      })
  }
  for (const entry of ast.body as Node[]) {
    const node = (entry.declaration as Node | undefined) ?? entry
    if (node.type === 'FunctionDeclaration' && node.id)
      analyze(node, (node.id as Node).name as string)
    if (node.type === 'VariableDeclaration') {
      for (const decl of node.declarations as Node[]) {
        const init = decl.init as Node | undefined
        if (init && functionTypes.has(init.type) && (decl.id as Node).type === 'Identifier')
          analyze(init, (decl.id as Node).name as string)
      }
    }
  }
  return results
}

export const solidExitCode = (violations: Violation[]) =>
  Number(violations.some((v) => v.severity === 'error'))

export function checkComposableManyReturns(): Violation[] {
  const files = listProjectFiles(['.ts']).filter((f) => {
    return isFrontendFile(f, ['composables']) && basename(f).startsWith('use')
  })
  const violations: Violation[] = []

  for (const file of files) {
    let content: string
    try {
      content = readFileSync(file, 'utf-8')
    } catch (error) {
      violations.push({
        file,
        rule: 'app-composable-many-returns',
        severity: 'error',
        message: `Lecture impossible : ${String(error)}`,
      })
      continue
    }
    try {
      for (const result of countComposableReturns(content)) {
        if (result.count > MAX_RETURNS || !result.complete)
          violations.push({
            file,
            rule: 'app-composable-many-returns',
            severity: result.count > MAX_RETURNS ? 'error' : 'warning',
            message:
              result.count > MAX_RETURNS
                ? `${result.name} : au moins ${result.count} propriétés exposées (maximum : ${MAX_RETURNS})`
                : `${result.name} : retour dynamique, comptage incomplet ; revue humaine nécessaire`,
          })
      }
    } catch (error) {
      violations.push({
        file,
        rule: 'app-composable-many-returns',
        severity: 'error',
        message: `Analyse impossible : ${String(error)}`,
      })
    }
  }
  return violations
}

function rel(file: FilePath): string {
  return relative(ROOT, file)
}

const colored =
  Boolean(process.stdout.isTTY) &&
  !['', 'dumb'].includes(process.env.TERM ?? '') &&
  !('NO_COLOR' in process.env)
const paint = (text: string, color: number) => (colored ? `\x1b[${color}m${text}\x1b[0m` : text)

function report(violations: Violation[]): void {
  const errors = violations.filter((v) => v.severity === 'error')
  const warnings = violations.filter((v) => v.severity !== 'error')
  const directory = join(ROOT, '.tmp/quality')
  mkdirSync(directory, { recursive: true })
  const reportPath = join(directory, 'solid.json')
  writeFileSync(
    reportPath,
    JSON.stringify(
      {
        errors: errors.length,
        warnings: warnings.length,
        findings: violations.map((v) => ({
          ...v,
          file: rel(v.file),
          severity: v.severity ?? 'warning',
        })),
      },
      null,
      2,
    ) + '\n',
  )
  process.stdout.write(
    paint(
      `[1/1] ${errors.length ? 'ÉCHEC' : 'RÉUSSI'} — ${errors.length} erreurs bloquantes`,
      errors.length ? 31 : 32,
    ) + '\n',
  )
  process.stdout.write(
    paint(`  ${warnings.length} avertissements à relire.`, warnings.length ? 33 : 90) + '\n\n',
  )
  const displayed = errors.length
    ? errors.slice(0, diagnosticLimit(errors.length))
    : warnings.slice(0, diagnosticLimit(warnings.length))
  for (const v of displayed) {
    process.stdout.write(`  ${rel(v.file)} [${v.rule}]\n    ${v.message}\n`)
  }
  process.stdout.write(
    '\n' +
      paint(
        `Résultat : ${errors.length ? 'ÉCHEC' : 'RÉUSSI'} — les avertissements seuls ne bloquent pas.`,
        errors.length ? 31 : 32,
      ) +
      '\n',
  )
  process.stdout.write(`Rapport complet : ${reportPath}\n`)
}

if (import.meta.main) {
  process.stdout.write('Contrôle de taille des composants, types et composables\n\n')
  process.stdout.write(sourceContext(ROOT) + '\n')
  process.stdout.write(
    paint(
      'INFO — Signale les composants au-delà de 200 lignes et les types larges ; bloque les retours de composables dépassant huit propriétés certaines. Les retours dynamiques restent à relire.',
      34,
    ) + '\n\n',
  )
  process.stdout.write(
    paint('[1/1] EN COURS — Analyser les tailles et interfaces exposées', 34) + '\n',
  )
  const violations = [
    ...checkLargeComponents(),
    ...checkLargeTypes(),
    ...checkComposableManyReturns(),
  ]
  report(violations)
  process.exit(solidExitCode(violations))
}
