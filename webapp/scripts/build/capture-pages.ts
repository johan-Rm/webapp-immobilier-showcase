/**
 * Capture les pages du site rendu par le serveur, en suivant ses liens internes.
 *
 * Le pre-rendu de Nitro echoue sur certaines routes (listes de biens : erreur 500
 * sans diagnostic, cf. carte 041) alors que le meme serveur les rend correctement.
 * On interroge donc le serveur comme le ferait un visiteur, et on ecrit chaque
 * page a l'emplacement qui correspond a son adresse.
 *
 * Le parcours est amorce par la source du sitemap : les liens de navigation
 * n'apparaissent qu'apres hydratation cote navigateur, donc le suivi de liens
 * seul ne decouvrirait ni les listes ni les fiches de biens.
 *
 * Certaines pages (listes de biens) echouent en mode capture : leur rendu serveur
 * casse lorsque les donnees sont presentes (`Cannot read properties of null`,
 * defaut SSR a corriger, cf. carte 041). Une adresse de repli peut etre fournie :
 * les pages en echec y sont reprises, au prix de listes vides plutot qu'absentes.
 *
 * Usage : bun scripts/build/capture-pages.ts <base_url> <dossier_sortie> [url_repli]
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

/** Points de depart du parcours, un par langue. */
const ENTRY_PATHS = ['/fr', '/en', '/es']

/** Langues du site, pour decliner les adresses connues du sitemap. */
const LOCALES = ['fr', 'en', 'es']

/** Source des adresses connues du site, alimentee par le contenu. */
const SITEMAP_SOURCE = '/api/__sitemap__/urls'

/**
 * Adresse d'une fiche de bien : `/<langue>/properties/<annonce>/<categorie>/<slug>`.
 * Une seule fiche par couple annonce + categorie suffit a une maquette : le
 * livrable illustre chaque gabarit sans dupliquer des centaines de pages.
 */
const PROPERTY_SHEET = /^\/[a-z]{2}\/properties\/([^/]+)\/([^/]+)\/[^/]+$/

/** Routes exclues : espace prive, endpoints, pages de debogage. */
const EXCLUDED = [/^\/api\//, /^\/[a-z]{2}\/dashboard/, /^\/[a-z]{2}\/echo/, /^\/_/]

/** Extensions signalant un fichier statique plutot qu'une page. */
const ASSET_EXTENSION = /\.[a-z0-9]{2,5}$/i

type Report = {
  captured: number
  recovered: number
  failed: Array<{ path: string; reason: string }>
}

/** Ecrit une page a l'emplacement correspondant a son adresse. */
const writePage = async (outDir: string, path: string, html: string): Promise<void> => {
  const target = filePathFor(outDir, path)
  await mkdir(dirname(target), { recursive: true })
  await writeFile(target, html, 'utf-8')
}

/** Indique si un chemin doit etre parcouru. */
const isCapturable = (path: string): boolean =>
  path.startsWith('/') && !ASSET_EXTENSION.test(path) && !EXCLUDED.some((rule) => rule.test(path))

/** Normalise un chemin : sans ancre, sans parametres, sans slash final. */
const normalize = (path: string): string => {
  const clean = path.split('#')[0]?.split('?')[0] ?? ''
  return clean.length > 1 ? clean.replace(/\/$/, '') : clean
}

/** Extrait les chemins internes references par une page. */
const extractLinks = (html: string, baseUrl: string): string[] => {
  const links: string[] = []

  for (const match of html.matchAll(/href="([^"]+)"/g)) {
    const raw = match[1]
    if (!raw) continue

    const path = raw.startsWith(baseUrl) ? raw.slice(baseUrl.length) : raw
    if (!path.startsWith('/')) continue

    const normalized = normalize(path)
    if (isCapturable(normalized)) links.push(normalized)
  }

  return links
}

/**
 * Amorce le parcours avec les adresses declarees par la source du sitemap.
 *
 * Celle-ci n'expose que la langue par defaut : chaque adresse est declinee dans
 * les autres langues. Une declinaison invalide se soldera par un echec rapporte,
 * ce qui reste preferable a une page absente du livrable.
 *
 * @param baseUrl Racine du serveur interroge.
 * @returns Les chemins a parcourir, sans doublon.
 */
const seedFromSitemap = async (baseUrl: string): Promise<string[]> => {
  try {
    const response = await fetch(`${baseUrl}${SITEMAP_SOURCE}`)
    if (!response.ok) return []

    const entries = (await response.json()) as Array<{ loc?: unknown }>
    const paths = new Set<string>()
    const sampledGroups = new Set<string>()

    for (const entry of entries) {
      if (typeof entry.loc !== 'string') continue

      const normalized = normalize(entry.loc)
      const withoutLocale = normalized.replace(/^\/[a-z]{2}(?=\/|$)/, '')

      // Une seule fiche retenue par annonce et categorie.
      const sheet = PROPERTY_SHEET.exec(normalized)
      if (sheet) {
        const group = `${sheet[1]}/${sheet[2]}`
        if (sampledGroups.has(group)) continue
        sampledGroups.add(group)
      }

      for (const locale of LOCALES) {
        const candidate = `/${locale}${withoutLocale}`
        if (isCapturable(candidate)) paths.add(candidate)
      }
    }

    return [...paths]
  } catch {
    // Source indisponible : le parcours par liens reste possible.
    return []
  }
}

/** Chemin de fichier correspondant a une adresse. */
const filePathFor = (outDir: string, path: string): string =>
  join(outDir, path === '/' ? 'index.html' : `${path.replace(/^\//, '')}/index.html`)

const main = async (): Promise<void> => {
  const [baseUrl, outDir, fallbackUrl] = process.argv.slice(2)

  if (!baseUrl || !outDir) {
    console.error('Usage : bun scripts/build/capture-pages.ts <base_url> <dossier_sortie>')
    process.exit(1)
  }

  const queue = [...ENTRY_PATHS, ...(await seedFromSitemap(baseUrl))]
  const seen = new Set(queue)
  const report: Report = { captured: 0, recovered: 0, failed: [] }

  while (queue.length > 0) {
    const path = queue.shift()
    if (!path) break

    try {
      const response = await fetch(`${baseUrl}${path}`, { redirect: 'follow' })

      if (!response.ok) {
        report.failed.push({ path, reason: `HTTP ${response.status}` })
        continue
      }

      const html = await response.text()
      await writePage(outDir, path, html)
      report.captured += 1

      for (const link of extractLinks(html, baseUrl)) {
        if (seen.has(link)) continue
        seen.add(link)
        queue.push(link)
      }
    } catch (error) {
      report.failed.push({ path, reason: error instanceof Error ? error.message : String(error) })
    }
  }

  // Reprise des echecs sur le serveur de repli, en mode de rendu normal.
  if (fallbackUrl && report.failed.length > 0) {
    const pending = [...report.failed]
    report.failed = []

    for (const { path, reason } of pending) {
      try {
        const response = await fetch(`${fallbackUrl}${path}`, { redirect: 'follow' })
        if (!response.ok) {
          report.failed.push({ path, reason: `${reason}, repli HTTP ${response.status}` })
          continue
        }

        await writePage(outDir, path, await response.text())
        report.recovered += 1
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error)
        report.failed.push({ path, reason: `${reason}, repli ${detail}` })
      }
    }
  }

  console.warn(
    `[capture] ${report.captured} pages capturees` +
      (report.recovered > 0 ? ` | ${report.recovered} reprises en mode degrade` : ''),
  )

  if (report.failed.length > 0) {
    console.warn(`[capture] ${report.failed.length} echecs :`)
    for (const { path, reason } of report.failed.slice(0, 10)) {
      console.warn(`  ${path} — ${reason}`)
    }
  }
}

await main()
