export const useAppFooter = () => {
  const { appData } = useApp()

  const footer = computed<AppFooter | null>(() => {
    return appData.value?.footer ?? null
  })

  return {
    footer,
  }
}
