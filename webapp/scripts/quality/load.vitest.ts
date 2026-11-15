import { createServer } from 'node:http'

import { describe, expect, it } from 'vitest'

import { fixtureResponse, startFixtureServer } from './fixture-server'
import { assessLoad, loadProfile, localOrigin, preflight } from './load'
describe('charge bornée et isolée', () => {
  it.each([
    'https://example.test',
    'http://localhost',
    'http://127.0.0.1/path',
    'http://user:pass@127.0.0.1',
    'http://127.0.0.1/?token=x',
    undefined,
  ])('refuse une origine étrangère ou ambiguë', (value) =>
    expect(() => localOrigin(value)).toThrow(),
  )
  it('borne les profils', () => {
    expect(loadProfile('smoke')).toBe('smoke')
    expect(loadProfile('measure')).toBe('measure')
    expect(() => loadProfile('unlimited')).toThrow()
  })
  it.each([
    {},
    { metrics: {} },
    { metrics: { checks: { values: { fails: 1 } }, http_reqs: { values: { count: 3 } } } },
  ])('refuse un relevé vide ou échoué', (value) => expect(() => assessLoad(value)).toThrow())
  it('refuse redirection et contenu de connexion inattendu', async () => {
    const server = createServer((req, res) => {
      if (req.url === '/redirect') {
        res.writeHead(302, { location: 'https://foreign.test' })
        res.end()
      } else res.end('Connexion')
    })
    await new Promise<void>((done) => server.listen(0, '127.0.0.1', done))
    const address = server.address() as { port: number }
    try {
      for (const path of ['/redirect', '/private'])
        await expect(
          preflight(`http://127.0.0.1:${address.port}`, {
            path,
            status: 200,
            contains: 'Vos sites',
          }),
        ).rejects.toThrow()
    } finally {
      server.closeAllConnections()
      await new Promise<void>((done) => server.close(() => done()))
    }
  })
  it('ne crée aucun endpoint de test produit', async () => {
    const fixture = await startFixtureServer()
    try {
      expect((await fetch(fixture.origin + '/unknown')).status).toBe(404)
      expect(fixtureResponse('/api/auth/login', 'POST').status).toBe(200)
    } finally {
      await fixture.close()
    }
  })
})

it('accepte le schéma du résumé k6 1.6.1', () => {
  expect(
    assessLoad({
      metrics: {
        http_reqs: { count: 3 },
        checks: { passes: 6, fails: 0 },
        http_req_failed: { value: 0 },
        http_req_duration: { med: 12 },
      },
    }),
  ).toMatchObject({ requests: 3, informativeLatency: true })
})
