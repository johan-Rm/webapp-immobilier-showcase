<template>
  <div class="markdown-panel-mdc relative h-full min-h-0 w-full flex-1">
    <div
      ref="panelRef"
      class="markdown-panel h-full min-h-0 w-full py-4"
      :class="panelScrollClass"
      @scroll="updateScrollState"
    >
      <MDC class="px-6 2xl:px-16" :class="mdcContentClass" :value="markdownValue" />

      <footer v-if="contactEntries.length > 0" class="px-6 2xl:px-16">
        <div class="panel-footer-separator" aria-hidden="true" />

        <nav
          aria-label="Coordonnées de contact"
          class="text-foreground/70 flex flex-wrap gap-y-2 pt-6 text-sm"
          :class="footerNavClass"
        >
          <span
            v-for="(entry, index) in contactEntries"
            :key="entry.href"
            class="flex items-center gap-2"
            :class="getFooterNavItemClass(index)"
          >
            <AppLink
              :to="entry.href"
              :label="entry.label"
              variant="text"
              text-animation="fill"
              :text-class="LINK_FILL_TEXT_CLASS"
              :class="getFooterNavLinkClass(index)"
            />

            <!-- séparateur -->
            <span v-if="showContactSeparator(index)" class="opacity-40">•</span>
          </span>
        </nav>
      </footer>
    </div>

    <div
      v-show="canScrollFurther"
      aria-hidden="true"
      class="from-background via-background/80 pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t to-transparent"
    />
  </div>
</template>

<script setup lang="ts">
// 1. Imports
import type { WebPage } from '@schemas/interfaces'

// 2. Types et constantes statiques
type MarkdownPanelMdcProps = {
  content: WebPage | null
}

type ContactEntry = {
  label: string
  href: string
  icon: string
}

const LINK_FILL_TEXT_CLASS = 'from-secondary to-foreground/70 inline-block'

const SCROLL_END_TOLERANCE_PX = 2

// 3. Props et emits
const props = defineProps<MarkdownPanelMdcProps>()

// 4. Composables, stores, routeur
const appConfig = useAppConfig()

const { isPhoneDevice, isTabletPortrait } = useDeviceDetect()

// 5. Etat local
const canScrollFurther = ref(false)

let resizeObserver: ResizeObserver | null = null

// 6. Data inputs
const panelRef = ref<HTMLElement | null>(null)

// 7. Validation et helpers purs
const isCompactFooterNav = computed<boolean>(() => isPhoneDevice.value || isTabletPortrait.value)

const isMiddleFooterNavItem = (index: number): boolean => {
  return index === Math.floor(contactEntries.value.length / 2)
}

const getFooterNavItemClass = (index: number): string => {
  if (isCompactFooterNav.value) {
    return ''
  }

  const alignmentClass = isMiddleFooterNavItem(index) ? 'justify-center' : 'justify-start'

  return `min-w-0 flex-1 whitespace-nowrap ${alignmentClass}`
}

const getFooterNavLinkClass = (index: number): string => {
  if (isCompactFooterNav.value) {
    return 'text-left'
  }

  const alignmentClass = isMiddleFooterNavItem(index)
    ? 'justify-center text-center'
    : 'justify-start text-left'

  return `w-full ${alignmentClass}`
}

// 8. Computed UI-ready
const markdownValue = computed(() => {
  if (!props.content) return ''

  if (typeof props.content.text === 'string' && props.content.text.length > 0) {
    return props.content.text
  }

  return ''
})

// 9. Actions et handlers
const organizationEmail = computed<string>(() => appConfig.organization.email[0] ?? '')

const organizationPhoneNumbers = computed<string[]>(() => appConfig.organization.phoneNumbers ?? [])

const contactEntries = computed<ContactEntry[]>(() => {
  const entries: ContactEntry[] = []

  if (organizationEmail.value) {
    entries.push({
      label: organizationEmail.value,
      href: `mailto:${organizationEmail.value}`,
      icon: 'i-lucide-mail',
    })
  }

  entries.push(
    ...getOrganizationPhoneEntries(organizationPhoneNumbers.value).map((phoneEntry) => ({
      label: `${phoneEntry.label} ${phoneEntry.phone}`,
      href: phoneEntry.href,
      icon: 'i-lucide-phone',
    })),
  )

  return entries
})

const panelScrollClass = computed<string>(() => {
  if (isPhoneDevice.value || isTabletPortrait.value) {
    return 'overflow-visible'
  }

  return 'overflow-y-auto overscroll-contain'
})

const mdcContentClass = computed<string>(() => {
  if (isPhoneDevice.value || isTabletPortrait.value) {
    return ''
  }

  return 'pr-24'
})

const footerNavClass = computed<string>(() => {
  if (isCompactFooterNav.value) {
    return 'items-center justify-center gap-x-8'
  }

  return 'w-full flex-nowrap items-start justify-start gap-x-8'
})

const showContactSeparator = (index: number): boolean => {
  return isCompactFooterNav.value && index < contactEntries.value.length - 1
}

const updateScrollState = (): void => {
  const panel = panelRef.value

  if (!panel || isPhoneDevice.value || isTabletPortrait.value) {
    canScrollFurther.value = false
    return
  }

  const remainingScroll = panel.scrollHeight - panel.clientHeight - panel.scrollTop
  canScrollFurther.value = remainingScroll > SCROLL_END_TOLERANCE_PX
}

// 10. Watch et watchEffect
watch([markdownValue, contactEntries, isPhoneDevice, isTabletPortrait], async () => {
  await nextTick()
  updateScrollState()
})

// 11. Metadonnees ecran ou page

// 12. Lifecycle
onMounted(() => {
  updateScrollState()

  if (panelRef.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(updateScrollState)
    resizeObserver.observe(panelRef.value)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
})
</script>

<style scoped>
.panel-footer-separator {
  position: relative;
  height: 1px;
  width: 100%;
  margin: 3rem 0 0;

  background: rgb(var(--color-foreground) / 0.25);
}

.panel-footer-separator::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;

  width: 0.35rem;
  height: 0.35rem;
  border-radius: 999px;

  background: rgb(var(--color-foreground) / 0.9);

  transform: translate(-50%, -50%);
}

@keyframes separatorFadeIn {
  from {
    opacity: 0;
    transform: scaleX(0.6);
  }

  to {
    opacity: 1;
    transform: scaleX(1);
  }
}

@keyframes dotFadeIn {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.6);
  }

  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}
</style>
