import { readFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Nom du fichier de definition des themes, a la racine du projet.
 */
const THEME_FILE = 'themes.yaml'

/**
 * Lit le fichier de definition des themes, quel que soit le contexte d'execution.
 *
 * Le chemin ne peut pas etre deduit de la position du module : celle-ci change
 * entre le rendu serveur, le pre-rendu et le developpement, ce qui faisait
 * echouer les routes de theme pendant la generation statique. On essaie donc
 * plusieurs emplacements, du plus fiable au plus specifique.
 *
 * @param moduleUrl `import.meta.url` du module appelant, utilise en dernier recours.
 * @returns Le contenu brut du fichier de themes.
 * @throws Si le fichier reste introuvable a tous les emplacements essayes.
 */
export const readThemeSource = async (moduleUrl: string): Promise<string> => {
  const candidates = [
    resolve(process.cwd(), THEME_FILE),
    join(dirname(fileURLToPath(moduleUrl)), '..', '..', THEME_FILE),
  ]

  for (const candidate of candidates) {
    try {
      return await readFile(candidate, 'utf-8')
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    }
  }

  throw new Error(`Fichier de themes introuvable (essayé : ${candidates.join(', ')})`)
}
