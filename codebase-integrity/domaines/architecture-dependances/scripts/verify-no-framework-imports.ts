/**
 * @rule services/README.md — Zéro dépendance framework
 *
 * Vérifie qu'aucun fichier de services/ n'importe Vue, Nuxt, Pinia ou un
 * module d'auto-import Nuxt. La couche services/ doit rester framework-agnostic.
 *
 * Règle déterministe : toute violation fait échouer le check (exit 1).
 */

import { readFileSync } from 'node:fs'
import { relative } from 'node:path'

import { ROOT, listProjectFiles, loadValidationRule } from '../../../commun/validation-rules'

const RULE_NAME = 'services-no-framework-imports'

type FrameworkImportsRule = {
  name: string
  requiresManualReview: boolean
  paths: string[]
  extensions: string[]
  forbiddenModules: string[]
}

type Violation = { file: string; line: number; module: string }

const loadRule = (): FrameworkImportsRule => loadValidationRule<FrameworkImportsRule>(RULE_NAME)

function collectFiles(rule: FrameworkImportsRule): string[] {
  const prefixes = rule.paths.map((path) => `${path}/`)
  return listProjectFiles(rule.extensions).filter((file) =>
    prefixes.some((prefix) => relative(ROOT, file).startsWith(prefix)),
  )
}

function isForbidden(specifier: string, forbidden: string[]): boolean {
  return forbidden.some((entry) =>
    entry.endsWith('/') ? specifier.startsWith(entry) : specifier === entry,
  )
}

const IMPORT_SPECIFIER = /(?:from|import|require)\s*\(?\s*['"]([^'"]+)['"]/g

function checkFile(file: string, rule: FrameworkImportsRule): Violation[] {
  let content: string
  try {
    content = readFileSync(file, 'utf-8')
  } catch {
    return []
  }

  const violations: Violation[] = []
  const lines = content.split('\n')

  lines.forEach((line, idx) => {
    for (const match of line.matchAll(IMPORT_SPECIFIER)) {
      const specifier = match[1]
      if (isForbidden(specifier, rule.forbiddenModules)) {
        violations.push({ file, line: idx + 1, module: specifier })
      }
    }
  })

  return violations
}

function report(violations: Violation[]): void {
  if (violations.length === 0) {
    process.stdout.write('✓ services/ sans import framework\n')
    return
  }

  process.stderr.write(
    `\n✗ ${violations.length} import(s) framework interdit(s) dans services/\n\n`,
  )
  for (const v of violations) {
    process.stderr.write(`  [${RULE_NAME}] ${relative(ROOT, v.file)}:${v.line}\n`)
    process.stderr.write(`  module : "${v.module}"\n`)
    process.stderr.write(`  → déplacer la logique réactive/Nuxt dans un composable ou une page\n\n`)
  }
}

if (import.meta.main) {
  const rule = loadRule()
  const violations = collectFiles(rule).flatMap((file) => checkFile(file, rule))
  report(violations)
  process.exit(violations.length === 0 ? 0 : 1)
}
