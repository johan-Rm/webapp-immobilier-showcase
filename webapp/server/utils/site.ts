import { siteContentRoot, siteThemePath } from '../../services/infra/resolver/site'

import site from '#site'

/** L'identité compilée prime sur GD_TARGET à l'exécution du serveur. */
export const currentSiteContentRoot = (): string => siteContentRoot(process.cwd(), site.id)
export const currentSiteThemePath = (): string => siteThemePath(site.id)
