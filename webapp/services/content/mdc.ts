import YAML from 'yaml'

/**
 * Représente un bloc MDC minimal extrait du corps d'une page.
 *
 * Ce type ne cherche pas à refléter tout le runtime `@nuxtjs/mdc`, mais uniquement
 * le sous-ensemble utile au projet : nom du bloc, props de frontmatter et corps brut.
 */
export type MdcBodyComponent = {
  tag: string
  props: Record<string, unknown>
  body: string
}

// Capture les blocs `::nom-du-bloc ... ::` avec frontmatter YAML optionnel.
// Le motif reste volontairement strict afin de privilégier un format stable,
// contrôlé par le backoffice, plutôt qu'une compatibilité MDC exhaustive.
const BLOCK_PATTERN =
  /^::(?<tag>[a-zA-Z0-9_-]+)\s*\r?\n(?:(?:---\s*\r?\n)(?<frontmatter>[\s\S]*?)(?:\r?\n---)\s*\r?\n)?(?<body>[\s\S]*?)(?:\r?\n)?::\s*$/gm

/**
 * Parse le frontmatter YAML d'un bloc MDC en restant tolérant aux entrées vides.
 *
 * Le parseur ne lève pas d'exception ici : un frontmatter absent ou non objet
 * produit simplement un objet vide afin de garder un comportement prévisible dans
 * les services appelants.
 *
 * @param raw Chaîne YAML brute capturée dans un bloc MDC.
 * @returns Objet simple exploitable comme dictionnaire de props.
 */
const parseFrontmatter = (raw: string): Record<string, unknown> => {
  if (!raw.trim()) {
    return {}
  }

  const parsed = YAML.parse(raw)
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {}
  }

  return parsed as Record<string, unknown>
}

/**
 * Extrait les blocs de composants déclarés dans un corps Markdown/MDC.
 *
 * Cette fonction sert de parseur synchrone maison pour le format réellement utilisé
 * par le projet. Elle privilégie :
 * - une exécution déterministe dans les getters/store
 * - un sous-ensemble stable de syntaxe
 * - une tolérance aux corps vides
 *
 * @param body Corps brut d'une page contenant éventuellement des blocs `::...`.
 * @returns Liste ordonnée des blocs détectés dans le contenu.
 *
 * @example
 * const components = extractBodyComponents(body)
 * const first = components[0]?.props
 */
export const extractBodyComponents = (body: string): MdcBodyComponent[] => {
  if (!body.trim()) {
    return []
  }

  const components: MdcBodyComponent[] = []

  for (const match of body.matchAll(BLOCK_PATTERN)) {
    const tag = match.groups?.tag?.trim()
    if (!tag) {
      continue
    }

    components.push({
      tag,
      props: parseFrontmatter(match.groups?.frontmatter ?? ''),
      body: (match.groups?.body ?? '').trim(),
    })
  }

  return components
}

/**
 * Indexe les composants d'un corps MDC par leur `slug`.
 *
 * Seuls les blocs exposant un `slug` string non vide sont retenus. Ce helper est
 * destiné aux usages où l'UI doit retrouver rapidement un bloc métier à partir
 * d'un identifiant stable (ex: variante de landing, section adressable).
 *
 * @param body Corps brut d'une page.
 * @returns Dictionnaire `slug -> props` prêt à être consommé par l'application.
 */
export const extractBodyComponentsBySlug = (
  body: string,
): Record<string, Record<string, unknown>> => {
  const components = extractBodyComponents(body)

  return components.reduce<Record<string, Record<string, unknown>>>((accumulator, component) => {
    const slug = component.props.slug
    if (typeof slug === 'string' && slug.length > 0) {
      accumulator[slug] = component.props
    }
    return accumulator
  }, {})
}
