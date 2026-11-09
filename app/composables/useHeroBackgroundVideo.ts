import type { Ref } from 'vue'

import {
  useDocumentVisibility,
  useElementVisibility,
  usePreferredReducedMotion,
} from '@vueuse/core'

/** Charge après l'image critique et suspend la lecture hors écran / onglet masqué. */
export const useHeroBackgroundVideo = (
  container: Ref<HTMLElement | null>,
  video: Ref<HTMLVideoElement | null>,
  imageReady: Ref<boolean>,
) => {
  const route = useRoute()
  const reducedMotion = usePreferredReducedMotion()
  const documentVisibility = useDocumentVisibility()
  const isVisible = useElementVisibility(container)
  const isMounted = ref(false)
  const saveData = ref(false)
  const isPaused = ref(false)
  const isPlaying = ref(false)
  const hasFailed = ref(false)
  const videoSources = ref<{ desktop: string; mobile: string } | null>(null)
  const isVideoEnabled = computed(() => route.query.heroVideo === '1')
  const canPlay = computed(
    () =>
      isVideoEnabled.value &&
      isMounted.value &&
      imageReady.value &&
      isVisible.value &&
      documentVisibility.value === 'visible' &&
      reducedMotion.value !== 'reduce' &&
      !saveData.value &&
      !isPaused.value &&
      !hasFailed.value,
  )

  const togglePlayback = () => {
    isPaused.value = !isPaused.value
  }
  const handlePlaying = () => {
    isPlaying.value = true
  }
  const handleError = () => {
    hasFailed.value = true
    isPlaying.value = false
  }

  watch(isVideoEnabled, () => {
    video.value?.pause()
    videoSources.value = null
    isPlaying.value = false
    hasFailed.value = false
    isPaused.value = false
  })

  // Les sources sont absentes du SSR : aucune concurrence avec l'image LCP.
  watch(
    [canPlay, video, isVideoEnabled],
    async ([shouldPlay, element]) => {
      if (!shouldPlay) {
        element?.pause()
        if (reducedMotion.value === 'reduce') isPlaying.value = false
        return
      }
      if (!videoSources.value) {
        videoSources.value = {
          desktop: '/videos/rounded-1.mp4',
          mobile: '/videos/rounded-1-mobile.mp4',
        }
        return
      }
      if (element) {
        try {
          await element.play()
        } catch {
          // Autoplay refusé : l'image reste visible et le bouton permet de réessayer.
          isPaused.value = true
        }
      }
    },
    { flush: 'post' },
  )

  onMounted(() => {
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
    saveData.value = connection?.saveData === true
    isMounted.value = true
  })

  return {
    videoSources,
    isPaused,
    isPlaying,
    hasFailed,
    togglePlayback,
    handlePlaying,
    handleError,
  }
}
