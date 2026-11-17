import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { loadValidationRule } from '../../../codebase-integrity/commun/validation-rules'

import { projectFiles } from './run'

const say = (message: string) => process.stdout.write(message + '\n')

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
type Dependency = {
  module: string
  resolved: string
  couldNotResolve?: boolean
  preCompilationOnly?: boolean
}
type Module = { source: string; dependencies: Dependency[] }
type Graph = {
  modules: Module[]
  summary: { violations: { from: string; to: string; rule: { name: string } }[] }
}

export function assessGraph(value: unknown) {
  const graph = value as Graph
  if (
    !graph ||
    !Array.isArray(graph.modules) ||
    !graph.modules.length ||
    !graph.summary ||
    !Array.isArray(graph.summary.violations)
  )
    throw new Error('Graphe vide ou schéma non reconnu')
  if (
    !graph.modules.every(
      (m) =>
        typeof m.source === 'string' &&
        Array.isArray(m.dependencies) &&
        m.dependencies.every((d) => typeof d.module === 'string' && typeof d.resolved === 'string'),
    )
  )
    throw new Error('Modules ou dépendances invalides')
  const unresolved = graph.modules.flatMap((m) =>
    m.dependencies
      .filter((d) => d.couldNotResolve)
      .map((d) => ({ from: m.source, module: d.module })),
  )
  const violations = graph.summary.violations.filter(
    (v) => v.rule.name === 'services-no-framework-imports',
  )
  return {
    modules: graph.modules.length,
    dependencies: graph.modules.reduce((n, m) => n + m.dependencies.length, 0),
    unresolved,
    violations,
  }
}

export function analyzeArchitecture(appRoot = root, files?: string[]) {
  const selected =
    files ??
    projectFiles(appRoot).filter((file) => file.startsWith('services/') && file.endsWith('.ts'))
  if (!selected.length) throw new Error('Aucun module services découvert ; analyse non exécutée')
  const aliases = loadValidationRule<{
    name: string
    requiresManualReview: boolean
    aliases: Record<string, string>
  }>('app-types-placement').aliases
  const temporary = mkdtempSync(join(tmpdir(), 'architecture-resolution-'))
  const tsConfig = join(temporary, 'tsconfig.json')
  const paths = Object.fromEntries(
    Object.entries(aliases).flatMap(([name, target]) => {
      const alias = name.replace(/\/$/, '')
      const directory = resolve(appRoot, target)
      return [
        [alias, [directory]],
        [alias + '/*', [directory + '/*']],
      ]
    }),
  )
  writeFileSync(
    tsConfig,
    JSON.stringify({
      compilerOptions: { baseUrl: appRoot, paths },
      files: selected.map((file) => resolve(appRoot, file)),
    }),
  )
  const args = [
    join(root, 'node_modules/dependency-cruiser/bin/dependency-cruiser.mjs'),
    '--config',
    join(root, 'scripts/quality/dependency-cruiser.cjs'),
    '--output-type',
    'json',
    '--ts-config',
    tsConfig,
    ...selected,
  ]
  let result: ReturnType<typeof spawnSync>
  try {
    result = spawnSync('node', args, {
      cwd: appRoot,
      encoding: 'utf8',
      timeout: 120_000,
      maxBuffer: 32 * 1024 * 1024,
    })
  } finally {
    rmSync(temporary, { recursive: true, force: true })
  }
  if (result.error || ![0, 1].includes(result.status ?? -1))
    throw new Error(
      'Échec d’exécution de dependency-cruiser : ' + (result.stderr || 'code inconnu'),
    )
  if (!result.stdout?.length)
    throw new Error('Rapport de graphe absent : ' + String(result.stderr || 'erreur du processus'))
  const graph: unknown = JSON.parse(String(result.stdout))
  const summary = assessGraph(graph)
  const covered = new Set((graph as Graph).modules.map((m) => m.source))
  const missing = selected.filter((file) => !covered.has(file))
  if (missing.length) throw new Error('Modules demandés absents du graphe : ' + missing.join(', '))
  return { summary, graph, entryModules: selected.length }
}

export function runArchitecture(appRoot = root): number {
  const result = analyzeArchitecture(appRoot)
  const output = join(appRoot, '.tmp/quality')
  mkdirSync(output, { recursive: true })
  writeFileSync(join(output, 'architecture.json'), JSON.stringify(result, null, 2) + '\n')
  say(
    `Architecture services : ${result.entryModules} entrées, ${result.summary.modules} modules, ${result.summary.dependencies} dépendances, ${result.summary.violations.length} violations, ${result.summary.unresolved.length} imports non résolus.`,
  )
  for (const issue of result.summary.unresolved.slice(0, 8))
    say(`À examiner : ${issue.from} → ${issue.module}`)
  say(
    'Limites : imports explicites TypeScript, types compris ; pas de couverture des auto-imports Nuxt ou des templates Vue. Les imports non résolus sont exposés, sans nouvelle interdiction implicite.',
  )
  say('Rapport complet : ' + join(output, 'architecture.json'))
  return Number(result.summary.violations.length > 0)
}

if (import.meta.main) {
  try {
    process.exitCode = runArchitecture()
  } catch (error) {
    console.error('Architecture impossible :', error instanceof Error ? error.message : 'erreur')
    process.exitCode = 1
  }
}
