import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

import { discoverApplicationFiles } from '../../../codebase-integrity/commun/application-scope'

import { runOwned } from './mutation'
import { buildPlan, webappRoot } from './run'

type CoverageFile = { path: string; s: Record<string, number> }
type CoverageResult = Record<string, CoverageFile>

export function summarizeCoverage(sources: string[], reports: CoverageResult[], root: string) {
  const measured = new Map<string, Record<string, number>>()
  for (const report of reports) {
    for (const entry of Object.values(report)) {
      const path = entry.path.replaceAll('\\', '/')
      const rootPrefix = `${resolve(root).replaceAll('\\', '/')}/`
      if (!path.startsWith(rootPrefix) || !entry.s || typeof entry.s !== 'object') continue
      const relative = `webapp/${path.slice(rootPrefix.length)}`
      const counts = Object.values(entry.s)
      if (!counts.every((count) => typeof count === 'number' && Number.isFinite(count)))
        throw new Error(`Couverture invalide : ${relative}`)
      const previous = measured.get(relative) ?? {}
      for (const [id, count] of Object.entries(entry.s)) previous[id] = (previous[id] ?? 0) + count
      measured.set(relative, previous)
    }
  }
  return sources.map((path) => {
    const statements = measured.get(path)
    if (!statements || !Object.keys(statements).length)
      return { path, status: 'non-mesurable', reason: 'Aucune mesure Vitest Node exploitable' }
    const counts = Object.values(statements)
    const executed = counts.filter((count) => count > 0).length
    return {
      path,
      status: executed ? 'mesuré' : 'non-couvert',
      statements: counts.length,
      executed,
    }
  })
}

export async function runCoverage(
  target: 'showcase-immobilier' | 'client2-immobilier' | 'dashboard',
  root = webappRoot,
) {
  const repo = process.env.VERIFY_GIT_ROOT || resolve(root, '..')
  const selection = discoverApplicationFiles(repo, target)
  const temporary = mkdtempSync(join(tmpdir(), 'application-coverage-'))
  const reports: CoverageResult[] = []
  const notRun = [
    'Bun : instrumentation distincte non disponible',
    'Nuxt composants : instrumentation non validée',
    'Navigateur : instrumentation non validée',
  ]
  try {
    for (const family of ['unit', 'integration'] as const) {
      const plan = buildPlan({ family, target, list: false }, root)
      const directory = join(temporary, family)
      mkdirSync(directory, { recursive: true })
      let measured = false
      for (const command of plan.commands) {
        if (command.executable === 'bun') continue
        const isVitest = command.args.some((arg) => arg.endsWith('/vitest.mjs'))
        const args = isVitest
          ? [
              ...command.args,
              '--coverage.enabled',
              '--coverage.provider=v8',
              '--coverage.reporter=json',
              `--coverage.reportsDirectory=${directory}`,
              ...selection.source
                .filter((path) => /\.[cm]?[jt]sx?$/.test(path))
                .map((path) => `--coverage.include=${path.slice('webapp/'.length)}`),
            ]
          : command.args
        await runOwned(command.executable, args, command.cwd, 900000, command.env)
        if (isVitest) measured = true
      }
      if (!measured) throw new Error(`Suite Vitest absente : ${family}`)
      reports.push(
        JSON.parse(readFileSync(join(directory, 'coverage-final.json'), 'utf8')) as CoverageResult,
      )
    }
    const result = {
      target,
      files: summarizeCoverage(selection.source, reports, root),
      exclusions: selection.excluded,
      notRun,
    }
    const output = join(root, '.tmp/quality/coverage')
    mkdirSync(output, { recursive: true })
    const directory = mkdtempSync(join(output, `${target}-`))
    writeFileSync(join(directory, 'summary.json'), JSON.stringify(result, null, 2) + '\n')
    process.stdout.write(`Rapport : ${directory}\n`)
    return result
  } finally {
    rmSync(temporary, { recursive: true, force: true })
  }
}

if (import.meta.main) {
  const target = process.env.GD_TARGET
  if (target !== 'showcase-immobilier' && target !== 'client2-immobilier' && target !== 'dashboard')
    throw new Error('GD_TARGET invalide')
  runCoverage(target).catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
