import { basename, dirname, join } from 'node:path'

import { ensureReadableDirectory, normalizePath } from '../../../utils/fs'

/**
 * Résout et renvoie un chemin vers les fichiers de schéma YAML.
 * Recherche d’abord `SCHEMAS_PATH/webapp`, puis `SCHEMAS_PATH` lui-même,
 * et enfin les chemin passés en option. Chaque tentative est loguée si elle
 * échoue.
 *
 * @param log - fonction de log utilisée pour détailler les chemins ignorés.
 * @param optionPath - chemin alternatif explicite à essayer en dernier recours.
 * @returns chemin absolu validé d’un dossier contenant les schémas YAML.
 * @throws si aucun chemin valide n’est trouvé.
 */
export const resolveSchemaPath = async (
  log: (message: string) => void,
  optionPath?: string,
): Promise<string> => {
  const envPath = process.env.SCHEMAS_PATH?.trim() || join(process.cwd(), 'schemas/source')

  const normalizedEnvPath = normalizePath(envPath)
  const webappCandidate = normalizePath(join(envPath, 'webapp'))
  const localWebappCandidate = normalizePath(join(process.cwd(), 'schemas/webapp'))

  const envCandidates = [webappCandidate, normalizedEnvPath]
  for (const candidate of envCandidates) {
    try {
      await ensureReadableDirectory(candidate)
      return candidate
    } catch (error) {
      log(`Chemin ignoré "${candidate}": ${(error as Error).message}`)
    }
  }

  try {
    await ensureReadableDirectory(localWebappCandidate)
    return localWebappCandidate
  } catch (error) {
    log(`Chemin ignoré "${localWebappCandidate}": ${(error as Error).message}`)
  }

  if (!optionPath) {
    throw new Error(`SCHEMAS_PATH invalide (${envPath}) : aucun chemin valide détecté`)
  }

  const candidates = [optionPath].filter((candidate): candidate is string =>
    Boolean(candidate && candidate.trim()),
  )

  for (const candidate of candidates) {
    const normalized = normalizePath(candidate)

    try {
      await ensureReadableDirectory(normalized)
      return normalized
    } catch (error) {
      log(`Chemin ignoré "${candidate}": ${(error as Error).message}`)
    }
  }

  throw new Error(`SCHEMAS_PATH invalide (${envPath}) : aucun chemin valide détecté`)
}

/**
 * Résout le dossier des DTO à partir de `SCHEMAS_PATH`.
 * Supporte un `SCHEMAS_PATH` pointant soit vers la racine du dépôt de schémas,
 * soit directement vers `webapp/`.
 *
 * @param log - fonction de log utilisée pour détailler les chemins ignorés.
 * @param optionPath - chemin alternatif explicite à essayer en dernier recours.
 * @returns chemin absolu validé d’un dossier contenant les DTO source.
 * @throws si aucun chemin valide n’est trouvé.
 */
export const resolveDtoPath = async (
  log: (message: string) => void,
  optionPath?: string,
): Promise<string> => {
  const envPath = process.env.SCHEMAS_PATH?.trim() || join(process.cwd(), 'schemas/source')

  const normalizedEnvPath = normalizePath(envPath)
  const schemaRoot =
    basename(normalizedEnvPath) === 'webapp' ? dirname(normalizedEnvPath) : normalizedEnvPath
  const envCandidate = normalizePath(join(schemaRoot, 'dtos', 'symfony_api'))

  try {
    await ensureReadableDirectory(envCandidate)
    return envCandidate
  } catch (error) {
    log(`Chemin ignoré "${envCandidate}": ${(error as Error).message}`)
  }

  if (!optionPath) {
    throw new Error(`SCHEMAS_PATH invalide (${envPath}) : aucun dossier DTO valide détecté`)
  }

  const normalizedOptionPath = normalizePath(optionPath)

  try {
    await ensureReadableDirectory(normalizedOptionPath)
    return normalizedOptionPath
  } catch (error) {
    log(`Chemin ignoré "${normalizedOptionPath}": ${(error as Error).message}`)
  }

  throw new Error(`SCHEMAS_PATH invalide (${envPath}) : aucun dossier DTO valide détecté`)
}
