import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'
import YAML from 'yaml'

import { buildPlan, webappRoot } from './run'

const workflow = (name: string) =>
  YAML.parse(readFileSync(resolve(webappRoot, '../.github/workflows', name), 'utf8'))
describe('contrat des workflows qualité', () => {
  it('exécute les trois cibles sans abandon de matrice', () => {
    const job = workflow('quality.yml').jobs.quality
    expect(job.strategy.matrix.target).toEqual([
      'showcase-immobilier',
      'client2-immobilier',
      'dashboard',
    ])
    expect(job.strategy['fail-fast']).toBe(false)
    expect(job.env.QUALITY_MEDIA_FIXTURES).toBe('1')
  })
  it('route réellement les familles sur les trois cibles sans suite vide', () => {
    for (const target of ['showcase-immobilier', 'client2-immobilier', 'dashboard'] as const)
      for (const family of [
        'unit',
        'integration',
        'browser',
        'contracts',
        'security',
        'architecture',
        'mutation',
        'load',
        'lighthouse',
      ] as const) {
        const plan = buildPlan({
          family,
          target,
          list: true,
          ...(family === 'lighthouse' ? { profile: 'desktop' } : {}),
        })
        expect(plan.files.length, `${target}/${family}`).toBeGreaterThan(0)
        expect(plan.commands.length).toBeGreaterThan(0)
      }
  })
  it('ne masque pas les échecs des familles bloquantes', () => {
    const jobs = workflow('quality.yml').jobs
    for (const name of ['quality', 'supply-chain'])
      for (const step of jobs[name].steps) expect(step['continue-on-error']).not.toBe(true)
    const security = jobs['supply-chain'].steps.find((step: { run?: string }) =>
      step.run?.includes('verify -- security'),
    )
    expect(security).toBeDefined()
  })
  it('contrôle les messages depuis la base PR et conserve les rapports en échec', () => {
    const source = readFileSync(
      resolve(webappRoot, '../.github/workflows/ai-development-engineering.yml'),
      'utf8',
    )
    expect(source).toContain('git archive "$BASE_SHA" codebase-integrity')
    expect(source).toContain('module.check_range(Path(repository), base, head)')
    for (const name of ['quality.yml', 'quality-extended.yml'])
      expect(
        workflow(name).jobs[name === 'quality.yml' ? 'quality' : 'measure'].steps.some(
          (step: { uses?: string; if?: string }) =>
            step.uses?.startsWith('actions/upload-artifact@') && step.if === 'always()',
        ),
      ).toBe(true)
  })
  it('réserve les mesures longues à une demande explicite', () => {
    const file = workflow('quality-extended.yml')
    expect(file.on.workflow_dispatch.inputs.family.options).toEqual([
      'mutation',
      'load',
      'lighthouse',
    ])
    expect(file.jobs.measure['timeout-minutes']).toBe(20)
  })
})

describe('préparation explicite de l’image qualité', () => {
  function scenario(actions: string[], exitCode = 0, imageExit = 0) {
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
      const results = actions.map((action) =>
        spawnSync(
          'make',
          [
            '-f',
            'infra/make/Makefile.dev',
            action,
            'FAMILY=contracts',
            'GD_TARGET=showcase-immobilier',
            `QUALITY_COMPOSE=node ${docker}`,
            `QUALITY_DOCKER=node ${docker}`,
          ],
          { cwd: resolve(webappRoot, '..'), encoding: 'utf8' },
        ),
      )
      let recorded: string[][]
      try {
        recorded = readFileSync(calls, 'utf8')
          .trim()
          .split('\n')
          .map((line) => JSON.parse(line))
      } catch (error) {
        throw new Error(results.map((result) => result.stdout + result.stderr).join('\n'), {
          cause: error,
        })
      }
      return { results, recorded }
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  }
  it('prépare une fois puis réutilise l’image pour plusieurs contrôles', () => {
    const { results, recorded } = scenario(
      ['quality-prepare', 'quality-verify', 'quality-verify'],
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
    expect(results[1]!.stdout).toContain('make quality-prepare')
    expect(results[1]!.stdout).not.toContain(String.fromCharCode(27))
  })
  it('ignore les préparations répétées quand l’image existe', () => {
    const { results, recorded } = scenario(['quality-prepare', 'quality-prepare'], 0, 1)
    expect(results.map((result) => result.status)).toEqual([0, 0])
    expect(recorded.filter((args) => args[0] === 'build')).toHaveLength(1)
    expect(results[1]!.stdout).toContain('préparation ignorée')
  })
  it('reconstruit explicitement même si l’image existe déjà', () => {
    const { results, recorded } = scenario(['quality-rebuild'])
    expect(results[0]!.status).toBe(0)
    expect(recorded).toEqual([['build', 'verify']])
  })
  it('préserve un échec du contrôle sans reconstruire automatiquement', () => {
    const { results, recorded } = scenario(['quality-verify'], 42)
    expect(results[0]!.status).not.toBe(0)
    expect(recorded.map((args) => args[0])).toEqual(['config', 'image', 'run'])
  })
  it('refuse une image absente sans lancer ni construire un conteneur', () => {
    const { results, recorded } = scenario(['quality-verify'], 0, 1)
    expect(results[0]!.status).not.toBe(0)
    expect(results[0]!.stdout).toContain('Image qualité absente')
    expect(recorded.map((args) => args[0])).toEqual(['config', 'image'])
  })
  it.each([
    ['quality-lint-check', 'lint'],
    ['quality-format-check', 'format'],
    ['quality-type-check', 'types'],
    ['quality-guards-check', 'guards'],
    ['quality-services-check', 'services'],
    ['quality-conventions-check', 'conventions'],
  ])('route %s vers le lanceur commun sans build', (target, family) => {
    const { results, recorded } = scenario([target])
    expect(results[0]!.status).toBe(0)
    const runs = recorded.filter((args) => args[0] === 'run')
    expect(runs).toHaveLength(1)
    expect(runs[0]).toContain(family)
    expect(recorded.some((args) => args[0] === 'build')).toBe(false)
  })
  it('arrête quality-check au premier échec sans lancer les autres contrôles', () => {
    const { results, recorded } = scenario(['quality-check'], 42)
    expect(results[0]!.status).not.toBe(0)
    expect(recorded.filter((args) => args[0] === 'run')).toHaveLength(1)
  })
  it('ne prétend pas que l’image est prête si sa préparation échoue', () => {
    const { results } = scenario(['quality-prepare'], 17, 1)
    expect(results[0]!.status).not.toBe(0)
    expect(results[0]!.stdout).not.toContain('Image prête')
  })
})
