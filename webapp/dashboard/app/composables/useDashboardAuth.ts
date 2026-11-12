export const useDashboardAuth = (mode: 'login' | 'invitation' | 'forgot' | 'reset') => {
  const { t } = useI18n()
  const route = useRoute()
  const access = useDashboardAccess()
  const pendingInvitation = useState('saas.pendingInvitation', () => '')
  const state = reactive({
    email: '',
    password: '',
    token: '',
    pending: false,
    error: '',
    success: '',
  })
  const submit = async () => {
    if (state.pending) return
    state.error = ''
    state.success = ''
    state.pending = true
    const path = {
      login: '/auth/login',
      invitation: '/auth/invitations/accept',
      forgot: '/auth/password/forgot',
      reset: '/auth/password/reset',
    }[mode]
    const body =
      mode === 'login'
        ? { email: state.email, password: state.password }
        : mode === 'forgot'
          ? { email: state.email }
          : mode === 'invitation' && access.state.value.user
            ? { token: state.token }
            : { token: state.token, password: state.password }
    try {
      await access.actions.request(path, { method: 'POST', body })
      if (mode === 'login') {
        if (await access.actions.reload())
          await navigateTo(pendingInvitation.value ? '/invitation' : '/')
        else state.error = t('access.unavailable')
      } else {
        state.password = ''
        if (mode === 'invitation') {
          pendingInvitation.value = ''
          state.token = ''
        }
        state.success = t(`auth.${mode}Success`)
      }
    } catch {
      state.error = t('auth.failed')
    } finally {
      state.pending = false
    }
  }
  const loginExisting = () => {
    pendingInvitation.value = state.token
    return navigateTo('/connexion')
  }
  onMounted(() => {
    if (mode === 'invitation') state.token = pendingInvitation.value
    if (typeof route.query.token === 'string') {
      state.token = route.query.token
      if (mode === 'invitation') pendingInvitation.value = state.token
      const query = { ...route.query }
      delete query.token
      void navigateTo({ path: route.path, query }, { replace: true })
    }
  })
  return { state, submit, loginExisting }
}
