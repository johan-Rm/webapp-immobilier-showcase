import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export function assessMutation(report: unknown) {
  if (!report || typeof report !== 'object' || !('files' in report))
    throw new Error('Rapport de mutation invalide')
  const files = (report as { files: Record<string, { mutants: { status: string }[] }> }).files
  if (!files || typeof files !== 'object') throw new Error('Fichiers absents')
  const counts: Record<string, number> = {}
  for (const file of Object.values(files)) {
    if (!Array.isArray(file.mutants)) throw new Error('Mutants absents')
    for (const mutant of file.mutants) {
      if (
        ![
          'Killed',
          'Timeout',
          'Survived',
          'NoCoverage',
          'CompileError',
          'RuntimeError',
          'Ignored',
        ].includes(mutant.status)
      )
        throw new Error('Statut inconnu ou non terminé')
      counts[mutant.status] = (counts[mutant.status] ?? 0) + 1
    }
  }
  const detected = (counts.Killed ?? 0) + (counts.Timeout ?? 0),
    survived = counts.Survived ?? 0,
    uncovered = counts.NoCoverage ?? 0
  const total = detected + survived + uncovered
  if (!total || counts.RuntimeError) throw new Error('Aucun mutant évalué ou erreur d’exécution')
  return {
    detected,
    survived,
    uncovered,
    total,
    excluded: (counts.CompileError ?? 0) + (counts.Ignored ?? 0),
    score: (100 * detected) / total,
    informativeScore: true,
  }
}
export function runOwned(
  executable: string,
  args: string[],
  cwd: string,
  timeoutMs: number,
  environment: NodeJS.ProcessEnv = {},
): Promise<void> {
  return new Promise((done, reject) => {
    const child = spawn(executable, args, {
      cwd,
      stdio: 'inherit',
      detached: process.platform !== 'win32',
      env: { PATH: process.env.PATH, HOME: tmpdir(), CI: 'true', ...environment },
    })
    let interrupted = false
    const stop = () => {
      interrupted = true
      if (child.pid)
        try {
          process.kill(process.platform === 'win32' ? child.pid : -child.pid, 'SIGKILL')
        } catch {}
    }
    const timer = setTimeout(stop, timeoutMs)
    process.once('SIGINT', stop)
    process.once('SIGTERM', stop)
    const clean = () => {
      clearTimeout(timer)
      process.removeListener('SIGINT', stop)
      process.removeListener('SIGTERM', stop)
    }
    child.once('error', (e) => {
      clean()
      reject(e)
    })
    child.once('close', (code) => {
      clean()
      if (interrupted || code !== 0) reject(new Error(`Exécution interrompue ou échouée (${code})`))
      else done()
    })
  })
}
export async function runMutation(
  root = resolve(dirname(fileURLToPath(import.meta.url)), '../..'),
) {
  const source = join(root, 'shared/saas/links.ts'),
    hash = () => createHash('sha256').update(readFileSync(source)).digest('hex')
  const before = hash(),
    temporary = mkdtempSync(join(tmpdir(), 'nuxt-mutation-')),
    output = join(root, '.tmp/quality/mutation'),
    started = Date.now()
  mkdirSync(output, { recursive: true })
  try {
    for (const name of [
      'shared/saas/links.ts',
      'shared/saas/links.vitest.ts',
      'scripts/quality/stryker.config.mjs',
      'scripts/quality/vitest-mutation.config.ts',
    ]) {
      mkdirSync(dirname(join(temporary, name)), { recursive: true })
      cpSync(join(root, name), join(temporary, name))
    }
    writeFileSync(join(temporary, 'package.json'), '{"type":"module"}\n')
    // Le pilote pur ne doit pas hériter du tsconfig Nuxt d’un dossier parent.
    writeFileSync(
      join(temporary, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: { target: 'ES2022', module: 'ESNext', moduleResolution: 'Bundler' },
      }) + '\n',
    )
    symlinkSync(join(root, 'node_modules'), join(temporary, 'node_modules'), 'dir')
    await runOwned(
      'node',
      [
        join(root, 'node_modules/@stryker-mutator/core/bin/stryker.js'),
        'run',
        'scripts/quality/stryker.config.mjs',
      ],
      temporary,
      180000,
    )
    const summary = {
      ...assessMutation(JSON.parse(readFileSync(join(temporary, 'reports/mutation.json'), 'utf8'))),
      durationMs: Date.now() - started,
      sourceSha256: before,
    }
    cpSync(join(temporary, 'reports'), output, { recursive: true })
    writeFileSync(join(output, 'summary.json'), JSON.stringify(summary, null, 2) + '\n')
    process.stdout.write(
      `Mutation : ${summary.detected} détectés, ${summary.survived} survivants, ${summary.uncovered} non couverts ; score informatif ${summary.score.toFixed(1)} %.\nRapport : ${output}\n`,
    )
    return summary
  } finally {
    rmSync(temporary, { recursive: true, force: true })
    if (hash() !== before) throw new Error('Source modifiée pendant la mesure')
  }
}
if (import.meta.main)
  runMutation().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
