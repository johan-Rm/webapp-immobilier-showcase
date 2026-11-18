import { execFileSync, spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const families = [
  'unit',
  'integration',
  'browser',
  'conventions',
  'components',
  'security',
  'architecture',
  'mutation',
  'mutation-extended',
  'coverage',
  'functions-debug',
  'duplicates',
  'load',
  'lighthouse',
  'contracts',
  'lint',
  'format',
  'types',
  'guards',
  'services',
  'types-placement',
  'images',
  'business-logic',
  'script-setup',
  'responsibilities',
  'code-quality',
  'solid',
] as const
export const targets = ['showcase-immobilier', 'client2-immobilier', 'dashboard'] as const
type Family = (typeof families)[number]
type Target = (typeof targets)[number]
export type Options = { family: Family; target: Target; list: boolean; profile?: string }
type Command = { executable: string; args: string[]; cwd: string; env: NodeJS.ProcessEnv }
export type Plan = { family: Family; target: Target; files: string[]; commands: Command[] }

export const webappRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

export function parseOptions(args: string[]): Options {
  const remaining = args.filter((arg) => arg !== '--')
  const family = remaining.shift()
  if (!families.includes(family as Family))
    throw new Error(`Famille attendue : ${families.join(', ')}`)
  let target = process.env.GD_TARGET || 'showcase-immobilier'
  let list = false
  let profile: string | undefined
  while (remaining.length) {
    const arg = remaining.shift()
    if (arg === '--list') list = true
    else if (arg === '--target' || arg === '--profile') {
      const value = remaining.shift()
      if (!value || value.startsWith('-')) throw new Error(`Valeur absente pour ${arg}`)
      if (arg === '--target') target = value
      else profile = value
    } else throw new Error(`Argument inconnu : ${arg}`)
  }
  if (!targets.includes(target as Target)) throw new Error(`Cible inconnue : ${target}`)
  if (profile && (family !== 'lighthouse' || !['desktop', 'mobile'].includes(profile)))
    throw new Error('Profil Lighthouse attendu : desktop ou mobile')
  return { family: family as Family, target: target as Target, list, profile }
}

export function projectFiles(root: string): string[] {
  const gitRoot = process.env.VERIFY_GIT_ROOT || resolve(root, '..')
  return execFileSync(
    'git',
    [
      '-c',
      `safe.directory=${gitRoot}`,
      'ls-files',
      '--cached',
      '--others',
      '--exclude-standard',
      '--deduplicate',
      '-z',
      '--',
      'webapp',
    ],
    { cwd: gitRoot, encoding: 'utf8' },
  )
    .split('\0')
    .filter((path) => path.startsWith('webapp/'))
    .map((path) => path.slice('webapp/'.length))
    .filter((path) => existsSync(join(root, path)))
    .sort()
}

export function isIntegration(file: string, source: string): boolean {
  return (
    file.startsWith('server/') ||
    file.startsWith('tests/layers/') ||
    /from\s+['"]node:(?:http|https|child_process|fs)(?:\/promises)?['"]/.test(source)
  )
}

export function nodeTestFiles(root: string, target: Target, files = projectFiles(root)): string[] {
  const targetRoot = target === 'dashboard' ? 'dashboard/' : `sites/${target}/`
  return files.filter(
    (file) =>
      file.endsWith('.vitest.ts') &&
      !file.endsWith('.nuxt.vitest.ts') &&
      ['scripts/', 'services/', 'shared/', 'tests/', 'server/', targetRoot].some((prefix) =>
        file.startsWith(prefix),
      ),
  )
}

const conventionScripts: Partial<Record<Family, string>> = {
  'types-placement': 'check:app:types',
  images: 'check:app:images',
  'business-logic': 'check:app:components:no-business-logic',
  'script-setup': 'check:app:script-setup-standard',
  responsibilities: 'check:app:soc',
  'code-quality': 'check:app:code-quality',
  solid: 'check:app:solid',
}

export function buildPlan(options: Options, root = webappRoot, files = projectFiles(root)): Plan {
  const { family, target } = options
  const env = { GD_TARGET: target, VERIFY_FAMILY: family }
  const command = (args: string[], cwd = root, executable = process.execPath): Command => ({
    executable,
    args,
    cwd,
    env,
  })
  const plan: Plan = { family, target, files: [], commands: [] }
  if (family === 'unit' || family === 'integration') {
    plan.files = nodeTestFiles(root, target, files).filter(
      (file) =>
        isIntegration(file, readFileSync(join(root, file), 'utf8')) === (family === 'integration'),
    )
    const bunTests = files.filter((file) => file.startsWith('server/') && file.endsWith('.test.ts'))
    const vitestFiles = [...plan.files]
    if (family === 'unit') plan.files.push(...bunTests)
    if (!plan.files.length) throw new Error(`Aucun test découvert : ${family}/${target}`)
    if (vitestFiles.length) {
      plan.commands.push(
        command(
          ['node_modules/nuxt/bin/nuxt.mjs', 'prepare', '--dotenv', '.env.test'],
          root,
          'node',
        ),
      )
      plan.commands.push(
        command(['node_modules/vitest/vitest.mjs', 'run', ...vitestFiles], root, 'node'),
      )
    }
    if (family === 'unit' && bunTests.length)
      plan.commands.push(command(['--no-env-file', 'test', ...bunTests], root, 'bun'))
  } else if (family === 'components') {
    plan.files = files.filter(
      (file) =>
        file.endsWith('.nuxt.vitest.ts') &&
        file.startsWith(target === 'dashboard' ? 'dashboard/' : `sites/${target}/`),
    )
    if (!plan.files.length) throw new Error(`Pilote composants non installé pour ${target}`)
    plan.commands.push(
      command(['node_modules/nuxt/bin/nuxt.mjs', 'prepare', '--dotenv', '.env.test'], root, 'node'),
      command(['node_modules/vitest/vitest.mjs', 'run', ...plan.files], root, 'node'),
    )
  } else if (family === 'browser') {
    const matchesTarget = (file: string) => {
      if (target === 'dashboard') return /\/saas-/.test(file)
      if (target === 'client2-immobilier') return /\/client2/.test(file)
      return file.endsWith('/home.smoke.spec.ts')
    }
    plan.files = files.filter(
      (file) => file.startsWith('tests/e2e/') && file.endsWith('.spec.ts') && matchesTarget(file),
    )
    if (!plan.files.length) throw new Error(`Aucun parcours navigateur pour ${target}`)
    if (!options.list && !process.env.PLAYWRIGHT_BASE_URL)
      throw new Error('PLAYWRIGHT_BASE_URL explicite requis ; démarrer un serveur fixture isolé')
    plan.commands.push(
      command(['node_modules/@playwright/test/cli.js', 'test', ...plan.files], root, 'node'),
    )
  } else if (family === 'lint' || family === 'format') {
    plan.files = ['package.json']
    plan.commands.push(
      command(
        ['--no-env-file', 'run', family === 'lint' ? 'lint:check' : 'format:check'],
        root,
        'bun',
      ),
    )
  } else if (family === 'types') {
    plan.files = ['scripts/build/type-check.ts']
    plan.commands.push(
      command(['node_modules/nuxt/bin/nuxt.mjs', 'prepare', '--dotenv', '.env.test'], root, 'node'),
      command(
        [
          'node_modules/vue-tsc/bin/vue-tsc.js',
          '--noEmit',
          '--project',
          target === 'dashboard' ? 'dashboard/.nuxt/tsconfig.site.json' : 'tsconfig.json',
        ],
        root,
        'node',
      ),
    )
  } else if (
    family === 'conventions' ||
    family === 'guards' ||
    family === 'services' ||
    conventionScripts[family]
  ) {
    const integrity = resolve(root, '../codebase-integrity')
    if (!existsSync(join(integrity, 'package.json')))
      throw new Error('Paquet Codebase Integrity absent')
    plan.files = ['../codebase-integrity/package.json']
    const script =
      conventionScripts[family] ??
      (family === 'guards'
        ? 'check:app:guards'
        : family === 'services'
          ? 'check:services:no-framework-imports'
          : 'check:conventions')
    plan.commands.push(command(['--no-env-file', 'run', script], integrity, 'bun'))
  } else {
    const script = `scripts/quality/${family === 'functions-debug' || family === 'duplicates' ? 'source-quality' : family}.ts`
    if (!existsSync(join(root, script)))
      throw new Error(`Famille non installée : ${family} (${script})`)
    plan.files = [script]
    plan.commands.push(
      command(
        [
          '--no-env-file',
          'run',
          script,
          ...(family === 'functions-debug' || family === 'duplicates' ? [family] : []),
          ...(options.profile ? ['--profile', options.profile] : []),
        ],
        root,
        'bun',
      ),
    )
  }
  return plan
}

const explanations: Record<Family, string> = {
  'types-placement':
    'Vérifie le placement des types partagés conformément aux conventions du socle.',
  images: 'Vérifie les composants et attributs d’image attendus dans les templates Vue.',
  'business-logic':
    'Recherche la logique métier interdite dans les composants selon les conventions documentées.',
  'script-setup':
    'Vérifie les sections documentées du script setup et leurs exceptions explicites.',
  responsibilities: 'Vérifie la séparation des responsabilités entre pages et composants.',
  'code-quality': 'Vérifie les conventions de code propres au projet sur les sources frontend.',
  solid: 'Vérifie les seuils documentés de responsabilités des composables, composants et types.',

  lint: 'Vérifie les règles ESLint de l’application Nuxt et des vérificateurs.',
  format:
    'Vérifie la mise en forme des fichiers de l’application et des vérificateurs selon la configuration Prettier.',
  types: 'Prépare Nuxt puis vérifie les types TypeScript et Vue de la cible.',
  guards: 'Signale les gardes potentiellement redondantes, à relire humainement.',
  services: 'Vérifie les imports interdits de frameworks dans les services.',
  unit: 'Teste la logique avec les moteurs Vitest et Bun séparés.',
  integration: 'Teste les échanges et assemblages avec des dépendances simulées.',
  components: 'Teste les interactions des composants dans le vrai environnement Nuxt.',
  browser: 'Vérifie les parcours dans Chromium contre un serveur de test explicite.',
  conventions: 'Contrôle les conventions techniques du code ; les avertissements restent à relire.',
  security: 'Audite les deux fichiers de dépendances ; les avis high et critical bloquent.',
  architecture: 'Mesure les imports des services et contrôle leur indépendance du framework.',
  mutation: 'Évalue si les tests détectent les modifications volontaires du module pur.',
  'mutation-extended':
    'Mesure la mutation des sources compatibles dans une copie isolée ; score informatif.',
  coverage: 'Mesure la couverture Vitest Node et distingue les sources non mesurables.',
  'functions-debug':
    'Signale les fonctions et journaux suspects ; bloque les instructions debugger non exemptées.',
  duplicates: 'Signale les fragments similaires pour revue humaine.',
  load: 'Mesure une charge locale bornée ; les erreurs bloquent, les latences sont informatives.',
  lighthouse: 'Audite les vraies pages SSR trois fois ; scores informatifs, erreurs bloquantes.',
  contracts: 'Compare deux générations isolées des contrats YAML locaux.',
}

export async function executePlan(plan: Plan): Promise<number> {
  const info = `INFO — ${explanations[plan.family]}\n`
  const colors = process.stdout.isTTY && process.env.TERM !== 'dumb' && !('NO_COLOR' in process.env)
  process.stdout.write(colors ? `\u001b[34m${info}\u001b[0m` : info)
  for (const command of plan.commands) {
    const code = await new Promise<number>((complete, reject) => {
      const child = spawn(command.executable, command.args, {
        cwd: command.cwd,
        env: { ...process.env, ...command.env },
        stdio: 'inherit',
        detached: process.platform !== 'win32',
      })
      let interrupted = false
      let forceStop: ReturnType<typeof setTimeout> | undefined
      const signalGroup = (signal: NodeJS.Signals) => {
        if (!child.pid) return
        try {
          if (process.platform === 'win32') child.kill(signal)
          else process.kill(-child.pid, signal)
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== 'ESRCH') reject(error)
        }
      }
      const interrupt = () => {
        if (interrupted) return
        interrupted = true
        signalGroup('SIGTERM')
        forceStop = setTimeout(() => signalGroup('SIGKILL'), 5000)
        forceStop.unref()
      }
      process.once('SIGINT', interrupt)
      process.once('SIGTERM', interrupt)
      const clean = () => {
        clearTimeout(forceStop)
        process.removeListener('SIGINT', interrupt)
        process.removeListener('SIGTERM', interrupt)
      }
      child.once('error', (error) => {
        clean()
        reject(error)
      })
      child.once('exit', (status) => {
        clean()
        complete(interrupted ? 130 : (status ?? 1))
      })
    })
    if (code !== 0) return code
  }
  return 0
}

if (import.meta.main) {
  try {
    const options = parseOptions(process.argv.slice(2))
    const plan = buildPlan(options)
    if (options.list) process.stdout.write(`${JSON.stringify(plan, null, 2)}\n`)
    else {
      process.stdout.write(`${plan.family}/${plan.target} : ${plan.files.length} fichier(s)\n`)
      process.exitCode = await executePlan(plan)
    }
  } catch (error) {
    process.stderr.write(`${(error as Error).message}\n`)
    process.exitCode = 1
  }
}
