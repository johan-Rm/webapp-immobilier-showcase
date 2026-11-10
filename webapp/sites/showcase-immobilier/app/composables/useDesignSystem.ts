import type { ComputedRef, Ref } from 'vue'

import { computed, watch } from 'vue'

type UseDesignSystemReturn = {
  themeMode: Ref<ThemeMode>
  setTheme: (next: ThemeMode) => void
  cinemaMode: Ref<CinemaMode>
  setCinema: (next: CinemaMode) => void
  cinemaOverlayClass: ComputedRef<string>
}

const _useDesignSystem = (): UseDesignSystemReturn => {
  const colorMode = useColorMode()

  const themeMode = useState<ThemeMode>('ui.theme.mode', () => 'light')

  useHead({
    htmlAttrs: {
      class: computed(() => ({
        'theme-kasbah': themeMode.value === 'kasbah',
      })),
    },
  })

  watch(
    () => themeMode.value,
    (next) => {
      if (next === 'kasbah') {
        colorMode.preference = 'dark'
        return
      }
      colorMode.preference = next
    },
    { immediate: true },
  )

  const setTheme = (next: ThemeMode): void => {
    themeMode.value = next
  }

  const cinemaMode = useState<CinemaMode>('ui.cinema.mode', () => 'strong')

  const cinemaOverlayClass = computed(() => {
    if (cinemaMode.value === 'strong') {
      return 'bg-[radial-gradient(circle_at_30%_40%,rgba(0,0,0,0.12),rgba(0,0,0,0.48)),linear-gradient(to_right,rgba(0,0,0,0.40),rgba(0,0,0,0.10)_55%,rgba(0,0,0,0.50))]'
    }
    if (cinemaMode.value === 'soft') {
      return 'bg-[radial-gradient(circle_at_30%_40%,rgba(0,0,0,0.05),rgba(0,0,0,0.28)),linear-gradient(to_right,rgba(0,0,0,0.20),rgba(0,0,0,0.04)_55%,rgba(0,0,0,0.26))]'
    }
    return 'hidden'
  })

  const setCinema = (next: CinemaMode): void => {
    cinemaMode.value = next
  }

  return {
    themeMode,
    setTheme,
    cinemaMode,
    setCinema,
    cinemaOverlayClass,
  }
}

export const useDesignSystem = createSharedComposable(_useDesignSystem)
