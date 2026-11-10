import type { Ref } from 'vue'

interface ModalItem {
  visible: boolean
}

interface Modals {
  example1: ModalItem
}

interface SidePanelItem {
  visible: boolean
}
interface SidePanels {
  designControls: SidePanelItem
  mainMenu: SidePanelItem
}

type UseDashboardReturn = {
  isCommandPropertyOpen: Ref<boolean>
  openCommandProperty: () => void
  closeCommandProperty: () => void
  toggleCommandProperty: () => void
  sidePanels: Ref<SidePanels>
  openSidePanel: (key: keyof SidePanels) => void
  closeSidePanel: (key: keyof SidePanels) => void
  toggleSidePanel: (key: keyof SidePanels) => void
  hideSidePanelsItems: () => void
}

const _useDashboard = (): UseDashboardReturn => {
  const route = useRoute()
  const { loggedIn } = useUserSession()

  const isCommandPropertyOpen = useState<boolean>('ui.commandProperty.open', () => false)

  const openCommandProperty = (): void => {
    isCommandPropertyOpen.value = true
  }

  const closeCommandProperty = (): void => {
    isCommandPropertyOpen.value = false
  }

  const toggleCommandProperty = (): void => {
    isCommandPropertyOpen.value = !isCommandPropertyOpen.value
  }

  // Variante de livrable statique : le menu principal s'ouvre normalement au
  // clic. Sans script, il resterait inaccessible ; ce drapeau permet d'en
  // produire une version deja ouverte, sans effet sur le site vivant.
  const isStaticMenuOpen = useRuntimeConfig().public.staticMenuOpen === true

  const sidePanels = ref<SidePanels>({
    designControls: { visible: false },
    mainMenu: { visible: isStaticMenuOpen },
  })

  const modals = ref<Modals>({
    example1: { visible: false },
  })

  const hideModalsItems = (): void => {
    const keys = Object.keys(modals.value) as Array<keyof Modals>
    keys.forEach((item) => {
      modals.value[item].visible = false
    })
  }

  const hideSidePanelsItems = (): void => {
    Object.keys(sidePanels.value).forEach((item) => {
      sidePanels.value[item as keyof SidePanels].visible = false
    })
  }

  const openSidePanel = (key: keyof SidePanels): void => {
    hideSidePanelsItems()
    sidePanels.value[key].visible = true
  }

  const closeSidePanel = (key: keyof SidePanels): void => {
    sidePanels.value[key].visible = false
  }

  const toggleSidePanel = (key: keyof SidePanels): void => {
    if (sidePanels.value[key].visible) {
      sidePanels.value[key].visible = false
      return
    }
    hideSidePanelsItems()
    sidePanels.value[key].visible = true
  }

  if (import.meta.client) {
    defineShortcuts({
      meta_q: {
        usingInput: true,
        handler: () => {
          if (!loggedIn.value) return
          toggleSidePanel('designControls')
        },
      },
      ctrl_s: {
        usingInput: true,
        handler: () => {
          if (!loggedIn.value) return
          toggleCommandProperty()
        },
      },
      ctrl_d: {
        usingInput: false,
        handler: () => {
          // Si l'on consulte une fiche bien, on transmet son slug pour pré-sélectionner
          // le même bien dans le dashboard (cf. PropertyWorkspace).
          const slug = route.params.accommodationSlug
          const targetSlug = Array.isArray(slug) ? slug.at(-1) : slug

          navigateTo({
            path: useLocalePath()('/dashboard'),
            query: targetSlug ? { slug: targetSlug } : undefined,
          })
        },
      },
    })
  }
  watch(
    () => route.fullPath,
    () => {
      hideModalsItems()
      hideSidePanelsItems()
      // showLogostate()
    },
  )

  return {
    isCommandPropertyOpen,
    openCommandProperty,
    closeCommandProperty,
    toggleCommandProperty,
    sidePanels,
    openSidePanel,
    closeSidePanel,
    toggleSidePanel,
    hideSidePanelsItems,
  }
}

export const useDashboard = createSharedComposable(_useDashboard)
