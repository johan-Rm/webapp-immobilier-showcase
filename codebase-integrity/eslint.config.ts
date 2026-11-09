import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const basePath = dirname(fileURLToPath(import.meta.url))
const appRoot = process.env.AIDE_WEBAPP_ROOT || resolve(basePath, '../webapp')
// Une seule politique TypeScript pour le projet, réutilisée sans copie.
const { default: config } = (await import(
  pathToFileURL(resolve(appRoot, 'eslint.config.ts')).href
)) as { default: Record<string, unknown>[] }
export default config.map((entry) => ({ ...entry, basePath }))
