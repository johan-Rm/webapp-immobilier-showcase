import { spawnSync } from 'node:child_process'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const integrityRoot = fileURLToPath(new URL('..', import.meta.url))
const appRoot = process.env.AIDE_WEBAPP_ROOT || resolve(integrityRoot, '../webapp')
const result = spawnSync(
  join(appRoot, 'node_modules/.bin/eslint'),
  ['.', '--max-warnings', '0', ...process.argv.slice(2)],
  { cwd: integrityRoot, stdio: 'inherit' },
)
if (result.error) throw result.error
process.exit(result.status ?? 1)
