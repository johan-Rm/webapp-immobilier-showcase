/**
 * Contrats UI du parcours immersif d'un bien d'exception.
 *
 * Types de présentation dérivés de `Accommodation.hasPart` par
 * `services/mapper/exceptional.ts`, consommés par l'orchestrateur
 * `ScreenPropertyExceptional` et les composants `PropertyExceptional*`.
 * Volontairement hors contrats partagés de l'orchestrateur (purement frontend).
 */

/** Layout de rendu interne d'un écran du parcours. */
export type ExceptionalScreenLayout =
  'split' | 'full-overlay' | 'full' | 'triptych' | 'carousel' | 'duo' | 'contact'

/** Template éditorial configurable par écran (contrat `additionalType`). */
export type ExceptionalScreenTemplate =
  'SCREEN_01' | 'SCREEN_02' | 'SCREEN_03' | 'SCREEN_04' | 'SCREEN_05' | 'SCREEN_06' | 'CONTACT'

/** Variante chromatique du panneau overlay (SCREEN_02). */
export type ExceptionalOverlayMode = 'dark' | 'light'

/** Variante du voile appliqué aux images des screens éditables. */
export type ExceptionalImageOverlay = 'none' | 'dark' | 'light'

/** Visuel d'un écran : url résolue + texte alternatif. */
export type ExceptionalMedia = {
  src: string
  alt: string
}

/** Écran du parcours, prêt pour le rendu. */
export type ExceptionalScreen = {
  id: string
  /** Désignation en minuscules (clé interne). */
  label: string
  /** Template visuel configurable (équivalent d'une prop de screen). */
  template: ExceptionalScreenTemplate
  /** Désignation affichée (label tiret, atténué). */
  eyebrow: string
  title: string
  /** Sous-chaîne du titre mise en avant par la couleur d'accent. */
  titleHighlight?: string
  text: string
  cta?: string
  media: readonly ExceptionalMedia[]
  /** Caractéristiques clés optionnelles affichées dans certains templates. */
  specs?: readonly string[]
  /** SCREEN_01/02/04 : inverse les deux blocs principaux sur desktop. */
  reverse?: boolean
  /** SCREEN_02 : variante chromatique du panneau. */
  overlayMode?: ExceptionalOverlayMode
  /** Voile optionnel appliqué aux images du screen. */
  imageOverlay?: ExceptionalImageOverlay
}

/** Segment de titre : texte + indicateur d'accent. */
export type ExceptionalTitlePart = {
  text: string
  accent: boolean
}

/** Badge de la synthèse fixe : libellé complet + diminutif compact (mobile). */
export type ExceptionalPropertyBadge = {
  full: string
  short: string
}

/** Synthèse fixe du bien (repère permanent + drawer d'infos). */
export type ExceptionalPropertySummary = {
  name: string
  location: string
  reference: string
  price: string
  /** Premier visuel du parcours, réutilisé comme image d'ambiance du contact. */
  contactImage: string
}
