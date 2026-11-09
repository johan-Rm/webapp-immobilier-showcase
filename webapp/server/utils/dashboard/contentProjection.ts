import { randomUUID } from 'node:crypto'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

import YAML from 'yaml'

import { resolveContentRoot } from './markdownExporter'

export type ProjectedMediaObject = {
  identifier: string
  caption: string
  url: string
  mainEntity: string
  dateModified: string
}

export type ProjectedCategoryCode = {
  id: string
  codeValue: string
  name: string
  inCodeSet: string
  text?: string
  metadata?: {
    isEnabled?: boolean
  }
}

type LocalizedLabel = {
  locale: string
  label: string
}

type LocalizedCaption = {
  locale: string
  caption: string
}

const writeQueues = new Map<string, Promise<void>>()

const getMetadataPath = (locale: string, fileName: string): string =>
  join(resolveContentRoot(), locale, 'metadata', fileName)

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const normalizeItems = (value: unknown): unknown[] => {
  if (Array.isArray(value)) return value
  if (isRecord(value) && Array.isArray(value.items)) return value.items
  return []
}

const readItems = async (filePath: string): Promise<unknown[]> => {
  try {
    const raw = await readFile(filePath, 'utf8')
    return normalizeItems(YAML.parse(raw))
  } catch (error) {
    if (isRecord(error) && error.code === 'ENOENT') return []
    throw error
  }
}

const toProjectedMediaObject = (value: unknown): ProjectedMediaObject | null => {
  if (
    !isRecord(value) ||
    typeof value.identifier !== 'string' ||
    typeof value.caption !== 'string' ||
    typeof value.url !== 'string' ||
    typeof value.mainEntity !== 'string'
  ) {
    return null
  }

  return {
    identifier: value.identifier,
    caption: value.caption,
    url: value.url,
    mainEntity: value.mainEntity,
    dateModified: typeof value.dateModified === 'string' ? value.dateModified : '',
  }
}

const toProjectedCategoryCode = (value: unknown): ProjectedCategoryCode | null => {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    typeof value.codeValue !== 'string' ||
    typeof value.name !== 'string' ||
    typeof value.inCodeSet !== 'string'
  ) {
    return null
  }

  const isEnabled =
    isRecord(value.metadata) && typeof value.metadata.isEnabled === 'boolean'
      ? value.metadata.isEnabled
      : undefined

  return {
    id: value.id,
    codeValue: value.codeValue,
    name: value.name,
    inCodeSet: value.inCodeSet,
    ...(typeof value.text === 'string' ? { text: value.text } : {}),
    ...(typeof isEnabled === 'boolean' ? { metadata: { isEnabled } } : {}),
  }
}

const writeItemsAtomically = async <TItem>(filePath: string, items: TItem[]): Promise<void> => {
  await mkdir(dirname(filePath), { recursive: true })
  const temporaryPath = `${filePath}.${randomUUID()}.tmp`
  const yaml = YAML.stringify({ items }, { lineWidth: 0 })
  await writeFile(temporaryPath, yaml, 'utf8')
  await rename(temporaryPath, filePath)
}

const withFileWriteQueue = async <TResult>(
  filePath: string,
  operation: () => Promise<TResult>,
): Promise<TResult> => {
  const previous = writeQueues.get(filePath) ?? Promise.resolve()
  let release = (): void => undefined
  const current = new Promise<void>((resolve) => {
    release = resolve
  })
  const tail = previous.catch(() => undefined).then(() => current)
  writeQueues.set(filePath, tail)

  await previous.catch(() => undefined)
  try {
    return await operation()
  } finally {
    release()
    if (writeQueues.get(filePath) === tail) writeQueues.delete(filePath)
  }
}

const compareMediaByModificationDate = (
  left: ProjectedMediaObject,
  right: ProjectedMediaObject,
): number => {
  const leftTime = Date.parse(left.dateModified)
  const rightTime = Date.parse(right.dateModified)
  const safeLeftTime = Number.isNaN(leftTime) ? 0 : leftTime
  const safeRightTime = Number.isNaN(rightTime) ? 0 : rightTime
  return safeRightTime - safeLeftTime
}

export const normalizeMediaUrl = (value: string): string => {
  const trimmed = value.trim()
  if (!trimmed) return ''

  try {
    return new URL(trimmed, 'http://content.local').pathname
  } catch {
    return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  }
}

const upsertMediaForLocale = async (locale: string, media: ProjectedMediaObject): Promise<void> => {
  const filePath = getMetadataPath(locale, 'media-object.yaml')
  await withFileWriteQueue(filePath, async () => {
    const items = (await readItems(filePath))
      .map(toProjectedMediaObject)
      .filter((item): item is ProjectedMediaObject => item !== null)
    const nextItems = items.filter((item) => item.identifier !== media.identifier)
    nextItems.push(media)
    nextItems.sort(compareMediaByModificationDate)
    await writeItemsAtomically(filePath, nextItems)
  })
}

export const projectMediaObject = async (input: {
  enabledLocales: string[]
  translations: LocalizedCaption[]
  media: Omit<ProjectedMediaObject, 'caption'>
  fallbackCaption: string
}): Promise<void> => {
  const captionByLocale = new Map(
    input.translations.map((translation) => [translation.locale, translation.caption]),
  )

  await Promise.all(
    input.enabledLocales.map((locale) =>
      upsertMediaForLocale(locale, {
        ...input.media,
        caption: captionByLocale.get(locale) ?? input.fallbackCaption,
      }),
    ),
  )
}

const upsertCategoryCodeForLocale = async (
  locale: string,
  categoryCode: ProjectedCategoryCode,
): Promise<void> => {
  const filePath = getMetadataPath(locale, 'category-code.yaml')
  await withFileWriteQueue(filePath, async () => {
    const items = (await readItems(filePath))
      .map(toProjectedCategoryCode)
      .filter((item): item is ProjectedCategoryCode => item !== null)
    const index = items.findIndex(
      (item) =>
        item.codeValue === categoryCode.codeValue && item.inCodeSet === categoryCode.inCodeSet,
    )
    const nextItems = [...items]
    if (index < 0) nextItems.push(categoryCode)
    else nextItems[index] = { ...items[index], ...categoryCode }
    nextItems.sort(
      (left, right) =>
        left.inCodeSet.localeCompare(right.inCodeSet) ||
        left.codeValue.localeCompare(right.codeValue),
    )
    await writeItemsAtomically(filePath, nextItems)
  })
}

export const projectCategoryCode = async (input: {
  enabledLocales: string[]
  translations: LocalizedLabel[]
  categoryCode: Omit<ProjectedCategoryCode, 'name'>
  fallbackLabel: string
}): Promise<void> => {
  const labelByLocale = new Map(
    input.translations.map((translation) => [translation.locale, translation.label]),
  )

  await Promise.all(
    input.enabledLocales.map((locale) =>
      upsertCategoryCodeForLocale(locale, {
        ...input.categoryCode,
        name: labelByLocale.get(locale) ?? input.fallbackLabel,
      }),
    ),
  )
}

export const updateProjectedCategoryCodeText = async (input: {
  locale: string
  codeValue: string
  inCodeSet: string
  text: string
}): Promise<ProjectedCategoryCode> => {
  const filePath = getMetadataPath(input.locale, 'category-code.yaml')
  return withFileWriteQueue(filePath, async () => {
    const items = (await readItems(filePath))
      .map(toProjectedCategoryCode)
      .filter((item): item is ProjectedCategoryCode => item !== null)
    const index = items.findIndex(
      (item) => item.codeValue === input.codeValue && item.inCodeSet === input.inCodeSet,
    )
    if (index < 0) {
      throw new Error(`CategoryCode ${input.inCodeSet}/${input.codeValue} absent de content`)
    }
    const current = items[index]
    if (!current) throw new Error('CategoryCode introuvable apres resolution')

    const updated = { ...current, text: input.text }
    const nextItems = [...items]
    nextItems[index] = updated
    await writeItemsAtomically(filePath, nextItems)
    return updated
  })
}

export const findProjectedCategoryCode = async (
  locale: string,
  inCodeSet: string,
  codeValue: string,
): Promise<ProjectedCategoryCode | null> => {
  const filePath = getMetadataPath(locale, 'category-code.yaml')
  const items = (await readItems(filePath))
    .map(toProjectedCategoryCode)
    .filter((item): item is ProjectedCategoryCode => item !== null)
  return items.find((item) => item.inCodeSet === inCodeSet && item.codeValue === codeValue) ?? null
}
