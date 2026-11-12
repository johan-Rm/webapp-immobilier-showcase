import type { H3Event } from 'h3'

import { createHash, randomUUID } from 'node:crypto'

import { getHeader, getQuery, getRouterParam, setResponseStatus } from 'h3'
import { z } from 'zod'

import { requireEditorProject } from '../articles/context'
import { readNativeEditorArticle } from '../articles/handlers'
import { articleMetadata, articleMetadataSchema, mapNativeArticle } from '../articles/model'
import {
  editorLock,
  editorRevision,
  inputParse,
  nativeParse,
  readEditorJson,
  requireEditorRevision,
} from '../articles/native'
import { saasResourceId } from '../auth/access'
import { saasEndpoint, saasFailure, saasConfig } from '../auth/runtime'
import { authorizedSaasRequest, readSaasSession } from '../auth/session'

import { publicationTarget, requireProjectionWorker } from './config'
import { releaseReferences } from './resources'
import { loadPublicationJournal, savePublicationJournal, publicationJobSchema } from './store'

import { saasLocaleSchema, saasWriteTranslationSchema } from '#shared/schemas'

const sha = (value: string) => createHash('sha256').update(value).digest('hex')
const queueConfirmed = (
  journal: Awaited<ReturnType<typeof loadPublicationJournal>>,
  job: z.infer<typeof publicationJobSchema>,
  revision: string,
) => {
  // A previously uncertain command may be confirmed after a newer generation was applied.
  if (job.generation < journal.generation) job.generation = ++journal.generation
  job.phase = 'queued'
  job.result = { revision, publishedSnapshotId: job.snapshot?.snapshotId ?? null }
  job.error = null
}
const resultFor = (event: H3Event, job: z.infer<typeof publicationJobSchema>) => {
  if (!job.result)
    return saasFailure(job.error?.status ?? 503, job.error?.code ?? 'publication_uncertain')
  let state: 'pending' | 'applied' | 'failed' = 'pending'
  if (job.phase === 'applied') state = 'applied'
  if (job.phase === 'failed') state = 'failed'
  setResponseStatus(event, state === 'pending' ? 202 : 200)
  return {
    articleId: job.command.articleId,
    locale: job.command.locale,
    revision: job.result.revision,
    publishedSnapshotId: job.result.publishedSnapshotId,
    projection: { generation: job.generation, state, errorCode: job.error?.code ?? null },
  }
}
export const saasPublication = (event: H3Event) =>
  saasEndpoint(event, async () => {
    inputParse(z.object({}).strict(), getQuery(event))
    const projectId = saasResourceId(event, 'projectId')
    const articleId = saasResourceId(event, 'articleId')
    const locale = inputParse(saasLocaleSchema, getRouterParam(event, 'locale'))
    const project = await requireEditorProject(event, projectId)
    publicationTarget(projectId)
    if (!project.enabledLocales.includes(locale)) return saasFailure(400, 'locale_mismatch')
    const actor = await readSaasSession(event)
    const owner = sha(actor.email)
    const key = inputParse(z.uuid(), getHeader(event, 'idempotency-key'))
    const expectedRevision = getHeader(event, 'if-match')
    if (!expectedRevision) return saasFailure(428, 'revision_required')
    const command = {
      projectId,
      articleId,
      locale,
      action: event.method === 'DELETE' ? ('unpublish' as const) : ('publish' as const),
      expectedRevision,
    }
    const id = sha(`${owner}\0${key}`)
    const fingerprint = editorRevision(command)
    return editorLock(`publication/${projectId}`, () =>
      editorLock(`${projectId}/articles/${articleId}`, async () => {
        const journal = await loadPublicationJournal(projectId)
        let job = journal.jobs[id]
        if (job && (job.owner !== owner || job.fingerprint !== fingerprint))
          return saasFailure(409, 'idempotency_conflict')
        let raw = await readNativeEditorArticle(event, projectId, articleId)
        let article = mapNativeArticle(raw, projectId)
        if (job?.result) return resultFor(event, job)
        if (job?.phase === 'rejected') return saasFailure(job.error!.status, job.error!.code)
        const edition = article.translations.find((t) => t.draft.locale === locale)
        if (!edition) return saasFailure(404, 'translation_not_found')
        if (!job) {
          requireEditorRevision(event, article.revision)
          const translation = nativeParse(saasWriteTranslationSchema.strip(), edition.draft)
          const write = { categoryIds: article.categoryIds, translation }
          const references =
            command.action === 'publish'
              ? await releaseReferences(event, project, write)
              : { categories: [], assets: [] }
          const snapshot =
            command.action === 'publish'
              ? {
                  snapshotId: randomUUID(),
                  revision: article.revision,
                  publishedAt: new Date().toISOString(),
                  categoryIds: article.categoryIds,
                  translation: write.translation,
                }
              : null
          job = nativeParse(publicationJobSchema, {
            id,
            owner,
            fingerprint,
            command,
            generation: journal.generation + 1,
            phase: 'prepared',
            snapshot,
            previousSnapshotId: edition.published?.snapshotId ?? null,
            categories: references.categories,
            assets: references.assets,
            result: null,
            error: null,
          })
          journal.generation = job.generation
          journal.jobs[id] = job
          // Persist intent before touching Symfony: network failures can then be reconciled by the same key.
          await savePublicationJournal(journal)
        } else {
          const currentId = edition.published?.snapshotId ?? null
          const desiredId = job.snapshot?.snapshotId ?? null
          const observed =
            command.action === 'publish'
              ? currentId === desiredId
              : currentId === null && job.previousSnapshotId !== null
          if (observed) {
            queueConfirmed(journal, job, article.revision)
            await savePublicationJournal(journal)
            return resultFor(event, job)
          }
          if (article.revision !== expectedRevision) {
            job.phase = 'rejected'
            job.error = { status: 409, code: 'revision_conflict' }
            await savePublicationJournal(journal)
            return saasFailure(409, 'revision_conflict')
          }
        }
        const nativeTranslation = raw.translations.find((t) => t.locale === locale)!
        const stored = articleMetadata(nativeTranslation)
        const shared = raw.translations.map(articleMetadata).find((m) => m !== null)
        const fields = nativeParse(saasWriteTranslationSchema.strip(), edition.draft)
        const metadata = nativeParse(articleMetadataSchema, {
          summary: fields.summary,
          primaryImage: fields.primaryImage,
          metaTitle: fields.metaTitle,
          metaDescription: fields.metaDescription,
          content: fields.content,
          schemaVersion: 1,
          categoryIds: article.categoryIds,
          authoredLocales:
            shared?.authoredLocales ??
            article.translations.filter((t) => !t.draft.generated).map((t) => t.draft.locale),
          ...stored,
          published: job.snapshot,
        })
        try {
          await authorizedSaasRequest(
            event,
            `/api/projects/${projectId}/articles/${articleId}/translations?locale=${locale}`,
            {
              method: 'PUT',
              body: {
                translations: [
                  { locale, schemaData: { ...nativeTranslation.schemaData, gdSaas: metadata } },
                ],
              },
            },
          )
          raw = await readNativeEditorArticle(event, projectId, articleId)
          article = mapNativeArticle(raw, projectId)
          const persisted =
            article.translations.find((t) => t.draft.locale === locale)?.published ?? null
          if (editorRevision(persisted) !== editorRevision(job.snapshot))
            return saasFailure(502, 'persistence_mismatch')
        } catch (error) {
          const failure = error as { statusCode?: number; data?: { code?: string } }
          const status = failure.statusCode ?? 503
          job.phase = [400, 401, 403, 404, 409, 422].includes(status) ? 'rejected' : 'uncertain'
          job.error = { status, code: failure.data?.code ?? 'upstream_failed' }
          await savePublicationJournal(journal)
          throw error
        }
        queueConfirmed(journal, job, article.revision)
        await savePublicationJournal(journal)
        return resultFor(event, job)
      }),
    )
  })
const workerProject = (event: H3Event) => {
  requireProjectionWorker(event)
  const id = saasResourceId(event, 'projectId')
  publicationTarget(id)
  return id
}
export const saasProjectionQueue = (event: H3Event) =>
  saasEndpoint(event, async () => {
    const projectId = workerProject(event)
    return editorLock(`publication/${projectId}`, async () => {
      const journal = await loadPublicationJournal(projectId)
      const confirmed = Object.values(journal.jobs)
        .filter((job) => job.result !== null)
        .sort((a, b) => a.generation - b.generation)
      const latest = new Map<string, z.infer<typeof publicationJobSchema>>()
      for (const job of confirmed) latest.set(`${job.command.articleId}/${job.command.locale}`, job)
      const entries = [...latest.values()]
        .filter((job) => job.snapshot !== null)
        .map((job) => {
          const snapshot = job.snapshot!
          const translation = snapshot.translation
          return {
            article: {
              id: job.command.articleId,
              projectId,
              snapshotId: snapshot.snapshotId,
              publishedAt: snapshot.publishedAt,
              ...translation,
              metaTitle: translation.metaTitle || translation.headline,
              metaDescription: translation.metaDescription || translation.summary,
              categories: job.categories,
            },
            assets: job.assets,
          }
        })
      return {
        schemaVersion: 1,
        projectId,
        target: publicationTarget(projectId),
        sourceOrigin: saasConfig().api,
        generation: confirmed.at(-1)?.generation ?? 0,
        appliedGeneration: journal.appliedGeneration,
        entries,
        commands: confirmed
          .filter((job) => job.phase !== 'applied')
          .map((job) => ({
            id: job.id,
            generation: job.generation,
            articleId: job.command.articleId,
            locale: job.command.locale,
            action: job.command.action,
          })),
      }
    })
  })
export const saasProjectionAck = (event: H3Event) =>
  saasEndpoint(event, async () => {
    const projectId = workerProject(event)
    const body = inputParse(
      z
        .object({
          generation: z.number().int().positive(),
          state: z.enum(['applied', 'failed']),
          errorCode: z
            .enum(['projection_failed', 'asset_unavailable', 'invalid_projection'])
            .optional(),
        })
        .strict(),
      await readEditorJson(event),
    )
    return editorLock(`publication/${projectId}`, async () => {
      const journal = await loadPublicationJournal(projectId)
      const confirmed = Object.values(journal.jobs).filter((job) => job.result !== null)
      const generation = Math.max(0, ...confirmed.map((job) => job.generation))
      if (
        body.generation !== generation ||
        body.generation < journal.appliedGeneration ||
        (body.generation === journal.appliedGeneration && body.state === 'failed')
      )
        return saasFailure(409, 'generation_conflict')
      for (const job of confirmed) {
        if (
          job.generation > body.generation ||
          (body.state === 'failed' && job.phase === 'applied')
        )
          continue
        job.phase = body.state
        job.error =
          body.state === 'failed'
            ? { status: 502, code: body.errorCode ?? 'projection_failed' }
            : null
      }
      if (body.state === 'applied') journal.appliedGeneration = body.generation
      await savePublicationJournal(journal)
      return { generation: body.generation, state: body.state }
    })
  })
