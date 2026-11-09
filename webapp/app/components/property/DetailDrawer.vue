<template>
  <!--
    Shell présentationnel du drawer de détail d'un bien, partagé par la fiche classique
    (ScreenPropertyDetail) et le parcours immersif (PropertyExceptionalInfoPanel).
    S'appuie sur USlideover (Nuxt UI) : Teleport, focus-trap, scroll-lock, ESC, role=dialog
    et transitions sont gérés nativement. Bottom-sheet sur mobile, panneau latéral sur desktop.
  -->
  <USlideover
    :open="open"
    :side="isMobile ? 'bottom' : desktopSide"
    :ui="slideoverUi"
    :aria-label="ariaLabel"
    @update:open="emit('update:open', $event)"
  >
    <template #content>
      <div
        class="bg-background text-foreground relative flex h-dvh min-h-0 w-full flex-col"
        data-screen-touch-ignore
      >
        <!-- Poignée de fermeture mobile (bottom-sheet). -->
        <div class="relative flex items-center justify-center px-4 py-3 lg:hidden">
          <UButton
            type="button"
            class="bg-surface text-foreground absolute -top-4 left-1/2 inline-flex -translate-x-1/2 items-center justify-center rounded-full border-0 p-2 shadow-lg shadow-black/10"
            aria-label="Fermer les détails"
            color="neutral"
            variant="ghost"
            :ui="{ base: 'rounded-full border-0 shadow-none ring-0 hover:bg-transparent' }"
            @click="emit('update:open', false)"
          >
            <UIcon name="i-lucide-chevrons-down" class="text-xl" aria-hidden="true" />
          </UButton>
        </div>

        <!-- Fermeture desktop (panneau latéral). -->
        <UButton
          type="button"
          class="text-foreground/60 hover:text-foreground absolute top-4 right-4 z-10 hidden h-9 w-9 items-center justify-center rounded-full lg:flex"
          aria-label="Fermer les détails"
          color="neutral"
          variant="ghost"
          :ui="{ base: 'rounded-full border-0 shadow-none ring-0 hover:bg-transparent' }"
          @click="emit('update:open', false)"
        >
          <UIcon name="i-lucide-x" class="text-xl" aria-hidden="true" />
        </UButton>

        <div class="flex min-h-0 flex-1 flex-col">
          <slot />
        </div>
      </div>
    </template>
  </USlideover>
</template>

<script setup lang="ts">
// 1. Imports
import { computed, onMounted, onUnmounted, ref } from 'vue'

// 3. Props et emits
const props = withDefaults(
  defineProps<{
    open: boolean
    desktopSide?: 'left' | 'right'
    contentClass?: string
    ariaLabel?: string
  }>(),
  {
    desktopSide: 'left',
    contentClass: 'w-[min(92vw,28rem)]',
    ariaLabel: undefined,
  },
)

const emit = defineEmits<{ 'update:open': [value: boolean] }>()

// 5. Etat local
const isMobile = ref(false)
let mediaQuery: MediaQueryList | null = null

const handleMediaQueryChange = (event: MediaQueryListEvent): void => {
  isMobile.value = event.matches
}

// 8. Computed UI-ready
const slideoverUi = computed(() =>
  isMobile.value
    ? {
        content: 'max-h-[82dvh] bg-background text-foreground ring-0 shadow-none',
        overlay: 'bg-black/55',
      }
    : {
        content: `${props.contentClass} bg-background text-foreground ring-0 sm:ring-0 shadow-none sm:shadow-none`,
        overlay: 'bg-black/55',
      },
)

// 12. Lifecycle
onMounted(() => {
  mediaQuery = window.matchMedia('(max-width: 1023px)')
  isMobile.value = mediaQuery.matches
  mediaQuery.addEventListener('change', handleMediaQueryChange)
})

onUnmounted(() => {
  if (mediaQuery) {
    mediaQuery.removeEventListener('change', handleMediaQueryChange)
  }
})
</script>
