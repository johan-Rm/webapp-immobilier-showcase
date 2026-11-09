/**
 * @rule README.md — Clean Code : Code commenté (warning)
 * @rule README.md — KISS : Ternaires imbriqués (bloquant)
 * @rule README.md — KISS : Niveaux d'imbrication (warning)
 * @rule README.md — YAGNI : TODO / FIXME (warning)
 *
 * - app-no-commented-code    : exit 0
 * - app-no-nested-ternary    : exit 1 si violations
 * - app-deep-nesting         : exit 0
 * - app-todo-fixme           : exit 0
 */

import { readFileSync } from 'node:fs'
import { extname, relative } from 'node:path'

import { ROOT, listProjectFiles, loadValidationRule } from './validation-rules'

type ScanRule = {
  patterns?: string[]
  markers?: string[]
  maxNestingDepth?: number
  indentSize?: number
  controlFlowKeywords?: string[]
}

const COMMENTED_CODE_RULE = loadValidationRule<
  ScanRule & { name: string; requiresManualReview: boolean }
>('app-no-commented-code')
loadValidationRule<ScanRule & { name: string; requiresManualReview: boolean }>(
  'app-no-nested-ternary',
)
const DEEP_NESTING_RULE = loadValidationRule<
  ScanRule & { name: string; requiresManualReview: boolean }
>('app-deep-nesting')
const TODO_FIXME_RULE = loadValidationRule<
  ScanRule & { name: string; requiresManualReview: boolean }
>('app-todo-fixme')

const COMMENTED_PATTERNS = COMMENTED_CODE_RULE.patterns ?? [
  '// const ',
  '// function ',
  '// return ',
  '// if (',
  '// for (',
  '// while (',
  '// let ',
  '// var ',
  '// type ',
  '// interface ',
]
const TODO_MARKERS = TODO_FIXME_RULE.markers ?? ['TODO', 'FIXME', 'HACK', 'XXX']
const NESTING_THRESHOLD =
  (DEEP_NESTING_RULE.maxNestingDepth ?? 4) * (DEEP_NESTING_RULE.indentSize ?? 2)
const CONTROL_FLOW_KEYWORDS = DEEP_NESTING_RULE.controlFlowKeywords ?? [
  'if (',
  'for (',
  'while (',
  'switch (',
  'else {',
  '} else',
]

type FilePath = string
type Violation = { file: FilePath; line: number; rule: string; message: string }

function extractScriptBlock(content: string): { text: string; lineOffset: number } | null {
  const match = content.match(/<script\b[^>]*>([\s\S]*?)<\/script>/i)
  if (!match || match.index === undefined) return null
  const lineOffset =
    content.slice(0, match.index + match[0].indexOf(match[1])).split('\n').length - 1
  return { text: match[1], lineOffset }
}

function isCommentedCode(line: string): boolean {
  const trimmed = line.trim()
  return COMMENTED_PATTERNS.some((p) => trimmed.startsWith(p.trim()))
}

function isNestedTernary(line: string): boolean {
  const trimmed = line.trim()
  if (trimmed.startsWith('//') || trimmed.startsWith('*')) return false
  if (/^\s*(?:export\s+)?(?:type|interface)\s+\w/.test(line)) return false

  let s = line
    .replace(/'(?:[^'\\]|\\.)*'/g, "''")
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/`(?:[^`\\]|\\.)*`/g, '``')
    .replace(/\/(?:[^/\\]|\\.)+\/[gimsuy]*/g, '/re/')

  s = s.replace(/\?\./g, '').replace(/\?\?/g, '').replace(/\w\?:/g, '')

  return (s.match(/\?/g) ?? []).length >= 2
}

function isDeepNesting(line: string): boolean {
  const spaces = line.match(/^(\s*)/)?.[1]?.length ?? 0
  if (spaces < NESTING_THRESHOLD) return false
  return CONTROL_FLOW_KEYWORDS.some((kw) => line.includes(kw))
}

function todoMarkerIn(line: string): string | null {
  const t = line.trim()
  if (!t.startsWith('//') && !t.startsWith('*') && !t.startsWith('/*')) return null
  return TODO_MARKERS.find((m) => t.includes(m)) ?? null
}

export function checkFile(file: FilePath): Violation[] {
  let content: string
  try {
    content = readFileSync(file, 'utf-8')
  } catch {
    return []
  }

  const isVue = extname(file) === '.vue'
  let scanText: string
  let lineOffset: number

  if (isVue) {
    const block = extractScriptBlock(content)
    if (!block) return []
    scanText = block.text
    lineOffset = block.lineOffset
  } else {
    scanText = content
    lineOffset = 0
  }

  const violations: Violation[] = []
  scanText.split('\n').forEach((line, idx) => {
    const lineNum = lineOffset + idx + 1

    if (isCommentedCode(line)) {
      violations.push({ file, line: lineNum, rule: 'app-no-commented-code', message: line.trim() })
    }

    if (isNestedTernary(line)) {
      violations.push({
        file,
        line: lineNum,
        rule: 'app-no-nested-ternary',
        message: line.trim(),
      })
    }

    if (isDeepNesting(line)) {
      const spaces = line.match(/^(\s*)/)?.[1]?.length ?? 0
      violations.push({
        file,
        line: lineNum,
        rule: 'app-deep-nesting',
        message: `${spaces} espaces — ${line.trim()}`,
      })
    }

    const marker = todoMarkerIn(line)
    if (marker) {
      violations.push({ file, line: lineNum, rule: 'app-todo-fixme', message: line.trim() })
    }
  })

  return violations
}

function rel(file: FilePath): string {
  return relative(ROOT, file)
}

const RULE_ADVICE: Record<string, string> = {
  'app-no-commented-code': '→ supprimer le code commenté ou le convertir en commentaire explicatif',
  'app-no-nested-ternary': '→ remplacer par une variable nommée ou un if/else explicite',
  'app-deep-nesting': '→ appliquer early return, extraire une fonction ou inverser la condition',
  'app-todo-fixme': '→ résoudre ou créer un ticket de suivi dédié',
}

function report(violations: Violation[]): number {
  if (violations.length === 0) {
    process.stdout.write('✓ Qualité de code OK\n')
    return 0
  }

  const byRule = new Map<string, Violation[]>()
  for (const v of violations) {
    const list = byRule.get(v.rule) ?? []
    list.push(v)
    byRule.set(v.rule, list)
  }

  let blocking = 0

  for (const [rule, items] of byRule) {
    const isBlocking = rule === 'app-no-nested-ternary'
    const icon = isBlocking ? '✗' : '⚠ '
    const suffix = isBlocking ? '' : ' (revue manuelle requise)'

    process.stderr.write(`\n${icon} [${rule}] ${items.length} occurrence(s)${suffix}\n\n`)
    for (const v of items) {
      process.stderr.write(`  ${rel(v.file)}:${v.line}\n`)
      process.stderr.write(`  ${v.message}\n`)
      process.stderr.write(`  ${RULE_ADVICE[rule] ?? ''}\n\n`)
    }

    if (isBlocking) blocking += items.length
  }

  return blocking
}

if (import.meta.main) {
  const files = listProjectFiles(['.ts', '.vue']).filter((f) => !f.startsWith(ROOT + '/scripts/'))
  const violations = files.flatMap(checkFile)
  const blocking = report(violations)
  process.exit(blocking > 0 ? 1 : 0)
}
