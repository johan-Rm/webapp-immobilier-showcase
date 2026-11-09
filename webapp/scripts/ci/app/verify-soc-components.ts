/**
 * @rule app/README.md — SOC : Fetch dans les composants
 * @rule app/README.md — SRP : Mutations de store dans les composants
 *
 * Vérifie que les composants app/components/ ne fetchent pas directement
 * et n'écrivent pas directement dans un store.
 *
 * Mode : warning uniquement (exit 0)
 */

import { readFileSync } from 'node:fs'
import { relative } from 'node:path'

import { ROOT, listProjectFiles, loadValidationRule } from './validation-rules'

type PatternRule = {
  patterns?: string[]
}

const FETCH_RULE = loadValidationRule<
  PatternRule & { name: string; requiresManualReview: boolean }
>('app-no-fetch-in-components')
const STORE_RULE = loadValidationRule<
  PatternRule & { name: string; requiresManualReview: boolean }
>('app-no-store-write-in-components')

const FETCH_PATTERNS = FETCH_RULE.patterns ?? ['$fetch(', 'useFetch(', 'useLazyFetch(']
const STORE_PATTERNS = STORE_RULE.patterns ?? ['.$patch(']

type FilePath = string
type Violation = { file: FilePath; line: number; rule: string; pattern: string }

function collectVueFiles(): FilePath[] {
  return listProjectFiles(['.vue']).filter((f) => relative(ROOT, f).startsWith('app/components/'))
}

function extractScriptLineOffset(content: string): number {
  const match = content.match(/<script\b[^>]*>([\s\S]*?)<\/script>/i)
  if (!match || match.index === undefined) return 0
  return content.slice(0, match.index + match[0].indexOf(match[1])).split('\n').length - 1
}

function extractScriptText(content: string): string {
  return content.match(/<script\b[^>]*>([\s\S]*?)<\/script>/i)?.[1] ?? ''
}

export function checkFile(file: FilePath): Violation[] {
  let content: string
  try {
    content = readFileSync(file, 'utf-8')
  } catch {
    return []
  }

  const scriptText = extractScriptText(content)
  if (!scriptText.trim()) return []

  const lineOffset = extractScriptLineOffset(content)
  const violations: Violation[] = []

  scriptText.split('\n').forEach((line, idx) => {
    const trimmed = line.trim()
    if (trimmed.startsWith('//') || trimmed.startsWith('*')) return

    const lineNum = lineOffset + idx + 1

    for (const pattern of FETCH_PATTERNS) {
      if (line.includes(pattern)) {
        violations.push({ file, line: lineNum, rule: 'app-no-fetch-in-components', pattern })
      }
    }
    for (const pattern of STORE_PATTERNS) {
      if (line.includes(pattern)) {
        violations.push({ file, line: lineNum, rule: 'app-no-store-write-in-components', pattern })
      }
    }
  })

  return violations
}

function rel(file: FilePath): string {
  return relative(ROOT, file)
}

function report(violations: Violation[]): void {
  if (violations.length === 0) {
    process.stdout.write('✓ SOC composants OK\n')
    return
  }

  process.stderr.write(`\n⚠  ${violations.length} violation(s) SOC (revue manuelle requise)\n\n`)
  for (const v of violations) {
    process.stderr.write(`  [${v.rule}] ${rel(v.file)}:${v.line}\n`)
    process.stderr.write(`  pattern : "${v.pattern}"\n`)
    if (v.rule === 'app-no-fetch-in-components') {
      process.stderr.write(`  → déplacer le fetch dans un composable ou une page\n\n`)
    } else {
      process.stderr.write(
        `  → modifier le store via une action, pas directement depuis un composant\n\n`,
      )
    }
  }
}

if (import.meta.main) {
  const files = collectVueFiles()
  const violations = files.flatMap(checkFile)
  report(violations)
  process.exit(0)
}
