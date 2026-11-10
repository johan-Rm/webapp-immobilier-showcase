const DESKTOP_MIN_WIDTH = 1024
const DESKTOP_WIDE_MIN_WIDTH = 1280
const SSR_WIDTH = DESKTOP_WIDE_MIN_WIDTH

export const useDeviceDetect = () => {
  const device = useDevice()
  const isDesktopWide = useMediaQuery(`(min-width: ${DESKTOP_WIDE_MIN_WIDTH}px)`, {
    ssrWidth: SSR_WIDTH,
  })
  const isDesktop = useMediaQuery(`(min-width: ${DESKTOP_MIN_WIDTH}px)`, { ssrWidth: SSR_WIDTH })
  const isPortrait = useMediaQuery('(orientation: portrait)', { ssrWidth: SSR_WIDTH })
  const isLandscape = useMediaQuery('(orientation: landscape)', { ssrWidth: SSR_WIDTH })
  const isPhoneDevice = computed<boolean>(() => device.isMobile)
  const isTabletDevice = computed<boolean>(() => device.isTablet)
  const isMobilePortrait = computed<boolean>(() => isPhoneDevice.value && isPortrait.value)
  const isMobileLandscape = computed<boolean>(() => isPhoneDevice.value && isLandscape.value)
  const isTabletPortrait = computed<boolean>(() => isTabletDevice.value && isPortrait.value)
  const isTabletLandscape = computed<boolean>(() => isTabletDevice.value && isLandscape.value)

  return {
    isPhoneDevice,
    isTabletDevice,
    isMobilePortrait,
    isMobileLandscape,
    isTabletPortrait,
    isTabletLandscape,
    isDesktop,
    isDesktopWide,
    isPortrait,
    isLandscape,
  }
}
