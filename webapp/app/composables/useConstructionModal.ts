// Routes accessibles même quand le mode construction est actif (dashboard + login),
// avec ou sans préfixe de locale i18n (ex. /dashboard, /fr/dashboard/login).
const CONSTRUCTION_EXEMPT_PATH_PATTERN = /^(?:\/[a-z]{2})?\/dashboard(?:\/|$)/

export const isConstructionExemptPath = (path: string): boolean =>
  CONSTRUCTION_EXEMPT_PATH_PATTERN.test(path)

export const useConstructionModal = () => {
  const route = useRoute()
  const isConstructionEnabled = useState<boolean>('is-construction-enabled', () => false)
  const isOpen = useState<boolean>('construction-modal-open', () => false)

  // La route courante échappe-t-elle au verrou construction ?
  const isExemptRoute = computed<boolean>(() => isConstructionExemptPath(route.path))

  const open = (): void => {
    if (isExemptRoute.value) return

    isOpen.value = true
  }

  const close = (): void => {
    if (isConstructionEnabled.value) return

    isOpen.value = false
  }

  const toggleConstructionMode = (value: boolean): void => {
    isConstructionEnabled.value = value
    isOpen.value = value
  }

  return {
    isConstructionEnabled,
    isOpen,
    isExemptRoute,
    open,
    close,
    toggleConstructionMode,
  }
}
