import { createHash } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import { applyExceptions, inspectSource } from '../scripts/verify-functions-debug'

describe('fonctions et débogage', () => {
  it('signale la longueur et la complexité sans compter les fonctions imbriquées dans la complexité du parent', () => {
    const source = `function long() {\n${'const x = 1\n'.repeat(50)}function inner() { ${'if (x) {} '.repeat(11)} }\n}`
    const findings = inspectSource('app.ts', source)
    expect(findings.filter((x) => x.rule === 'function-length')).toHaveLength(1)
    expect(findings.filter((x) => x.rule === 'function-complexity')).toHaveLength(1)
  })
  it('détecte uniquement les instructions debugger et restitue les lignes Vue réelles', () => {
    const source =
      '<template><p>debugger</p></template>\n<script setup lang="ts">\n// debugger\nconst x = "debugger"\ndebugger\n</script>'
    expect(inspectSource('app.vue', source).filter((x) => x.rule === 'debugger')).toEqual([
      { rule: 'debugger', line: 5 },
    ])
  })
  it('signale les journaux suspects sans qualifier les autres', () => {
    expect(inspectSource('app.ts', 'console.warn(payload); console.error("failed")')).toEqual([
      { rule: 'debug-log', line: 1 },
    ])
  })
  it('refuse les sources invalides', () => {
    expect(() => inspectSource('app.ts', 'const x = ;')).toThrow('Source invalide')
  })
  it('analyse les fichiers JSX valides', () => {
    expect(inspectSource('app.jsx', 'const view = () => <div>ok</div>')).toEqual([])
  })
  it('accepte seulement une exception exacte, approuvée, non expirée et valide', () => {
    const sources = { 'app.ts': 'debugger;' }
    const item = {
      path: 'app.ts',
      line: 1,
      sha256: createHash('sha256').update(sources['app.ts']).digest('hex'),
      reason: 'justification',
      approval: 'verdict 1',
      expires: '2026-12-02',
    }
    expect(applyExceptions(sources, [], '2026-11-18').blocking).toHaveLength(1)
    expect(applyExceptions(sources, [item], '2026-12-02').blocking).toHaveLength(0)
    expect(() => applyExceptions(sources, [item], '2026-12-03')).toThrow()
    expect(() => applyExceptions(sources, [{ ...item, approval: '' }], '2026-11-18')).toThrow()
    expect(() =>
      applyExceptions(sources, [{ ...item, sha256: '0'.repeat(64) }], '2026-11-18'),
    ).toThrow()
    expect(() => applyExceptions(sources, [item, item], '2026-11-18')).toThrow()
    expect(() => applyExceptions(sources, [{ ...item, line: 2 }], '2026-11-18')).toThrow()
  })
})
