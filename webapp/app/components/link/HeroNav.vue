<template>
  <NuxtLink v-if="!disabled && safeTo" :to="safeTo" :class="linkClasses">
    <slot />
  </NuxtLink>

  <span v-else aria-disabled="true" :class="disabledClasses">
    <slot />
  </span>
</template>

<script setup lang="ts">
// 1. Imports

// 2. Types et constantes statiques
type Props = {
  to?: string
  disabled?: boolean
}

const baseClasses =
  'pointer-events-auto relative mx-auto flex h-8 w-fit min-w-48 items-center justify-center self-center rounded-lg px-3 text-center text-[0.5625rem] tracking-wider text-white uppercase backdrop-blur transition-all duration-300 ease-out sm:h-9 sm:min-w-44 sm:px-4 sm:text-[0.6875rem] md:mx-0 md:h-10 md:min-w-0 md:flex-1 md:self-stretch md:rounded-xl md:text-xs md:backdrop-blur 2xl:h-20 2xl:text-2xl'

// 3. Props et emits
const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  to: undefined,
})

// 4. Composables, stores, routeur
const { isMobilePortrait, isTabletPortrait } = useDeviceDetect()

// 5. Etat local

// 6. Data inputs

// 7. Validation et helpers purs

// 8. Computed UI-ready
const safeTo = computed(() => props.to?.trim() || undefined)

const backgroundClasses = computed(() =>
  isMobilePortrait.value || isTabletPortrait.value ? 'bg-foreground/50' : 'bg-white/10',
)

const linkClasses = computed(() => [
  baseClasses,
  backgroundClasses.value,
  'hover:scale-[1.02] hover:bg-white/20 hover:text-white hover:shadow-lg hover:shadow-white/10 hover:backdrop-blur-md',
])

const disabledClasses = computed(() => [
  baseClasses,
  backgroundClasses.value,
  'cursor-not-allowed opacity-40 grayscale',
])

// 9. Actions et handlers

// 10. Watch et watchEffect

// 11. Metadonnees ecran ou page

// 12. Lifecycle
</script>
