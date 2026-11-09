import type { Ref } from 'vue'

import { computed } from 'vue'

type PendingKey = string

type UseAppPendingReturn = {
  pendingKeys: Ref<PendingKey[]>
  pendingCount: Readonly<Ref<number>>
  isPending: Readonly<Ref<boolean>>
  startPending: (key: PendingKey) => void
  stopPending: (key: PendingKey) => void
}

export const useAppPending = (): UseAppPendingReturn => {
  const pendingKeys = useState<PendingKey[]>('app.pending.keys', () => [])
  const pendingCount = computed(() => pendingKeys.value.length)
  const isPending = computed(() => pendingCount.value > 0)

  const startPending = (key: PendingKey): void => {
    if (!pendingKeys.value.includes(key)) {
      pendingKeys.value = [...pendingKeys.value, key]
    }
  }

  const stopPending = (key: PendingKey): void => {
    if (pendingKeys.value.includes(key)) {
      pendingKeys.value = pendingKeys.value.filter((entry) => entry !== key)
    }
  }

  return {
    pendingKeys,
    pendingCount,
    isPending,
    startPending,
    stopPending,
  }
}
