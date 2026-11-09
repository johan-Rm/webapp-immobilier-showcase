import { createHash } from 'node:crypto'
import { readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'

import { defineEventHandler, getQuery, setHeader } from 'h3'

import { resolveRuntimeContentRoot } from '../utils/content/loaders'

import { normalizeLocale } from '#shared/utils/locale'

type ContentVersionResponse = {
  version: string
  updatedAt: string
}

export default defineEventHandler(async (event): Promise<ContentVersionResponse> => {
  const query = getQuery(event)
  const locale = normalizeLocale(typeof query.locale === 'string' ? query.locale : 'fr')
  const directory = join(resolveRuntimeContentRoot(), locale, 'accommodations')
  const files = (await readdir(directory)).filter((fileName) => fileName.endsWith('.md')).sort()

  const entries = await Promise.all(
    files.map(async (fileName) => {
      const fileStat = await stat(join(directory, fileName))
      return {
        fileName,
        mtimeMs: fileStat.mtimeMs,
        size: fileStat.size,
      }
    }),
  )

  const latestMtimeMs = entries.reduce((latest, entry) => Math.max(latest, entry.mtimeMs), 0)
  const signature = entries
    .map((entry) => `${entry.fileName}:${entry.mtimeMs}:${entry.size}`)
    .join('|')

  setHeader(event, 'Cache-Control', 'no-store')

  return {
    version: createHash('sha256').update(signature).digest('hex'),
    updatedAt: latestMtimeMs > 0 ? new Date(latestMtimeMs).toISOString() : '',
  }
})
