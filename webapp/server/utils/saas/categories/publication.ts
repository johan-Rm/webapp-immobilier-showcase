import type { mapEditorCategory } from './catalog'

import { saasFailure } from '../auth/runtime'
import { loadPublicationJournal, savePublicationJournal } from '../publication/store'

/** Appelé sous le verrou publication du projet, après relecture native autorisée. */
export const refreshPublishedCategory = async (
  projectId: string,
  category: ReturnType<typeof mapEditorCategory>,
) => {
  if (category.projectId !== projectId) return saasFailure(404, 'not_found')
  const journal = await loadPublicationJournal(projectId)
  const latest = new Map<string, (typeof journal.jobs)[string]>()
  for (const job of Object.values(journal.jobs)
    .filter((job) => job.result !== null)
    .sort((a, b) => a.generation - b.generation))
    latest.set(job.command.articleId + '/' + job.command.locale, job)
  const active = new Set(
    [...latest.values()].filter((job) => job.snapshot !== null).map((job) => job.id),
  )
  let changed = false
  for (const job of Object.values(journal.jobs)) {
    if (!job.snapshot || job.phase === 'rejected' || (job.result !== null && !active.has(job.id)))
      continue
    const reference = job.categories.find((item) => item.id === category.id)
    if (!reference) continue
    const label = category.labels[job.command.locale]
    if (!label?.trim()) return saasFailure(422, 'category_translation_missing')
    if (reference.label === label) continue
    reference.label = label
    if (active.has(job.id)) {
      job.generation = ++journal.generation
      job.phase = 'queued'
      job.error = null
    }
    changed = true
  }
  if (changed) await savePublicationJournal(journal)
}
