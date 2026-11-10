<template>
  <div class="relative h-dvh w-screen overflow-hidden">
    <div v-if="!isFramedLanding" class="absolute inset-x-0 top-0 z-50">
      <div
        class="grid min-h-24 grid-cols-2 px-4 pt-6 lg:min-h-32 2xl:min-h-48 2xl:pt-10 2xl:pl-16"
        :class="headerBackgroundClass"
      >
        <div class="justify-self-start">
          <LazyLogoShowcaseFull size="lg" aria-label="Retour à l'accueil" />
        </div>
        <div class="justify-self-end">
          <LazyNavigationQuickActions />
        </div>
      </div>
    </div>
    <div v-if="!isFramedLanding" class="absolute right-4 bottom-4 z-50">
      <LazyNavigationSocialNetwork />
    </div>
    <UMain class="h-full w-full">
      <slot />
    </UMain>
    <LazyUdrawerDesignSystem />
    <LazyCommandPropertySlideover />
    <LazyNavigationMobileActionsMenu />
    <Transition name="fade-up" appear>
      <LazyNavigationMain />
    </Transition>
  </div>
</template>

<script setup lang="ts">
// 1. Imports

// 2. Types et constantes statiques

// 3. Props et emits

// 4. Composables, stores, routeur

// Pages sans FullImage.vue n'ont pas de hero — on force isHeroImageReady à true
// pour que AppBootShell puisse terminer son cycle de vie normalement.
// FullImage.vue réinitialise ce state à false (watch immediate) quand il est présent.
const isHeroImageReady = useState<boolean>('screen.real-estate-full-image.hero-ready', () => true)
isHeroImageReady.value = true

const { isPhoneDevice, isTabletPortrait } = useDeviceDetect()
const { screenStatus } = useScreenSystem()
const route = useRoute()
const localePath = useLocalePath()

// 5. Etat local

// 6. Data inputs

// 7. Validation et helpers purs

// 8. Computed UI-ready
const isFramedLanding = computed(() => {
  const raw = route.query.landing
  const landing = Array.isArray(raw) ? raw[0] : raw
  return (
    route.path === localePath('/') &&
    landing === 'rounded' &&
    (!activeScreenId.value || activeScreenId.value === 'screen-landing')
  )
})

const activeScreenId = computed<string | null>(() => screenStatus.value.currentId)

const headerBackgroundClass = computed<string>(() => {
  if (
    (isPhoneDevice.value || isTabletPortrait.value) &&
    activeScreenId.value === 'screen-panel-mdc'
  ) {
    return 'bg-background'
  }

  return ''
})

// 9. Actions et handlers

// 10. Watch et watchEffect

// 11. Metadonnees ecran ou page

// 12. Lifecycle
</script>
