import { describe, expect, it } from 'vitest'

import { evaluateSourceQuality } from './source-quality'

describe('raccordement qualité des sources', () => {
  it('bloque debugger tout en conservant les signalements', () => {
    const result = evaluateSourceQuality(
      { 'webapp/a.ts': 'debugger; console.warn(payload)' },
      {},
      'functions-debug',
      [],
      '2026-11-18',
    )
    expect(result.blocking).toHaveLength(1)
    expect(result.findings).toHaveLength(2)
  })
  it('compare la cible aux autres sans bloquer les duplications', () => {
    const content = Array.from(
      { length: 10 },
      (_, index) => `const variable_${index} = "some long value"`,
    ).join('\n')
    const result = evaluateSourceQuality(
      { 'webapp/a.ts': content },
      { 'webapp/b.ts': content },
      'duplicates',
      [],
      '2026-11-18',
    )
    expect(result.findings).toHaveLength(1)
    expect(result.blocking).toHaveLength(0)
  })
})
