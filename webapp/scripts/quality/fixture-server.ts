import { createServer } from 'node:http'

/** API amont fictive, hors routes produit ; aucune connexion à Symfony. */
export function fixtureResponse(path: string, method: string) {
  if (path === '/api/auth/login' && method === 'POST') {
    const token = [
      Buffer.from('{}').toString('base64url'),
      Buffer.from(
        JSON.stringify({
          username: 'editor@example.test',
          exp: Math.floor(Date.now() / 1000) + 3600,
          roles: ['ROLE_USER'],
        }),
      ).toString('base64url'),
      'fixture-signature',
    ].join('.')
    return { status: 200, body: { token, refresh_token: 'fixture-refresh' } }
  }
  if (path === '/api/organizations')
    return {
      status: 200,
      body: {
        member: [{ id: '11111111-1111-4111-8111-111111111111', name: 'Organisation de test' }],
      },
    }
  if (path.endsWith('/members')) return { status: 403, body: { detail: 'denied' } }
  if (path.endsWith('/projects')) return { status: 200, body: { member: [] } }
  return { status: 404, body: { detail: 'not found' } }
}
export function startFixtureServer(port = 0) {
  const server = createServer((req, res) => {
    const result = fixtureResponse(
      new URL(req.url || '/', 'http://127.0.0.1').pathname,
      req.method || 'GET',
    )
    res.writeHead(result.status, {
      'content-type': 'application/json',
      'cache-control': 'no-store',
    })
    res.end(JSON.stringify(result.body))
  })
  return new Promise<{ origin: string; close: () => Promise<void> }>((done, reject) => {
    server.once('error', reject)
    server.listen(port, '127.0.0.1', () => {
      const address = server.address()
      if (!address || typeof address === 'string')
        return reject(new Error('Adresse fixture absente'))
      done({
        origin: `http://127.0.0.1:${address.port}`,
        close: () =>
          new Promise((ok, fail) => server.close((error) => (error ? fail(error) : ok()))),
      })
    })
  })
}
if (import.meta.main) {
  const fixture = await startFixtureServer(Number(process.env.QUALITY_FIXTURE_PORT || 19852))
  process.stdout.write(`Amont fictif : ${fixture.origin}\n`)
  for (const signal of ['SIGINT', 'SIGTERM'] as const)
    process.once(signal, () => {
      void fixture.close()
    })
}
