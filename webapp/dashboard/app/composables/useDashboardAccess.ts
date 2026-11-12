type AccessUser = { id: string; email: string; platformAdmin: boolean }
type AccessOrganization = { id: string; name: string; canManageMembers: boolean }
type AccessProject = { id: string; name: string }
type AccessCollection<T> = { items: T[]; hasNext: boolean }

/** Browser-facing BFF view models; server authorization remains mandatory on every operation. */
export const useDashboardAccess = () => {
  // Route middleware has no component instance; use the global i18n composer.
  const { t } = useNuxtApp().$i18n as ReturnType<typeof useI18n>
  const state = useState('saas.access', () => ({
    user: null as AccessUser | null,
    organizations: [] as AccessOrganization[],
    projects: [] as AccessProject[],
    organizationId: '',
    projectId: '',
    loading: false,
    error: '',
    sequence: 0,
  }))
  const context = computed(() => ({
    organization:
      state.value.organizations.find((item) => item.id === state.value.organizationId) ?? null,
    project: state.value.projects.find((item) => item.id === state.value.projectId) ?? null,
    platformAdmin: state.value.user?.platformAdmin ?? false,
    canManageMembers: Boolean(
      state.value.user?.platformAdmin ||
      state.value.organizations.find((item) => item.id === state.value.organizationId)
        ?.canManageMembers,
    ),
    organizationItems: state.value.organizations.map((item) => ({
      label: item.name,
      value: item.id,
    })),
    projectItems: state.value.projects.map((item) => ({ label: item.name, value: item.id })),
  }))
  const unsaved = useState('saas.unsaved', () => false)
  const busy = useState('saas.busy', () => false)
  const confirmDiscard = () =>
    !busy.value && (!unsaved.value || window.confirm(t('editor.discard')))
  const reset = () => {
    state.value.sequence++
    state.value.user = null
    state.value.organizations = []
    state.value.projects = []
    state.value.organizationId = ''
    state.value.projectId = ''
  }
  const request = async <T>(
    path: string,
    options: Parameters<typeof $fetch>[1] = {},
  ): Promise<T> => {
    try {
      return await $fetch<T>(`/api/saas${path}`, { ...options, credentials: 'same-origin' })
    } catch (error) {
      if ((error as { statusCode?: number }).statusCode === 401 && path !== '/auth/login') {
        reset()
        if (path !== '/auth/session') await navigateTo('/connexion')
      }
      throw error
    }
  }
  const collection = async <T>(path: string): Promise<T[]> => {
    const items: T[] = []
    let page = 1
    let more = true
    while (more) {
      const result = await request<AccessCollection<T>>(path, { query: { page, pageSize: 100 } })
      items.push(...result.items)
      more = result.hasNext
      page++
    }
    return items
  }
  const selectOrganization = async (id: string) => {
    if (id === state.value.organizationId || !confirmDiscard()) return
    if (!state.value.organizations.some((item) => item.id === id)) return
    const sequence = ++state.value.sequence
    state.value.organizationId = id
    state.value.projectId = ''
    state.value.projects = []
    state.value.loading = true
    state.value.error = ''
    try {
      const projects = await collection<AccessProject>(
        `/organizations/${encodeURIComponent(id)}/projects`,
      )
      if (sequence !== state.value.sequence) return
      state.value.projects = projects
      state.value.projectId = projects[0]?.id ?? ''
    } catch {
      if (sequence === state.value.sequence) state.value.error = t('access.unavailable')
    } finally {
      if (sequence === state.value.sequence) state.value.loading = false
    }
  }
  const reload = async () => {
    state.value.loading = true
    state.value.error = ''
    try {
      const session = await request<{ user: AccessUser }>('/auth/session')
      state.value.user = session.user
      state.value.organizations = await collection<AccessOrganization>('/organizations')
      const id =
        state.value.organizations.find((item) => item.id === state.value.organizationId)?.id ??
        state.value.organizations[0]?.id
      state.value.organizationId = ''
      if (id) await selectOrganization(id)
      return true
    } catch {
      state.value.user = null
      state.value.organizations = []
      state.value.projects = []
      state.value.organizationId = ''
      state.value.projectId = ''
      state.value.error = t('access.unavailable')
      return false
    } finally {
      state.value.loading = false
    }
  }
  const logout = async () => {
    if (!confirmDiscard()) return
    try {
      await request('/auth/logout', { method: 'POST' })
      unsaved.value = false
      reset()
      await navigateTo('/connexion')
    } catch {
      state.value.error = t('access.logoutFailed')
    }
  }
  const selectProject = (id: string) => {
    if (id === state.value.projectId || !confirmDiscard()) return
    if (state.value.projects.some((item) => item.id === id)) state.value.projectId = id
  }
  return {
    state,
    context,
    actions: { request, collection, reload, logout, selectOrganization, selectProject },
  }
}
