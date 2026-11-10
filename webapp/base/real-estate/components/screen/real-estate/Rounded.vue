<template>
  <div
    class="screen-real-estate-rounded bg-background relative flex flex-col justify-end px-[1mm] pb-[1mm]"
    :class="screenColumnTemplate[column].value"
  >
    <header
      class="flex min-h-0 flex-1 items-center justify-between gap-2 sm:gap-6 max-sm:[&_svg]:max-w-[100px]"
    >
      <LogoShowcaseFull size="sm" :force-visible="true" color-class="text-foreground/90" />
      <UNavigationMenu
        :items="headerMenuItems"
        :aria-label="mainMenuAriaLabel"
        class="min-w-0 overflow-x-auto"
        :ui="{ link: 'text-foreground text-xs lg:text-sm', list: 'gap-1 lg:gap-5' }"
      />
    </header>
    <div
      ref="heroContainer"
      class="relative h-[82dvh] w-full shrink-0 basis-[82dvh] overflow-hidden rounded-3xl shadow-none shadow-zinc-900"
    >
      <AppImage
        v-if="hasBackgroundImage && !usePortraitHeroImage"
        :src="bgImageUrl"
        :alt="heroImageAlt"
        v-bind="IMAGE_PRESETS.fullscreenCover"
        loading="eager"
        :placeholder="false"
        fetchpriority="high"
        decoding="async"
        :preload="true"
        class="absolute inset-0 h-full w-full object-cover"
        @loaded="handleHeroImageLoad"
        @error="handleHeroImageError"
      />

      <AppImage
        v-if="usePortraitHeroImage"
        :src="bgImagePortraitUrl"
        :alt="heroImageAlt"
        v-bind="IMAGE_PRESETS.heroMobile"
        loading="eager"
        :placeholder="false"
        fetchpriority="high"
        decoding="async"
        :preload="true"
        class="absolute inset-0 h-full w-full object-cover"
        @loaded="handleHeroImageLoad"
        @error="handleHeroImageError"
      />

      <!-- Vidéo décorative native : Nuxt UI ne fournit pas de lecteur vidéo. -->
      <video
        v-if="videoSources && !hasVideoFailed"
        :key="videoSources.desktop"
        ref="heroVideo"
        muted
        loop
        playsinline
        preload="none"
        aria-hidden="true"
        tabindex="-1"
        :class="isVideoPlaying ? 'opacity-100' : 'opacity-0'"
        class="pointer-events-none absolute inset-0 h-full w-full object-cover"
        @playing="handleVideoPlaying"
        @error="handleVideoError"
      >
        <source :src="videoSources.mobile" type="video/mp4" media="(max-width: 767px)" />
        <source :src="videoSources.desktop" type="video/mp4" />
      </video>

      <div class="relative z-10 h-full w-full">
        <UButton
          v-if="videoSources && !hasVideoFailed"
          :icon="isVideoPaused ? 'i-lucide-play' : 'i-lucide-pause'"
          :aria-label="t(isVideoPaused ? 'heroVideo.play' : 'heroVideo.pause')"
          color="neutral"
          variant="solid"
          class="absolute top-4 right-4 rounded-full"
          @click="toggleVideoPlayback"
        />
        <nav
          :aria-label="mainMenuAriaLabel"
          class="pointer-events-none absolute bottom-10 left-1/2 flex w-full max-w-[92vw] -translate-x-1/2 flex-col items-stretch justify-center gap-2 px-4 sm:max-w-2xl sm:gap-3 md:flex-row md:items-stretch lg:bottom-18 lg:gap-3 lg:px-0 2xl:bottom-36 2xl:max-w-7xl 2xl:gap-6"
        >
          <LinkHeroNav
            v-for="item in menuItemsWithAvailability"
            :key="`${item.url}:${item.name}`"
            :to="item.disabled ? undefined : localePath(item.url ?? '/')"
            :disabled="item.disabled"
          >
            <span>{{ item.name }}</span>

            <span v-if="item.text" class="sr-only">
              {{ item.text }}
            </span>
          </LinkHeroNav>
        </nav>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 1. Imports
import type { MediaObject } from '@schemas/interfaces'

// 2. Types et constantes statiques
type RoundedScreenProps = {
  data?: CreativeWork
}

type MenuItemWithAvailability = MenuItem & {
  count: number
  disabled: boolean
  text?: string
}

type HeroImageEventPayload = {
  src: string
  time: number
}

const SCREEN_ID = 'screen-real-estate-rounded'
const column: ScreenColumnTemplate = 'single'
const MOBILE_PORTRAIT_BACKGROUND_TYPE = 'mobile-portrait-background'
const PORTRAIT_HERO_MEDIA_QUERY =
  '(max-width: 767px), (min-width: 768px) and (max-width: 1023px) and (orientation: portrait)'
const HERO_IMAGE_READY_STATE_KEY = 'screen.real-estate-full-image.hero-ready'

// 3. Props et emits
const props = defineProps<RoundedScreenProps>()

// 4. Composables, stores, routeur
const heroContainer = ref<HTMLElement | null>(null)
const heroVideo = ref<HTMLVideoElement | null>(null)
const { t } = useI18n({
  useScope: 'local',
  messages: {
    fr: { heroVideo: { play: 'Lire la vidéo', pause: 'Mettre la vidéo en pause' } },
    en: { heroVideo: { play: 'Play video', pause: 'Pause video' } },
    es: { heroVideo: { play: 'Reproducir el vídeo', pause: 'Pausar el vídeo' } },
  },
})
const logger = useLogger({ module: 'screen-real-estate-rounded' })
const { warmQuickActionTarget } = useQuickActionWarmup()
const { getItemsByRealEstateListing } = useAccommodation()
const { isPhoneDevice, isTabletPortrait } = useDeviceDetect()
const { primaryMenuItems, secondaryMenuItems, appData } = useAppNavigation()
const isStaticOutput = useRuntimeConfig().public.staticOutput === true
const localePath = useLocalePath()
const { setScreenMeta, screenColumnTemplate } = useScreenSystem()
const isHeroImageReady = useState<boolean>(HERO_IMAGE_READY_STATE_KEY, () => false)

const {
  videoSources,
  isPaused: isVideoPaused,
  isPlaying: isVideoPlaying,
  hasFailed: hasVideoFailed,
  togglePlayback: toggleVideoPlayback,
  handlePlaying: handleVideoPlaying,
  handleError: handleVideoError,
} = useHeroBackgroundVideo(heroContainer, heroVideo, isHeroImageReady)

// 5. Etat local
const isPortraitHeroViewport = ref(isPhoneDevice.value || isTabletPortrait.value)
// Les biens différés peuvent arriver avant l'hydratation de ce composant lazy.
// Garder le même élément de navigation entre SSR et premier rendu client.
const hasHydrated = ref(false)

let portraitHeroMediaQuery: MediaQueryList | null = null
const warmedHeroNavigationTargets = new Set<string>()

// 6. Data inputs
const menuItems = computed<MenuItem[]>(() => (props.data?.links as MenuItem[] | undefined) ?? [])
const hasLandingScreenData = computed<boolean>(() => props.data !== undefined)

// 7. Validation et helpers purs
const getListingSlugFromUrl = (url?: string): string => {
  if (!url) return ''
  return url.split('/').filter(Boolean).at(-1) ?? ''
}

// 8. Computed UI-ready
const mainMenuAriaLabel = computed(
  () => appData.value?.components?.navigationMain?.mainMenuAriaLabel,
)
const headerMenuItems = computed(() =>
  [...primaryMenuItems.value, ...secondaryMenuItems.value.filter((item) => item.url === '/contact')]
    .filter((item) => item.url !== '/')
    .map((item) => ({ label: item.name, to: localePath(item.url) })),
)

const menuItemsWithAvailability = computed<MenuItemWithAvailability[]>(() =>
  menuItems.value.map((item) => {
    const listingSlug = getListingSlugFromUrl(item.url)
    const count = getItemsByRealEstateListing(listingSlug).value.length

    return {
      ...item,
      count,
      disabled: (hasHydrated.value || isStaticOutput) && count === 0,
    }
  }),
)

const backgroundImage = computed<MediaObject | null>(() => {
  const image = props.data?.image as MediaObject | string | MediaObject[] | undefined
  if (typeof image === 'string' && image.trim().length > 0)
    return { identifier: image, url: image, caption: '', mainEntity: 'ImageObject' }
  return image && typeof image === 'object' && !Array.isArray(image) ? image : null
})

const portraitBackgroundImage = computed<MediaObject | null>(() => {
  const parts = (props.data?.hasPart as CreativeWork[] | undefined) ?? []
  const portraitPart = parts.find(
    (part) => (part.additionalType as string | undefined) === MOBILE_PORTRAIT_BACKGROUND_TYPE,
  )
  const image = portraitPart?.image as MediaObject | string | MediaObject[] | undefined
  if (typeof image === 'string' && image.trim().length > 0)
    return { identifier: image, url: image, caption: '', mainEntity: 'ImageObject' }
  return image && typeof image === 'object' && !Array.isArray(image) ? image : null
})

const bgImageUrl = computed<string>(() => backgroundImage.value?.url ?? '')
const bgImageAlt = computed<string>(() => backgroundImage.value?.caption ?? '')
const hasBackgroundImage = computed<boolean>(() => bgImageUrl.value.trim().length > 0)
const bgImagePortraitUrl = computed<string>(() => portraitBackgroundImage.value?.url ?? '')
const bgImagePortraitAlt = computed<string>(
  () => portraitBackgroundImage.value?.caption ?? bgImageAlt.value,
)
const hasPortraitBackgroundImage = computed<boolean>(
  () => bgImagePortraitUrl.value.trim().length > 0,
)

const hasHeroImage = computed<boolean>(() => {
  return hasBackgroundImage.value || hasPortraitBackgroundImage.value
})

const usePortraitHeroImage = computed<boolean>(
  () => hasPortraitBackgroundImage.value && isPortraitHeroViewport.value,
)

const selectedHeroImageUrl = computed<string>(() => {
  return usePortraitHeroImage.value ? bgImagePortraitUrl.value : bgImageUrl.value
})

const heroNavigationTargets = computed<string[]>(() =>
  menuItems.value
    .map((item) => item.url)
    .filter((url): url is string => typeof url === 'string' && url.trim().length > 0)
    .map((url) => localePath(url))
    .filter((to, index, list) => to !== '/' && list.indexOf(to) === index),
)

const heroImageAlt = computed<string>(() => {
  return usePortraitHeroImage.value
    ? bgImagePortraitAlt.value
    : bgImageAlt.value || bgImagePortraitAlt.value
})

// 9. Actions et handlers
const syncPortraitHeroViewport = (): void => {
  isPortraitHeroViewport.value = portraitHeroMediaQuery?.matches ?? false
}

const markSelectedHeroImageReady = (payload: HeroImageEventPayload): void => {
  if (payload.src !== selectedHeroImageUrl.value) return

  isHeroImageReady.value = true
}

const handleHeroImageLoad = markSelectedHeroImageReady

const handleHeroImageError = markSelectedHeroImageReady

const warmHeroNavigationTargets = (): void => {
  const targets = heroNavigationTargets.value.filter((to) => !warmedHeroNavigationTargets.has(to))

  if (targets.length === 0) return

  targets.forEach((to) => {
    warmedHeroNavigationTargets.add(to)

    warmQuickActionTarget({
      id: `rounded:${to}`,
      to,
    })
  })

  logger.info('Warm hero navigation targets', {
    screenId: SCREEN_ID,
    targets,
  })
}

// 10. Watch et watchEffect
watch(
  [hasLandingScreenData, selectedHeroImageUrl],
  ([hasData, imageUrl]) => {
    isHeroImageReady.value = hasData && imageUrl.trim().length === 0
  },
  { immediate: true },
)

watch(heroNavigationTargets, warmHeroNavigationTargets, { immediate: true })

// 11. Metadonnees ecran ou page

// 12. Lifecycle
onMounted(() => {
  hasHydrated.value = true
  if (hasLandingScreenData.value && !hasHeroImage.value) {
    isHeroImageReady.value = true
  }

  logger.info('Mounted screen', {
    screenId: SCREEN_ID,
    hasBackgroundImage: hasBackgroundImage.value,
    hasPortraitBackgroundImage: hasPortraitBackgroundImage.value,
    menuItemsCount: menuItems.value.length,
  })

  setScreenMeta('screen-landing', {
    type: 'landing',
    logo: {
      visible: false,
    },
    layout: {
      column,
      contentZone: 'none',
      imageZone: 'background',
      hasBackgroundImage: hasBackgroundImage.value,
      backgroundImage: bgImageUrl.value,
    },
  })

  portraitHeroMediaQuery = window.matchMedia(PORTRAIT_HERO_MEDIA_QUERY)
  syncPortraitHeroViewport()
  portraitHeroMediaQuery.addEventListener('change', syncPortraitHeroViewport)
})

onUnmounted(() => {
  logger.info('Unmounted screen', {
    screenId: SCREEN_ID,
    isHeroImageReady: isHeroImageReady.value,
  })

  portraitHeroMediaQuery?.removeEventListener('change', syncPortraitHeroViewport)
  portraitHeroMediaQuery = null
})
</script>

<style scoped>
/* Garder ce bloc pour les imports CSS encore actifs pendant le HMR de Vite.
   La présentation du screen est définie par les classes Tailwind du template. */
</style>
