import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'

/** Le contexte des sources peut différer de celui du vérificateur. */
export function sourceContext(sourceRoot: string): string {
  let branch = 'branche inconnue'
  try {
    branch =
      execFileSync('git', ['branch', '--show-current'], {
        cwd: sourceRoot,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim() || 'HEAD détachée'
  } catch {
    // L’inventaire reste responsable de refuser un dépôt invalide.
  }
  return `Sources analysées : ${resolve(sourceRoot)}\nBranche des sources : ${branch}\nLes résultats portent sur ces fichiers ; les modifications des autres worktrees ne sont pas intégrées.\n`
}

export const diagnosticLimit = (count: number) => (count <= 8 ? count : 3)
