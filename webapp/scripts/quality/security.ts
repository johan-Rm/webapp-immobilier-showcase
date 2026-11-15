import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const say = (message: string) => process.stdout.write(message + '\n')

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
type AuditException = { package: string; advisory: string; reason: string; expires: string }
type Finding = { package: string; advisory: string; severity: string; excepted: boolean }
type Execution = { status: number | null; stdout: string; stderr: string; error?: unknown }
const severities = new Set(['low', 'moderate', 'high', 'critical'])

export function validateExceptions(value: unknown, now = new Date()): AuditException[] {
  if (!Array.isArray(value)) throw new Error('Liste des exceptions invalide')
  const seen = new Set<string>()
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') throw new Error('Exception invalide')
    const e = entry as AuditException
    if (
      ![e.package, e.advisory, e.reason, e.expires].every((v) => typeof v === 'string' && v.trim())
    )
      throw new Error('Exception sans avis, paquet, justification ou échéance')
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(e.expires) ||
      !Number.isFinite(Date.parse(e.expires)) ||
      new Date(e.expires).toISOString().slice(0, 10) !== e.expires
    )
      throw new Error('Date d’exception invalide')
    if (Date.parse(e.expires + 'T23:59:59.999Z') < now.getTime())
      throw new Error('Exception expirée')
    const key = e.package + ':' + e.advisory
    if (seen.has(key)) throw new Error('Exception dupliquée')
    seen.add(key)
  }
  return value as AuditException[]
}

export function assessAudit(result: Execution, exceptions: AuditException[] = []): Finding[] {
  if (result.error || ![0, 1].includes(result.status ?? -1))
    throw new Error('Échec d’exécution ou de transport du scanner')
  if (result.stderr.trim())
    throw new Error('Diagnostic du scanner : couverture non établie ; aucun succès déclaré')
  const data: unknown = JSON.parse(result.stdout)
  if (!data || typeof data !== 'object' || Array.isArray(data))
    throw new Error('Schéma audit non reconnu')
  const findings: Finding[] = []
  for (const [name, entries] of Object.entries(data)) {
    if (!Array.isArray(entries) || !entries.length)
      throw new Error('Réponse audit inconnue ou paquets ignorés')
    for (const entry of entries) {
      if (
        !entry ||
        typeof entry !== 'object' ||
        !severities.has(entry.severity) ||
        !['string', 'number'].includes(typeof entry.id) ||
        !String(entry.id).trim() ||
        typeof entry.url !== 'string'
      )
        throw new Error('Avis incomplet ou sévérité inconnue')
      const id = String(entry.id)
      const ghsa = /^https:\/\/github\.com\/advisories\/(GHSA-[\w-]+)$/.exec(entry.url)?.[1]
      const excepted = exceptions.some(
        (e) => e.package === name && (e.advisory === id || Boolean(ghsa && e.advisory === ghsa)),
      )
      findings.push({ package: name, advisory: ghsa || id, severity: entry.severity, excepted })
    }
  }
  if (result.status === 1 && !findings.length)
    throw new Error('Scanner en échec sans avis exploitable')
  return findings
}

export function lockInventory(value: unknown): { packages: number; notAnalyzed: string[] } {
  if (!value || typeof value !== 'object' || !('packages' in value))
    throw new Error('Lockfile sans inventaire de paquets')
  const packages = (value as { packages: unknown }).packages
  if (
    !packages ||
    typeof packages !== 'object' ||
    Array.isArray(packages) ||
    !Object.keys(packages).length
  )
    throw new Error('Inventaire vide ou invalide')
  const notAnalyzed: string[] = []
  for (const [name, entry] of Object.entries(packages)) {
    const spec = Array.isArray(entry) ? entry[0] : null
    if (
      typeof spec !== 'string' ||
      !/^(?:@[^/]+\/)?[^@]+@\d+\.\d+\.\d+(?:[-+][\w.+-]+)?$/.test(spec)
    )
      notAnalyzed.push(name)
  }
  return { packages: Object.keys(packages).length, notAnalyzed }
}

export const securityExitCode = (findings: Finding[]) =>
  Number(findings.some((f) => !f.excepted && ['high', 'critical'].includes(f.severity)))

export function runSecurity(
  appRoot = root,
  execute = (cwd: string): Execution => {
    const r = spawnSync('bun', ['--no-env-file', 'audit', '--json'], {
      cwd,
      encoding: 'utf8',
      timeout: 120_000,
      maxBuffer: 16 * 1024 * 1024,
    })
    return { status: r.status, stdout: r.stdout || '', stderr: r.stderr || '', error: r.error }
  },
): number {
  const version = spawnSync('bun', ['--version'], { encoding: 'utf8' })
  if (version.status !== 0 || version.stdout.trim() !== '1.4.0')
    throw new Error(
      'Scanner éprouvé avec Bun 1.4.0 requis ; vérifier le schéma avant de changer de version',
    )
  const exceptions = validateExceptions(
    JSON.parse(readFileSync(join(appRoot, 'scripts/quality/security-exceptions.json'), 'utf8')),
  )
  const bun = (globalThis as unknown as { Bun?: { JSONC: { parse: (text: string) => unknown } } })
    .Bun
  const parseLock = (text: string) => (bun ? bun.JSONC.parse(text) : JSON.parse(text))
  const workspaces = [appRoot, resolve(appRoot, '../codebase-integrity')]
  const results = workspaces.map((cwd) => {
    const workspace = cwd === appRoot ? 'webapp' : 'codebase-integrity'
    let inventory = { packages: 0, notAnalyzed: [] as string[] }
    let lockSha256: string | null = null
    try {
      const lock = readFileSync(join(cwd, 'bun.lock'), 'utf8')
      lockSha256 = createHash('sha256').update(lock).digest('hex')
      inventory = lockInventory(parseLock(lock))
      const findings = assessAudit(execute(cwd), exceptions)
      return {
        workspace,
        lockSha256,
        ...inventory,
        findings,
        error: null,
      }
    } catch (error) {
      return {
        workspace,
        lockSha256,
        ...inventory,
        findings: [] as Finding[],
        error: error instanceof Error ? error.message : 'Erreur de contrôle',
      }
    }
  })
  const output = join(appRoot, '.tmp/quality')
  mkdirSync(output, { recursive: true })
  const code = Number(
    results.some((r) => r.error || r.notAnalyzed.length || securityExitCode(r.findings)),
  )
  writeFileSync(
    join(output, 'security.json'),
    JSON.stringify(
      {
        date: new Date().toISOString(),
        bun: version.stdout.trim(),
        developmentDependencies: true,
        results,
        code,
      },
      null,
      2,
    ) + '\n',
  )
  for (const result of results) {
    const blocking = result.findings.filter(
      (f) => !f.excepted && ['high', 'critical'].includes(f.severity),
    ).length
    say(
      `${result.workspace} : ${result.packages} paquets inventoriés, ${result.findings.length} avis, ${blocking} high/critical non exemptés, ${result.notAnalyzed.length} paquets non analysables.`,
    )
    if (result.error) console.error(`${result.workspace} : ${result.error}`)
  }
  say('Rapport complet : ' + join(output, 'security.json'))
  say('Limite : avis connus du registre ; cet audit ne prouve pas la sécurité globale du produit.')
  return code
}

if (import.meta.main) {
  try {
    process.exitCode = runSecurity()
  } catch (error) {
    console.error('Audit impossible :', error instanceof Error ? error.message : 'erreur')
    process.exitCode = 1
  }
}
