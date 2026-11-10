import type { EchoRequest } from '#shared/types/echo'
import type { Ref } from 'vue'

import { storeToRefs } from 'pinia'
import { ref } from 'vue'

import { useEchoStore } from '~/stores/echo'

import { echoRequestSchema } from '#shared/schemas'

export type UseEchoReturn = {
  message: Ref<EchoRequest['message']>
  validationError: Ref<string | null>
  echoed: Ref<string | null>
  loading: Ref<boolean>
  error: Ref<ApiError | null>
  submit: () => Promise<void>
}

export const useEcho = (): UseEchoReturn => {
  const store = useEchoStore()
  const { echoed, loading, error } = storeToRefs(store)

  const message = ref<EchoRequest['message']>('')
  const validationError = ref<string | null>(null)

  const submit = async (): Promise<void> => {
    const parsed = echoRequestSchema.safeParse({ message: message.value })
    if (!parsed.success) {
      validationError.value = parsed.error.issues[0]?.message ?? 'Message invalide'
      return
    }

    validationError.value = null
    await store.sendEcho(parsed.data)
  }

  return {
    message,
    validationError,
    echoed,
    loading,
    error,
    submit,
  }
}
