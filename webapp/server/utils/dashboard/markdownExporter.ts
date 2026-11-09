import type {
  DashboardAccommodation,
  DashboardAccommodationSavePayload,
  DashboardAccommodationTranslationPayload,
  DashboardEditableRecord,
  DashboardEditableValue,
  LocaleMarkdownResult,
} from '#shared/types/dashboardAccommodation'

import { randomUUID } from 'node:crypto'
import { mkdir, readdir, readFile, rename, unlink, writeFile } from 'node:fs/promises'
import { basename, dirname, isAbsolute, join } from 'node:path'

import YAML from 'yaml'

function isFixture(accommodation: DashboardAccommodation): boolean {
  const additionalProperty = accommodation.frontmatter.additionalProperty
  if (!Array.isArray(additionalProperty)) return false
  return additionalProperty.some((prop) => {
    if (typeof prop !== 'object' || prop === null || Array.isArray(prop)) return false
    const entry = prop as Record<string, DashboardEditableValue>
    return entry.name === 'dataSource' && entry.value === 'fixture'
  })
}

function buildMarkdown(frontmatter: Record<string, DashboardEditableValue>, body: string): string {
  const yaml = YAML.stringify(frontmatter)
  const trimmedBody = body.trimStart()
  return `---\n${yaml}---\n\n${trimmedBody}\n`
}

export type MarkdownExportResult =
  { updated: true; filePath: string } | { updated: false; reason: string }

export const resolveContentRoot = (): string => {
  const configuredPath = process.env.CONTENT_PATH?.trim()
  if (!configuredPath) return join(process.cwd(), 'content')
  return isAbsolute(configuredPath) ? configuredPath : join(process.cwd(), configuredPath)
}

const writeMarkdownAtomically = async (filePath: string, content: string): Promise<void> => {
  await mkdir(dirname(filePath), { recursive: true })
  const temporaryPath = `${filePath}.${randomUUID()}.tmp`
  await writeFile(temporaryPath, content, 'utf8')
  await rename(temporaryPath, filePath)
}

export async function exportToMarkdown(
  accommodation: DashboardAccommodation,
): Promise<MarkdownExportResult> {
  if (isFixture(accommodation)) {
    return { updated: false, reason: 'fixture_skipped' }
  }

  const slug =
    typeof accommodation.frontmatter.slug === 'string' && accommodation.frontmatter.slug
      ? accommodation.frontmatter.slug
      : accommodation.identifier.toLowerCase()
  const fileName = `${slug}.md`
  const filePath = join(resolveContentRoot(), accommodation.locale, 'accommodations', fileName)

  const content = buildMarkdown(accommodation.frontmatter, accommodation.body)

  await writeMarkdownAtomically(filePath, content)

  return { updated: true, filePath }
}

const LOCALIZED_FIELDS = new Set([
  'slug',
  'name',
  'label',
  'highlight',
  'body',
  'review',
  'metaTitle',
  'metaDescription',
])

const LOCALIZED_FRONTMATTER_FIELDS = [...LOCALIZED_FIELDS].filter((field) => field !== 'body')

const FRONTMATTER_REGEX = /^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/

const parseFrontmatterAndBody = (
  raw: string,
): { frontmatter: DashboardEditableRecord; body: string } | null => {
  const match = FRONTMATTER_REGEX.exec(raw)
  if (!match?.[1]) return null
  try {
    const frontmatter = YAML.parse(match[1]) as DashboardEditableRecord
    const body = raw.replace(FRONTMATTER_REGEX, '').trim()
    return { frontmatter, body }
  } catch {
    return null
  }
}

const mergeGlobalFields = (
  existing: DashboardEditableRecord,
  source: DashboardEditableRecord,
): DashboardEditableRecord => {
  const merged: DashboardEditableRecord = { ...existing }
  for (const [key, value] of Object.entries(source)) {
    if (!LOCALIZED_FIELDS.has(key)) merged[key] = value
  }
  return merged
}

const updateLocaleFile = async (
  filePath: string,
  globalFrontmatter: DashboardEditableRecord,
  identifier: string,
): Promise<boolean> => {
  let raw: string
  try {
    raw = await readFile(filePath, 'utf8')
  } catch {
    return false
  }
  const parsed = parseFrontmatterAndBody(raw)
  if (parsed?.frontmatter.identifier !== identifier) return false

  const merged = mergeGlobalFields(parsed.frontmatter, globalFrontmatter)
  await writeMarkdownAtomically(filePath, buildMarkdown(merged, parsed.body))
  return true
}

export async function propagateGlobalFields(
  globalFrontmatter: DashboardEditableRecord,
  identifier: string,
  sourceLocale: string,
  otherLocales: string[],
): Promise<void> {
  const contentRoot = resolveContentRoot()

  for (const locale of otherLocales) {
    if (locale === sourceLocale) continue

    const dir = join(contentRoot, locale, 'accommodations')
    let files: string[]
    try {
      files = (await readdir(dir)).filter((f) => f.endsWith('.md'))
    } catch {
      continue
    }

    for (const fileName of files) {
      const updated = await updateLocaleFile(join(dir, fileName), globalFrontmatter, identifier)
      if (updated) break
    }
  }
}

export async function deleteOrphanFile(
  oldFileName: string,
  newFilePath: string,
  locale: string,
): Promise<void> {
  const oldFilePath = join(resolveContentRoot(), locale, 'accommodations', oldFileName)
  if (oldFilePath === newFilePath) return
  try {
    await unlink(oldFilePath)
  } catch {
    // Fichier déjà absent ou non accessible — non bloquant
  }
}

const hasLocalizedContent = (translation: DashboardAccommodationTranslationPayload): boolean =>
  Object.entries(translation).some(
    ([key, value]) => key !== 'locale' && typeof value === 'string' && value.trim().length > 0,
  )

const buildLocalizedFrontmatter = (
  source: DashboardEditableRecord,
  existing: DashboardEditableRecord | null,
  translation: DashboardAccommodationTranslationPayload,
): DashboardEditableRecord => {
  const frontmatter = { ...source }
  LOCALIZED_FRONTMATTER_FIELDS.forEach((field) => delete frontmatter[field])

  LOCALIZED_FRONTMATTER_FIELDS.forEach((field) => {
    const existingValue = existing?.[field]
    if (typeof existingValue === 'string' && existingValue.length > 0) {
      frontmatter[field] = existingValue
    }

    if (!Object.hasOwn(translation, field)) return
    const value = translation[field as keyof DashboardAccommodationTranslationPayload]
    if (typeof value === 'string' && value.length > 0) frontmatter[field] = value
    else delete frontmatter[field]
  })

  return frontmatter
}

const findLocaleFile = async (
  locale: string,
  identifier: string,
): Promise<{ filePath: string; frontmatter: DashboardEditableRecord; body: string } | null> => {
  const directory = join(resolveContentRoot(), locale, 'accommodations')
  let files: string[] = []
  try {
    files = (await readdir(directory)).filter((fileName) => fileName.endsWith('.md'))
  } catch {
    return null
  }

  for (const fileName of files) {
    const filePath = join(directory, fileName)
    try {
      const raw = await readFile(filePath, 'utf8')
      const parsed = parseFrontmatterAndBody(raw)
      if (parsed?.frontmatter.identifier === identifier) return { filePath, ...parsed }
    } catch {
      // Un fichier illisible est ignore ; les autres restent candidats.
    }
  }
  return null
}

const deleteOtherLocaleFiles = async (
  locale: string,
  identifier: string,
  keptFilePath: string,
): Promise<void> => {
  const directory = join(resolveContentRoot(), locale, 'accommodations')
  let files: string[] = []
  try {
    files = (await readdir(directory)).filter((fileName) => fileName.endsWith('.md'))
  } catch {
    return
  }

  await Promise.all(
    files.map(async (fileName) => {
      const filePath = join(directory, fileName)
      if (filePath === keptFilePath) return
      try {
        const raw = await readFile(filePath, 'utf8')
        const parsed = parseFrontmatterAndBody(raw)
        if (parsed?.frontmatter.identifier === identifier) await unlink(filePath)
      } catch {
        // Un fichier concurrentiellement supprime ne bloque pas la projection.
      }
    }),
  )
}

export async function exportAllLocales(
  accommodation: DashboardAccommodationSavePayload,
): Promise<LocaleMarkdownResult[]> {
  const translations = accommodation.translations ?? []
  if (translations.length === 0) {
    try {
      const result = await exportToMarkdown(accommodation)
      if (result.updated && accommodation.fileName) {
        await deleteOrphanFile(accommodation.fileName, result.filePath, accommodation.locale)
      }
      return [{ locale: accommodation.locale, ...result }]
    } catch {
      return [{ locale: accommodation.locale, updated: false, reason: 'write_error' }]
    }
  }

  if (isFixture(accommodation)) {
    return translations.map(({ locale }) => ({
      locale,
      updated: false,
      reason: 'fixture_skipped',
    }))
  }

  return Promise.all(
    translations.map(async (translation): Promise<LocaleMarkdownResult> => {
      if (!hasLocalizedContent(translation)) {
        return { locale: translation.locale, updated: false, reason: 'empty_translation_skipped' }
      }

      const existing = await findLocaleFile(translation.locale, accommodation.identifier)
      const frontmatter = buildLocalizedFrontmatter(
        accommodation.frontmatter,
        existing?.frontmatter ?? null,
        translation,
      )
      const slug =
        typeof translation.slug === 'string' && translation.slug.trim()
          ? translation.slug.trim()
          : typeof existing?.frontmatter.slug === 'string' && existing.frontmatter.slug
            ? existing.frontmatter.slug
            : accommodation.identifier.toLowerCase()
      if (!slug) {
        return { locale: translation.locale, updated: false, reason: 'missing_slug' }
      }

      const fileName = basename(`${slug}.md`)
      const filePath = join(resolveContentRoot(), translation.locale, 'accommodations', fileName)
      const body = Object.hasOwn(translation, 'body')
        ? typeof translation.body === 'string'
          ? translation.body
          : ''
        : (existing?.body ?? '')

      try {
        await writeMarkdownAtomically(filePath, buildMarkdown(frontmatter, body))
        await deleteOtherLocaleFiles(translation.locale, accommodation.identifier, filePath)
        return { locale: translation.locale, updated: true, filePath }
      } catch (error) {
        console.error(`[markdown-export] Echec projection locale ${translation.locale}:`, error)
        return { locale: translation.locale, updated: false, reason: 'write_error' }
      }
    }),
  )
}
