type SymfonyStatus = { available: boolean; error?: string }

export const useSymfonyStatus = () => {
  const available = ref<boolean | null>(null)
  const checking = ref(false)

  const check = async (): Promise<void> => {
    checking.value = true
    try {
      const result = await $fetch<SymfonyStatus>('/api/dashboard/symfony-status')
      available.value = result.available
    } catch {
      available.value = false
    } finally {
      checking.value = false
    }
  }

  return { available, checking, check }
}
