import { constants } from 'node:fs'
import { access, stat } from 'node:fs/promises'
import { resolve } from 'node:path'

export const normalizePath = (pathLike: string) => resolve(process.cwd(), pathLike)

export const ensureReadableDirectory = async (pathLike: string) => {
  const stats = await stat(pathLike)

  if (!stats.isDirectory()) {
    throw new Error(`"${pathLike}" n'est pas un dossier`)
  }

  await access(pathLike, constants.R_OK)
}

export const ensureReadableFile = async (pathLike: string, label?: string) => {
  try {
    const fileStats = await stat(pathLike)
    if (!fileStats.isFile()) {
      throw new Error(`Le chemin "${pathLike}" n'est pas un fichier`)
    }
    await access(pathLike, constants.R_OK)
  } catch (error) {
    const context = label ? ` ${label}` : ''
    throw new Error(
      `Fichier${context} manquant ou illisible (${pathLike}) : ${(error as Error).message}`,
    )
  }
}
