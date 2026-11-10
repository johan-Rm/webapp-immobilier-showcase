<template>
  <HeadingH2
    size="2xl"
    class="group absolute right-4 bottom-2 left-4 z-9999 whitespace-nowrap uppercase md:bottom-4 2xl:right-10 2xl:bottom-10 2xl:left-10"
  >
    <NuxtLink v-if="hasLink" :to="linkTarget" :class="hoverCss">
      <slot />
    </NuxtLink>
    <span v-else>
      <slot />
    </span>
  </HeadingH2>
</template>

<script setup lang="ts">
// 1. Imports

// 2. Types et constantes statiques

// 3. Props et emits
const props = defineProps<{
  to?: string
}>()

// 4. Composables, stores, routeur
const { currentMeta } = useScreenSystem()

// 5. Etat local

// 6. Data inputs

// 7. Validation et helpers purs
const hasLink = computed<boolean>(() => Boolean(props.to?.trim()))

// 8. Computed UI-ready
const hoverCss = computed(() => {
  return currentMeta.value?.layout?.imageZone === 'background'
    ? ''
    : 'hover:text-primary transition-colors'
})

// 9. Actions et handlers
const linkTarget = computed<string>(() => props.to?.trim() ?? '')

// 10. Watch et watchEffect

// 11. Metadonnees ecran ou page

// 12. Lifecycle
</script>
