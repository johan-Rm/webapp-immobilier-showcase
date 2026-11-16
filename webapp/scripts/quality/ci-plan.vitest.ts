import { readFileSync } from 'node:fs'
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
