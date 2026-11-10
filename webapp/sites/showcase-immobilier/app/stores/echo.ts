import type { EchoRequest, EchoResponse } from '#shared/types/echo'
import type { FetchError } from 'ofetch'

import { defineStore } from 'pinia'
import { ref } from 'vue'

import { postEcho } from '@services/api/echo'

const isApiError = (value: unknown): value is ApiError => {
  if (!value || typeof value !== 'object') return false
  if (!('status' in value) || !('message' in value)) return false
  return typeof (value as { status: unknown }).status === 'number'
}

const normalizeApiError = (error: unknown): ApiError => {
  const maybeFetchError = error as FetchError | null
  const data = maybeFetchError?.data as unknown
  if (isApiError(data)) return data

  return { status: 500, message: 'Erreur inattendue' }
}

export const useEchoStore = defineStore('echo', () => {
  const echoed = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<ApiError | null>(null)

  const sendEcho = async (payload: EchoRequest): Promise<EchoResponse | null> => {
    loading.value = true
    error.value = null

    try {
      const response = await postEcho(payload, $fetch as JsonFetcher)
      echoed.value = response.echoed
      return response
    } catch (err) {
      error.value = normalizeApiError(err)
      echoed.value = null
      return null
    } finally {
      loading.value = false
    }
  }

  return {
    echoed,
    loading,
    error,
    sendEcho,
  }
})
