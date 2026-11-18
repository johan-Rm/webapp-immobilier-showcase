import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

export const targets = ['showcase-immobilier', 'client2-immobilier', 'dashboard'] as const
export type ApplicationTarget = (typeof targets)[number]

export type SourceKind = 'source' | 'test' | 'types' | 'generated' | 'other'

/** Preserve literal route brackets and other glob metacharacters. */
export const escapeGlobPath = (path: string): string =>
  path.replace(/[\[\]*?{}()+@]/g, (char) =>
    char === '[' ? '[[]' : char === ']' ? '[]]' : `[${char}]`,
  )

const shared = ['webapp/base/real-estate/', 'webapp/server/', 'webapp/services/', 'webapp/shared/']
const rootFor = (target: ApplicationTarget) =>
  target === 'dashboard' ? 'webapp/dashboard/' : `webapp/sites/${target}/`

export function classifySource(path: string): SourceKind {
  if (/(^|\/)(?:generated|\.nuxt|\.output|\.tmp|node_modules|schemas)(?:\/|$)/.test(path))
    return 'generated'
  if (/(?:\.d\.ts|\.d\.mts|\.d\.cts)$/.test(path)) return 'types'
  if (
    /(^|\/)(?:tests?|__tests__)(?:\/|$)|\.(?:test|spec|vitest|nuxt\.vitest)\.[cm]?[jt]sx?$/.test(
      path,
    )
  )
    return 'test'
  return /\.(?:[cm]?[jt]sx?|vue)$/.test(path) ? 'source' : 'other'
}

export function selectApplicationFiles(files: string[], target: string) {
  if (!targets.includes(target as ApplicationTarget)) throw new Error(`Cible inconnue : ${target}`)
  const selectedRoot = rootFor(target as ApplicationTarget)
  const source: string[] = []
  const comparison: string[] = []
  const excluded: { path: string; reason: SourceKind }[] = []
  for (const path of [...new Set(files)].sort()) {
    const inScope = [...shared, selectedRoot].some((root) => path.startsWith(root))
    const otherTarget = targets.some(
      (candidate) => candidate !== target && path.startsWith(rootFor(candidate)),
    )
    if (!inScope && !otherTarget) continue
    const kind = classifySource(path)
    if (kind !== 'source') excluded.push({ path, reason: kind })
    else if (inScope) source.push(path)
    else comparison.push(path)
  }
  return { target, source, comparison, excluded }
}

export function discoverApplicationFiles(root: string, target: string) {
  const output = execFileSync(
    'git',
    [
      'ls-files',
      '--cached',
      '--others',
      '--exclude-standard',
      '--deduplicate',
      '-z',
      '--',
      'webapp',
    ],
    { cwd: root, encoding: 'utf8' },
  )
  return selectApplicationFiles(
    output.split('\0').filter((path) => path && existsSync(join(root, path))),
    target,
  )
}
