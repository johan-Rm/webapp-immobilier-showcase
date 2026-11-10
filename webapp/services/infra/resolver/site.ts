import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { resolveSiteId } from '../../../shared/site/registry'

/**
 * Trouve le paquet autonome à partir du module compilé, indépendamment du cwd.
 * Seule une sortie portant l'identité compilée peut être utilisée.
 */
const packagedSiteRoot = (id: string): string | undefined => {
  let directory = dirname(fileURLToPath(import.meta.url))
  while (dirname(directory) !== directory) {
    const candidate = join(directory, 'site', id)
    if (existsSync(join(candidate, 'themes.yaml'))) return candidate
    directory = dirname(directory)
  }
  return undefined
}

/** Le même dossier sert à la lecture et aux projections du dashboard. */
export const siteContentRoot = (
  root = process.cwd(),
  id = resolveSiteId(process.env.GD_TARGET),
): string => {
  const configured = process.env.CONTENT_PATH?.trim()
  if (configured) return resolve(root, configured)
  const packaged = packagedSiteRoot(id)
  return join(packaged ?? join(root, 'sites', id), 'content')
}

export const siteMediaRoot = (root = process.cwd()): string =>
  resolve(
    root,
    process.env.CONTENT_SYNC_MEDIA_DIR ||
      `sites/${resolveSiteId(process.env.GD_TARGET)}/public/images`,
  )

export const siteThemePath = (id: string): string =>
  join(packagedSiteRoot(id) ?? join(process.cwd(), 'sites', id), 'themes.yaml')
