import { spawn } from 'node:child_process'
import { createWriteStream } from 'node:fs'
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { dirname, join, resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'

import { projectionConfig } from '../saas/config'
import { manifestSchema } from '../saas/contract'
import { activateProjection } from '../saas/storage'

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
// JPEG déterministe décodable par IPX ; utilisé uniquement sous opt-in des fixtures média.
const fixtureJpeg = Buffer.from(
  '/9j/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAYACADASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAT/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFgEBAQEAAAAAAAAAAAAAAAAAAAQF/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AkAZCAAAAAAB//9k=',
  'base64',
)

export async function prepareShowcaseMediaFixtures(root: string, publicRoot: string) {
  const site = join(root, 'sites/showcase-immobilier')
  const sources = await Promise.all([
    readFile(join(site, 'app/app.config.ts'), 'utf8'),
    ...['fr', 'en', 'es'].map((locale) =>
      readFile(join(site, 'content', locale, 'web-pages/home.md'), 'utf8'),
    ),
  ])
  const images = new Set(
    sources.flatMap((source) =>
      [...source.matchAll(/\/images\/([a-zA-Z0-9_-]+\.jpe?g)\b/g)].map((match) => match[1]!),
    ),
  )
  const folder = join(publicRoot, 'images')
  await mkdir(folder, { recursive: true })
  for (const image of images) {
    await writeFile(join(folder, image), fixtureJpeg, { flag: 'wx' }).catch((error) => {
      if (error.code !== 'EEXIST') throw error
    })
  }
  return [...images]
}

export async function startFixtureStack(
  target: string,
  port: number,
  root = resolve(dirname(fileURLToPath(import.meta.url)), '../..'),
) {
  if (
    !['showcase-immobilier', 'client2-immobilier', 'dashboard'].includes(target) ||
    !Number.isInteger(port) ||
    port < 1024 ||
    port > 65535
  )
    throw new Error('Cible ou port de test invalide')
  const parent = join(root, '.tmp/quality')
  await mkdir(parent, { recursive: true })
  const temporary = await mkdtemp(join(parent, 'fixture-stack-'))
  const upstream = await startFixtureServer()
  const origin = `http://127.0.0.1:${port}`
  const projectId = '10000000-0000-4000-8000-000000000001'
  try {
    if (target === 'client2-immobilier' && process.env.QUALITY_BROWSER_FIXTURES !== '1') {
      const stage = join(temporary, 'projection/client2-immobilier/.stage-initial')
      await mkdir(join(stage, 'media'), { recursive: true })
      const config = projectionConfig({
        SAAS_PROJECTION_PROJECT_ID: projectId,
        SAAS_PROJECTION_SECRET: 'fixture-only-secret-32-characters-minimum',
        SAAS_PROJECTION_ROOT:
          process.env.QUALITY_BROWSER_FIXTURES === '1'
            ? join(root, '.tmp/web005-ci')
            : join(temporary, 'projection'),
        SAAS_DASHBOARD_URL: origin,
        SAAS_DASHBOARD_ORIGIN: origin,
        SAAS_PROJECTION_SOURCE_ORIGIN: origin,
      })
      await activateProjection(
        config,
        stage,
        manifestSchema.parse({
          schemaVersion: 1,
          projectId,
          target: 'client2-immobilier',
          generation: 1,
          sourceVersion: 'a'.repeat(64),
          articles: [],
          indexes: { fr: [], en: [], es: [] },
          media: [],
        }),
      )
    }
    const output = target === 'dashboard' ? 'dashboard/.output' : '.output'
    if (target === 'showcase-immobilier') {
      if (process.env.QUALITY_MEDIA_FIXTURES === '1') {
        await prepareShowcaseMediaFixtures(root, join(root, output, 'public'))
      }

      await cp(join(root, output, 'site', target, 'content'), join(temporary, 'content'), {
        recursive: true,
      })
      for (const locale of ['fr', 'en', 'es'])
        await mkdir(join(temporary, 'content', locale, 'accommodations'), { recursive: true })
    }
    const logPath = join(temporary, 'server.log'),
      log = createWriteStream(logPath)
    const child = spawn('node', [join(root, output, 'server/index.mjs')], {
      cwd: root,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        PATH: process.env.PATH,
        HOME: temporary,
        HOST: '127.0.0.1',
        PORT: String(port),
        SITE_URL: origin,
        NUXT_PUBLIC_SITE_URL: origin,
        SYMFONY_API_URL: upstream.origin,
        NUXT_SYMFONY_API_URL: upstream.origin,
        SAAS_ORIGIN: origin,
        SAAS_SESSION_DIR: join(temporary, 'sessions'),
        SAAS_PROJECTION_PROJECT_ID: projectId,
        SAAS_PROJECTION_ROOT:
          process.env.QUALITY_BROWSER_FIXTURES === '1'
            ? join(root, '.tmp/web005-ci')
            : join(temporary, 'projection'),
        SAAS_PREVIEW_SECRET: 'fixture-only-secret-32-characters-minimum',
        ACCOMMODATION_FIXTURES_ENABLED: 'true',
        ...(target === 'showcase-immobilier' ? { CONTENT_PATH: join(temporary, 'content') } : {}),
      },
    })
    child.stdout.pipe(log, { end: false })
    child.stderr.pipe(log, { end: false })
    let failure: Error | undefined
    child.on('error', (error) => {
      failure = error
    })
    let closed = false
    const close = async () => {
      if (closed) return
      closed = true
      if (child.exitCode === null && child.signalCode === null && child.pid) {
        child.kill('SIGTERM')
        await new Promise<void>((done) => {
          const timer = setTimeout(() => {
            child.kill('SIGKILL')
          }, 3000)
          child.once('close', () => {
            clearTimeout(timer)
            done()
          })
        })
      }
      log.end()
      await upstream.close()
      await rm(temporary, { recursive: true, force: true })
    }
    for (let attempt = 0; attempt < 100; attempt++) {
      if (failure || child.exitCode !== null || child.signalCode !== null) {
        await close()
        throw failure || new Error('SSR interrompu avant disponibilité')
      }
      try {
        const response = await fetch(
          origin +
            (target === 'dashboard'
              ? '/connexion'
              : target === 'showcase-immobilier'
                ? '/fr'
                : '/'),
          { redirect: 'manual', signal: AbortSignal.timeout(1000) },
        )
        if (response.status === 200) return { origin, logPath, close }
      } catch {}
      await delay(100)
    }
    await close()
    throw new Error('SSR indisponible après attente bornée')
  } catch (error) {
    await upstream.close().catch(() => undefined)
    await rm(temporary, { recursive: true, force: true })
    throw error
  }
}
if (import.meta.main) {
  const pending = process.argv.includes('--ssr')
    ? startFixtureStack(
        process.env.GD_TARGET || 'showcase-immobilier',
        Number(process.env.QUALITY_FIXTURE_PORT || 3000),
      )
    : startFixtureServer(Number(process.env.QUALITY_FIXTURE_PORT || 19852))
  for (const signal of ['SIGINT', 'SIGTERM'] as const)
    process.once(signal, () => {
      void pending.then((fixture) => fixture.close()).catch(() => undefined)
    })
  const fixture = await pending
  process.stdout.write(`Environnement de test prêt : ${fixture.origin}\n`)
}
