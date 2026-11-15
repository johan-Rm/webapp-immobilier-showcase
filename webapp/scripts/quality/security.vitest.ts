import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  assessAudit,
  lockInventory,
  securityExitCode,
  validateExceptions,
  runSecurity,
} from './security'

const advisory = (severity = 'high') => ({
  id: 1,
  severity,
  url: 'https://github.com/advisories/GHSA-aaaa-bbbb-cccc',
})
const response = (data: unknown, status = 1, stderr = '') => ({
  status,
  stdout: JSON.stringify(data),
  stderr,
})
describe('politique des audits de dépendances', () => {
  it.each(['high', 'critical'])('bloque %s même sur un paquet de développement', (severity) => {
    expect(securityExitCode(assessAudit(response({ 'dev-tool': [advisory(severity)] })))).toBe(1)
  })
  it.each(['low', 'moderate'])('garde %s informatif malgré le code 1 de Bun', (severity) => {
    expect(securityExitCode(assessAudit(response({ pkg: [advisory(severity)] })))).toBe(0)
  })
  it('accepte un audit vide réussi mais refuse un échec vide', () => {
    expect(assessAudit(response({}, 0))).toEqual([])
    expect(() => assessAudit(response({}, 1))).toThrow()
  })
  it('borne les exceptions au paquet et à l’avis exacts', () => {
    const exceptions = validateExceptions([
      { package: 'pkg', advisory: '1', reason: 'décision humaine', expires: '2099-12-31' },
    ])
    expect(securityExitCode(assessAudit(response({ pkg: [advisory()] }), exceptions))).toBe(0)
    expect(securityExitCode(assessAudit(response({ other: [advisory()] }), exceptions))).toBe(1)
  })
  it('refuse une exception expirée, mal formée ou dupliquée', () => {
    expect(() =>
      validateExceptions([
        { package: 'pkg', advisory: '1', reason: 'test', expires: '2000-01-01' },
      ]),
    ).toThrow()
    expect(() =>
      validateExceptions([
        { package: 'pkg', advisory: '1', reason: 'test', expires: '2099-02-30' },
      ]),
    ).toThrow()
    expect(() => validateExceptions({})).toThrow()
    const duplicate = { package: 'pkg', advisory: '1', reason: 'test', expires: '2099-12-31' }
    expect(() => validateExceptions([duplicate, duplicate])).toThrow()
  })
  it.each([
    response({ error: 'transport' }, 2),
    response({ pkg: [advisory('unknown')] }),
    response({ skipped: ['private'] }),
    response({}, 0, 'Skipped private registry'),
    { status: null, stdout: '', stderr: '' },
    { status: 0, stdout: 'invalid', stderr: '' },
  ])('refuse transport, schéma inconnu et paquets ignorés', (result) => {
    expect(() => assessAudit(result)).toThrow()
  })
  it('expose les paquets hors registre et refuse un inventaire vide', () => {
    expect(lockInventory({ packages: { a: ['a@1.2.3'], local: ['local@file:../local'] } })).toEqual(
      { packages: 2, notAnalyzed: ['local'] },
    )
    expect(() => lockInventory({ packages: {} })).toThrow()
    expect(() => lockInventory({})).toThrow()
  })
})

it.each(['complete', 'missing', 'skipped'])(
  'vérifie les deux lockfiles et conserve les couvertures incomplètes : %s',
  (kind) => {
    const base = mkdtempSync(join(tmpdir(), 'security-fixture-'))
    try {
      const app = join(base, 'webapp')
      const integrity = join(base, 'codebase-integrity')
      mkdirSync(join(app, 'scripts/quality'), { recursive: true })
      mkdirSync(integrity)
      writeFileSync(join(app, 'scripts/quality/security-exceptions.json'), '[]')
      writeFileSync(join(app, 'bun.lock'), JSON.stringify({ packages: { a: ['a@1.0.0'] } }))
      if (kind !== 'missing')
        writeFileSync(
          join(integrity, 'bun.lock'),
          JSON.stringify({ packages: { a: [kind === 'skipped' ? 'a@file:../a' : 'a@1.0.0'] } }),
        )
      expect(runSecurity(app, () => response({}, 0))).toBe(kind === 'complete' ? 0 : 1)
      const report = JSON.parse(readFileSync(join(app, '.tmp/quality/security.json'), 'utf8'))
      expect(report.results).toHaveLength(2)
      if (kind === 'skipped') expect(report.results[1].notAnalyzed).toEqual(['a'])
      if (kind === 'missing') expect(report.results[1].error).toBeTruthy()
    } finally {
      rmSync(base, { recursive: true, force: true })
    }
  },
)
