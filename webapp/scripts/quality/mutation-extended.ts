import { execFileSync } from 'node:child_process'
import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'

import { discoverApplicationFiles } from '../../../codebase-integrity/commun/application-scope'

import { assessMutation, runOwned } from './mutation'
import { webappRoot } from './run'

type Target = 'showcase-immobilier' | 'client2-immobilier' | 'dashboard'

export function mutationTempRoot(root: string, candidate: string): string {
  const app = resolve(root)
  const temporary = resolve(candidate)
  return temporary === app || temporary.startsWith(`${app}/`) ? '/tmp' : temporary
}

export function mutationSelection(sources: string[], requested?: string[]) {
  const eligible = sources.filter((path) => /\.[cm]?[jt]sx?$/.test(path))
  const selected = requested ?? eligible
  if (!selected.length || selected.some((path) => !eligible.includes(path)))
    throw new Error('Sélection de mutation vide ou hors périmètre mesurable')
  return {
    selected: [...new Set(selected)].sort(),
    notSelected: sources
      .filter((path) => !selected.includes(path))
      .map((path) => ({
        path,
        reason: eligible.includes(path) ? 'Hors sélection explicite' : 'Mutation Vue non validée',
      })),
  }
}

export function mutationFiles(selected: string[], report: { files: Record<string, unknown> }) {
  return selected.map((path) => {
    const matches = Object.entries(report.files).filter(([name]) => {
      const normalized = name.replaceAll('\\', '/')
      return normalized.endsWith(`/${path.slice(7)}`) || normalized === path.slice(7)
    })
    if (matches.length > 1) throw new Error(`Fichier ambigu dans le rapport : ${path}`)
    const file = matches[0]?.[1] as { mutants?: { status: string }[] } | undefined
    const statuses = file?.mutants?.map((item) => item.status) ?? []
    const detected = statuses.filter((status) => status === 'Killed' || status === 'Timeout').length
    const survived = statuses.filter((status) => status === 'Survived').length
    const uncovered = statuses.filter((status) => status === 'NoCoverage').length
    if (!detected && !survived && !uncovered)
      return { path, status: 'non-mesurable', reason: 'Aucun mutant évaluable dans le rapport' }
    return {
      path,
      status: uncovered && !detected && !survived ? 'sans-couverture' : 'mesuré',
      detected,
      survived,
      uncovered,
    }
  })
}

export async function runExtendedMutation(
  target: Target,
  requested?: string[],
  root = webappRoot,
  pilot = false,
) {
  const repo = process.env.VERIFY_GIT_ROOT || resolve(root, '..')
  const scope = discoverApplicationFiles(repo, target)
  const selection = mutationSelection(scope.source, requested)
  if (
    pilot &&
    (selection.selected.length !== 1 || selection.selected[0] !== 'webapp/shared/saas/links.ts')
  )
    throw new Error('Le pilote est limité au module shared/saas/links.ts')
  const temporary = mkdtempSync(join(mutationTempRoot(root, tmpdir()), 'application-mutation-'))
  const app = join(temporary, 'webapp')
  try {
    const tracked = execFileSync('git', ['ls-files', '--cached', '--deduplicate', '-z'], {
      cwd: repo,
      encoding: 'utf8',
    })
      .split('\0')
      .filter(Boolean)
    const paths = [
      ...new Set([
        ...tracked,
        ...scope.source,
        ...scope.comparison,
        ...scope.excluded.filter((item) => item.reason === 'test').map((item) => item.path),
      ]),
    ]
    const sourceRoot = resolve(root, '..')
    for (const path of paths) {
      if (
        path
          .split('/')
          .some(
            (part) =>
              part === '..' ||
              part === '.git' ||
              part === 'node_modules' ||
              /^\.env(?:\.|$)/.test(part),
          )
      )
        continue
      const source = join(sourceRoot, path),
        dest = join(temporary, path)
      if (!existsSync(source) || !lstatSync(source).isFile()) {
        if (selection.selected.includes(path))
          throw new Error(`Source sélectionnée absente de l’image : ${path}`)
        continue
      }
      mkdirSync(dirname(dest), { recursive: true })
      cpSync(source, dest)
    }
    symlinkSync(join(root, 'node_modules'), join(app, 'node_modules'), 'dir')
    symlinkSync(
      join(root, '../codebase-integrity/node_modules'),
      join(temporary, 'codebase-integrity/node_modules'),
      'dir',
    )
    execFileSync('git', ['init', '-q', temporary])
    const mutate = selection.selected.map((path) => path.slice('webapp/'.length))
    const config = {
      testRunner: 'vitest',
      plugins: ['@stryker-mutator/vitest-runner'],
      mutate,
      vitest: {
        configFile: pilot ? 'scripts/quality/vitest-mutation.config.ts' : 'vitest.config.ts',
        related: false,
      },
      coverageAnalysis: 'perTest',
      concurrency: 1,
      // Stryker excludes .nuxt from its own sandbox; this whole project is already a disposable copy.
      inPlace: true,
      reporters: ['clear-text', 'json'],
      jsonReporter: { fileName: 'reports/mutation.json' },
      timeoutMS: 5000,
      timeoutFactor: 2,
    }
    writeFileSync(join(app, 'stryker-dem013.config.json'), JSON.stringify(config))
    const env = {
      GD_TARGET: target,
      VERIFY_GIT_ROOT: temporary,
      VERIFY_FAMILY: 'mutation',
      NUXT_TELEMETRY_DISABLED: '1',
    }
    await runOwned(
      'node',
      ['node_modules/nuxt/bin/nuxt.mjs', 'prepare', '--dotenv', '.env.test'],
      app,
      180000,
      env,
    )
    await runOwned(
      'node',
      ['node_modules/@stryker-mutator/core/bin/stryker.js', 'run', 'stryker-dem013.config.json'],
      app,
      1800000,
      env,
    )
    const report = JSON.parse(readFileSync(join(app, 'reports/mutation.json'), 'utf8')) as {
      files: Record<string, unknown>
    }
    const summary = {
      target,
      ...assessMutation(report),
      files: [
        ...mutationFiles(selection.selected, report),
        ...selection.notSelected.map((item) => ({ ...item, status: 'non-mesurable' })),
      ],
      exclusions: scope.excluded,
      notRun: [
        ...(pilot ? ['Pilote : seuls les tests directs du module partagé sont exécutés'] : []),
        'Bun : runner non validé',
        'Nuxt composants : runner non validé',
        'Navigateur : runner non validé',
      ],
    }
    const output = join(root, '.tmp/quality/mutation-extended')
    mkdirSync(output, { recursive: true })
    const reportDirectory = mkdtempSync(join(output, `${target}-`))
    writeFileSync(join(reportDirectory, 'summary.json'), JSON.stringify(summary, null, 2) + '\n')
    cpSync(join(app, 'reports/mutation.json'), join(reportDirectory, 'mutation.json'))
    process.stdout.write(`Rapport : ${reportDirectory}\n`)
    return summary
  } finally {
    rmSync(temporary, { recursive: true, force: true })
  }
}

if (import.meta.main) {
  const target = process.env.GD_TARGET
  if (target !== 'showcase-immobilier' && target !== 'client2-immobilier' && target !== 'dashboard')
    throw new Error('GD_TARGET invalide')
  const requested = process.env.QUALITY_MUTATION_FILES?.split(',').filter(Boolean)
  runExtendedMutation(
    target,
    requested,
    webappRoot,
    process.env.QUALITY_MUTATION_PILOT === '1',
  ).catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
