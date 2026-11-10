type AppMenuGroupKey = 'primaryMenuItems' | 'secondaryMenuItems' | 'otherItems'
type NavigationMenuItem = MenuItem & { identifier: string; name: string; url: string }

type UseAppNavigationReturn = {
  appData: ComputedRef<App | null>
  navigationItems: ComputedRef<NavigationMenuItem[]>
  primaryMenuItems: ComputedRef<NavigationMenuItem[]>
  secondaryMenuItems: ComputedRef<NavigationMenuItem[]>
  otherItems: ComputedRef<NavigationMenuItem[]>
  getMenuItemByIdentifier: (identifier: string) => NavigationMenuItem | null
}

export const useAppNavigation = (): UseAppNavigationReturn => {
  const { appData } = useApp()
  const appConfig = useAppConfig()

  const navigationItems = computed<NavigationMenuItem[]>(() => {
    const navigation = appData.value?.navigation

    if (!navigation) {
      return []
    }

    return Object.entries(navigation).map(([identifier, item]) => ({
      identifier,
      ...item,
    }))
  })

  const navigationMap = computed<Map<string, NavigationMenuItem>>(
    () => new Map(navigationItems.value.map((item) => [item.identifier, item])),
  )

  const resolveMenuGroup = (groupKey: AppMenuGroupKey): NavigationMenuItem[] => {
    const identifiers = appConfig.menu?.[groupKey] ?? []

    return identifiers
      .map((identifier) => navigationMap.value.get(identifier))
      .filter((item): item is NavigationMenuItem => item !== undefined)
  }

  const primaryMenuItems = computed<NavigationMenuItem[]>(() =>
    resolveMenuGroup('primaryMenuItems'),
  )
  const secondaryMenuItems = computed<NavigationMenuItem[]>(() =>
    resolveMenuGroup('secondaryMenuItems'),
  )
  const otherItems = computed<NavigationMenuItem[]>(() => resolveMenuGroup('otherItems'))

  const getMenuItemByIdentifier = (identifier: string): NavigationMenuItem | null => {
    return navigationMap.value.get(identifier) ?? null
  }

  return {
    appData,
    navigationItems,
    primaryMenuItems,
    secondaryMenuItems,
    otherItems,
    getMenuItemByIdentifier,
  }
}
