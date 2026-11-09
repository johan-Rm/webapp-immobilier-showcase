import { execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import YAML from 'yaml'

export const ROOT = resolve(fileURLToPath(new URL('../../..', import.meta.url)))

export type RuleSeverity = 'error' | 'warning'

export type ValidationRuleBase = {
  name: string
  requiresManualReview: boolean
  severity?: RuleSeverity
  description?: string
}

type ValidationRulesFile = {
  rules?: unknown[]
}

const RULES_FILE = join(ROOT, 'scripts', 'ci', 'app', 'rules.yaml')

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function assertRuleBase(
  rule: Record<string, unknown>,
  name: string,
): asserts rule is ValidationRuleBase & Record<string, unknown> {
  if (rule.name !== name) {
    throw new Error(`Regle YAML "${name}" introuvable`)
  }

  if (typeof rule.requiresManualReview !== 'boolean') {
    throw new Error(`La regle YAML "${name}" doit definir requiresManualReview`)
  }
}

export function listProjectFiles(extensions: string[] = []): string[] {
  const extSet = extensions.length > 0 ? new Set(extensions) : null
  return execSync('git ls-files --full-name --cached --others --exclude-standard --deduplicate', {
    cwd: ROOT,
  })
    .toString()
    .split('\n')
    .filter(Boolean)
    .map((file) => (file.startsWith('webapp/') ? file.slice('webapp/'.length) : file))
    .filter((file, index, files) => files.indexOf(file) === index)
    .filter((file) => existsSync(join(ROOT, file)))
    .map((f: string) => join(ROOT, f))
    .filter((f: string) => !extSet || extSet.has(extname(f)))
}

export function projectPath(path: string): string {
  return join(ROOT, path)
}

export function projectPaths(paths: string[] | undefined): string[] {
  return (paths ?? []).map(projectPath)
}

export function loadValidationRule<T extends ValidationRuleBase & Record<string, unknown>>(
  name: string,
): T {
  const raw = readFileSync(RULES_FILE, 'utf-8')
  const parsed = YAML.parse(raw) as ValidationRulesFile
  const rules = Array.isArray(parsed.rules) ? parsed.rules : []
  const rule = rules.find((entry) => isRecord(entry) && entry.name === name)

  if (!isRecord(rule)) {
    throw new Error(`Regle YAML "${name}" introuvable dans ${RULES_FILE}`)
  }

  assertRuleBase(rule, name)
  return rule as T
}
