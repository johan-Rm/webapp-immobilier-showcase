import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'
import YAML from 'yaml'

import { buildPlan, webappRoot } from './run'

const workflow = (name: string) =>
  YAML.parse(readFileSync(resolve(webappRoot, '../.github/workflows', name), 'utf8'))
type Step = { run?: string; uses?: string; if?: string; 'continue-on-error'?: boolean }
type Job = { steps: Step[]; strategy?: { matrix: { target: string[] }; 'fail-fast': boolean } }
type Workflow = {
  name: string
  on: { pull_request?: unknown; push?: { branches: string[] } }
  jobs: Record<string, Job>
}
const names = [
  'ai-development-engineering.yml',
  'quality.yml',
  'conventions.yml',
  'internal-tests.yml',
  'runtime-tests.yml',
  'sonarqube.yml',
]
const targets = ['showcase-immobilier', 'client2-immobilier', 'dashboard']
const commands = (job: Job) => job.steps.map((step) => step.run ?? '').join('\n')
function contract(files: Record<string, Workflow>): string[] {
  const errors: string[] = []
  for (const name of names) {
    const file = files[name]
    if (!file) {
      errors.push(`famille absente: ${name}`)
      continue
    }
    const expectedNames: Record<string, string> = {
      'ai-development-engineering.yml': 'aide-tests',
      'conventions.yml': 'conventions-tests',
    }
    if (expectedNames[name] && file.name !== expectedNames[name])
      errors.push(`nom incorrect: ${name}`)
    if (
      !Object.hasOwn(file.on, 'pull_request') ||
      JSON.stringify(file.on.push?.branches) !== JSON.stringify(['develop', 'master'])
    )
      errors.push(`déclenchement: ${name}`)
    for (const job of Object.values(file.jobs))
      for (const step of job.steps ?? [])
        if (step['continue-on-error'] === true) errors.push(`échec masqué: ${name}`)
  }
  for (const [name, jobName] of [
    ['quality.yml', 'quality'],
    ['conventions.yml', 'source-quality'],
    ['internal-tests.yml', 'tests'],
    ['runtime-tests.yml', 'runtime'],
  ]) {
    const job = files[name]?.jobs[jobName]
    if (
      !job ||
      JSON.stringify(job.strategy?.matrix.target) !== JSON.stringify(targets) ||
      job.strategy?.['fail-fast'] !== false
    )
      errors.push(`matrice: ${name}`)
    if (
      !job?.steps.some(
        (step) => step.uses?.startsWith('actions/upload-artifact@') && step.if === 'always()',
      )
    )
      errors.push(`rapport: ${name}`)
  }
  for (const [name, jobName, expected] of [
    ['quality.yml', 'quality', 'bun run lint:check'],
    ['quality.yml', 'quality', 'bun run format:check'],
    ['quality.yml', 'quality', 'bun run type-check'],
    ['quality.yml', 'supply-chain', 'verify -- security'],
    ['quality.yml', 'supply-chain', 'verify -- architecture'],
    ['conventions.yml', 'source-quality', 'verify -- functions-debug'],
    ['conventions.yml', 'source-quality', 'verify -- duplicates'],
    ['internal-tests.yml', 'tests', 'verify -- unit'],
    ['internal-tests.yml', 'tests', 'verify -- integration'],
    ['internal-tests.yml', 'tests', 'verify -- components'],
    ['internal-tests.yml', 'tests', 'verify -- contracts'],
    ['internal-tests.yml', 'tests', 'verify -- coverage'],
    ['runtime-tests.yml', 'runtime', 'verify -- browser'],
    ['runtime-tests.yml', 'runtime', 'verify -- load'],
    ['ai-development-engineering.yml', 'cadre', 'make internal-tests-verifiers'],
    ['ai-development-engineering.yml', 'cadre', 'make conventions-tests-docs'],
    ['ai-development-engineering.yml', 'commits', 'git archive "$BASE_SHA" codebase-integrity'],
  ])
    if (!files[name]?.jobs[jobName] || !commands(files[name]!.jobs[jobName]!).includes(expected))
      errors.push(`contrôle absent: ${expected}`)
  const runtime = files['runtime-tests.yml']?.jobs.runtime
  if (!runtime || !commands(runtime).includes('fixture-server.ts --ssr'))
    errors.push('fixtures runtime absentes')
  const all = JSON.stringify(files).toLowerCase()
  if (
    /lighthouse|mutation-extended|saas-api-load|conventions-tests-devbook|verify -- mutation/.test(
      all,
    )
  )
    errors.push('contrôle local présent en CI')
  if (/https?:\/\/(?!127\.0\.0\.1)/.test(JSON.stringify(files['runtime-tests.yml'])))
    errors.push('runtime externe')
  if (Object.keys(files).length !== names.length) errors.push('nombre de familles')
  return errors
}
describe('contrat des workflows qualité', () => {
  const files = Object.fromEntries(names.map((name) => [name, workflow(name)])) as Record<
    string,
    Workflow
  >
  it('conserve les six familles, matrices, contrôles et exclusions', () => {
    expect(
      readdirSync(resolve(webappRoot, '../.github/workflows'))
        .filter((name) => /\.ya?ml$/.test(name))
        .sort(),
    ).toEqual([...names].sort())
    expect(contract(files)).toEqual([])
  })
  it('détecte une famille, cible ou couverture manquante', () => {
    for (const mutate of [
      (x: typeof files) => {
        delete x['runtime-tests.yml']
      },
      (x: typeof files) => {
        x['conventions.yml']!.name = 'conventions'
      },
      (x: typeof files) => {
        x['quality.yml']!.jobs.quality!.strategy!.matrix.target.pop()
      },
      (x: typeof files) => {
        x['internal-tests.yml']!.jobs.tests!.steps = x[
          'internal-tests.yml'
        ]!.jobs.tests!.steps.filter((s) => !s.run?.includes('verify -- coverage'))
      },
    ]) {
      const candidate = structuredClone(files)
      mutate(candidate)
      expect(contract(candidate).length).toBeGreaterThan(0)
    }
  })
  it('détecte les erreurs masquées et les contrôles exclus', () => {
    for (const mutate of [
      (x: typeof files) => {
        x['internal-tests.yml']!.jobs.tests!.steps.push({ 'continue-on-error': true })
      },
      (x: typeof files) => {
        x['runtime-tests.yml']!.jobs.runtime!.steps.push({ run: 'verify -- lighthouse' })
      },
      (x: typeof files) => {
        x['runtime-tests.yml']!.jobs.runtime!.steps.push({ run: 'curl https://api.example.com' })
      },
      (x: typeof files) => {
        x['internal-tests.yml']!.jobs.tests!.steps.push({ run: 'verify -- mutation-extended' })
      },
    ]) {
      const candidate = structuredClone(files)
      mutate(candidate)
      expect(contract(candidate).length).toBeGreaterThan(0)
    }
  })
  it('route les familles sur les trois cibles sans suite vide', () => {
    for (const target of targets as Array<
      'showcase-immobilier' | 'client2-immobilier' | 'dashboard'
    >)
      for (const family of [
        'unit',
        'integration',
        'browser',
        'contracts',
        'security',
        'architecture',
        'coverage',
        'functions-debug',
        'duplicates',
        'load',
      ] as const) {
        const plan = buildPlan({ family, target, list: true })
        expect(plan.files.length, `${target}/${family}`).toBeGreaterThan(0)
        expect(plan.commands.length).toBeGreaterThan(0)
      }
  })
})

describe('préparation explicite de l’image qualité', () => {
  function scenario(actions: string[], exitCode = 0, imageExit = 0, makeExecutable = 'make') {
    const directory = mkdtempSync(resolve(tmpdir(), 'quality-make-'))
    try {
      const calls = resolve(directory, 'calls.jsonl')
      const docker = resolve(directory, 'compose.cjs')
      const image = resolve(directory, 'image-ready')
      writeFileSync(
        docker,
        [
          `const args = process.argv.slice(2);`,
          `require('node:fs').appendFileSync(${JSON.stringify(calls)}, JSON.stringify(args) + String.fromCharCode(10));`,
          `if (args[0] === 'config') { console.log(JSON.stringify({name: 'fixture', services: {verify: {}}})); process.exit(0); }`,
          `if (args[0] === 'build' && ${exitCode} === 0) require('node:fs').writeFileSync(${JSON.stringify(image)}, 'ready');`,
          `process.exit(args[0] === 'image' ? (require('node:fs').existsSync(${JSON.stringify(image)}) ? 0 : ${imageExit}) : ${exitCode});`,
        ].join('\n'),
      )
      const results = actions.map((action) => {
        const result = spawnSync(
          makeExecutable,
          [
            '-f',
            'infra/make/Makefile.dev',
            ...action.split(' '),
            ...(action === 'quality-verify' ? ['FAMILY=contracts'] : []),
            `GD_TARGET=${action.includes('components') ? 'dashboard' : 'showcase-immobilier'}`,
            'WEBAPP_BASE_URL=http://127.0.0.1:19856',
            `CHECKS_COMPOSE=node ${docker}`,
            `CHECKS_DOCKER=node ${docker}`,
          ],
          { cwd: resolve(webappRoot, '..'), encoding: 'utf8' },
        )
        if (result.error)
          throw new Error(`Impossible de lancer Make : ${result.error.message}`, {
            cause: result.error,
          })
        if (result.signal) throw new Error(`Make interrompu par le signal ${result.signal}`)
        return result
      })
      let recorded: string[][]
      try {
        recorded = readFileSync(calls, 'utf8')
          .trim()
          .split('\n')
          .map((line) => JSON.parse(line))
      } catch (error) {
        throw new Error(
          results.map((result) => `${result.stdout ?? ''}${result.stderr ?? ''}`).join('\n'),
          {
            cause: error,
          },
        )
      }
      return { results, recorded }
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  }
  it('signale Make absent sans masquer la cause par un journal manquant ou NaN', () => {
    expect(() => scenario(['checks-prepare'], 0, 0, '/absent-make-dem011')).toThrow(
      /Impossible de lancer Make.*ENOENT/,
    )
  })
  it('prépare une fois puis réutilise l’image pour plusieurs contrôles', () => {
    const { results, recorded } = scenario(
      ['checks-prepare', 'conventions-tests-contracts', 'conventions-tests-contracts'],
      0,
      1,
    )
    expect(results.map((result) => result.status)).toEqual([0, 0, 0])
    expect(recorded.filter((args) => args[0] === 'build')).toEqual([['build', 'verify']])
    expect(recorded.filter((args) => args[0] === 'run')).toEqual([
      [
        'run',
        '--pull',
        'never',
        '--no-deps',
        '--rm',
        'verify',
        'contracts',
        '--target',
        'showcase-immobilier',
      ],
      [
        'run',
        '--pull',
        'never',
        '--no-deps',
        '--rm',
        'verify',
        'contracts',
        '--target',
        'showcase-immobilier',
      ],
    ])
    expect(results[1]!.stdout).toContain('make checks-prepare')
    expect(results[1]!.stdout).not.toContain(String.fromCharCode(27))
  })
  it('ignore les préparations répétées quand l’image existe', () => {
    const { results, recorded } = scenario(['checks-prepare', 'checks-prepare'], 0, 1)
    expect(results.map((result) => result.status)).toEqual([0, 0])
    expect(recorded.filter((args) => args[0] === 'build')).toHaveLength(1)
    expect(results[1]!.stdout).toContain('préparation ignorée')
  })
  it('reconstruit explicitement même si l’image existe déjà', () => {
    const { results, recorded } = scenario(['checks-rebuild'])
    expect(results[0]!.status).toBe(0)
    expect(recorded).toEqual([['build', 'verify']])
  })
  it('préserve un échec du contrôle sans reconstruire automatiquement', () => {
    const { results, recorded } = scenario(['conventions-tests-contracts'], 42)
    expect(results[0]!.status).not.toBe(0)
    expect(recorded.map((args) => args[0])).toEqual(['config', 'image', 'run'])
  })
  it('refuse une image absente sans lancer ni construire un conteneur', () => {
    const { results, recorded } = scenario(['conventions-tests-contracts'], 0, 1)
    expect(results[0]!.status).not.toBe(0)
    expect(results[0]!.stdout).toContain('Image des contrôles absente')
    expect(recorded.map((args) => args[0])).toEqual(['config', 'image'])
  })
  it.each([
    ['internal-tests-unit', 'unit'],
    ['internal-tests-integration', 'integration'],
    ['internal-tests-components', 'components'],
    ['runtime-tests-browser', 'browser'],
    ['third-party-tests-security', 'security'],
    ['internal-tests-mutation', 'mutation'],
    ['runtime-tests-load', 'load'],
    ['runtime-tests-lighthouse', 'lighthouse'],
    ['conventions-tests-contracts', 'contracts'],
    ['conventions-tests-architecture', 'architecture'],
    ['third-party-tests-lint', 'lint'],
    ['third-party-tests-format', 'format'],
    ['third-party-tests-types', 'types'],
    ['conventions-tests-types-placement', 'types-placement'],
    ['conventions-tests-images', 'images'],
    ['conventions-tests-business-logic', 'business-logic'],
    ['conventions-tests-script-setup', 'script-setup'],
    ['conventions-tests-responsibilities', 'responsibilities'],
    ['conventions-tests-code-quality', 'code-quality'],
    ['conventions-tests-solid', 'solid'],
    ['conventions-tests-guards', 'guards'],
    ['conventions-tests-services', 'services'],
  ])('route %s vers le lanceur commun sans build', (target, family) => {
    const { results, recorded } = scenario([target])
    expect(results[0]!.status).toBe(0)
    const runs = recorded.filter((args) => args[0] === 'run')
    expect(runs).toHaveLength(1)
    expect(runs[0]).toContain(family)
    expect(recorded.some((args) => args[0] === 'build')).toBe(false)
  })
  it.each([
    'internal-tests-browser',
    'internal-tests-load',
    'third-party-tests-lighthouse',
    'test-browser',
    'load-check',
    'lighthouse-check',
    'conventions-all',
    'third-party-tests-code',
    'conventions-check',
    'quality-conventions-check',
    'quality-check',
    'checks-run',
  ])('refuse le regroupement supprimé %s', (name) => {
    expect(() => scenario([name])).toThrow(/No rule to make target/)
  })
  it('exécute chaque commande lors d’un appel Make multiple sans FAMILY', () => {
    const { results, recorded } = scenario([
      'internal-tests-unit internal-tests-integration conventions-tests-contracts',
    ])
    expect(results[0]!.status).toBe(0)
    expect(recorded.filter((args) => args[0] === 'run').map((args) => args[6])).toEqual([
      'unit',
      'integration',
      'contracts',
    ])
  })
  it.each([
    ['quality-verify', 'conventions-tests-contracts'],
    ['quality-prepare', 'checks-prepare'],
    ['quality-rebuild', 'checks-rebuild'],
    ['quality-guards-check', 'conventions-tests-guards'],
    ['quality-services-check', 'conventions-tests-services'],
  ])('conserve %s comme délégation de compatibilité vers %s', (legacy, canonical) => {
    const before = scenario([legacy])
    const after = scenario([canonical])
    expect(before.results[0]!.status).toBe(0)
    expect(before.recorded).toEqual(after.recorded)
  })
  it.each([
    ['test-unit', 'internal-tests-unit'],
    ['test-integration', 'internal-tests-integration'],
    ['test-components', 'internal-tests-components'],
    ['test-mutation', 'internal-tests-mutation'],
    ['security-check', 'third-party-tests-security'],
    ['quality-lint-check', 'third-party-tests-lint'],
    ['quality-format-check', 'third-party-tests-format'],
    ['quality-type-check', 'third-party-tests-types'],
    ['conventions-tests-guards-check', 'conventions-tests-guards'],
    ['conventions-tests-services-check', 'conventions-tests-services'],
    ['conventions-tests-architecture-check', 'conventions-tests-architecture'],
    ['conventions-tests-contracts-check', 'conventions-tests-contracts'],
  ])('préserve l’alias %s vers %s', (legacy, canonical) => {
    expect(scenario([legacy]).recorded).toEqual(scenario([canonical]).recorded)
  })
  it('ne prétend pas que l’image est prête si sa préparation échoue', () => {
    const { results } = scenario(['checks-prepare'], 17, 1)
    expect(results[0]!.status).not.toBe(0)
    expect(results[0]!.stdout).not.toContain('Image prête')
  })
})
