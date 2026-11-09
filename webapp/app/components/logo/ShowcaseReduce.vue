<template>
  <div
    v-if="effectiveVisible && needsContainer"
    class="inline-flex"
    :class="[props.containerClass, contextualContainerClass]"
  >
    <NuxtLink
      :to="props.to"
      class="inline-flex items-center justify-center"
      :aria-label="logoAriaLabel"
      @click="handleClick"
    >
      <ReduceLogoSvg
        class="w-auto"
        :class="[{ 'logo-showcase-reduce--mono': props.mono }, props.colorClass, sizeClass]"
        :style="inlineSize"
      />
    </NuxtLink>
  </div>
  <NuxtLink
    v-else-if="effectiveVisible"
    :to="props.to"
    class="inline-flex items-center justify-center"
    :aria-label="logoAriaLabel"
    @click="handleClick"
  >
    <ReduceLogoSvg
      class="w-auto"
      :class="[{ 'logo-showcase-reduce--mono': props.mono }, props.colorClass, sizeClass]"
      :style="inlineSize"
    />
  </NuxtLink>
</template>

<script setup lang="ts">
// 1. Imports
import ReduceLogoSvg from '~/assets/logo/showcase-reduce.svg'

// 2. Types et constantes statiques
type PresetSize = 'sm' | 'md' | 'lg' | 'xl'

// 3. Props et emits
const props = withDefaults(
  defineProps<{
    colorClass?: string
    size?: PresetSize | number
    mono?: boolean
    forceVisible?: boolean
    ariaLabel?: string
    to?: string
    containerClass?: string
  }>(),
  {
    colorClass: 'text-foreground',
    size: 'lg',
    mono: true,
    forceVisible: false,
    ariaLabel: undefined,
    to: '/',
    containerClass: undefined,
  },
)

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

// 4. Composables, stores, routeur
const { appData } = useApp()
const { currentMeta } = useScreenSystem()

const route = useRoute()

const localePath = useLocalePath()

// 5. Etat local

// 6. Data inputs

// 7. Validation et helpers purs
const isPlainLeftClick = (event: MouseEvent): boolean =>
  event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey

// 8. Computed UI-ready
const logoAriaLabel = computed(() => props.ariaLabel ?? appData.value?.components?.logo?.ariaLabel)
const sizeClass = computed(() => {
  if (typeof props.size === 'number') return ''
  const map: Record<PresetSize, string> = {
    sm: 'h-8',
    md: 'h-12',
    lg: 'h-20',
    xl: 'h-28',
  }
  return map[props.size] ?? map.lg
})

const inlineSize = computed(() =>
  typeof props.size === 'number' ? { height: `${props.size}px` } : undefined,
)

const isVisible = computed(() => currentMeta.value?.logo?.visible === true)

const effectiveVisible = computed(() => props.forceVisible || isVisible.value)

const contextualContainerClass = computed(() => {
  if (currentMeta.value?.logo?.containerVariant !== 'glass') return undefined
  return 'rounded-3xl bg-black/20 p-2 backdrop-blur'
})

const needsContainer = computed(
  () => Boolean(props.containerClass) || Boolean(contextualContainerClass.value),
)

const isHomeLandingTarget = computed(() => {
  const target = splitTarget(props.to)
  return target.path === normalizeRoutePath(localePath('/')) && target.hash === '#screen-landing'
})

// 9. Actions et handlers
const splitTarget = (value: string): { path: string; hash: string } => {
  const [pathPart, hashPart] = value.split('#', 2)

  return {
    path: normalizeRoutePath(pathPart && pathPart.length > 0 ? pathPart : '/'),
    hash: hashPart ? `#${hashPart}` : '',
  }
}

const triggerHashSync = (): void => {
  window.dispatchEvent(new Event('hashchange'))
}

const handleClick = (event: MouseEvent): void => {
  emit('click', event)

  if (!import.meta.client || !isPlainLeftClick(event)) return
  if (!isHomeLandingTarget.value) return

  const isHomeRoute = normalizeRoutePath(route.path) === normalizeRoutePath(localePath('/'))
  if (!isHomeRoute) return

  event.preventDefault()

  if (window.location.hash !== '#screen-landing') {
    window.location.hash = '#screen-landing'
    return
  }

  triggerHashSync()
}

// 10. Watch et watchEffect

// 11. Metadonnees ecran ou page

// 12. Lifecycle
</script>

<style scoped>
.logo-showcase-reduce--mono :deep(path),
.logo-showcase-reduce--mono :deep(rect),
.logo-showcase-reduce--mono :deep(circle),
.logo-showcase-reduce--mono :deep(ellipse),
.logo-showcase-reduce--mono :deep(polygon),
.logo-showcase-reduce--mono :deep(polyline) {
  fill: currentColor;
  stroke: currentColor;
}

.logo-showcase-reduce--mono :deep([fill='white']),
.logo-showcase-reduce--mono :deep([style*='fill:white']),
.logo-showcase-reduce--mono :deep([style*='fill: white']) {
  fill: white;
}
</style>
