import type { NuxtHooks } from 'nuxt/schema'

import { readdir } from 'node:fs/promises'
import { join } from 'node:path'

import { generateArtifacts } from '../../services/converter/schema/generateArtifacts'
import { resolveDtoPath, resolveSchemaPath } from '../../services/infra/resolver/schema/path'

/**
 * Hook de génération des contrats TypeScript à partir des schémas YAML.
 *
 * Ce module est appelé au moment du `build:before` Nuxt pour garantir que :
 * - les interfaces de domaine (`schemas/interfaces`) sont alignées avec les schémas source
 * - les DTO (`schemas/dtos`) restent cohérents avec les contrats de transformation
 *
 * Le hook ne fait pas de mapping métier ; il orchestre uniquement la résolution des chemins,
 * la génération des artefacts et le reporting des erreurs.
 */

/**
 * Ensemble des identifiants de schémas YAML à convertir en interfaces TypeScript.
 */
const SCHEMAS = [
  'Accommodation',
  'AccommodationCategory',
  'AccommodationMedia',
  'AccommodationPlace',
  'AccommodationComponent',
  'AmenityFeature',
  'Article',
  'CategoryCode',
  'Offer',
  'Organization',
  'RealEstateListing',
  'MediaObject',
  'WebPage',
] as const

/**
 * Schémas destinés à la génération des DTO applicatifs.
 *
 * Le périmètre DTO est volontairement réduit : seuls les contrats utilisés
 * comme frontières de transformation sont produits avec le suffixe `Dto`.
 */
const DTOS = ['Accommodation', 'WebPage'] as const

/**
 * Signature du hook Nuxt `build:before`.
 *
 * Le type est figé localement pour garder une API stable, même si le code
 * du hook est factorisé dans plusieurs fonctions internes.
 */
type BuildBeforeHook = NonNullable<NuxtHooks['build:before']>

/**
 * Affiche un message de log avec le préfixe du hook afin de faciliter la recherche.
 * @param message Texte du log à afficher.
 */
const log = (message: string) => console.warn(`[schema-hook] ${message}`)

/**
 * Normalise un nom de fichier YAML vers un identifiant de schéma en PascalCase.
 *
 * Exemple : `real_estate-listing.yaml` → `RealEstateListing`.
 *
 * @param fileName Nom de fichier source.
 * @returns Nom de schéma exploitable pour le reporting du hook.
 */
const toSchemaName = (fileName: string) =>
  fileName
    .replace(/\.ya?ml$/i, '')
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')

/**
 * Liste les schémas YAML détectés dans le dossier source.
 *
 * @param schemaPath Chemin absolu vers le dossier de schémas.
 * @returns Liste triée des schémas détectés (format PascalCase).
 */
const listSchemaNames = async (schemaPath: string): Promise<string[]> => {
  const entries = await readdir(schemaPath, { withFileTypes: true })

  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => /\.ya?ml$/i.test(name))
    .sort((left, right) => left.localeCompare(right))
    .map(toSchemaName)
}

/**
 * Hook Nuxt déclenché avant chaque build/prepare pour générer les interfaces
 * TypeScript issues des schémas YAML, en centralisant le logging et les erreurs.
 *
 * Pipeline exécutée :
 * - résolution du dossier de schémas source (`resolveSchemaPath`)
 * - génération des interfaces principales (`SCHEMAS`)
 * - résolution du dossier DTO (`resolveDtoPath`)
 * - génération des DTO suffixés (`DTOS`)
 *
 * Le hook applique une tolérance ciblée sur certains cas de permissions afin
 * de préserver des artefacts déjà présents dans des environnements contraints.
 *
 * @returns `void`
 * @throws {Error} Propage les erreurs de résolution/génération non tolérées.
 *
 * @see resolveSchemaPath
 * @see resolveDtoPath
 * @see generateArtifacts
 */
export const runSchemaHook: BuildBeforeHook = async () => {
  // Préparation et signalement du démarrage du traitement.
  log('Démarrage de la génération des interfaces depuis les schémas YAML...')

  try {
    // Résolution du chemin de schémas à partir des fichiers partagés du projet.
    const schemaPath = await resolveSchemaPath(log)
    const schemas = await listSchemaNames(schemaPath)

    if (!schemas.length) {
      throw new Error(`Aucun schéma YAML détecté dans "${join(schemaPath)}"`)
    }

    log(`Chemin des schémas retenu: ${schemaPath}`)
    log(`Schémas traités: ${schemas.join(', ')}`)

    // Génération des artefacts TypeScript et confirmation finale.
    await generateArtifacts(schemaPath, SCHEMAS, SCHEMAS)
    const dtoPath = await resolveDtoPath(log)
    log(`Chemin des DTO retenu: ${dtoPath}`)
    log(`DTO traités: ${DTOS.join(', ')}`)
    await generateArtifacts(dtoPath, DTOS, DTOS, {
      outputDir: 'schemas/dtos',
      typeNameSuffix: 'Dto',
    })
    log('Génération des interfaces terminée avec succès.')
  } catch (error) {
    const reason = (error as Error).message

    console.error(`[schema-hook] Échec de la génération des interfaces : ${reason}`)
    throw error
  }
}
