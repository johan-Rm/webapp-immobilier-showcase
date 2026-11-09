<template>
  <nav :aria-label="navAriaLabel" class="flex items-center">
    <ul class="flex items-center gap-2">
      <li v-for="loc in availableLocales" :key="loc.code">
        <NuxtLink
          v-if="loc.code !== currentLocale"
          :to="switchLocalePath(loc.code)"
          class="inline-flex items-center gap-1 text-xs font-semibold tracking-widest uppercase opacity-50 transition-opacity duration-200 hover:opacity-100"
          :class="colorClass"
          :aria-label="loc.name"
        >
          <span aria-hidden="true">{{ loc.flag }}</span>
          <span>{{ loc.code.toUpperCase() }}</span>
        </NuxtLink>

        <span
          v-else
          aria-current="true"
          class="inline-flex cursor-default items-center gap-1 text-xs font-semibold tracking-widest uppercase opacity-100"
          :class="colorClass"
          :aria-label="loc.name"
        >
          <span aria-hidden="true">{{ loc.flag }}</span>
          <span>{{ loc.code.toUpperCase() }}</span>
        </span>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
// 1. Imports

// 2. Types et constantes statiques
type ColorVariant = 'default' | 'contrast'

// 3. Props et emits
const props = withDefaults(
  defineProps<{
    variant?: ColorVariant
  }>(),
  {
    variant: 'default',
  },
)

// 4. Composables, stores, routeur
const { locale } = useI18n()
const switchLocalePath = useSwitchLocalePath()
const { appData } = useAppNavigation()
const { enabledLocales } = useProjectLocales()

// 5. Etat local

// 6. Data inputs
// Seules les locales activees pour le projet courant sont proposees.
const availableLocales = enabledLocales

// 7. Validation et helpers purs

// 8. Computed UI-ready
const currentLocale = computed(() => locale.value)

const navAriaLabel = computed<string>(
  () => appData.value?.components?.langSwitcher?.navAriaLabel ?? 'Switch language',
)

const colorClass = computed<string>(() => {
  return props.variant === 'contrast' ? 'text-white' : 'text-foreground'
})
</script>
