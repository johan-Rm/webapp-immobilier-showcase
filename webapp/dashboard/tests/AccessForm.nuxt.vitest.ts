import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import AccessForm from '../app/components/dashboard/AccessForm.vue'

const doubles = vi.hoisted(() => ({ request: vi.fn(), reload: vi.fn(), navigate: vi.fn() }))
mockNuxtImport('navigateTo', () => doubles.navigate)
mockNuxtImport('useDashboardAccess', () => () => ({
  state: ref({ user: null, error: '' }),
  actions: { request: doubles.request, reload: doubles.reload },
}))
mockNuxtImport('useRoute', () => () => ({ path: '/connexion', query: {} }))
// Real form and auth composable; transport, navigation and access context are doubled.
const mounted: { unmount: () => void }[] = []
beforeEach(() => {
  vi.clearAllMocks()
  doubles.reload.mockResolvedValue(false)
})
afterEach(() => mounted.splice(0).forEach((wrapper) => wrapper.unmount()))
const mount = async () => {
  const wrapper = await mountSuspended(AccessForm, { props: { mode: 'login' } })
  mounted.push(wrapper)
  return wrapper
}

describe('AccessForm — contrat utilisateur', () => {
  it('attend une soumission explicite et ne publie aucun contenu', async () => {
    const wrapper = await mount()
    await wrapper.get('input[type=email]').setValue('client@example.test')
    await wrapper.get('input[type=password]').setValue('secret-de-test')
    expect(doubles.request).not.toHaveBeenCalled()
    doubles.request.mockResolvedValue({})
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(doubles.request.mock.calls).toEqual([
      [
        '/auth/login',
        { method: 'POST', body: { email: 'client@example.test', password: 'secret-de-test' } },
      ],
    ])
    expect(doubles.navigate).not.toHaveBeenCalled()
  })

  it('conserve la saisie et annonce le refus dans une alerte accessible', async () => {
    doubles.request.mockRejectedValue(new Error('refus simulé'))
    const wrapper = await mount()
    await wrapper.get('input[type=email]').setValue('client@example.test')
    await wrapper.get('input[type=password]').setValue('secret-de-test')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect((wrapper.get('input[type=email]').element as HTMLInputElement).value).toBe(
      'client@example.test',
    )
    expect((wrapper.get('input[type=password]').element as HTMLInputElement).value).toBe(
      'secret-de-test',
    )
    expect(wrapper.get('[role=alert]').text()).toContain('Impossible de terminer cette action.')
    expect(doubles.navigate).not.toHaveBeenCalled()
    expect(doubles.request).toHaveBeenCalledTimes(1)
  })
})
