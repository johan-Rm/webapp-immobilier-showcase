import type { ApplicationTarget } from '../types/saas/target.ts'

/** Identifiant par défaut : conserve les commandes et le site historiques. */
export const DEFAULT_SITE_ID = 'showcase-immobilier'

/** Un identifiant ne peut jamais désigner un chemin hors de sites/. */
export const resolveSiteId = (value: string | undefined): string => {
  const id = value?.trim() || DEFAULT_SITE_ID
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
    throw new Error(`[site] Identifiant invalide : ${id}`)
  }
  return id
}

/** Build-time selection only. Unknown sites remain subject to the existing filesystem checks. */
export const resolveApplicationTarget = (value: string | undefined): ApplicationTarget => {
  const id = resolveSiteId(value)
  return id === 'dashboard'
    ? { id, kind: 'dashboard', root: 'dashboard' }
    : { id, kind: 'site', root: `sites/${id}` }
}
