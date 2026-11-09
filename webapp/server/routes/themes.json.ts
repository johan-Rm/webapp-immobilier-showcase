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

type ThemeColorEntry = ThemeDefinition['colors'][number]

const resolveThemeColors = (
  colors: ThemeColorEntry[],
  palettes: ThemeYaml['colors'] = {},
): ThemeColorEntry[] =>
  colors.flatMap((color) => {
    const entries: ThemeColorEntry[] = []

    if (color.value) {
      entries.push({ label: color.label, value: color.value, shade: color.shade })
    }

    if (color.scale) {
      entries.push({ label: color.label, scale: color.scale, shade: color.shade })
    }

    if (color.color) {
      const palette = palettes[color.color]
      if (!palette) return entries

      entries.push({ label: color.label, scale: palette, shade: color.shade })

      if (color.shade !== undefined) {
        const shadeKey = String(color.shade)
        const shadeValue = palette[shadeKey]
        if (shadeValue) entries.push({ label: color.label, value: shadeValue, shade: color.shade })
      }
    }

    return entries
  })

export default defineEventHandler(async () => {
  const raw = await readThemeSource(import.meta.url)
  const data = parse(raw) as ThemeYaml
  const themes = data?.themes ?? {}
  const palettes = data?.colors ?? themes.colors ?? {}
  const resolvedThemes = Object.fromEntries(
    Object.entries(themes)
      .filter(([key]) => key !== 'colors')
      .map(([key, theme]) => {
        if (!theme || typeof theme !== 'object' || !('colors' in theme)) {
          return [key, theme]
        }
        const typedTheme = theme as ThemeDefinition
        return [
          key,
          {
            ...typedTheme,
            colors: resolveThemeColors(typedTheme.colors ?? [], palettes),
          },
        ]
      }),
  )
  return {
    ...data,
    themes: resolvedThemes,
  }
})
