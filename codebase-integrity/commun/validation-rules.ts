import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import YAML from 'yaml'

const INTEGRITY_ROOT = fileURLToPath(new URL('..', import.meta.url))
export const ROOT = resolve(process.env.AIDE_WEBAPP_ROOT || resolve(INTEGRITY_ROOT, '../webapp'))

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

const RULES_FILES = readdirSync(join(INTEGRITY_ROOT, 'domaines'))
  .map((domain) => join(INTEGRITY_ROOT, 'domaines', domain, 'regles.yaml'))
  .filter(existsSync)

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
  return execFileSync(
    'git',
    [
      'ls-files',
      '--full-name',
      '--cached',
      '--others',
      '--exclude-standard',
      '--deduplicate',
      '-z',
      '--',
      'webapp',
    ],
    {
      cwd: process.env.AIDE_GIT_ROOT || resolve(INTEGRITY_ROOT, '..'),
    },
  )
    .toString()
    .split('\0')
    .filter((file) => file.startsWith('webapp/'))
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
  const rules = RULES_FILES.flatMap((path) => {
    const parsed = YAML.parse(readFileSync(path, 'utf-8')) as ValidationRulesFile
    return Array.isArray(parsed.rules) ? parsed.rules : []
  })
  const rule = rules.find((entry) => isRecord(entry) && entry.name === name)

  if (!isRecord(rule)) {
    throw new Error(`Regle YAML "${name}" introuvable dans les règles des domaines`)
  }

  assertRuleBase(rule, name)
  return rule as T
}
