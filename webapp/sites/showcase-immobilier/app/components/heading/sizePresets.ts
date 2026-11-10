export const HEADING_SIZE_PRESETS = {
  xs: 'clamp(0.75rem, 1vw, 0.875rem)',
  sm: 'clamp(0.875rem, 1.2vw, 1rem)',
  md: 'clamp(1rem, 1.45vw, 1.3rem)',
  lg: 'clamp(1.1rem, 1.75vw, 1.5rem)',
  xl: 'clamp(1.2rem, 2vw, 1.85rem)',
  '2xl': 'clamp(1.35rem, 2.4vw, 2.25rem)',
  '3xl': 'clamp(1.7rem, 2.9vw, 3rem)',
  '4xl': 'clamp(2.1rem, 3.6vw, 4.4rem)',
  '5xl': 'clamp(2.5rem, 4.5vw, 5.5rem)',
} as const

export type HeadingSizePreset = keyof typeof HEADING_SIZE_PRESETS

const HEADING_SIZE_CLASS_BY_PRESET: Record<HeadingSizePreset, string> = {
  xs: 'heading-size-xs',
  sm: 'heading-size-sm',
  md: 'heading-size-md',
  lg: 'heading-size-lg',
  xl: 'heading-size-xl',
  '2xl': 'heading-size-2xl',
  '3xl': 'heading-size-3xl',
  '4xl': 'heading-size-4xl',
  '5xl': 'heading-size-5xl',
}

export function resolveHeadingSizeClass(size?: string): string {
  if (!size) {
    return ''
  }

  const preset = size as HeadingSizePreset
  return HEADING_SIZE_CLASS_BY_PRESET[preset] ?? ''
}
