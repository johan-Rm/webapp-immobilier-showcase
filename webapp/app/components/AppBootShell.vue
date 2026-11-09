<template>
  <div
    class="bg-background fixed inset-0 flex w-screen items-center justify-center text-center transition-opacity duration-500 ease-out"
    :class="isLandingShellVisible ? 'z-100 opacity-100' : 'pointer-events-none z-100 opacity-0'"
    role="status"
    aria-live="polite"
    aria-busy="true"
    :aria-label="props.ariaLabel"
  >
    <LogoShowcaseFull
      class="-mt-24 transition-opacity duration-500 ease-out md:mt-0"
      :class="isLandingShellVisible ? 'opacity-100' : 'opacity-0'"
      size="5xl"
      :force-visible="true"
      :color-class="props.logoColorClass"
      :aria-label="props.logoAriaLabel"
    />
  </div>
</template>

<script setup lang="ts">
// 2. Types et constantes statiques

// Doit correspondre à la durée `duration-500` de la transition CSS de sortie.
const LANDING_SHELL_EXIT_DURATION_MS = 500
// Filet de sécurité : si l'init ou l'image hero n'aboutissent jamais (API en panne,
// requête suspendue), le shell se retire au lieu de masquer le site indéfiniment.
const LANDING_SHELL_FAILSAFE_MS = 8000

// 3. Props et emits
// Doit rester un sous-ensemble de LogoColorClass (LogoShowcaseFull).
type BootShellLogoColorClass = 'text-foreground/90' | 'text-white/90' | 'text-surface'

const props = withDefaults(
  defineProps<{
    ariaLabel?: string
    logoAriaLabel?: string
    logoColorClass?: BootShellLogoColorClass
  }>(),
  {
    ariaLabel: 'Chargement initial de l application',
    logoAriaLabel: 'Showcase Immobilier',
    logoColorClass: 'text-surface',
  },
)

// 4. Composables, stores, routeur

const logger = useLogger({ module: 'app-boot-shell' })
const { isLandingShellVisible } = useApp()
const { initCoreDataStatus, isInitCoreDataReady } = useNuxtServerInit()

// 5. Etat local

// Référence au timer de complétion : permet d'annuler le délai si l'état redevient visible.
let completionTimer: ReturnType<typeof setTimeout> | null = null
// Timer du filet de sécurité : force la complétion si le boot ne se termine jamais.
let failsafeTimer: ReturnType<typeof setTimeout> | null = null
// Partagé avec app.vue via useState : signal de fin de vie du shell pour la session courante.
const hasLandingShellCompleted = useState<boolean>('app.boot-shell.completed', () => false)
// Accès direct pour le logging : même clé que FullImage.vue.
const isHeroImageReady = useState<boolean>('screen.real-estate-full-image.hero-ready', () => false)

// 8. Computed UI-ready

// 10. Watch et watchEffect

// Orchestre le cycle de vie du shell.
// Quand isLandingShellVisible passe à false, démarre un timer égal à la durée
// de la transition CSS avant de signaler la complétion à app.vue (démontage du v-if).
// Le double-check (nextTick + vérification finale) évite de déclencher la complétion
// sur des oscillations rapides de l'état.
watch(
  isLandingShellVisible,
  async (visible) => {
    // Protège l'accès au DOM et aux timers : client-only.
    // Requis pour la compatibilité SSR (et évite un log par requête serveur).
    if (import.meta.server) return

    logger.info('boot-shell:visibility-change', {
      visible,
      isHeroImageReady: isHeroImageReady.value,
      isInitCoreDataReady: isInitCoreDataReady.value,
      initCoreDataStatus: initCoreDataStatus.value,
      hasLandingShellCompleted: hasLandingShellCompleted.value,
    })

    if (completionTimer) {
      clearTimeout(completionTimer)
      completionTimer = null
    }

    // Pas de complétion si le shell est encore visible ou si l'init n'est pas terminée.
    if (visible || initCoreDataStatus.value === 'loading') return

    await nextTick()

    if (!isLandingShellVisible.value) {
      completionTimer = setTimeout(() => {
        // Vérification finale : annule si l'état est redevenu visible pendant le délai.
        if (!isLandingShellVisible.value) {
          logger.info('boot-shell:completed', {
            isHeroImageReady: isHeroImageReady.value,
          })
          hasLandingShellCompleted.value = true
        }

        completionTimer = null
      }, LANDING_SHELL_EXIT_DURATION_MS)
    }
  },
  { immediate: true },
)

// 12. Lifecycle

onMounted(() => {
  failsafeTimer = setTimeout(() => {
    failsafeTimer = null
    if (hasLandingShellCompleted.value) return

    logger.warn('boot-shell:failsafe-triggered', {
      isHeroImageReady: isHeroImageReady.value,
      initCoreDataStatus: initCoreDataStatus.value,
    })
    hasLandingShellCompleted.value = true
  }, LANDING_SHELL_FAILSAFE_MS)
})

onUnmounted(() => {
  // Nettoyage défensif : évite une mise à jour de state sur un composant démonté.
  if (completionTimer) {
    clearTimeout(completionTimer)
    completionTimer = null
  }
  if (failsafeTimer) {
    clearTimeout(failsafeTimer)
    failsafeTimer = null
  }
})
</script>
