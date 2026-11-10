import { readFile } from 'node:fs/promises'

import { currentSiteThemePath } from '../site'

/** Le thème provient exclusivement de la layer sélectionnée au build. */
export const readThemeSource = async (): Promise<string> => readFile(currentSiteThemePath(), 'utf8')
