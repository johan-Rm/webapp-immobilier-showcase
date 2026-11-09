/* global process */
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const appRoot =
  process.env.AIDE_WEBAPP_ROOT || resolve(dirname(fileURLToPath(import.meta.url)), '../webapp')
const { default: settings } = await import(
  pathToFileURL(resolve(appRoot, 'prettier.config.cjs')).href
)
const config = { ...settings }
// Les contrôles ne contiennent pas de composants UI ou de classes Tailwind.
delete config.plugins
export default config
