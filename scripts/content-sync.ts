/* eslint-disable no-console */
/**
 * Synchronisation API → fichiers content (pull-only).
 *
 * Lit l'API Symfony et écrit les fichiers locaux pour les locales activées du
 * projet (champ `enabledLocales`). Coexiste avec import-accommodations.ts (push).
 *
 * Usage :
 *   bun scripts/content-sync.ts
 *   bun scripts/content-sync.ts --dry-run
 *   bun scripts/content-sync.ts --locale=fr
 */

import type { Dirent } from 'node:fs'

import { randomUUID } from 'node:crypto'
import { mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'

import { config as loadDotenv } from 'dotenv'
import YAML from 'yaml'

loadDotenv({ path: resolve(process.cwd(), '.env') })

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const isDryRun = process.argv.includes('--dry-run')
const localeFlag = process.argv.find((a) => a.startsWith('--locale='))?.split('=')[1]

const API_URL = process.env.SYMFONY_API_URL ?? ''
const PROJECT_ID = process.env.SYMFONY_PROJECT_ID ?? ''
const SERVICE_EMAIL = process.env.SYMFONY_SERVICE_EMAIL ?? ''
const SERVICE_PASSWORD = process.env.SYMFONY_SERVICE_PASSWORD ?? ''
const CONTENT_DIR = join(process.cwd(), 'content')
const MEDIA_DIR = resolve(
  process.env.CONTENT_SYNC_MEDIA_DIR ?? join(process.cwd(), 'public/images'),
)

if (!API_URL || !PROJECT_ID || !SERVICE_EMAIL || !SERVICE_PASSWORD) {
  console.error('[content-sync] Erreur : variables SYMFONY_* manquantes dans .env')
  process.exit(1)
}

// ---------------------------------------------------------------------------
// Types API
// ---------------------------------------------------------------------------

type HydraCollection<TItem> = {
  'hydra:member'?: TItem[]
  member?: TItem[]
  'hydra:view'?: { 'hydra:next'?: string }
  view?: { next?: string }
}

type ApiOffer = {
  price: string
  priceCurrency: string
  priceSpecification?: string | null
  availability?: string | null
}

type ApiAccommodationMedia = {
  mediaObject: string // UUID
  position: number
  caption: string | null
  keywords: string[]
  representativeOfPage?: boolean
}

type ApiAccommodationHasPart = {
  additionalType?: string | null
  position?: number | null
  name?: string | null
  headline?: string | null
  text?: string | null
  // L'API renvoie `[]` quand vide, sinon un objet { reverse?, overlayMode? }.
  meta?: Record<string, unknown> | unknown[] | null
  // Références media-object (UUID), ordonnées.
  associatedMedia?: string[]
}

type ApiAccommodation = {
  id: string
  identifier: string
  slug: string
  name: string | null
  label: string | null
  highlight: string | null
  body: string | null
  review: string | null
  metaTitle: string | null
  metaDescription: string | null
  category: string
  realEstateListing: string
  place: string
  amenityFeature: string[]
  tags: string[]
  offer: ApiOffer | null
  floorSize: string | null
  landArea: string | null
  areaSize: string | null
  areaTerrace: string | null
  level: number | null
  yearBuilt: number | null
  numberOfRooms: number | null
  numberOfBedrooms: number | null
  numberOfBathroomsTotal: number | null
  numberOfGarages: number | null
  occupancy: number | null
  associatedMedia: ApiAccommodationMedia[]
  hasPart?: ApiAccommodationHasPart[]
  status: 'published' | 'draft' | 'archived'
  createdAt: string
  updatedAt: string
}

type ApiCategoryCode = {
  id: string
  codeValue: string
  label: string
  inCodeSet: string
  metadata?: {
    isEnabled?: boolean
  }
  text?: string | null
}

type ApiMediaObject = {
  id: string
  caption: string | null
  contentUrl: string | null
  originalFilename: string | null
  mainEntity: string | null
  updatedAt: string
}

type ApiProject = {
  id: string
  name: string
  sourceLocale: string
  enabledLocales: string[]
}

type NodeError = Error & { code?: string }

const isNodeError = (value: unknown): value is NodeError => value instanceof Error

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

async function fetchToken(): Promise<string> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: SERVICE_EMAIL, password: SERVICE_PASSWORD }),
  })
  if (!res.ok) throw new Error(`Auth failed: ${res.status} ${await res.text()}`)
  const json = (await res.json()) as { token: string }
  return json.token
}

// ---------------------------------------------------------------------------
// Fetchers
// ---------------------------------------------------------------------------

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, Accept: 'application/ld+json' }
}

async function fetchCollection<TItem>(url: string, token: string): Promise<TItem[]> {
  const items: TItem[] = []
  const visited = new Set<string>()
  let pageUrl: string | undefined = url

  while (pageUrl) {
    if (new URL(pageUrl).origin !== new URL(url).origin) {
      throw new Error(`Pagination URL outside API origin: ${pageUrl}`)
    }
    if (visited.has(pageUrl)) throw new Error(`Pagination loop: ${pageUrl}`)
    visited.add(pageUrl)
    const res = await fetch(pageUrl, { headers: authHeaders(token) })
    const raw = await res.text()
    if (!res.ok) throw new Error(`Fetch failed [${res.status}] ${pageUrl}\n${raw.slice(0, 500)}`)
    let json: HydraCollection<TItem>
    try {
      json = JSON.parse(raw) as HydraCollection<TItem>
    } catch {
      const contentType = res.headers.get('content-type') ?? 'inconnu'
      throw new Error(
        `Réponse non-JSON [${res.status}] ${pageUrl}\n  content-type: ${contentType}\n  corps (500 premiers car.): ${raw.slice(0, 500)}`,
      )
    }
    items.push(...(json['hydra:member'] ?? json.member ?? []))
    const next = json['hydra:view']?.['hydra:next'] ?? json.view?.next
    pageUrl = next ? new URL(next, pageUrl).href : undefined
  }
  return items
}

function projectUrl(path: string, locale: string) {
  return `${API_URL}/api/projects/${PROJECT_ID}/${path}?pagination=false&locale=${locale}`
}

/**
 * Récupère le projet pour connaître les locales réellement activées côté API.
 * Évite de demander une locale non activée (erreur 400 « Locale is not enabled »).
 */
async function fetchProject(token: string): Promise<ApiProject> {
  const url = `${API_URL}/api/projects/${PROJECT_ID}`
  const res = await fetch(url, { headers: authHeaders(token) })
  const raw = await res.text()
  if (!res.ok) throw new Error(`Fetch projet échoué [${res.status}] ${url}\n${raw.slice(0, 500)}`)
  return JSON.parse(raw) as ApiProject
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

type CategoryCodeYamlItem = {
  id: string
  codeValue: string
  name: string
  inCodeSet: string
  metadata?: {
    isEnabled?: boolean
  }
  text?: string
}

function mapCategoryCodes(items: ApiCategoryCode[]): CategoryCodeYamlItem[] {
  return items
    .filter((item) => Boolean(item.codeValue && item.inCodeSet))
    .map((item) => ({
      id: item.id,
      codeValue: item.codeValue,
      name: item.label ?? item.codeValue,
      inCodeSet: item.inCodeSet,
      ...(typeof item.metadata?.isEnabled === 'boolean'
        ? { metadata: { isEnabled: item.metadata.isEnabled } }
        : {}),
      ...(item.text ? { text: item.text } : {}),
    }))
    .sort(
      (a, b) => a.inCodeSet.localeCompare(b.inCodeSet) || a.codeValue.localeCompare(b.codeValue),
    )
}

type MediaObjectYamlItem = {
  identifier: string
  caption: string
  url: string
  mainEntity: string
  dateModified: string
}
type UuidFilenameMap = Record<string, string>

// L'API peut renvoyer contentUrl en absolu (https://host/images/x.jpg) ou en
// relatif (/images/x.jpg). On ne garde que le pathname : la base factice permet
// de résoudre les deux formes sans planter sur un chemin relatif.
function toMediaPath(contentUrl: string): string {
  return new URL(contentUrl, 'http://_').pathname
}

function toManagedMediaFilename(url: string): string | null {
  const pathname = toMediaPath(url)
  const parts = pathname.split('/').filter(Boolean)
  if (parts.length !== 2 || parts.at(0) !== 'images') return null

  const filename = parts.at(1)?.trim()
  return filename ? filename : null
}

function mapMediaObjects(items: ApiMediaObject[]): {
  yamlItems: MediaObjectYamlItem[]
  uuidToFilename: UuidFilenameMap
  managedFilenames: Set<string>
} {
  const yamlItems: MediaObjectYamlItem[] = []
  const uuidToFilename: UuidFilenameMap = {}
  const managedFilenames = new Set<string>()

  for (const item of items) {
    if (!item.id || !item.contentUrl) continue

    uuidToFilename[item.id] = item.id
    const mediaPath = toMediaPath(item.contentUrl)
    const filename = toManagedMediaFilename(item.contentUrl)
    if (filename) managedFilenames.add(filename)

    yamlItems.push({
      identifier: item.id,
      caption: item.caption ?? '',
      url: mediaPath,
      mainEntity: item.mainEntity ?? 'ImageObject',
      dateModified: item.updatedAt,
    })
  }

  return { yamlItems, uuidToFilename, managedFilenames }
}

function toNumericIfPossible(v: string | null | undefined): number | string | null {
  if (v === null || v === undefined) return null
  const n = Number(v)
  return Number.isFinite(n) && v.trim() !== '' ? n : v
}

type AccommodationFrontmatter = Record<string, unknown>

function mapAccommodation(
  item: ApiAccommodation,
  uuidToFilename: UuidFilenameMap,
): { frontmatter: AccommodationFrontmatter; body: string } {
  const fm: AccommodationFrontmatter = {}

  fm.identifier = item.identifier
  if (item.slug) fm.slug = item.slug
  if (item.name) fm.name = item.name
  fm.dateCreated = item.createdAt
  fm.dateModified = item.updatedAt

  if (item.category) fm.category = item.category
  if (item.realEstateListing) fm.realEstateListing = item.realEstateListing
  if (item.place) fm.place = item.place

  if (item.offer) {
    fm.offer = {
      price: toNumericIfPossible(item.offer.price) ?? item.offer.price,
      priceCurrency: item.offer.priceCurrency,
      ...(item.offer.priceSpecification && { priceSpecification: item.offer.priceSpecification }),
      ...(item.offer.availability && { availability: item.offer.availability }),
    }
  }

  if (item.yearBuilt != null) fm.yearBuilt = item.yearBuilt
  if (item.floorSize != null) fm.floorSize = toNumericIfPossible(item.floorSize) ?? item.floorSize
  if (item.landArea != null) fm.landArea = toNumericIfPossible(item.landArea) ?? item.landArea
  if (item.areaSize != null) fm.areaSize = item.areaSize
  if (item.areaTerrace != null) fm.areaTerrace = item.areaTerrace
  if (item.level != null) fm.level = item.level
  if (item.numberOfRooms != null) fm.numberOfRooms = item.numberOfRooms
  if (item.numberOfBedrooms != null) fm.numberOfBedrooms = item.numberOfBedrooms
  if (item.numberOfBathroomsTotal != null) fm.numberOfBathroomsTotal = item.numberOfBathroomsTotal
  if (item.numberOfGarages != null) fm.numberOfGarages = item.numberOfGarages
  if (item.occupancy != null) fm.occupancy = item.occupancy

  if (item.amenityFeature?.length) fm.amenityFeature = item.amenityFeature
  if (item.tags?.length) fm.tags = item.tags

  const sortedMedia = [...item.associatedMedia].sort((a, b) => a.position - b.position)
  const resolvedMedia: Array<{ image: string; caption?: string; keywords?: string[] }> = []
  for (const entry of sortedMedia) {
    const filename = uuidToFilename[entry.mediaObject]
    if (!filename) {
      console.warn(`    [warn] mediaObject UUID non résolu : ${entry.mediaObject}`)
      continue
    }
    resolvedMedia.push({
      image: filename,
      ...(entry.caption && { caption: entry.caption }),
      ...(entry.keywords?.length && { keywords: entry.keywords }),
      ...(entry.representativeOfPage && { representativeOfPage: true }),
    })
  }
  fm.associatedMedia = resolvedMedia

  // Parcours immersif : chaque écran référence ses médias par UUID ; on les résout
  // en identifiants de galerie (`{ image }`), comme `associatedMedia`, pour que le
  // mapper runtime (services/mapper/accommodation.ts) retrouve les url via la galerie.
  if (item.hasPart?.length) {
    const screens = [...item.hasPart]
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      .map((screen) => {
        const media = (screen.associatedMedia ?? [])
          .map((uuid) => uuidToFilename[uuid])
          .filter((filename): filename is string => Boolean(filename))
          .map((filename) => ({ image: filename }))

        const hasMeta =
          screen.meta != null && !Array.isArray(screen.meta) && Object.keys(screen.meta).length > 0

        return {
          ...(screen.additionalType && { additionalType: screen.additionalType }),
          ...(screen.position != null && { position: screen.position }),
          ...(screen.name && { name: screen.name }),
          ...(screen.headline && { headline: screen.headline }),
          ...(screen.text && { text: screen.text }),
          ...(hasMeta && { meta: screen.meta }),
          associatedMedia: media,
        }
      })
    fm.hasPart = screens
  }

  fm.isActive = item.status === 'published'

  if (item.label) fm.label = item.label
  if (item.highlight) fm.highlight = item.highlight
  if (item.review) fm.review = item.review
  if (item.metaTitle) fm.metaTitle = item.metaTitle
  if (item.metaDescription) fm.metaDescription = item.metaDescription

  return {
    frontmatter: fm,
    body: item.body?.trim() ?? '',
  }
}

// ---------------------------------------------------------------------------
// Serializers
// ---------------------------------------------------------------------------

function toMarkdown(frontmatter: AccommodationFrontmatter, body: string): string {
  const yaml = YAML.stringify(frontmatter, { lineWidth: 0 })
  return body ? `---\n${yaml}---\n\n${body}\n` : `---\n${yaml}---\n`
}

function toYaml(items: unknown[]): string {
  return YAML.stringify({ items }, { lineWidth: 0 })
}

// ---------------------------------------------------------------------------
// Writers
// ---------------------------------------------------------------------------

async function safeWriteFile(filePath: string, content: string) {
  await mkdir(dirname(filePath), { recursive: true })
  const temporaryPath = `${filePath}.${randomUUID()}.tmp`
  await writeFile(temporaryPath, content, 'utf8')
  await rename(temporaryPath, filePath)
}

async function purgeMarkdownDir(dir: string) {
  let files: string[]
  try {
    files = await readdir(dir)
  } catch {
    return // dossier absent, rien à purger
  }
  const mdFiles = files.filter((f) => f.endsWith('.md'))
  await Promise.all(mdFiles.map((f) => rm(join(dir, f))))
  if (mdFiles.length > 0) console.log(`  purge ${mdFiles.length} fichiers dans ${dir}`)
}

async function readManagedMediaFilenames(mediaYamlPath: string): Promise<Set<string>> {
  try {
    const raw = await readFile(mediaYamlPath, 'utf8')
    const parsed: unknown = YAML.parse(raw)
    const items = isRecord(parsed) && Array.isArray(parsed.items) ? parsed.items : []
    const filenames = new Set<string>()

    for (const item of items) {
      if (!isRecord(item) || typeof item.url !== 'string') continue
      const filename = toManagedMediaFilename(item.url)
      if (filename) filenames.add(filename)
    }

    return filenames
  } catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT') return new Set()
    throw error
  }
}

async function purgeStaleManagedMediaFiles(
  previousFilenames: Set<string>,
  nextFilenames: Set<string>,
) {
  const staleFilenames = [...previousFilenames].filter((filename) => !nextFilenames.has(filename))
  if (staleFilenames.length === 0) return

  let entries: Dirent[]
  try {
    entries = await readdir(MEDIA_DIR, { withFileTypes: true })
  } catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT') {
      console.warn(`  [warn] dossier media absent, purge ignorée : ${MEDIA_DIR}`)
      return
    }
    throw error
  }

  const existingFiles = new Set(
    entries.filter((entry) => entry.isFile()).map((entry) => entry.name),
  )
  const filesToDelete = staleFilenames.filter((filename) => existingFiles.has(filename))

  if (isDryRun) {
    console.log(`  [dry-run] purge ${filesToDelete.length} fichiers media dans ${MEDIA_DIR}`)
    return
  }

  await Promise.all(filesToDelete.map((filename) => rm(join(MEDIA_DIR, filename))))
  if (filesToDelete.length > 0) {
    console.log(`  purge ${filesToDelete.length} fichiers media dans ${MEDIA_DIR}`)
  }
}

// ---------------------------------------------------------------------------
// Sync par locale
// ---------------------------------------------------------------------------

async function syncLocale(locale: string, token: string) {
  console.log(`\n[sync:${locale}]`)

  const [categoryCodes, mediaObjects, accommodations] = await Promise.all([
    fetchCollection<ApiCategoryCode>(projectUrl('category-codes', locale), token),
    fetchCollection<ApiMediaObject>(projectUrl('media-objects', locale), token),
    fetchCollection<ApiAccommodation>(projectUrl('accommodations', locale), token),
  ])

  console.log(
    `  category-codes: ${categoryCodes.length}, media-objects: ${mediaObjects.length}, accommodations: ${accommodations.length}`,
  )

  if (accommodations.length === 0) {
    console.warn(`  [warn] Aucune accommodation — vérifier SYMFONY_PROJECT_ID`)
  }

  // Category codes
  const mappedCodes = mapCategoryCodes(categoryCodes)
  const codeYamlPath = join(CONTENT_DIR, locale, 'metadata', 'category-code.yaml')
  if (isDryRun) {
    console.log(`  [dry-run] ${codeYamlPath} (${mappedCodes.length} codes)`)
  } else {
    await safeWriteFile(codeYamlPath, toYaml(mappedCodes))
    console.log(`  ✓ category-code.yaml (${mappedCodes.length})`)
  }

  // Media objects
  const { yamlItems: mediaYaml, uuidToFilename, managedFilenames } = mapMediaObjects(mediaObjects)
  const mediaYamlPath = join(CONTENT_DIR, locale, 'metadata', 'media-object.yaml')
  const previousManagedFilenames = await readManagedMediaFilenames(mediaYamlPath)
  if (isDryRun) {
    console.log(`  [dry-run] ${mediaYamlPath} (${mediaYaml.length} items)`)
  } else {
    await safeWriteFile(mediaYamlPath, toYaml(mediaYaml))
    console.log(`  ✓ media-object.yaml (${mediaYaml.length})`)
  }
  await purgeStaleManagedMediaFiles(previousManagedFilenames, managedFilenames)

  // Accommodations — purge avant réécriture pour refléter exactement l'état API
  const accommodationsDir = join(CONTENT_DIR, locale, 'accommodations')
  if (isDryRun) {
    console.log(`  [dry-run] purge ${accommodationsDir}/*.md`)
  } else {
    await purgeMarkdownDir(accommodationsDir)
  }

  let ok = 0
  let errors = 0
  for (const item of accommodations) {
    const filename = `${item.slug || item.identifier.toLowerCase()}.md`
    const filePath = join(CONTENT_DIR, locale, 'accommodations', filename)
    try {
      const { frontmatter, body } = mapAccommodation(item, uuidToFilename)
      if (isDryRun) {
        console.log(`  [dry-run] ${filePath}`)
      } else {
        await safeWriteFile(filePath, toMarkdown(frontmatter, body))
        console.log(`  ✓ ${filename}`)
      }
      ok++
    } catch (err) {
      console.error(`  ✗ ${filename}: ${err}`)
      errors++
    }
  }

  return { ok, errors }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

/**
 * Résout les locales à synchroniser depuis les locales activées du projet.
 * Si `--locale=` est fourni, on le valide contre les locales activées.
 */
function resolveLocales(project: ApiProject): string[] {
  const enabled = project.enabledLocales
  if (!localeFlag) return enabled

  if (!enabled.includes(localeFlag)) {
    console.warn(
      `[content-sync] [skip] locale demandée '${localeFlag}' non activée pour le projet '${project.name}' (activées: ${enabled.join(', ')})`,
    )
    return []
  }
  return [localeFlag]
}

async function main() {
  const token = await fetchToken()
  console.log('[content-sync] authentifié ✓')

  const project = await fetchProject(token)
  const locales = resolveLocales(project)
  console.log(
    `[content-sync] mode=${isDryRun ? 'dry-run' : 'live'} projet=${project.name} locales=${locales.join(',') || '(aucune)'}`,
  )

  let totalOk = 0
  let totalErrors = 0

  for (const locale of locales) {
    const { ok, errors } = await syncLocale(locale, token)
    totalOk += ok
    totalErrors += errors
  }

  console.log(`\n[content-sync] terminé — accommodations: ${totalOk}, erreurs: ${totalErrors}`)

  if (totalErrors > 0) process.exit(1)
}

main().catch((err) => {
  console.error('[content-sync] erreur fatale:', err)
  process.exit(1)
})
