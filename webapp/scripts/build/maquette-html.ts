/**
 * Post-traitement d'une sortie statique en maquette HTML autonome.
 *
 * Transforme un dossier produit par le build en pages ouvrables directement
 * dans un navigateur, sans serveur (protocole `file://`) :
 *
 * 1. Les adresses du transformateur d'images serveur (`/_ipx/<params>/…`) sont
 *    rabattues sur le fichier d'origine, qui est présent dans la sortie.
 * 2. Les scripts et leurs préchargements sont retirés : la maquette est figée,
 *    et un navigateur refuse de charger des modules depuis un fichier local.
 * 3. Les chemins absolus sont réécrits en relatif, faute de racine en `file://`.
 * 4. Les liens de navigation pointent vers le fichier `index.html` réel.
 *
 * Usage : bun scripts/build/maquette-html.ts <dossier> [--dry-run]
 */
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join, relative, dirname, resolve, sep } from 'node:path'

/** Attributs porteurs d'une adresse à réécrire. */
const URL_ATTRIBUTES = ['href', 'src', 'content', 'data-src'] as const

/** Extensions considérées comme des fichiers et non des routes. */
const FILE_EXTENSION = /\.[a-z0-9]{2,5}$/i

type Stats = {
  files: number
  ipx: number
  scripts: number
  paths: number
  shells: number
  themes: number
  styles: number
  templates: number
}

/** Liste récursivement les fichiers HTML d'un dossier. */
const listHtmlFiles = async (root: string): Promise<string[]> => {
  const entries = await readdir(root, { withFileTypes: true })
  const found: string[] = []

  for (const entry of entries) {
    const path = join(root, entry.name)
    if (entry.isDirectory()) {
      found.push(...(await listHtmlFiles(path)))
      continue
    }
    if (entry.name.endsWith('.html')) found.push(path)
  }

  return found
}

/** Préfixe relatif permettant de remonter à la racine depuis un fichier. */
const relativePrefix = (root: string, file: string): string => {
  const depth = relative(root, dirname(file)).split(sep).filter(Boolean).length
  return depth === 0 ? './' : '../'.repeat(depth)
}

/**
 * Convertit une adresse absolue en adresse relative exploitable en `file://`.
 *
 * Une adresse sans extension désigne une route : elle est complétée par le
 * fichier `index.html` réellement présent sur le disque.
 */
const toRelative = (url: string, prefix: string): string => {
  const [path, hash] = url.split('#')
  const clean = (path ?? '').replace(/^\//, '')
  if (!clean) return `${prefix}index.html${hash ? `#${hash}` : ''}`

  const target = FILE_EXTENSION.test(clean) ? clean : `${clean.replace(/\/$/, '')}/index.html`
  return `${prefix}${target}${hash ? `#${hash}` : ''}`
}

/**
 * Retire un element `<div>` et l'integralite de son contenu imbrique.
 *
 * Une expression reguliere ne peut pas apparier des balises imbriquees : on
 * compte les ouvertures et fermetures a partir de la balise reperee.
 *
 * @param html Document a nettoyer.
 * @param marker Fragment identifiant la balise ouvrante ciblee.
 * @returns Le document prive de l'element, ou inchange si le marqueur est absent.
 */
const removeElement = (html: string, marker: string): string => {
  const markerIndex = html.indexOf(marker)
  if (markerIndex === -1) return html

  const start = html.lastIndexOf('<div', markerIndex)
  if (start === -1) return html

  const tag = /<\/?div\b/g
  tag.lastIndex = start
  let depth = 0

  for (let match = tag.exec(html); match; match = tag.exec(html)) {
    depth += match[0].startsWith('</') ? -1 : 1
    if (depth === 0) {
      const end = html.indexOf('>', match.index)
      return html.slice(0, start) + html.slice(end + 1)
    }
  }

  return html
}

/** Feuilles de style deja lues et preparees, indexees par chemin absolu. */
const styleCache = new Map<string, string>()

/**
 * Remplace les polices referencees par une feuille de style par leur contenu.
 *
 * Les polices sont soumises a la meme regle d'origine que les feuilles : une
 * fois la feuille integree dans la page, un chemin relatif ne resoudrait plus.
 *
 * @param css Contenu de la feuille de style.
 * @param cssDir Dossier d'origine de la feuille, pour resoudre les chemins.
 * @returns La feuille dont les polices sont integrees.
 */
const inlineFonts = async (css: string, cssDir: string): Promise<string> => {
  const references = [...css.matchAll(/url\((["']?)([^)"']+\.woff2?)\1\)/g)]
  let out = css

  for (const [match, , fontPath] of references) {
    if (!fontPath || fontPath.startsWith('data:') || fontPath.startsWith('http')) continue

    try {
      const buffer = await readFile(resolve(cssDir, fontPath))
      const type = fontPath.endsWith('.woff2') ? 'font/woff2' : 'font/woff'
      out = out.replace(match, `url(data:${type};base64,${buffer.toString('base64')})`)
    } catch {
      // Police introuvable : la feuille reste utilisable avec ses polices de repli.
    }
  }

  return out
}

/**
 * Lit une feuille de style et integre ses polices, avec mise en cache.
 *
 * @param stylePath Chemin absolu de la feuille.
 * @returns Le contenu prepare, ou `null` si la feuille est introuvable.
 */
const readStyle = async (stylePath: string): Promise<string | null> => {
  const cached = styleCache.get(stylePath)
  if (cached !== undefined) return cached

  try {
    const prepared = await inlineFonts(await readFile(stylePath, 'utf-8'), dirname(stylePath))
    styleCache.set(stylePath, prepared)
    return prepared
  } catch {
    return null
  }
}

/**
 * Remplace chaque feuille de style liee par son contenu, dans la page.
 *
 * @param html Document a traiter.
 * @param fileDir Dossier de la page, pour resoudre les chemins relatifs.
 * @param stats Compteurs mis a jour au passage.
 * @returns Le document dont les styles sont integres.
 */
const inlineStyles = async (html: string, fileDir: string, stats: Stats): Promise<string> => {
  const links = [...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*>/gi)]
  let out = html

  for (const [tag] of links) {
    const href = /href="([^"]+)"/.exec(tag)?.[1]
    if (!href || href.startsWith('http') || href.startsWith('data:')) continue

    const css = await readStyle(resolve(fileDir, href))
    if (css === null) continue

    out = out.replace(tag, `<style data-inlined="${href}">${css}</style>`)
    stats.styles += 1
  }

  return out
}

/**
 * Feuille de style propre a la maquette figee.
 *
 * Le site vivant revele chaque ecran en lui posant `data-screen-active`. Sans
 * script, aucun ecran n'est actif et la page reste vide. On les rend donc tous
 * visibles et on les remet en flux vertical, faute de quoi leur positionnement
 * absolu les superposerait.
 */
const MAQUETTE_STYLE = `<style data-maquette>
html,body{height:auto!important;overflow:visible!important}
#__nuxt,#__nuxt>div{height:auto!important;overflow:visible!important}
main{height:auto!important;overflow:visible!important}
/* Le conteneur de page, mais pas les panneaux en position fixe (menu ouvert),
   qui tirent leur hauteur de leur ancrage et non du flux. */
.h-dvh.w-screen.overflow-hidden:not(.fixed){height:auto!important;overflow:visible!important}
.page-ui-root{height:auto!important}
/* Hauteur reelle et non automatique : les visuels sont places en hauteur 100%
   de leur parent, et 100% d'une hauteur automatique vaut zero. */
.page-section-ui-root{position:relative!important;inset:auto!important;opacity:1!important;transform:none!important;pointer-events:auto!important;height:100vh!important;min-height:100vh!important}
.page-section-ui-container,.screen-property-list{height:100%!important;overflow:visible!important}
/* Rail du parcours : sa transformation, pilotee par script, redefinit le
   referentiel des elements ancres a la fenetre, qui se retrouvent hors champ.
   Il aligne aussi les ecrans horizontalement ; on les empile pour un defilement. */
.screen-track{transform:none!important;flex-direction:column!important}
</style>`

/** Classe de theme attendue par la feuille de style, cf. `colorMode.preference`. */
const THEME_CLASS = 'light'

/**
 * Pose la classe de theme sur `<html>` et fixe le schema de couleurs.
 *
 * @param html Document a modifier.
 * @param stats Compteurs mis a jour au passage.
 * @returns Le document dont la balise racine porte le theme clair.
 */
const applyTheme = (html: string, stats: Stats): string =>
  html.replace(/<html\b([^>]*)>/i, (match, attributes: string) => {
    if (new RegExp(`class="[^"]*\\b${THEME_CLASS}\\b`).test(attributes)) return match

    stats.themes += 1
    const withClass = /class="[^"]*"/.test(attributes)
      ? attributes.replace(
          /class="([^"]*)"/,
          (_m, value: string) => `class="${[value.trim(), THEME_CLASS].filter(Boolean).join(' ')}"`,
        )
      : `${attributes} class="${THEME_CLASS}"`

    return `<html${withClass} style="color-scheme: ${THEME_CLASS}">`
  })

/** Applique les transformations à une page. */
const transform = async (
  html: string,
  prefix: string,
  fileDir: string,
  stats: Stats,
): Promise<string> => {
  let out = html

  // 1. Images : `/_ipx/<params>/images/x.jpg` → `/images/x.jpg`
  out = out.replace(/\/_ipx\/[^/"'\s]+\//g, () => {
    stats.ipx += 1
    return '/'
  })

  // 2. Ecran de demarrage : plus aucun script ne peut l'effacer.
  const withoutShell = removeElement(out, 'aria-busy="true"')
  if (withoutShell !== out) stats.shells += 1
  out = withoutShell

  // 3. Scripts et préchargements de modules ou de données.
  out = out.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, () => {
    stats.scripts += 1
    return ''
  })
  out = out.replace(/<link\b[^>]*rel="(?:modulepreload|prefetch)"[^>]*>/gi, '')
  out = out.replace(/<link\b[^>]*as="fetch"[^>]*>/gi, '')

  // 3. et 4. Adresses absolues → relatives, routes → fichier index.html.
  for (const attribute of URL_ATTRIBUTES) {
    const pattern = new RegExp(`(${attribute}=")(/[^"]*)"`, 'g')
    out = out.replace(pattern, (_match, head: string, url: string) => {
      stats.paths += 1
      return `${head}${toRelative(url, prefix)}"`
    })
  }

  // `srcset` porte plusieurs adresses séparées par des virgules.
  out = out.replace(/srcset="([^"]+)"/g, (_match, value: string) => {
    const rewritten = value
      .split(',')
      .map((candidate) => {
        const [url, ...rest] = candidate.trim().split(/\s+/)
        if (!url?.startsWith('/')) return candidate.trim()
        stats.paths += 1
        return [toRelative(url, prefix), ...rest].join(' ')
      })
      .join(', ')
    return `srcset="${rewritten}"`
  })

  // 6. Theme clair pose en dur.
  out = applyTheme(out, stats)

  // 7. Enveloppes inertes retirees, leur contenu conserve.
  const templates = out.match(/<\/?template[^>]*>/gi)
  if (templates) {
    stats.templates += templates.length / 2
    out = out.replace(/<\/?template[^>]*>/gi, '')
  }

  // 8. Feuilles de style et polices integrees dans la page.
  out = await inlineStyles(out, fileDir, stats)

  // 8. Revelation des ecrans du parcours.
  if (!out.includes('data-maquette')) {
    out = out.replace('</head>', `${MAQUETTE_STYLE}</head>`)
  }

  return out
}

const main = async (): Promise<void> => {
  const root = process.argv[2]
  const isDryRun = process.argv.includes('--dry-run')

  if (!root) {
    console.error('Usage : bun scripts/build/maquette-html.ts <dossier> [--dry-run]')
    process.exit(1)
  }

  const files = await listHtmlFiles(root)
  const stats: Stats = {
    files: 0,
    ipx: 0,
    scripts: 0,
    paths: 0,
    shells: 0,
    themes: 0,
    styles: 0,
    templates: 0,
  }

  for (const file of files) {
    const html = await readFile(file, 'utf-8')
    const out = await transform(html, relativePrefix(root, file), dirname(file), stats)
    if (!isDryRun) await writeFile(file, out, 'utf-8')
    stats.files += 1
  }

  console.warn(
    `[maquette] ${stats.files} pages | ${stats.ipx} images rabattues | ` +
      `${stats.scripts} scripts retires | ${stats.shells} ecrans de demarrage retires | ` +
      `${stats.paths} chemins relativises | ${stats.themes} themes poses | ` +
      `${stats.styles} feuilles integrees | ${stats.templates} enveloppes retirees` +
      (isDryRun ? ' (simulation)' : ''),
  )
}

await main()
