type AccessMember = { id: string; email: string }

export const useDashboardAdmin = () => {
  const { t } = useI18n()
  const access = useDashboardAccess()
  const state = reactive({
    organizationName: '',
    projectName: '',
    email: '',
    members: [] as AccessMember[],
    pending: false,
    loadingMembers: false,
    error: '',
    success: '',
  })
  const loadMembers = async () => {
    state.members = []
    state.loadingMembers = false
    if (!access.context.value.canManageMembers || !access.state.value.organizationId) return
    const id = access.state.value.organizationId
    state.loadingMembers = true
    try {
      const result = await access.actions.collection<AccessMember>(
        `/organizations/${encodeURIComponent(id)}/members`,
      )
      if (id === access.state.value.organizationId) state.members = result
    } catch {
      if (id === access.state.value.organizationId) state.error = t('admin.failed')
    } finally {
      if (id === access.state.value.organizationId) state.loadingMembers = false
    }
  }
  const run = async (action: 'organization' | 'project' | 'invite' | 'remove', memberId = '') => {
    if (state.pending) return
    state.error = ''
    state.success = ''
    state.pending = true
    try {
      const organizationId = access.state.value.organizationId
      if (['organization', 'project'].includes(action) && !access.context.value.platformAdmin)
        throw new Error('forbidden')
      if (
        ['invite', 'remove'].includes(action) &&
        (!organizationId || !access.context.value.canManageMembers)
      )
        throw new Error('forbidden')
      if (action === 'project' && !organizationId) throw new Error('organization_required')
      if (action === 'organization')
        await access.actions.request('/organizations', {
          method: 'POST',
          body: { name: state.organizationName },
        })
      if (action === 'project')
        await access.actions.request('/projects', {
          method: 'POST',
          body: { organizationId, name: state.projectName },
        })
      if (action === 'invite')
        await access.actions.request(
          `/organizations/${encodeURIComponent(organizationId)}/invitations`,
          { method: 'POST', body: { email: state.email } },
        )
      if (action === 'remove')
        await access.actions.request(
          `/organizations/${encodeURIComponent(organizationId)}/members/${encodeURIComponent(memberId)}`,
          { method: 'DELETE' },
        )
      if (action === 'organization' || action === 'project') {
        if (!(await access.actions.reload())) throw new Error('refresh_failed')
      } else await loadMembers()
      if (!state.error) state.success = t('admin.saved')
    } catch {
      state.error = t('admin.failed')
    } finally {
      state.pending = false
    }
  }
  watch(
    () => access.state.value.organizationId,
    () => {
      state.error = ''
      state.success = ''
      void loadMembers()
    },
    { immediate: true },
  )
  return { state, run }
}
