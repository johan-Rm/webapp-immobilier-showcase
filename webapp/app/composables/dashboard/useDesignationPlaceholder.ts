import type { Ref } from 'vue'

/**
 * Contrat du placeholder rotatif de la désignation.
 */
interface UseDesignationPlaceholderOptions {
  /** Libellé du lieu sélectionné ('' si aucun) — alimente les suggestions contextuelles. */
  placeLabel: Ref<string>
  /** La rotation ne tourne que lorsque ce ref est vrai (étape visible, pas de saisie). */
  active: Ref<boolean>
  /** Intervalle de rotation en ms (défaut 2800). */
  intervalMs?: number
}

const DEFAULT_INTERVAL_MS = 2800

// Suggestions génériques tant qu'aucun lieu n'est choisi.
const GENERIC_SUGGESTIONS = [
  'Riad lumineux au cœur de la médina',
  'Villa contemporaine avec piscine',
  'Appartement vue mer, Nouvelle Ville',
  'Maison de campagne et oliveraie',
  'Local commercial proche Bab Marrakech',
  'Terrain constructible, route d’Agadir',
] as const

// Gabarits contextualisés avec le lieu choisi ({lieu}).
const CONTEXTUAL_TEMPLATES = [
  'Riad de charme à {lieu}',
  'Bel appartement à {lieu}',
  'Maison lumineuse, {lieu}',
  'Villa avec jardin proche de {lieu}',
] as const

/**
 * Construit la liste de suggestions selon le lieu. Pur, isolé pour être testable sans DOM.
 */
export const buildDesignationSuggestions = (placeLabel: string): string[] => {
  const trimmed = placeLabel.trim()
  if (!trimmed) return [...GENERIC_SUGGESTIONS]
  return CONTEXTUAL_TEMPLATES.map((template) => template.replace('{lieu}', trimmed))
}

/**
 * Placeholder rotatif et contextuel pour le champ désignation du creator.
 *
 * Fait défiler des exemples (fondu géré côté CSS via le simple changement de valeur),
 * en tissant le libellé du lieu choisi quand il existe. SSR-safe (timer client uniquement,
 * libéré au démontage) et respecte `prefers-reduced-motion` (pas de rotation).
 */
export const useDesignationPlaceholder = (
  options: UseDesignationPlaceholderOptions,
): { placeholder: Ref<string> } => {
  const { placeLabel, active } = options
  const intervalMs = options.intervalMs ?? DEFAULT_INTERVAL_MS

  const index = ref(0)
  const suggestions = computed<string[]>(() => buildDesignationSuggestions(placeLabel.value))
  const placeholder = computed<string>(
    () => suggestions.value[index.value] ?? suggestions.value[0] ?? '',
  )

  let timer: ReturnType<typeof setInterval> | null = null

  const prefersReducedMotion = (): boolean =>
    import.meta.client && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const stop = (): void => {
    if (timer !== null) {
      clearInterval(timer)
      timer = null
    }
  }

  const start = (): void => {
    stop()
    if (!import.meta.client || prefersReducedMotion() || suggestions.value.length <= 1) return
    timer = setInterval(() => {
      index.value = (index.value + 1) % suggestions.value.length
    }, intervalMs)
  }

  watch(active, (isActive) => (isActive ? start() : stop()))

  // Lieu modifié : repartir du premier exemple et relancer si actif.
  watch(suggestions, () => {
    index.value = 0
    if (active.value) start()
  })

  onMounted(() => {
    if (active.value) start()
  })

  onUnmounted(stop)

  return { placeholder }
}
