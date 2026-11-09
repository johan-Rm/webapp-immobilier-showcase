/**
 * @rule services/README.md — Zéro dépendance framework
 *
 * Vérifie qu'aucun fichier de services/ n'importe Vue, Nuxt, Pinia ou un
 * module d'auto-import Nuxt. La couche services/ doit rester framework-agnostic.
 *
 * Règle déterministe : toute violation fait échouer le check (exit 1).
 */

import { execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { extname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import YAML from 'yaml'

const ROOT = resolve(fileURLToPath(new URL('../../..', import.meta.url)))
const RULES_FILE = join(ROOT, 'scripts', 'ci', 'services', 'rules.yaml')
const RULE_NAME = 'services-no-framework-imports'

type FrameworkImportsRule = {
  name: string
  requiresManualReview: boolean
  paths: string[]
  extensions: string[]
  forbiddenModules: string[]
}

type Violation = { file: string; line: number; module: string }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function loadRule(): FrameworkImportsRule {
  const parsed = YAML.parse(readFileSync(RULES_FILE, 'utf-8')) as { rules?: unknown[] }
  const rule = (parsed.rules ?? []).find((entry) => isRecord(entry) && entry.name === RULE_NAME)

  if (!isRecord(rule)) {
    throw new Error(`Règle YAML "${RULE_NAME}" introuvable dans ${RULES_FILE}`)
  }
  if (typeof rule.requiresManualReview !== 'boolean') {
    throw new Error(`La règle "${RULE_NAME}" doit définir requiresManualReview`)
  }

  return rule as unknown as FrameworkImportsRule
}

function collectFiles(rule: FrameworkImportsRule): string[] {
  const exts = new Set(rule.extensions)
  const prefixes = rule.paths.map((p) => `${p}/`)
  return execSync('git ls-files --full-name --cached --others --exclude-standard --deduplicate', {
    cwd: ROOT,
  })
    .toString()
    .split('\n')
    .filter(Boolean)
    .map((file) => (file.startsWith('webapp/') ? file.slice('webapp/'.length) : file))
    .filter((file, index, files) => files.indexOf(file) === index)
    .filter((file) => existsSync(join(ROOT, file)))
    .filter((f) => prefixes.some((prefix) => f.startsWith(prefix)))
    .filter((f) => exts.has(extname(f)))
    .map((f) => join(ROOT, f))
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
