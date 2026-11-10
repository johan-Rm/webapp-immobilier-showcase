import type {
  ExceptionalOverlayMode,
  ExceptionalScreen,
  ExceptionalTitlePart,
} from '#shared/types/exceptional'

/**
 * Helpers d'affichage partagés par les composants `PropertyExceptional*`.
 *
 * Centralise les classes de zone de texte (selon le contexte de fond) et le
 * découpage du titre en segments accentués, pour éviter la duplication entre
 * les sept layouts de screens.
 */

// Zone de texte sur image : label atténué + accent sombre.
export const IMAGE_LABEL_CLASS =
  'mb-3 text-xs font-semibold tracking-[0.3em] text-white/55 uppercase'
export const IMAGE_ACCENT_CLASS = 'text-foreground'

// Zone de texte sur fond `background` : label atténué + accent blanc.
export const BACKGROUND_LABEL_CLASS =
  'mb-3 text-xs font-semibold tracking-[0.3em] text-foreground/55 uppercase'
export const BACKGROUND_ACCENT_CLASS = 'text-white'

/** Découpe le titre en segments, en isolant la sous-chaîne à mettre en accent. */
export const titleParts = (screen: ExceptionalScreen): ExceptionalTitlePart[] => {
  const { title, titleHighlight } = screen
  if (!titleHighlight) return [{ text: title, accent: false }]
  const start = title.indexOf(titleHighlight)
  if (start < 0) return [{ text: title, accent: false }]
  const parts: ExceptionalTitlePart[] = []
  if (start > 0) parts.push({ text: title.slice(0, start), accent: false })
  parts.push({ text: titleHighlight, accent: true })
  const end = start + titleHighlight.length
  if (end < title.length) parts.push({ text: title.slice(end), accent: false })
  return parts
}

/** Classes du voile chromatique commun aux images des screens éditables. */
export const imageOverlayClass = (screen: ExceptionalScreen, darkClass = 'bg-black/30'): string => {
  const imageOverlay = screen.imageOverlay ?? 'dark'
  if (imageOverlay === 'none') return ''
  return imageOverlay === 'light' ? 'bg-white/20' : darkClass
}

const overlayMode = (screen: ExceptionalScreen): ExceptionalOverlayMode =>
  screen.overlayMode ?? 'dark'

// SCREEN_02 : le mode pilote panneau et contraste texte/accent (sans backdrop blur).
export const overlayPanelClass = (screen: ExceptionalScreen): string =>
  overlayMode(screen) === 'light' ? 'bg-background/80' : 'bg-foreground/80'

export const overlayTextClass = (screen: ExceptionalScreen): string =>
  overlayMode(screen) === 'light' ? 'text-foreground' : 'text-white'

export const overlayLabelClass = (screen: ExceptionalScreen): string =>
  overlayMode(screen) === 'light' ? BACKGROUND_LABEL_CLASS : IMAGE_LABEL_CLASS

export const overlayAccentClass = (screen: ExceptionalScreen): string =>
  overlayMode(screen) === 'light' ? BACKGROUND_ACCENT_CLASS : 'text-background'
