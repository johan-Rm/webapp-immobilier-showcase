import type { Ref } from 'vue'

/**
 * Coordonnées d'un point de contact dans le viewport.
 */
export interface LongPressPoint {
  x: number
  y: number
}

/**
 * Contrat du détecteur d'appui long tactile.
 */
export interface UseLongPressOptions {
  /** N'attache les listeners que lorsque ce ref est vrai. */
  enabled: Ref<boolean>
  /** Délai avant déclenchement, en ms (défaut 500). */
  delay?: number
  /** Tolérance de déplacement au-delà de laquelle le geste est annulé, en px (défaut 10). */
  moveThreshold?: number
  /** Sélecteur des cibles à ignorer (champs de saisie, édition). */
  ignoreSelector?: string
  /** Callback déclenché à l'échéance, avec le point de contact. */
  onLongPress: (point: LongPressPoint) => void
}

const DEFAULT_DELAY = 500
const DEFAULT_MOVE_THRESHOLD = 10

/**
 * Indique si le déplacement entre deux points dépasse le seuil (distance euclidienne).
 * Helper pur, isolé pour être testable sans DOM.
 */
export const exceedsMoveThreshold = (
  start: LongPressPoint,
  current: LongPressPoint,
  threshold: number,
): boolean => Math.hypot(current.x - start.x, current.y - start.y) > threshold

/**
 * Détecte un appui long tactile n'importe où sur le document.
 *
 * Le geste est détecté via un timer tactile (plus fiable que l'event `contextmenu`
 * natif sur iOS Safari) : `touchstart` démarre un délai, annulé au mouvement, au
 * multi-touch ou au relâchement anticipé. À l'échéance, `onLongPress` est appelé puis
 * le `contextmenu` natif et le `click` fantôme qui suivent sont neutralisés.
 *
 * SSR-safe : liaison en `onMounted`, libération en `onUnmounted` ou au passage
 * `enabled = false`.
 */
export const useLongPress = (options: UseLongPressOptions): void => {
  const { enabled, onLongPress } = options
  const delay = options.delay ?? DEFAULT_DELAY
  const moveThreshold = options.moveThreshold ?? DEFAULT_MOVE_THRESHOLD
  const ignoreSelector = options.ignoreSelector ?? ''

  let timer: ReturnType<typeof setTimeout> | null = null
  let startPoint: LongPressPoint | null = null
  let triggered = false
  let attached = false

  const clearTimer = (): void => {
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
  }

  const cancel = (): void => {
    clearTimer()
    startPoint = null
  }

  const isIgnoredTarget = (target: EventTarget | null): boolean => {
    if (!ignoreSelector) return false
    if (!(target instanceof Element)) return false
    return target.closest(ignoreSelector) !== null
  }

  const onTouchStart = (event: TouchEvent): void => {
    triggered = false
    if (event.touches.length > 1) {
      cancel()
      return
    }
    const touch = event.touches[0]
    if (!touch || isIgnoredTarget(event.target)) return

    startPoint = { x: touch.clientX, y: touch.clientY }
    clearTimer()
    timer = setTimeout(() => {
      timer = null
      if (!startPoint) return
      triggered = true
      onLongPress(startPoint)
      startPoint = null
    }, delay)
  }

  const onTouchMove = (event: TouchEvent): void => {
    if (!startPoint) return
    if (event.touches.length > 1) {
      cancel()
      return
    }
    const touch = event.touches[0]
    if (!touch) return
    if (exceedsMoveThreshold(startPoint, { x: touch.clientX, y: touch.clientY }, moveThreshold)) {
      cancel()
    }
  }

  const onTouchEndOrCancel = (): void => {
    cancel()
  }

  // Neutralise le menu contextuel natif déclenché par le long-press.
  const onContextMenu = (event: Event): void => {
    if (triggered) event.preventDefault()
  }

  // Neutralise le clic fantôme synthétisé après le geste (capture pour devancer les cibles).
  const onClickCapture = (event: MouseEvent): void => {
    if (!triggered) return
    event.preventDefault()
    event.stopPropagation()
    triggered = false
  }

  const attach = (): void => {
    if (attached) return
    attached = true
    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchmove', onTouchMove, { passive: true })
    document.addEventListener('touchend', onTouchEndOrCancel)
    document.addEventListener('touchcancel', onTouchEndOrCancel)
    document.addEventListener('contextmenu', onContextMenu)
    document.addEventListener('click', onClickCapture, { capture: true })
  }

  const detach = (): void => {
    if (!attached) return
    attached = false
    cancel()
    triggered = false
    document.removeEventListener('touchstart', onTouchStart)
    document.removeEventListener('touchmove', onTouchMove)
    document.removeEventListener('touchend', onTouchEndOrCancel)
    document.removeEventListener('touchcancel', onTouchEndOrCancel)
    document.removeEventListener('contextmenu', onContextMenu)
    document.removeEventListener('click', onClickCapture, { capture: true })
  }

  onMounted(() => {
    if (enabled.value) attach()
  })

  watch(enabled, (isEnabled) => {
    if (isEnabled) attach()
    else detach()
  })

  onUnmounted(detach)
}
