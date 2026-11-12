export default defineNuxtRouteMiddleware(async () => {
  // SSR never renders private data; the session is obtained by the client from the protected BFF.
  if (import.meta.server) return
  const access = useDashboardAccess()
  if (!access.state.value.user && !(await access.actions.reload())) return navigateTo('/connexion')
})
