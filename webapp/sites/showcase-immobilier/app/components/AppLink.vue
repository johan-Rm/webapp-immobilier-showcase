<template>
  <!-- ✅ lien actif -->
  <NuxtLink
    v-if="!disabled"
    :to="to"
    :aria-label="ariaLabel"
    :target="target"
    :rel="computedRel"
    :class="rootClass"
    prefetch-on="visibility"
    @click="handleAppLinkClick"
    @mouseenter="emit('mouseenter')"
    @focus="emit('focus')"
  >
    <LazyUIcon v-if="shouldRenderLeadingIcon" :name="icon" :class="iconClass" />

    <template v-if="shouldRenderTextContent">
      <span
        v-if="isTextVariant && textAnimation === 'slide-line'"
        aria-hidden="true"
        :class="lineClass"
      />

      <LazyUIcon
        v-if="isTextVariant && textAnimation === 'slide-arrow'"
        name="i-lucide-arrow-right"
        aria-hidden="true"
        :class="arrowClass"
      />

      <span :class="resolvedTextClass">
        <slot>{{ label }}</slot>
      </span>
    </template>

    <LazyUIcon v-if="shouldRenderTrailingIcon" :name="icon" :class="iconClass" />
  </NuxtLink>

  <!-- 🚫 lien désactivé -->
  <span v-else :aria-label="ariaLabel" aria-disabled="true" :class="disabledClass">
    <LazyUIcon v-if="shouldRenderLeadingIcon" :name="icon" :class="iconClass" />

    <template v-if="shouldRenderTextContent">
      <span :class="resolvedTextClass">
        <slot>{{ label }}</slot>
      </span>
    </template>

    <LazyUIcon v-if="shouldRenderTrailingIcon" :name="icon" :class="iconClass" />
  </span>
</template>

<script setup lang="ts">
// 1. Imports
import type { RouteLocationRaw } from 'vue-router'

// 2. Types et constantes statiques
type AppLinkVariant = 'icon' | 'text'

type AppLinkTextAnimation = 'none' | 'fill' | 'slide-line' | 'slide-arrow'

type AppLinkIconPosition = 'left' | 'right'

type AppLinkProps = {
  to: RouteLocationRaw
  icon?: string
  iconPosition?: AppLinkIconPosition
  label?: string
  ariaLabel?: string
  target?: AppLinkTarget
  rel?: string
  iconClass?: string
  textClass?: string
  variant?: AppLinkVariant
  textAnimation?: AppLinkTextAnimation
  disabled?: boolean // 🔥 NEW
}

// 3. Props et emits
const props = withDefaults(defineProps<AppLinkProps>(), {
  icon: '',
  iconPosition: 'left',
  label: '',
  ariaLabel: '',
  target: undefined,
  rel: undefined,
  iconClass: 'h-4 w-4 transition duration-200',
  textClass: '',
  variant: 'icon',
  textAnimation: 'none',
  disabled: false, // 🔥 default
})

const emit = defineEmits<{
  mouseenter: []
  focus: []
}>()

// 4. Composables, stores, routeur
const slots = useSlots()

const router = useRouter()

const { isConstructionEnabled, open: openConstructionModal } = useConstructionModal()

// 5. Etat local

// 6. Data inputs

// 7. Validation et helpers purs
const isIconVariant = computed<boolean>(() => props.variant === 'icon')

const isTextVariant = computed<boolean>(() => props.variant === 'text')

const hasDefaultSlot = computed<boolean>(() => Boolean(slots.default))

const hasTextContent = computed<boolean>(() => Boolean(props.label) || hasDefaultSlot.value)

const shouldRenderTextContent = computed<boolean>(() => isTextVariant.value || hasTextContent.value)

const shouldRenderLeadingIcon = computed<boolean>(() => {
  if (!props.icon) return false
  return isIconVariant.value || props.iconPosition === 'left'
})

const shouldRenderTrailingIcon = computed<boolean>(() => {
  if (!props.icon || !hasTextContent.value) return false
  return isTextVariant.value && props.iconPosition === 'right'
})

const resolvedTextClass = computed<string>(() => {
  const base = props.textClass?.trim() ?? ''

  if (!isTextVariant.value) return base

  if (props.textAnimation === 'fill') {
    const fillClass =
      'inline-block bg-gradient-to-r from-white from-50% to-foreground to-50% bg-[length:200%_100%] bg-right bg-clip-text text-transparent transition-[background-position] duration-500 group-hover:bg-left'
    return [fillClass, base].filter(Boolean).join(' ')
  }

  if (props.textAnimation === 'slide-line' || props.textAnimation === 'slide-arrow') {
    const slideClass =
      'inline-block transition-transform duration-300 ease-out group-hover:translate-x-4'
    return [slideClass, base].filter(Boolean).join(' ')
  }

  return base
})

// 8. Computed UI-ready

// 9. Actions et handlers
const computedRel = computed<string | undefined>(() => {
  if (props.rel) return props.rel
  return props.target === '_blank' ? 'noopener noreferrer' : undefined
})

const rootClass = computed<string>(() => {
  if (isIconVariant.value) {
    return 'group inline-flex h-11 w-11 items-center justify-center rounded-2xl border-2 border-foreground/95 text-foreground transition-colors duration-200 hover:bg-foreground hover:text-white'
  }

  if (props.textAnimation === 'slide-line') {
    return 'group relative inline-flex pl-1 items-center transition'
  }

  if (props.textAnimation === 'slide-arrow') {
    return 'group relative inline-flex items-center pl-1 transition'
  }

  return 'group inline-flex items-center transition'
})

const disabledClass = computed<string>(() => {
  return [rootClass.value, 'cursor-not-allowed opacity-40 grayscale pointer-events-none']
    .filter(Boolean)
    .join(' ')
})

const lineClass = computed<string>(() => {
  return 'pointer-events-none absolute top-1/2 left-0 h-[1px] w-3 -translate-y-1/2 -translate-x-5 bg-current opacity-0 transition-all duration-300 ease-out group-hover:translate-x-0 group-hover:opacity-100'
})

const arrowClass = computed<string>(() => {
  return 'pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 -translate-x-2 opacity-0 transition-all duration-300 ease-out group-hover:translate-x-0 group-hover:opacity-100'
})

const handleAppLinkClick = (event: MouseEvent): void => {
  if (props.disabled) {
    event.preventDefault()
    return
  }

  if (!isConstructionEnabled.value) return

  // Laisser passer les liens vers le dashboard, même en mode construction.
  if (isConstructionExemptPath(router.resolve(props.to).path)) return

  event.preventDefault()
  openConstructionModal()
}

// 10. Watch et watchEffect

// 11. Metadonnees ecran ou page

// 12. Lifecycle
</script>
