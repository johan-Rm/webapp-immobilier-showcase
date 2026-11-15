import { spawnSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { cpus, platform, release } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { runOwned } from './mutation'

export const k6Image =
  'grafana/k6:1.6.1@sha256:a5ad6bc089a08d77c3ec49f3db8c6fa7a148e4073efcac44c675dbaf3568d8e1'
export function localOrigin(value: string | undefined) {
  if (!value) throw new Error('QUALITY_BASE_URL explicite requis')
  const url = new URL(value)
  if (
    url.protocol !== 'http:' ||
    !['127.0.0.1', '[::1]'].includes(url.hostname) ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  )
    throw new Error('Origine HTTP de test sur boucle locale requise')
  return url.origin
}
export function loadProfile(value: string | undefined) {
  if (value && value !== 'smoke' && value !== 'measure')
    throw new Error('Profil smoke ou measure requis')
  return value || 'smoke'
}
export async function preflight(
  origin: string,
  route: { path: string; status: number; contains: string },
) {
  const response = await fetch(new URL(route.path, localOrigin(origin)), {
    redirect: 'manual',
    signal: AbortSignal.timeout(5000),
  })
  if (
    response.status !== route.status ||
    (await response.text()).includes(route.contains) === false
  )
    throw new Error('Route de test inattendue, indisponible ou redirigée')
}
export function assessLoad(value: unknown) {
  const metrics = (value as { metrics?: Record<string, Record<string, number>> })?.metrics
  if (
    !metrics ||
    !Number.isInteger(metrics.http_reqs?.count) ||
    !(metrics.http_reqs.count > 0) ||
    !(metrics.checks?.passes > 0) ||
    metrics.checks.fails !== 0 ||
    metrics.http_req_failed?.value !== 0 ||
    !Number.isFinite(metrics.http_req_duration?.med)
  )
    throw new Error('Mesure vide, schéma inconnu ou vérifications fonctionnelles échouées')
  return {
    requests: metrics.http_reqs.count,
    checks: metrics.checks,
    latency: metrics.http_req_duration,
    informativeLatency: true,
  }
}
export async function runLoad(root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')) {
  const origin = localOrigin(process.env.QUALITY_BASE_URL),
    profile = loadProfile(process.env.QUALITY_LOAD_PROFILE)
  const target = process.env.GD_TARGET || 'showcase-immobilier'
  if (!['showcase-immobilier', 'client2-immobilier', 'dashboard'].includes(target))
    throw new Error('Cible inconnue')
  const routes =
    target === 'dashboard'
      ? [
          { path: '/connexion', status: 200, contains: 'Connexion' },
          { path: '/api/saas/auth/session', status: 401, contains: 'authentication_required' },
        ]
      : [{ path: target === 'showcase-immobilier' ? '/fr' : '/', status: 200, contains: '<main' }]
  const directory = join(root, '.tmp/quality/load', target + '-' + profile + '-' + Date.now())
  mkdirSync(directory, { recursive: true })
  const summaries = []
  for (const [index, route] of routes.entries()) {
    await preflight(origin, route)
    const name = 'dem011-k6-' + randomUUID()
    try {
      await runOwned(
        'docker',
        [
          'run',
          '--rm',
          '--name',
          name,
          '--network',
          'host',
          '--user',
          `${process.getuid?.() ?? 1000}:${process.getgid?.() ?? 1000}`,
          '-v',
          `${join(root, 'scripts/quality/load')}:/scripts:ro`,
          '-v',
          `${directory}:/reports`,
          '-e',
          `QUALITY_BASE_URL=${origin}`,
          '-e',
          `QUALITY_LOAD_PROFILE=${profile}`,
          '-e',
          `QUALITY_ROUTE=${JSON.stringify(route)}`,
          k6Image,
          'run',
          '--summary-export',
          `/reports/${index}.json`,
          '/scripts/scenarios.js',
        ],
        root,
        30000,
      )
      summaries.push({
        route,
        ...assessLoad(JSON.parse(readFileSync(join(directory, `${index}.json`), 'utf8'))),
      })
    } finally {
      spawnSync('docker', ['rm', '--force', name], { stdio: 'ignore', timeout: 5000 })
    }
  }
  const report = {
    target,
    origin,
    profile,
    k6Image,
    hardware: {
      platform: platform(),
      release: release(),
      cpus: cpus().length,
      model: cpus()[0]?.model,
    },
    summaries,
  }
  writeFileSync(join(directory, 'summary.json'), JSON.stringify(report, null, 2) + '\n')
  process.stdout.write(
    `Charge ${profile} : contrôles fonctionnels réussis ; latences informatives.\nRapport : ${directory}\n`,
  )
  return report
}
if (import.meta.main)
  runLoad().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
