import { parse } from 'yaml'

import { readThemeSource } from '../utils/content/themeSource'

type ThemeDefinition = {
  name?: string
  fonts?: {
    heading?: string
    body?: string
  }
  colors: Array<{
    label: string
    value?: string
    scale?: Record<string, string>
    color?: string
    shade?: string | number
  }>
}

type ThemeYaml = {
  themes: Record<string, ThemeDefinition | Record<string, Record<string, string>>> & {
    colors?: Record<string, Record<string, string>>
  }
  colors?: Record<string, Record<string, string>>
}

const hexToRgb = (hex: string) => {
  const normalized = hex.replace('#', '').trim()
  if (normalized.length !== 6) return null
  const r = Number.parseInt(normalized.slice(0, 2), 16)
  const g = Number.parseInt(normalized.slice(2, 4), 16)
  const b = Number.parseInt(normalized.slice(4, 6), 16)
  return `${r} ${g} ${b}`
}

type ThemeColorEntry = ThemeDefinition['colors'][number]

const resolveThemeColors = (colors: ThemeColorEntry[], palettes: ThemeYaml['colors'] = {}) => {
  const entries: Array<[string, string]> = []

  colors.forEach((color) => {
    if (color.value) {
      entries.push([color.label, color.value])
    }

    if (color.scale) {
      const scaleEntries = Object.entries(color.scale) as Array<[string, string]>
      scaleEntries.forEach(([scaleKey, scaleValue]) => {
        entries.push([`${color.label}-${scaleKey}`, scaleValue])
      })
    }

    if (color.color) {
      const palette = palettes[color.color]
      if (!palette) return

      const paletteEntries = Object.entries(palette) as Array<[string, string]>
      paletteEntries.forEach(([shadeKey, shadeValue]) => {
        entries.push([`${color.label}-${shadeKey}`, shadeValue])
      })

      if (color.shade !== undefined) {
        const shadeKey = String(color.shade)
        const shadeValue = palette[shadeKey]
        if (shadeValue) entries.push([color.label, shadeValue])
      }
    }
  })

  return Object.fromEntries(entries)
}

const buildThemeCss = (key: string, theme: ThemeDefinition, palettes: ThemeYaml['colors']) => {
  const colors = resolveThemeColors(theme.colors, palettes)
  const background = colors.background
  const surface = colors.surface
  const overlay = colors.overlay
  const foreground = colors.foreground ?? colors['foreground-950']
  const primary = colors.primary
  const secondary = colors.secondary
  const border = colors.border ?? surface ?? background
  const ring = colors.ring ?? primary

  const primaryFg = colors['primary-foreground'] ?? background ?? '#ffffff'
  const secondaryFg = colors['secondary-foreground'] ?? foreground ?? '#000000'

  const THEME_SELECTORS: Record<string, string> = { light: ':root', dark: '.dark' }
  const selector = THEME_SELECTORS[key] ?? `.theme-${key}`

  const heading = theme.fonts?.heading
  const body = theme.fonts?.body

  const baseKeys = new Set([
    'background',
    'surface',
    'overlay',
    'foreground',
    'primary',
    'primary-foreground',
    'secondary',
    'secondary-foreground',
    'border',
    'ring',
    'danger',
    'danger-foreground',
  ])

  const extraTokens = Object.entries(colors)
    .filter(([label]) => !baseKeys.has(label))
    .map(([label, value]) => {
      const rgb = hexToRgb(value)
      return rgb ? `  --color-${label}: ${rgb};` : ''
    })
    .filter(Boolean)

  return [
    `${selector} {`,
    heading ? `  --font-heading: '${heading}', system-ui, -apple-system, sans-serif;` : '',
    body ? `  --font-body: '${body}', system-ui, -apple-system, sans-serif;` : '',
    background ? `  --color-bg: ${hexToRgb(background)};` : '',
    surface ? `  --color-surface: ${hexToRgb(surface)};` : '',
    overlay ? `  --color-overlay: ${hexToRgb(overlay)};` : '',
    foreground ? `  --color-foreground: ${hexToRgb(foreground)};` : '',
    primary ? `  --color-primary: ${hexToRgb(primary)};` : '',
    primaryFg ? `  --color-primary-foreground: ${hexToRgb(primaryFg)};` : '',
    secondary ? `  --color-secondary: ${hexToRgb(secondary)};` : '',
    secondaryFg ? `  --color-secondary-foreground: ${hexToRgb(secondaryFg)};` : '',
    border ? `  --color-border: ${hexToRgb(border)};` : '',
    ring ? `  --color-ring: ${hexToRgb(ring)};` : '',
    ...extraTokens,
    `}`,
  ]
    .filter(Boolean)
    .join('\n')
}

export default defineEventHandler(async (event) => {
  const raw = await readThemeSource(import.meta.url)
  const themesData = parse(raw) as ThemeYaml
  const themes = themesData?.themes ?? {}
  const palettes = themesData?.colors ?? themes.colors ?? {}
  const css = Object.entries(themes)
    .filter(([key]) => key !== 'colors')
    .map(([key, theme]) => {
      if (!theme || typeof theme !== 'object' || !('colors' in theme)) return ''
      return buildThemeCss(key, theme as ThemeDefinition, palettes)
    })
    .filter(Boolean)
    .join('\n\n')

  event.node.res.setHeader('Content-Type', 'text/css; charset=utf-8')
  return css
})
