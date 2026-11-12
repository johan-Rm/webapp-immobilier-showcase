import { setTimeout as wait } from 'node:timers/promises'

import { projectionConfig } from './config'
import { runProjection } from './projector'

if (import.meta.main) {
  const args = process.argv.slice(2)
  const valid =
    args.every((arg) => ['--once', '--watch', '--dry-run'].includes(arg)) &&
    !(args.includes('--once') && args.includes('--watch')) &&
    !(args.includes('--watch') && args.includes('--dry-run'))
  if (!valid) {
    process.stderr.write('Usage: bun scripts/saas/project.ts [--once|--watch|--dry-run]\n')
    process.exitCode = 2
  } else {
    const controller = new AbortController()
    process.once('SIGINT', () => controller.abort())
    process.once('SIGTERM', () => controller.abort())
    const once = async () => {
      try {
        const result = await runProjection(projectionConfig(), args.includes('--dry-run'))
        process.stdout.write(JSON.stringify(result) + '\n')
        return result.state !== 'ack-pending'
      } catch (error) {
        const code = (error as { code?: string }).code ?? 'projection_failed'
        process.stderr.write(JSON.stringify({ state: 'failed', code }) + '\n')
        return false
      }
    }
    do {
      const ok = await once()
      if (!args.includes('--watch')) {
        process.exitCode = ok ? 0 : 1
        break
      }
      try {
        await wait(5000, undefined, { signal: controller.signal })
      } catch {
        break
      }
    } while (!controller.signal.aborted)
  }
}
