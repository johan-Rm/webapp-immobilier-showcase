import { describe, expect, it } from 'vitest'

import { buildPlan, families, parseOptions, targets } from './run'

describe('catalogue public du lanceur', () => {
  it('refuse une famille, une cible ou un profil inconnu', () => {
    expect(() => parseOptions(['unknown'])).toThrow()
    expect(() => parseOptions(['unit', '--target', 'unknown'])).toThrow()
    expect(() => parseOptions(['unit', '--profile', 'mobile'])).toThrow()
  })
  it('expose une sélection sans environnement privé pour chaque famille disponible', () => {
    for (const target of targets)
      for (const family of families) {
        if (family === 'components' && target !== 'dashboard') {
          expect(() => buildPlan({ family, target, list: true })).toThrow(/non installé/)
          continue
        }
        const plan = buildPlan({ family, target, list: true })
        expect(plan.files.length).toBeGreaterThan(0)
        expect(plan.commands.length).toBeGreaterThan(0)
        for (const command of plan.commands)
          expect(command.env).toEqual({ GD_TARGET: target, VERIFY_FAMILY: family })
      }
  })
})
