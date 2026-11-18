import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

import {
  discoverApplicationFiles,
  selectApplicationFiles,
} from '../../../codebase-integrity/commun/application-scope'
import { findDuplicates } from '../../../codebase-integrity/domaines/qualite-code/scripts/verify-duplicates'
import {
  applyExceptions,
  type DebuggerException,
} from '../../../codebase-integrity/domaines/qualite-code/scripts/verify-functions-debug'

import { webappRoot } from './run'

export function evaluateSourceQuality(
  sources: Record<string, string>,
  comparison: Record<string, string>,
  mode: 'functions-debug' | 'duplicates',
  exceptions: DebuggerException[],
  today: string,
) {
  if (mode === 'functions-debug') return applyExceptions(sources, exceptions, today)
  return {
    findings: findDuplicates({ ...sources, ...comparison }, new Set(Object.keys(sources))),
    blocking: [],
  }
}

export function runSourceQuality(
  mode: 'functions-debug' | 'duplicates',
  target: string,
  root = webappRoot,
) {
  const repo = process.env.VERIFY_GIT_ROOT || resolve(root, '..')
  const selection = discoverApplicationFiles(repo, target)
  if (!selection.source.length) throw new Error('Périmètre applicatif vide')
  const imageRoot = resolve(root, '..')
  const read = (paths: string[]) =>
    Object.fromEntries(
      paths.map((path) => {
        const full = join(imageRoot, path)
        if (!existsSync(full)) throw new Error(`Source absente de l’image : ${path}`)
        return [path, readFileSync(full, 'utf8')]
      }),
    )
  const source = read(selection.source)
  const comparison = mode === 'duplicates' ? read(selection.comparison) : {}
  const allExceptions = JSON.parse(
    readFileSync(join(imageRoot, 'codebase-integrity/commun/debugger-exceptions.json'), 'utf8'),
  ) as DebuggerException[]
  if (!Array.isArray(allExceptions)) throw new Error('Liste des exceptions invalide')
  const applicable = new Set(
    selectApplicationFiles(
      allExceptions.map((item) => item.path),
      target,
    ).source,
  )
  const exceptions = allExceptions.filter((item) => applicable.has(item.path))
  const result = evaluateSourceQuality(
    source,
    comparison,
    mode,
    exceptions,
    new Date().toISOString().slice(0, 10),
  )
  const output = join(root, '.tmp/quality/source-quality')
  mkdirSync(output, { recursive: true })
  const directory = mkdtempSync(join(output, `${mode}-${target}-`))
  writeFileSync(
    join(directory, 'summary.json'),
    JSON.stringify({ target, mode, ...result, exclusions: selection.excluded }, null, 2) + '\n',
  )
  process.stdout.write(
    `${result.findings.length} signalement(s), ${result.blocking.length} erreur(s) bloquante(s). Rapport : ${directory}\n`,
  )
  if (result.blocking.length) process.exitCode = 1
  return result
}

if (import.meta.main) {
  try {
    const mode = process.argv[2]
    if (mode !== 'functions-debug' && mode !== 'duplicates')
      throw new Error('Mode de contrôle invalide')
    runSourceQuality(mode, process.env.GD_TARGET || 'showcase-immobilier')
  } catch (error) {
    console.error(error)
    process.exitCode = 1
  }
}
