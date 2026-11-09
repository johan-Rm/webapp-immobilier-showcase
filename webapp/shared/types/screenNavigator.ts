/**
 * Contrats de types purs du sous-systeme de navigation fullscreen.
 *
 * @see ../../docs/2.architecture/1.application-architecture.md
 * @see ../README.md
 */
export type ScreenAxis = 'x' | 'y'

export type ScreenTransitionStyle =
  | 'slide'
  | 'curtain'
  | 'depth'
  | 'reveal'
  | 'split-columns'
  | 'push-parallax'
  | 'fade-up'
  | 'cross-zoom'

export type ScreenTransitionMode = ScreenTransitionStyle | 'slide-vertical' | 'slide-horizontal'

export type ScreenAnchorSyncMode = 'explicit-only' | 'always'

export type ScreenColumnTemplate =
  'single' | 'split-50-50' | 'split-67-33' | 'split-33-67' | 'triple-equal'
