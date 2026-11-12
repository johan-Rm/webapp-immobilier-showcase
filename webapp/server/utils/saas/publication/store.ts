import { randomBytes } from 'node:crypto'
import { lstat, mkdir, open, readFile, rename, unlink } from 'node:fs/promises'
import { dirname, join, parse, resolve, relative, isAbsolute } from 'node:path'

import { z } from 'zod'

import { saasFailure } from '../auth/runtime'

import { saasLocaleSchema, saasPublishedSnapshotSchema } from '#shared/schemas'

export const releaseAssetSchema = z
  .object({
    id: z.uuid(),
    sourcePath: z.string().startsWith('/images/'),
    mimeType: z.enum(['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif']),
  })
  .strict()
export const releaseCommandSchema = z
  .object({
    projectId: z.uuid(),
    articleId: z.uuid(),
    locale: saasLocaleSchema,
    action: z.enum(['publish', 'unpublish']),
    expectedRevision: z.string().min(1),
  })
  .strict()
const failureSchema = z.object({
  status: z.number().int().min(400).max(599),
  code: z.string().regex(/^[a-z_]+$/),
})
export const publicationJobSchema = z
  .object({
    id: z.string().regex(/^[a-f0-9]{64}$/),
    owner: z.string().regex(/^[a-f0-9]{64}$/),
    fingerprint: z.string(),
    command: releaseCommandSchema,
    generation: z.number().int().positive(),
    phase: z.enum(['prepared', 'uncertain', 'queued', 'applied', 'failed', 'rejected']),
    snapshot: saasPublishedSnapshotSchema.nullable(),
    previousSnapshotId: z.uuid().nullable(),
    categories: z.array(z.object({ id: z.uuid(), label: z.string().min(1) }).strict()),
    assets: z.array(releaseAssetSchema),
    result: z
      .object({ revision: z.string().min(1), publishedSnapshotId: z.uuid().nullable() })
      .nullable(),
    error: failureSchema.nullable(),
  })
  .strict()
const journalSchema = z
  .object({
    schemaVersion: z.literal(1),
    projectId: z.uuid(),
    generation: z.number().int().nonnegative(),
    appliedGeneration: z.number().int().nonnegative(),
    jobs: z.record(z.string(), publicationJobSchema),
  })
  .strict()
const directory = () => {
  const path = resolve(
    process.env.SAAS_PUBLICATION_DIR || join(process.cwd(), '.data', 'saas-publication'),
  )
  const location = relative(process.cwd(), path)
  if (location === '..' || location.startsWith('../') || isAbsolute(location))
    return saasFailure(503, 'publication_storage_unavailable')
  return path
}
const file = (projectId: string) => {
  if (!z.uuid().safeParse(projectId).success) return saasFailure(400, 'invalid_request')
  return join(directory(), projectId + '.json')
}
const checkLinks = async (path: string) => {
  const absolute = resolve(path)
  let current = parse(absolute).root
  for (const part of absolute.slice(current.length).split('/').filter(Boolean)) {
    current = join(current, part)
    try {
      if ((await lstat(current)).isSymbolicLink())
        return saasFailure(503, 'publication_storage_unavailable')
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    }
  }
}
export const loadPublicationJournal = async (projectId: string) => {
  const path = file(projectId)
  await checkLinks(path)
  try {
    const raw = await readFile(path, 'utf8')
    const journal = journalSchema.parse(JSON.parse(raw))
    if (
      journal.projectId !== projectId ||
      journal.appliedGeneration > journal.generation ||
      Object.entries(journal.jobs).some(
        ([key, job]) =>
          key !== job.id ||
          job.command.projectId !== projectId ||
          job.generation > journal.generation,
      )
    )
      return saasFailure(503, 'publication_storage_unavailable')
    return journal
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT')
      return {
        schemaVersion: 1 as const,
        projectId,
        generation: 0,
        appliedGeneration: 0,
        jobs: {} as Record<string, z.infer<typeof publicationJobSchema>>,
      }
    return saasFailure(503, 'publication_storage_unavailable')
  }
}
export const savePublicationJournal = async (
  journal: Awaited<ReturnType<typeof loadPublicationJournal>>,
) => {
  const parsed = journalSchema.safeParse(journal)
  if (!parsed.success) return saasFailure(503, 'publication_storage_unavailable')
  const path = file(journal.projectId)
  const temporary = `${path}.${randomBytes(12).toString('hex')}.tmp`
  await checkLinks(path)
  try {
    await mkdir(dirname(path), { recursive: true, mode: 0o700 })
    const handle = await open(temporary, 'wx', 0o600)
    try {
      await handle.writeFile(JSON.stringify(journal))
      await handle.sync()
    } finally {
      await handle.close()
    }
    await rename(temporary, path)
    const parent = await open(dirname(path), 'r')
    try {
      await parent.sync()
    } finally {
      await parent.close()
    }
  } catch {
    return saasFailure(503, 'publication_storage_unavailable')
  } finally {
    try {
      await unlink(temporary)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    }
  }
}
