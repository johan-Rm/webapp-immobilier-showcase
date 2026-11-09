<template>
  <!-- Logo cliquable vers l’accueil -->
  <a
    v-show="effectiveVisible"
    :href="homePath"
    class="inline-flex items-center justify-center"
    :aria-label="logoAriaLabel"
  >
    <!-- Le SVG hérite de la couleur via currentColor -->
    <LogoSvg class="w-auto max-w-[85vw]" :class="[colorClass, logoSizeClass]" />
  </a>
</template>

<script setup lang="ts">
// 1. Imports
import LogoSvg from '~/assets/logo/showcase-full.svg'

// 2. Types et constantes statiques
/**
 * Tailles prédéfinies du logo
 */
type PresetSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl'

/**
 * Couleurs autorisées (strictement 3)
 */
const DEFAULT_COLOR_CLASS = 'text-foreground/90'

const CONTRAST_COLOR_CLASS = 'text-white/90'

// 'text-surface' : utilisée par AppBootShell, logo sur le fond plein du shell de démarrage.
// Littéral inline : cette couleur n'a pas d'usage runtime dans ce composant.
type LogoColorClass = typeof DEFAULT_COLOR_CLASS | typeof CONTRAST_COLOR_CLASS | 'text-surface'

// 3. Props et emits
/**
 * Props du composant
 * - colorClass : permet de forcer la couleur du logo
 */
const props = withDefaults(
  defineProps<{
    colorClass?: LogoColorClass
    size?: PresetSize
    forceVisible?: boolean
    ariaLabel?: string
    to?: string
  }>(),
  {
    colorClass: undefined,
    size: 'lg',
    forceVisible: false,
    ariaLabel: undefined,
    to: '/',
  },
)

// 4. Composables, stores, routeur
const { appData } = useApp()
/**
 * Composables
 */
const { currentMeta } = useScreenSystem()

const localePath = useLocalePath()

// 5. Etat local

// 6. Data inputs
/**
 * Lien vers l’accueil (localisé)
 */
const homePath = computed<string>(() => localePath('/'))

/**
 * Dernière visibilité explicite issue du screen meta
 */
const latestExplicitVisible = ref<boolean>(false)

/**
 * Dernière couleur effective utilisée
 * (persistée tant qu’aucune prop ne force la couleur)
 */
const latestEffectiveColorClass = ref<LogoColorClass>(DEFAULT_COLOR_CLASS)

/**
 * Gestion de la taille du logo
 */
const logoSizeClass = computed<string>(() => {
  switch (props.size) {
    case 'xs':
      return 'h-6 sm:h-7 md:h-8 lg:h-9 xl:h-10 2xl:h-12'
    case 'sm':
      return 'h-8 sm:h-9 md:h-10 lg:h-11 xl:h-12 2xl:h-14'
    case 'md':
      return 'h-10 sm:h-11 md:h-12 lg:h-14 xl:h-16 2xl:h-20'
    case 'xl':
      return 'h-16 sm:h-20 md:h-24 lg:h-28 xl:h-32 2xl:h-40'
    case '2xl':
      return 'h-20 sm:h-24 md:h-28 lg:h-32 xl:h-40 2xl:h-48'
    case '3xl':
      return 'h-24 sm:h-28 md:h-32 lg:h-36 xl:h-44 2xl:h-52'
    case '4xl':
      return 'h-28 sm:h-32 md:h-36 lg:h-40 xl:h-48 2xl:h-56'
    case '5xl':
      return 'h-36 sm:h-40 md:h-48 lg:h-56 xl:h-64 2xl:h-80'
    case 'lg':
    default:
      return 'h-16 lg:h-20 xl:h-24 2xl:h-38'
  }
})

/**
 * Visibilité effective :
 * - forçable via props
 * - toujours visible en sortie statique : la visibilité est normalement pilotée
 *   par l'écran actif du parcours, notion qui n'existe pas sans script et qui
 *   laisserait le logo masqué dans le livrable
 * - sinon pilotée par le screen meta
 */
const isStaticOutput = useRuntimeConfig().public.staticOutput === true

const effectiveVisible = computed<boolean>(() => {
  return isStaticOutput || props.forceVisible || latestExplicitVisible.value
})

/**
 * Détermine la couleur selon le contexte visuel
 */
const resolveContextualColorClass = (imageZone?: string): LogoColorClass => {
  return imageZone === 'background' || imageZone === 'left'
    ? CONTRAST_COLOR_CLASS
    : DEFAULT_COLOR_CLASS
}

/**
 * Couleur finale appliquée :
 * priorité :
 * 1. props.colorClass
 * 2. dernière couleur effective
 */
const colorClass = computed<LogoColorClass>(() => {
  if (props.colorClass) return props.colorClass

  // Sortie statique : la couleur est normalement memorisee par un observateur
  // qui ne s'execute pas au rendu serveur, et l'en-tete est rendu avant que les
  // ecrans n'aient declare leur contexte visuel. On retient la couleur de
  // contraste, les ecrans du site presentant des fonds photographiques.
  if (isStaticOutput) {
    return resolveContextualColorClass(currentMeta.value?.layout?.imageZone ?? 'background')
  }

  return latestEffectiveColorClass.value
})

/**
 * Synchronisation de la visibilité depuis le screen meta
 */
watch(
  () => currentMeta.value?.logo?.visible,
  (visible) => {
    if (typeof visible !== 'boolean') return
    latestExplicitVisible.value = visible
  },
  { immediate: true },
)

/**
 * Mise à jour de la couleur depuis le screen meta
 * uniquement si aucune couleur n’est forcée via props
 */
watch(
  () => currentMeta.value,
  (meta) => {
    if (!meta) return
    if (props.colorClass) return

    latestEffectiveColorClass.value = resolveContextualColorClass(meta.layout?.imageZone)
  },
  { immediate: true },
)

// 7. Validation et helpers purs

// 8. Computed UI-ready
const logoAriaLabel = computed(() => props.ariaLabel ?? appData.value?.components?.logo?.ariaLabel)

// 9. Actions et handlers

// 10. Watch et watchEffect

// 11. Metadonnees ecran ou page

// 12. Lifecycle
</script>
