<template>
  <div
    class="screen-blockquote bg-background text-foreground relative h-full w-full overflow-hidden"
  >
    <div
      class="relative z-10 flex h-full w-full flex-col items-center justify-center gap-8 text-center"
    >
      <LazyHeadingH2Screen :to="sectionLink">
        {{ sectionTitle }}
      </LazyHeadingH2Screen>

      <LazyBlockquoteDefault :phrases="quotePhrases" :active-index="activeQuoteIndex" />

      <div class="sr-only" aria-hidden="true">
        <h3 v-for="phrase in quotePhrases" :key="phrase">
          {{ phrase }}
        </h3>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 1. Imports

// 2. Types et constantes statiques
type BlockquoteScreenProps = {
  data?: CreativeWork
}

const columnTemplate: ScreenColumnTemplate = 'single'

// 3. Props et emits
const props = defineProps<BlockquoteScreenProps>()

// 4. Composables, stores, routeur
const logger = useLogger({ module: 'screen-blockquote' })
const localePath = useLocalePath()
const { getMenuItemByIdentifier } = useAppNavigation()
const { setScreenMeta } = useScreenSystem()
const { warmQuickActionTarget } = useQuickActionWarmup()

// 5. Etat local
const activeQuoteIndex = ref<number>(0)

let quoteInterval: ReturnType<typeof setInterval> | null = null
let hasWarmedSectionTarget = false

// 6. Data inputs

// 7. Validation et helpers purs

// 8. Computed UI-ready
const quotePhrases = computed<string[]>(() =>
  (props.data?.hasPart ?? [])
    .map((part) => part.headline?.trim() ?? '')
    .filter((phrase) => phrase.length > 0),
)

const sectionTitle = computed<string>(() => props.data?.headline?.trim() ?? '')

const sectionLink = computed<string>(() => {
  const rawValue = props.data?.url?.trim() ?? ''

  if (!rawValue) {
    return localePath('/')
  }

  if (rawValue.startsWith('/')) {
    return localePath(rawValue)
  }

  return localePath(getMenuItemByIdentifier(rawValue)?.url ?? '/')
})

// 9. Actions et handlers
const warmSectionTarget = (): void => {
  if (hasWarmedSectionTarget) return

  const to = sectionLink.value
  if (!to || to === '/') return

  hasWarmedSectionTarget = true

  warmQuickActionTarget({
    id: `screen-blockquote:${to}`,
    to,
  })

  logger.info('Warm section target', {
    screenId: 'screen-blockquote',
    target: to,
  })
}

// 10. Watch et watchEffect
watchEffect(() => {
  if (quotePhrases.value.length === 0) {
    activeQuoteIndex.value = 0
    return
  }

  if (activeQuoteIndex.value >= quotePhrases.value.length) {
    activeQuoteIndex.value = 0
  }
})

// 11. Metadonnees ecran ou page

// 12. Lifecycle
onMounted(() => {
  logger.info('Mounted screen', {
    screenId: 'screen-blockquote',
    quotesCount: quotePhrases.value.length,
  })

  setScreenMeta('screen-blockquote', {
    type: 'standard',
    logo: {
      visible: true,
    },
    socialNetwork: {
      visible: true,
      backgroundTone: 'black',
    },
    layout: {
      column: columnTemplate,
      contentZone: 'full',
      imageZone: 'none',
      hasBackgroundImage: false,
    },
  })

  warmSectionTarget()

  if (quotePhrases.value.length > 1) {
    quoteInterval = setInterval(() => {
      activeQuoteIndex.value = (activeQuoteIndex.value + 1) % quotePhrases.value.length
    }, 3200)
  }
})

onUnmounted(() => {
  logger.info('Unmounted screen', {
    screenId: 'screen-blockquote',
    activeQuoteIndex: activeQuoteIndex.value,
  })

  if (quoteInterval) {
    clearInterval(quoteInterval)
  }
})
</script>
