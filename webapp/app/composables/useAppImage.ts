type AppImagePreset = {
  width: number
  format: 'webp'
  quality: 80
  fit: 'cover'
  sizes: string
}

const createResponsiveImagePreset = (width: number, sizes: string): AppImagePreset => ({
  width,
  format: 'webp',
  quality: 80,
  fit: 'cover',
  sizes,
})

export const IMAGE_PRESETS = {
  heroMaster: createResponsiveImagePreset(2560, '2560px'),
  heroFullScreen: createResponsiveImagePreset(1920, '1920px'),
  heroOptimized: createResponsiveImagePreset(1600, '1600px'),
  sectionBanner: createResponsiveImagePreset(1280, '1280px'),
  realEstateCard: createResponsiveImagePreset(800, '800px'),
  compactCard: createResponsiveImagePreset(600, '600px'),
  galleryLightbox: createResponsiveImagePreset(1200, '1200px'),
  galleryColumn: createResponsiveImagePreset(600, '600px'),
  thumbnail: createResponsiveImagePreset(300, '300px'),
  heroMobile: createResponsiveImagePreset(800, '800px'),
  cardMobile: createResponsiveImagePreset(600, '600px'),
  thumbnailMobile: createResponsiveImagePreset(200, '200px'),
  fullscreenCover: createResponsiveImagePreset(2048, '2048px'),
  vertical3col: createResponsiveImagePreset(852, '852px'),
} as const

type AppImagePresetName = keyof typeof IMAGE_PRESETS

export const IMAGE_DIMENSIONS = Object.fromEntries(
  Object.entries(IMAGE_PRESETS).map(([name, preset]) => [
    name,
    {
      width: preset.width,
    },
  ]),
) as {
  readonly [Name in AppImagePresetName]: Pick<(typeof IMAGE_PRESETS)[Name], 'width'>
}

export const useAppImage = () => {
  return {
    IMAGE_DIMENSIONS,
    IMAGE_PRESETS,
  }
}
