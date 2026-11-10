<template>
  <div ref="rootElement" :class="rootClass">
    <nav
      v-if="shouldRenderDesktopList"
      class="flex flex-col items-center gap-3 2xl:gap-4"
      :aria-label="navAriaLabel"
    >
      <ul class="flex flex-col items-center gap-3 2xl:gap-4">
        <li v-for="link in orderedSocialLinks" :key="link.to">
          <LazyULink
            :to="link.to"
            :external="link.target === '_blank'"
            :target="link.target"
            :aria-label="link['aria-label']"
            :rel="link.target === '_blank' ? 'noopener noreferrer' : undefined"
            class="group relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-2xl text-white/90 backdrop-blur-md transition hover:text-white 2xl:h-20 2xl:w-20"
            :class="[buttonBgClass, getToneButtonClass(link)]"
          >
            <LazyUIcon :name="link.icon" class="text-2xl 2xl:text-5xl" />
          </LazyULink>
        </li>
      </ul>
    </nav>

    <div v-else-if="shouldRenderMobileToggle" class="flex flex-col items-center gap-2">
      <Transition name="social-network-actions">
        <nav v-if="isMenuOpen" :id="mobileMenuId" class="order-2" :aria-label="navAriaLabel">
          <ul class="flex items-center justify-center gap-2 px-3 py-2">
            <li v-for="link in orderedSocialLinks" :key="link.to">
              <LazyULink
                :to="link.to"
                :external="link.target === '_blank'"
                :target="link.target"
                :aria-label="link['aria-label']"
                :rel="link.target === '_blank' ? 'noopener noreferrer' : undefined"
                class="shadow-foreground/20 bg-foreground/80 flex h-11 w-11 cursor-pointer items-center justify-center rounded-2xl text-white/95 shadow-lg backdrop-blur-md transition hover:text-white"
                :class="[buttonBgClass, getToneButtonClass(link)]"
                @click="closeMenu"
              >
                <LazyUIcon :name="link.icon" class="text-2xl" />
                <span class="sr-only">{{ link['aria-label'] }}</span>
              </LazyULink>
            </li>
          </ul>
        </nav>
      </Transition>

      <LazyUButton
        type="button"
        color="neutral"
        variant="ghost"
        class="order-1 -mt-px flex min-h-0 cursor-pointer items-end justify-center rounded-b-full bg-black/14 px-3 pt-1 pb-1.5 text-white/88 shadow-lg shadow-black/10 backdrop-blur-md transition-colors hover:bg-black/18 hover:text-white"
        :aria-controls="mobileMenuId"
        :aria-expanded="isMenuOpen"
        :aria-label="toggleButtonAriaLabel"
        @click="toggleMenu"
      >
        <LazyUIcon :name="isMenuOpen ? 'i-lucide-x' : 'i-lucide-share-2'" class="text-2xl" />
      </LazyUButton>
    </div>
  </div>
</template>

<script setup lang="ts">
// 1. Imports

// 2. Types et constantes statiques
type SocialNetworkBackgroundTone = 'white' | 'black'

type SocialLink = AppFooterSocialLink

const MOBILE_BREAKPOINT_MAX_WIDTH = 767

const DESKTOP_SSR_WIDTH = 1280

// 3. Props et emits
const props = defineProps<{
  backgroundTone?: SocialNetworkBackgroundTone
}>()

// 4. Composables, stores, routeur
const { appData } = useApp()

const { footer } = useAppFooter()

const { currentMeta } = useScreenSystem()

const route = useRoute()

const mobileMenuId = useId()

const isMobile = useMediaQuery(`(max-width: ${MOBILE_BREAKPOINT_MAX_WIDTH}px)`, {
  ssrWidth: DESKTOP_SSR_WIDTH,
})

// 5. Etat local
const isMenuOpen = ref(false)

// 6. Data inputs
const rootElement = ref<HTMLElement | null>(null)

onClickOutside(rootElement, () => {
  if (isMenuOpen.value) {
    closeMenu()
  }
})

onKeyStroke('Escape', () => {
  if (isMenuOpen.value) {
    closeMenu()
  }
})

// 7. Validation et helpers purs
const getToneButtonClass = (link: SocialLink): string | undefined => {
  if (link.tone === 'whatsapp') {
    return 'bg-emerald-400/25 hover:bg-emerald-400/70'
  }

  return undefined
}

const shouldRenderDesktopList = computed<boolean>(() => {
  return isVisible.value && orderedSocialLinks.value.length > 0 && !isMobile.value
})

const shouldRenderMobileToggle = computed<boolean>(() => {
  return isVisible.value && orderedSocialLinks.value.length > 0 && isMobile.value
})

const toggleButtonAriaLabel = computed<string>(() => {
  return isMenuOpen.value
    ? (socialNetworkContent.value?.closeMenuAriaLabel ?? '')
    : (socialNetworkContent.value?.openMenuAriaLabel ?? '')
})

const toggleMenu = (): void => {
  isMenuOpen.value = !isMenuOpen.value
}

// 8. Computed UI-ready
const socialNetworkContent = computed(() => appData.value?.components?.socialNetwork)

const isVisible = computed(() => currentMeta.value?.socialNetwork?.visible !== false)

// 9. Actions et handlers
const socialLinks = computed<SocialLink[]>(() => footer.value?.socialLinks ?? [])

const effectiveBackgroundTone = computed<SocialNetworkBackgroundTone>(
  () => props.backgroundTone ?? currentMeta.value?.socialNetwork?.backgroundTone ?? 'white',
)

const buttonBgClass = computed<string>(() => {
  if (effectiveBackgroundTone.value === 'black') {
    return 'bg-foreground/70 hover:bg-background/30'
  }

  return 'bg-white/20 hover:bg-white/15'
})

const orderedSocialLinks = computed<SocialLink[]>(() => {
  return [...socialLinks.value].sort((left, right) => {
    return (left.order ?? Number.MAX_SAFE_INTEGER) - (right.order ?? Number.MAX_SAFE_INTEGER)
  })
})

const rootClass = computed<string>(() => {
  if (isMobile.value) {
    return 'fixed top-0 left-1/2 z-[60] flex -translate-x-1/2 flex-col items-center pt-[env(safe-area-inset-top)]'
  }

  return 'relative pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)]'
})

const navAriaLabel = computed<string>(() => socialNetworkContent.value?.navAriaLabel ?? '')

const closeMenu = (): void => {
  isMenuOpen.value = false
}

// 10. Watch et watchEffect
watch(
  () => route.fullPath,
  () => {
    closeMenu()
  },
)

watch([isMobile, isVisible], ([mobile, visible]) => {
  if (!mobile || !visible) {
    closeMenu()
  }
})

// 11. Metadonnees ecran ou page

// 12. Lifecycle
</script>

<style scoped>
.social-network-actions-enter-active,
.social-network-actions-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.22s ease;
}

.social-network-actions-enter-from,
.social-network-actions-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
