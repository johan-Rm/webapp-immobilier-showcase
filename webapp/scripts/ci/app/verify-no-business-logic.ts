/**
 * @rule app/README.md — Logique métier dans les composants
 *
 * Vérifie qu'aucun computed dans app/components/ ne combine une source globale
 * (store Pinia, appConfig, storeToRefs) avec une transformation de données
 * (.map, .filter, .reduce, .push).
 *
 * Les données dérivées appartiennent aux getters de store ou aux composables.
 *
 * Mode : warning uniquement (exit 0)
 */

import { readFileSync } from 'node:fs'
import { relative } from 'node:path'

import { parse } from '@typescript-eslint/parser'

import { ROOT, listProjectFiles, loadValidationRule } from './validation-rules'

type NoBusinessLogicRule = {
  globalSourcePattern?: string
  globalSourceFunctions?: string[]
  transforms?: string[]
}

const RULE = loadValidationRule<
  NoBusinessLogicRule & { name: string; requiresManualReview: boolean }
>('app-components-no-business-logic')

const GLOBAL_SOURCE_PATTERN = new RegExp(
  RULE.globalSourcePattern ?? '^use\\w+Store$|^useAppConfig$',
)
const GLOBAL_SOURCE_FUNCTIONS = new Set(RULE.globalSourceFunctions ?? ['storeToRefs'])
const TRANSFORMS = RULE.transforms ?? ['.map(', '.filter(', '.reduce(', '.push(']

export type FilePath = string
export type Violation = {
  file: FilePath
  line: number
  varName: string
  globalSources: string[]
  transforms: string[]
}

export function collectVueFiles(): FilePath[] {
  return listProjectFiles(['.vue']).filter((f) => relative(ROOT, f).startsWith('app/components/'))
}

export function extractScriptContent(content: string): string {
  const match =
    content.match(/<script\b[^>]*\blang="ts"[^>]*>([\s\S]*?)<\/script>/i) ??
    content.match(/<script\b[^>]*>([\s\S]*?)<\/script>/i)
  return match?.[1] ?? ''
}

function lineAt(content: string, index: number): number {
  return content.slice(0, index).split('\n').length
}

export function findGlobalSources(ast: ReturnType<typeof parse>): Set<string> {
  const sources = new Set<string>()

  for (const node of ast.body) {
    if (node.type !== 'VariableDeclaration') continue

    for (const decl of node.declarations) {
      if (!decl.init) continue

      const init = decl.init as {
        type: string
        callee?: { type: string; name?: string }
        arguments?: unknown[]
      }

      const isGlobalCall =
        init.type === 'CallExpression' &&
        init.callee?.type === 'Identifier' &&
        init.callee.name !== undefined &&
        (GLOBAL_SOURCE_PATTERN.test(init.callee.name) ||
          GLOBAL_SOURCE_FUNCTIONS.has(init.callee.name))

      if (!isGlobalCall) continue

      const id = decl.id as {
        type: string
        name?: string
        properties?: { type: string; value?: { type: string; name?: string } }[]
      }

      if (id.type === 'Identifier' && id.name) {
        sources.add(id.name)
      } else if (id.type === 'ObjectPattern' && id.properties) {
        for (const prop of id.properties) {
          if (prop.type === 'Property' && prop.value?.type === 'Identifier' && prop.value.name) {
            sources.add(prop.value.name)
          }
        }
      }
    }
  }

  return sources
}

export function findViolations(script: string, file: FilePath): Violation[] {
  if (!script.trim()) return []

  let ast: ReturnType<typeof parse>
  try {
    ast = parse(script, { range: true, loc: false })
  } catch {
    return []
  }

  const globalSources = findGlobalSources(ast)
  if (globalSources.size === 0) return []

  const violations: Violation[] = []

  for (const node of ast.body) {
    if (node.type !== 'VariableDeclaration') continue

    for (const decl of node.declarations) {
      if (!decl.init) continue

      const init = decl.init as {
        type: string
        callee?: { type: string; name?: string }
        arguments?: { range?: [number, number] }[]
      }

      const isComputed =
        init.type === 'CallExpression' &&
        init.callee?.type === 'Identifier' &&
        init.callee.name === 'computed' &&
        (init.arguments?.length ?? 0) > 0

      if (!isComputed || !init.arguments) continue

      const callback = init.arguments[0]
      if (!callback.range) continue

      const callbackText = script.slice(callback.range[0], callback.range[1])
      const matchedSources = [...globalSources].filter((name) => callbackText.includes(name))
      const matchedTransforms = TRANSFORMS.filter((t) => callbackText.includes(t))

      if (matchedSources.length > 0 && matchedTransforms.length > 0) {
        const id = decl.id as { type: string; name?: string }
        violations.push({
          file,
          line: lineAt(script, callback.range[0]),
          varName: id.type === 'Identifier' && id.name ? id.name : '?',
          globalSources: matchedSources,
          transforms: matchedTransforms,
        })
      }
    }
  }

  return violations
}

export function checkFile(file: FilePath): Violation[] {
  let content: string
  try {
    content = readFileSync(file, 'utf-8')
  } catch {
    return []
  }
  return findViolations(extractScriptContent(content), file)
}

function rel(file: FilePath): string {
  return relative(ROOT, file)
}

function report(violations: Violation[]): void {
  if (violations.length === 0) {
    process.stdout.write('✓ Logique métier OK\n')
    return
  }

  process.stderr.write(`\n⚠  ${violations.length} computed(s) suspects (warning)\n\n`)
  for (const v of violations) {
    process.stderr.write(`  ${rel(v.file)}:${v.line}\n`)
    process.stderr.write(
      `  computed "${v.varName}" — sources globales : ${v.globalSources.join(', ')}\n`,
    )
    process.stderr.write(`  transformations : ${v.transforms.join(', ')}\n`)
    process.stderr.write(`  → déplacer dans un getter de store ou un composable\n\n`)
  }
}

if (import.meta.main) {
  const files = collectVueFiles()
  const violations = files.flatMap(checkFile)
  report(violations)
  process.exit(0)
}
