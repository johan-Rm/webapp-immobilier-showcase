export default defineNuxtRouteMiddleware((to, from) => {
  if (import.meta.server) return

  // Allow initial render/hydration navigation.
  if (!from.matched.length) return

  // Ignore no-op navigations.
  if (to.fullPath === from.fullPath) return

  const { isConstructionEnabled, open } = useConstructionModal()
  if (!isConstructionEnabled.value) return

  // Le dashboard reste accessible même en mode construction.
  if (isConstructionExemptPath(to.path)) return

  open()
  return abortNavigation()
})
