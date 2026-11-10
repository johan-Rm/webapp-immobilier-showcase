<template>
  <UDropdownMenu
    v-if="isActive"
    v-model:open="open"
    :items="items"
    :content="{ align: 'start', side: 'bottom', sideOffset: 4, collisionPadding: 8 }"
    :ui="menuUi"
  >
    <!-- Trigger invisible ancré sous le doigt : le menu s'ouvre programmatiquement. -->
    <span
      aria-hidden="true"
      class="pointer-events-none fixed block h-px w-px"
      :style="{ left: `${anchor.x}px`, top: `${anchor.y}px` }"
    />
  </UDropdownMenu>
</template>

<script setup lang="ts">
// 1. Imports

// 2. Types et constantes statiques
type ActionItem = {
  label: string
  icon: string
  onSelect: () => void
}

const VIEWPORT_MARGIN = 8

const IGNORE_SELECTOR = [
  'a',
  'button',
  'input',
  'label',
  'option',
  'select',
  'summary',
  'textarea',
  '[contenteditable]',
  '[role="button"]',
  '[role="combobox"]',
  '[role="listbox"]',
  '[role="menuitem"]',
  '[role="option"]',
  '[data-no-swipe]',
  '[data-screen-touch-ignore]',
].join(', ')

// Thème dashboard : fond #212121, accent olive #6B7A4A, libellés FR en dur.
const menuUi = {
  content: 'min-w-52 border border-white/10 bg-[#212121]',
  item: 'text-white/80 data-highlighted:bg-white/5 data-highlighted:text-white',
  itemLeadingIcon: 'text-[#6B7A4A]',
} as const

// 3. Props et emits

// 4. Composables, stores, routeur
const { loggedIn } = useUserSession()
const { isPhoneDevice, isTabletDevice } = useDeviceDetect()
const { openCommandProperty } = useDashboard()
const localePath = useLocalePath()
const route = useRoute()

// 5. Etat local
const open = ref(false)
const anchor = reactive<{ x: number; y: number }>({ x: 0, y: 0 })

// 6. Data inputs

// 7. Validation et helpers purs
const clampToViewport = (value: number, max: number): number =>
  Math.min(Math.max(value, VIEWPORT_MARGIN), Math.max(max - VIEWPORT_MARGIN, VIEWPORT_MARGIN))

// 8. Computed UI-ready
// Réservé aux admins connectés sur appareils tactiles (téléphone + tablette).
const isActive = computed<boolean>(
  () => loggedIn.value && (isPhoneDevice.value || isTabletDevice.value),
)

const items = computed<ActionItem[][]>(() => [
  [
    {
      label: 'Rechercher un bien',
      icon: 'i-lucide-search',
      onSelect: () => openCommandProperty(),
    },
    {
      label: 'Tableau de bord',
      icon: 'i-lucide-layout-dashboard',
      onSelect: () => {
        void navigateTo(localePath('/dashboard'))
      },
    },
  ],
])

// 9. Actions et handlers
const closeMenu = (): void => {
  open.value = false
}

const handleLongPress = (point: { x: number; y: number }): void => {
  anchor.x = clampToViewport(point.x, window.innerWidth)
  anchor.y = clampToViewport(point.y, window.innerHeight)
  open.value = true
}

useLongPress({
  enabled: isActive,
  ignoreSelector: IGNORE_SELECTOR,
  onLongPress: handleLongPress,
})

// 10. Watch et watchEffect
// Fermeture au changement de route et au scroll (en plus du tap extérieur natif).
watch(() => route.fullPath, closeMenu)

watch(open, (isOpen) => {
  if (isOpen) window.addEventListener('scroll', closeMenu, { passive: true, once: true })
  else window.removeEventListener('scroll', closeMenu)
})

// 11. Metadonnees ecran ou page

// 12. Lifecycle
onUnmounted(() => {
  window.removeEventListener('scroll', closeMenu)
})
</script>
