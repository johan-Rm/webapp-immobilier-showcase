/* eslint-disable no-console */
/**
 * Import initial des 7 biens réels (non-fixture) dans la base Symfony.
 *
 * Utilisation :
 *   bun scripts/import-accommodations.ts
 *   bun scripts/import-accommodations.ts --dry-run
 *
 * Nécessite SYMFONY_API_URL, SYMFONY_PROJECT_ID, SYMFONY_SERVICE_EMAIL,
 * SYMFONY_SERVICE_PASSWORD dans .env (ou variables d'environnement).
 */

import { readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'

import { config as loadDotenv } from 'dotenv'
import YAML from 'yaml'

loadDotenv({ path: resolve(process.cwd(), '.env') })

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const isDryRun = process.argv.includes('--dry-run')
const LOCALE = 'fr'
const CONTENT_DIR = join(process.cwd(), 'content', LOCALE, 'accommodations')

const API_URL = process.env.SYMFONY_API_URL ?? ''
const PROJECT_ID = process.env.SYMFONY_PROJECT_ID ?? ''
const SERVICE_EMAIL = process.env.SYMFONY_SERVICE_EMAIL ?? ''
const SERVICE_PASSWORD = process.env.SYMFONY_SERVICE_PASSWORD ?? ''

if (!isDryRun && (!API_URL || !PROJECT_ID || !SERVICE_EMAIL || !SERVICE_PASSWORD)) {
  console.error('Erreur : variables SYMFONY_* manquantes dans .env')
  process.exit(1)
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Frontmatter = Record<string, unknown>

type SymfonyCategoryCode = { '@id': string; code: string; inCodeSet: string }
type SymfonyAccommodation = { '@id': string; identifier: string }
type SymfonyMediaObject = { '@id': string; originalFilename: string | null }
type HydraCollection<T> = { 'hydra:member': T[] }
type CategoryCodeMap = Record<string, Record<string, string>>
type AccommodationUuidMap = Record<string, string>
type MediaObjectMap = Record<string, string>

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

async function fetchToken(): Promise<string> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: SERVICE_EMAIL, password: SERVICE_PASSWORD }),
  })
  if (!res.ok) throw new Error(`Auth failed: ${res.status} ${await res.text()}`)
  const json = (await res.json()) as { token: string }
  return json.token
}

// ---------------------------------------------------------------------------
// Referentiels
// ---------------------------------------------------------------------------

async function fetchCategoryCodeMap(token: string): Promise<CategoryCodeMap> {
  const res = await fetch(`${API_URL}/api/projects/${PROJECT_ID}/category-codes?pagination=false`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/ld+json' },
  })
  if (!res.ok) throw new Error(`CategoryCodes fetch failed: ${res.status}`)
  const json = (await res.json()) as HydraCollection<SymfonyCategoryCode>
  const map: CategoryCodeMap = {}
  for (const item of json['hydra:member'] ?? []) {
    if (!map[item.inCodeSet]) map[item.inCodeSet] = {}
    map[item.inCodeSet]![item.code] = item['@id']
  }
  return map
}

async function fetchMediaObjectMap(token: string): Promise<MediaObjectMap> {
  const res = await fetch(`${API_URL}/api/projects/${PROJECT_ID}/media-objects?pagination=false`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/ld+json' },
  })
  if (!res.ok) throw new Error(`MediaObjects fetch failed: ${res.status}`)
  const json = (await res.json()) as HydraCollection<SymfonyMediaObject>
  const map: MediaObjectMap = {}
  for (const item of json['hydra:member'] ?? []) {
    if (!item.originalFilename) continue
    const key = item.originalFilename.replace(/\.[^.]+$/, '')
    map[key] = item['@id']
  }
  return map
}

async function fetchAccommodationUuidMap(token: string): Promise<AccommodationUuidMap> {
  const res = await fetch(`${API_URL}/api/projects/${PROJECT_ID}/accommodations?pagination=false`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/ld+json' },
  })
  if (!res.ok) throw new Error(`Accommodations fetch failed: ${res.status}`)
  const json = (await res.json()) as HydraCollection<SymfonyAccommodation>
  const map: AccommodationUuidMap = {}
  for (const item of json['hydra:member'] ?? []) {
    const uuid = item['@id'].split('/').at(-1)
    if (uuid) map[item.identifier] = uuid
  }
  return map
}

// ---------------------------------------------------------------------------
// Frontmatter helpers
// ---------------------------------------------------------------------------

function parseFrontmatter(content: string): { fm: Frontmatter; body: string } {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/m)
  if (!match) return { fm: {}, body: content }
  return {
    fm: (YAML.parse(match[1]!) as Frontmatter) ?? {},
    body: match[2]?.trim() ?? '',
  }
}

function asString(v: unknown): string | null {
  return typeof v === 'string' && v.trim() !== '' ? v.trim() : null
}
function asNumber(v: unknown): number | null {
  return typeof v === 'number' ? v : null
}
function asBoolean(v: unknown): boolean | null {
  return typeof v === 'boolean' ? v : null
}
function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.filter((x): x is string => typeof x === 'string')
}

function resolveIri(
  codeMap: CategoryCodeMap,
  inCodeSet: string,
  code: string | null,
): string | null {
  if (!code) return null
  return codeMap[inCodeSet]?.[code] ?? null
}

function resolveIriArray(codeMap: CategoryCodeMap, inCodeSet: string, codes: string[]): string[] {
  return codes
    .map((c) => resolveIri(codeMap, inCodeSet, c))
    .filter((iri): iri is string => iri !== null)
}

// ---------------------------------------------------------------------------
// Mapper
// ---------------------------------------------------------------------------

function buildAssociatedMedia(
  fm: Frontmatter,
  mediaMap: MediaObjectMap,
): Array<{ mediaObject: string; caption?: string; keywords: string[]; position: number }> {
  const raw = fm.associatedMedia
  if (!Array.isArray(raw)) return []

  const result: Array<{
    mediaObject: string
    caption?: string
    keywords: string[]
    position: number
  }> = []
  let position = 0

  for (const item of raw) {
    if (typeof item !== 'object' || item === null) continue
    const entry = item as Record<string, unknown>
    const imageKey = typeof entry.image === 'string' ? entry.image : null
    if (!imageKey) continue

    const iri = mediaMap[imageKey] ?? null
    if (!iri) {
      console.warn(`    [warn] image non trouvée dans les media objects : ${imageKey}`)
      continue
    }

    const media: { mediaObject: string; caption?: string; keywords: string[]; position: number } = {
      mediaObject: iri,
      keywords: Array.isArray(entry.keywords)
        ? entry.keywords.filter((k): k is string => typeof k === 'string')
        : [],
      position,
    }
    if (typeof entry.caption === 'string' && entry.caption.trim()) {
      media.caption = entry.caption.trim()
    }
    result.push(media)
    position++
  }

  return result
}

function buildPayload(
  identifier: string,
  slug: string,
  fm: Frontmatter,
  body: string,
  codeMap: CategoryCodeMap,
  mediaMap: MediaObjectMap,
): Record<string, unknown> {
  const offer =
    fm.offer !== null && typeof fm.offer === 'object' && !Array.isArray(fm.offer)
      ? (fm.offer as Record<string, unknown>)
      : null

  const offerPrice = offer
    ? asNumber(offer.price) !== null
      ? String(asNumber(offer.price))
      : asString(offer.price)
    : null

  const floorSizeRaw = asNumber(fm.floorSize)
  const landAreaRaw = asNumber(fm.landArea)

  const amenityFeatureCodes = asStringArray(fm.amenityFeature)
  const tagCodes = asStringArray(fm.tags)

  const category = resolveIri(codeMap, 'accommodation-type', asString(fm.category))
  const realEstateListing = resolveIri(
    codeMap,
    'real-estate-listing',
    asString(fm.realEstateListing),
  )
  const place = resolveIri(codeMap, 'accommodation-place', asString(fm.place))
  const amenityFeature = resolveIriArray(codeMap, 'amenity-feature', amenityFeatureCodes)
  const tags = resolveIriArray(codeMap, 'tag', tagCodes)

  const associatedMedia = buildAssociatedMedia(fm, mediaMap)

  const payload: Record<string, unknown> = {
    identifier: asString(fm.identifier) ?? identifier,
    isActive: asBoolean(fm.isActive) ?? true,
    ...(category && { category }),
    ...(realEstateListing && { realEstateListing }),
    ...(place && { place }),
    amenityFeature,
    tags,
    associatedMedia,
  }

  const numberFields = [
    'yearBuilt',
    'areaSize',
    'areaTerrace',
    'numberOfRooms',
    'numberOfBedrooms',
    'numberOfBathroomsTotal',
    'numberOfGarages',
    'occupancy',
  ] as const
  for (const field of numberFields) {
    const v = asNumber(fm[field])
    if (v !== null) payload[field] = v
  }

  if (floorSizeRaw !== null) payload.floorSize = floorSizeRaw
  if (landAreaRaw !== null) payload.landArea = String(landAreaRaw)
  if (offerPrice !== null) payload.offerPrice = offerPrice
  if (offer && asString(offer.priceCurrency))
    payload.offerPriceCurrency = asString(offer.priceCurrency)
  if (offer && asString(offer.priceSpecification))
    payload.offerPriceSpecification = asString(offer.priceSpecification)
  if (asString(fm.offerAvailability)) payload.offerAvailability = asString(fm.offerAvailability)

  // Champs translatables
  payload.slug = asString(fm.slug) ?? slug
  const translatableStrings = [
    'name',
    'label',
    'highlight',
    'review',
    'metaTitle',
    'metaDescription',
  ] as const
  for (const field of translatableStrings) {
    const v = asString(fm[field])
    if (v !== null) payload[field] = v
  }
  if (body) payload.body = body

  return payload
}

// ---------------------------------------------------------------------------
// Non-fixture files detection
// ---------------------------------------------------------------------------

function isFixture(fm: Frontmatter): boolean {
  const ap = fm.additionalProperty
  if (!Array.isArray(ap)) return false
  return ap.some(
    (p) =>
      typeof p === 'object' &&
      p !== null &&
      (p as Record<string, unknown>).name === 'dataSource' &&
      (p as Record<string, unknown>).value === 'fixture',
  )
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(`[import] Mode : ${isDryRun ? 'DRY-RUN (aucun envoi)' : 'LIVE'}`)

  let token = ''
  let codeMap: CategoryCodeMap = {}
  let uuidMap: AccommodationUuidMap = {}
  let mediaMap: MediaObjectMap = {}

  if (!isDryRun) {
    token = await fetchToken()
    console.log('[import] Authentifié ✓')
    ;[codeMap, uuidMap, mediaMap] = await Promise.all([
      fetchCategoryCodeMap(token),
      fetchAccommodationUuidMap(token),
      fetchMediaObjectMap(token),
    ])
    console.log('[import] Référentiels chargés ✓')
  }

  const files = readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.md'))
  const realFiles = files.filter((f) => {
    const content = readFileSync(join(CONTENT_DIR, f), 'utf8')
    const { fm } = parseFrontmatter(content)
    return !isFixture(fm)
  })

  console.log(`[import] ${realFiles.length} biens réels trouvés (${files.length} total)`)

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/ld+json',
    Accept: 'application/ld+json',
  }

  let created = 0
  let updated = 0
  let errors = 0

  for (const file of realFiles) {
    const slug = file.replace(/\.md$/, '')
    const content = readFileSync(join(CONTENT_DIR, file), 'utf8')
    const { fm, body } = parseFrontmatter(content)
    const identifier = (asString(fm.identifier) ?? slug).toUpperCase()

    const payload = buildPayload(identifier, slug, fm, body, codeMap, mediaMap)

    const existingUuid = uuidMap[identifier] ?? null
    const method = existingUuid ? 'PUT' : 'POST'
    const url = existingUuid
      ? `${API_URL}/api/projects/${PROJECT_ID}/accommodations/${existingUuid}?locale=${LOCALE}`
      : `${API_URL}/api/projects/${PROJECT_ID}/accommodations?locale=${LOCALE}`

    console.log(`  [${method}] ${identifier} (${slug})`)

    if (isDryRun) {
      console.log(
        '    payload:',
        JSON.stringify(payload, null, 2).split('\n').slice(0, 6).join('\n') + '\n    ...',
      )
      continue
    }

    try {
      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const text = await res.text()
        console.error(`    ✗ ${res.status}: ${text.slice(0, 200)}`)
        errors++
      } else {
        if (existingUuid) {
          updated++
        } else {
          created++
        }
        console.log(`    ✓`)
      }
    } catch (err) {
      console.error(`    ✗ Erreur réseau: ${err}`)
      errors++
    }
  }

  console.log(`\n[import] Terminé — créés: ${created}, mis à jour: ${updated}, erreurs: ${errors}`)
}

main().catch((err) => {
  console.error('[import] Erreur fatale:', err)
  process.exit(1)
})
