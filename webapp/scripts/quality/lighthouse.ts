import { spawnSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { cpus, platform } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { localOrigin } from './load'
import { runOwned } from './mutation'

const categories = ['performance', 'accessibility', 'best-practices', 'seo'] as const
const metrics = [
  'first-contentful-paint',
  'largest-contentful-paint',
  'cumulative-layout-shift',
  'total-blocking-time',
  'speed-index',
] as const
export type LighthouseResult = {
  runtimeError?: unknown
  finalDisplayedUrl?: string
  finalUrl?: string
  lighthouseVersion?: string
  categories?: Record<string, { score: number | null }>
  audits?: Record<string, { numericValue?: number; score?: number | null }>
}
export function assessLighthouse(value: LighthouseResult, url: string) {
  if (!value || value.runtimeError) throw new Error('Erreur d’exécution Lighthouse')
  if (value.lighthouseVersion !== '13.0.1') throw new Error('Version Lighthouse non éprouvée')
  const expected = new URL(url),
    final = new URL(value.finalDisplayedUrl || value.finalUrl || 'about:blank')
  if (final.href !== expected.href) throw new Error('Page finale inattendue ou interstitielle')
  const scores: Record<string, number> = {},
    measurements: Record<string, number> = {}
  for (const key of categories) {
    const score = value.categories?.[key]?.score
    if (typeof score !== 'number' || !Number.isFinite(score) || score < 0 || score > 1)
      throw new Error('Catégorie absente ou inexploitable : ' + key)
    scores[key] = score
  }
  for (const key of metrics) {
    const number = value.audits?.[key]?.numericValue
    if (typeof number !== 'number' || !Number.isFinite(number) || number < 0)
      throw new Error('Métrique absente ou inexploitable : ' + key)
    measurements[key] = number
  }
  if (value.audits?.['quality-page-content']?.score !== 1)
    throw new Error('Contenu réellement audité différent de la fixture attendue')
  return { scores, metrics: measurements, finalUrl: final.href, informativeScores: true }
}
export function median(values: number[]) {
  if (!values.length || values.some((v) => !Number.isFinite(v)))
    throw new Error('Médiane vide ou invalide')
  const sorted = [...values].sort((a, b) => a - b),
    middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2
}
export function contentConfig(expected: string, profile: unknown) {
  return `import BaseGatherer from '/usr/lib/node_modules/lighthouse/core/gather/base-gatherer.js';
import {Audit} from '/usr/lib/node_modules/lighthouse/core/audits/audit.js';
class Content extends BaseGatherer {
 meta={supportedModes:['navigation']};
 getArtifact(context){return context.driver.executionContext.evaluate(()=>({text:document.body.innerText,main:document.querySelectorAll('main').length}),{args:[],useIsolation:true})}
}
class ContentAudit extends Audit {
 static get meta(){return {id:'quality-page-content',title:'Contenu attendu',failureTitle:'Contenu inattendu',description:'Vérifie la fixture rendue et le repère principal.',requiredArtifacts:['QualityPageContent']}}
 static audit(artifacts){const matched=artifacts.QualityPageContent.text.includes(${JSON.stringify(expected)});return {score:matched&&artifacts.QualityPageContent.main===1?1:0,details:{type:'debugdata',matched,mainCount:artifacts.QualityPageContent.main}}}
}
export default {extends:'lighthouse:default',settings:{...${JSON.stringify(profile)},onlyCategories:['performance','accessibility','best-practices','seo','quality'],disableStorageReset:true,maxWaitForLoad:30000},artifacts:[{id:'QualityPageContent',gatherer:{implementation:Content}}],audits:[{implementation:ContentAudit}],categories:{quality:{title:'Fixture auditée',auditRefs:[{id:'quality-page-content',weight:1}]}}};\n`
}
export async function runLighthouse(
  root = resolve(dirname(fileURLToPath(import.meta.url)), '../..'),
) {
  const origin = localOrigin(process.env.WEBAPP_BASE_URL),
    target = process.env.GD_TARGET || 'showcase-immobilier',
    profile =
      process.argv[2] === '--profile' && process.argv.length === 4 ? process.argv[3] : undefined
  const profiles = JSON.parse(
    readFileSync(join(root, 'scripts/quality/lighthouse/profiles.json'), 'utf8'),
  )
  if (!profile || !Object.hasOwn(profiles, profile))
    throw new Error('Profil Lighthouse desktop ou mobile explicite requis')
  const routes =
    target === 'dashboard'
      ? [
          { name: 'connexion', path: '/connexion', contains: 'Connexion', private: false },
          { name: 'prive', path: '/', contains: 'Vos sites, au même endroit', private: true },
        ]
      : target === 'client2-immobilier'
        ? [{ name: 'articles', path: '/fr/articles', contains: 'Articles', private: false }]
        : target === 'showcase-immobilier'
          ? [{ name: 'accueil', path: '/fr', contains: 'Essaouira', private: false }]
          : null
  if (!routes) throw new Error('Cible inconnue')
  const local = process.env.CHECKS_CONTAINER === '1'
  const chromePath = '/ms-playwright/chromium-1234/chrome-linux64/chrome'
  const chrome = local
    ? spawnSync(chromePath, ['--version'], { encoding: 'utf8', timeout: 15000 })
    : spawnSync(
        'docker',
        ['run', '--rm', '--entrypoint', chromePath, 'dem011-lighthouse:13.0.1', '--version'],
        { encoding: 'utf8', timeout: 15000 },
      )
  if (chrome.status !== 0 || !chrome.stdout.includes('151.0.7922.34'))
    throw new Error('Version Chromium non éprouvée ou navigateur indisponible')
  const output = join(root, '.tmp/quality/lighthouse', target + '-' + profile + '-' + Date.now())
  mkdirSync(output, { recursive: true })
  const results = []
  for (const route of routes) {
    const url = origin + route.path,
      response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(5000) })
    if (response.status !== 200) throw new Error('Page SSR indisponible ou redirigée : ' + url)
    const html = await response.text()
    if (!html.includes('<main')) throw new Error('SSR sans repère principal')
    let cookie = ''
    if (route.private) {
      const login = await fetch(origin + '/api/saas/auth/login', {
        method: 'POST',
        redirect: 'error',
        headers: { Origin: origin, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'editor@example.test', password: 'fixture-password' }),
      })
      if (login.status !== 200) throw new Error('Session fictive indisponible')
      cookie = login.headers.get('set-cookie')?.split(';')[0] || ''
      if (!cookie) throw new Error('Cookie fictif absent')
    }
    writeFileSync(
      join(output, route.name + '.config.mjs'),
      contentConfig(route.contains, profiles[profile]),
    )
    const samples: ReturnType<typeof assessLighthouse>[] = []
    for (let run = 1; run <= 3; run++) {
      const name = 'dem011-lighthouse-' + randomUUID(),
        prefix = route.name + '-' + run
      try {
        if (local) {
          await runOwned(
            'lighthouse',
            [
              url,
              '--config-path',
              join(output, route.name + '.config.mjs'),
              '--chrome-flags=--headless --no-sandbox --disable-dev-shm-usage --disable-background-networking --host-resolver-rules="MAP * ~NOTFOUND, EXCLUDE 127.0.0.1"',
              '--output=json',
              '--output=html',
              '--output-path',
              join(output, prefix),
              ...(cookie ? ['--extra-headers', JSON.stringify({ Cookie: cookie })] : []),
            ],
            root,
            120000,
            { CHROME_PATH: chromePath },
          )
        } else {
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
              `${output}:/reports`,
              'dem011-lighthouse:13.0.1',
              url,
              '--config-path',
              `/reports/${route.name}.config.mjs`,
              '--chrome-flags=--headless --no-sandbox --disable-dev-shm-usage --disable-background-networking --host-resolver-rules="MAP * ~NOTFOUND, EXCLUDE 127.0.0.1"',
              '--output=json',
              '--output=html',
              '--output-path',
              `/reports/${prefix}`,
              ...(cookie ? ['--extra-headers', JSON.stringify({ Cookie: cookie })] : []),
            ],
            root,
            120000,
          )
        }
        samples.push(
          assessLighthouse(
            JSON.parse(readFileSync(join(output, prefix + '.report.json'), 'utf8')),
            url,
          ),
        )
      } finally {
        if (!local) spawnSync('docker', ['rm', '--force', name], { stdio: 'ignore', timeout: 5000 })
      }
    }
    results.push({
      route,
      url,
      samples,
      median: {
        scores: Object.fromEntries(
          categories.map((key) => [key, median(samples.map((s) => s.scores[key]!))]),
        ),
        metrics: Object.fromEntries(
          metrics.map((key) => [key, median(samples.map((s) => s.metrics[key]!))]),
        ),
      },
    })
  }
  const report = {
    target,
    profile,
    lighthouse: '13.0.1',
    chromium: '151.0.7922.34',
    hardware: { platform: platform(), cpus: cpus().length, model: cpus()[0]?.model },
    settings: profiles[profile],
    informativeScores: true,
    results,
  }
  writeFileSync(join(output, 'summary.json'), JSON.stringify(report, null, 2) + '\n')
  process.stdout.write(
    `Lighthouse : ${results.length} routes, trois mesures et médianes ; scores informatifs.\nRapports : ${output}\n`,
  )
  return report
}
if (import.meta.main)
  runLighthouse().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
