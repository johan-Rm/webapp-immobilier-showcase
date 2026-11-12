import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { resolveApplicationTarget } from '../../shared/site/registry'

const webapp = fileURLToPath(new URL('../..', import.meta.url))
const target = resolveApplicationTarget(process.env.GD_TARGET)
const project = target.kind === 'dashboard' ? 'dashboard/.nuxt/tsconfig.site.json' : 'tsconfig.json'

// Keep package script behavior consistent with GD_TARGET, including an isolated dashboard buildDir.
for (const args of [
  [resolve(webapp, 'node_modules/nuxt/bin/nuxt.mjs'), 'prepare'],
  [resolve(webapp, 'node_modules/vue-tsc/bin/vue-tsc.js'), '--noEmit', '--project', project],
]) {
  const result = spawnSync('node', args, { cwd: webapp, env: process.env, stdio: 'inherit' })
  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}
