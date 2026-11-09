<template>
  <div class="screen-real-estate-three-col-properties bg-background relative h-full w-full">
    <div class="relative z-10 flex h-full w-full flex-col">
      <LazyHeadingH2Screen :to="sectionLink">
        {{ sectionTitle }}
      </LazyHeadingH2Screen>

      <div
        class="screen-real-estate-three-col-properties__panels grid min-h-0 flex-1 md:h-screen"
        :class="[
          screenColumnTemplate[columnTemplate].value,
          isMobilePortrait || isTabletPortrait ? 'pt-24 pb-14' : '',
        ]"
      >
        <LazyPanelThreeCols
          v-for="(panel, index) in panels"
          :key="panel.to"
          :panel="panel"
          :index="index"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 1. Imports
import type { MediaObject } from '@schemas/interfaces'

// 2. Types et constantes statiques
type ThreeColPropertiesScreenProps = {
  data?: CreativeWork
}

type TryptiquePanel = {
  image: string
  imageAlt: string
  title: string
  description: string
  to: string
  headingId: string
}

const SCREEN_ID = 'screen-real-estate-three-col-properties'
const columnTemplate: ScreenColumnTemplate = 'triple-equal'

// 3. Props et emits
const props = defineProps<ThreeColPropertiesScreenProps>()

// 4. Composables, stores, routeur
const metadataStore = useMetadataStore()
const localePath = useLocalePath()
const logger = useLogger({ module: 'screen-real-estate-three-col-properties' })

const { getPageBySlug, getPageComponentByIdentifier } = useWebPage()
const { isMobilePortrait, isTabletPortrait } = useDeviceDetect()
const { setScreenMeta, screenColumnTemplate } = useScreenSystem()
const { warmQuickActionTarget } = useQuickActionWarmup()

// 5. Etat local
const warmedTargets = new Set<string>()

// 6. Data inputs

// 7. Validation et helpers purs
function toPanelHeadingId(to: string): string {
  const safe = to.replaceAll('/', '-').replace(/^-+/, '')
  return `panel-${safe}-title`
}

// 8. Computed UI-ready
const sectionLink = computed<string>(() => localePath('/properties/bien-a-vendre'))

const fallbackPage = computed(() => getPageBySlug('home'))

const screenData = computed<CreativeWork | undefined>(() => {
  if (props.data) {
    return props.data
  }

  return getPageComponentByIdentifier(fallbackPage.value, SCREEN_ID) ?? undefined
})

const imageObjectByIdentifier = computed<Map<string, MediaObject>>(
  () => metadataStore.getImageObjectsByIdentifier,
)

const resolvedMenuItems = computed<MenuItem[]>(() => {
  return (screenData.value?.links as MenuItem[] | undefined) ?? []
})

const panels = computed<TryptiquePanel[]>(() =>
  resolvedMenuItems.value
    .map((menuItem) => {
      const imageIdentifier =
        typeof menuItem.imageIdentifier === 'string' ? menuItem.imageIdentifier : undefined
      if (!imageIdentifier) return null

      const image = imageObjectByIdentifier.value.get(imageIdentifier)
      const imageUrl = image?.url?.trim() || imageIdentifier
      if (!imageUrl) return null

      const title = menuItem.name ?? ''
      if (!title) return null

      const description = menuItem.description ?? ''
      const to = menuItem.url ?? ''
      if (!to) return null

      return {
        image: imageUrl,
        imageAlt: image?.caption?.trim() || title,
        title,
        description,
        to,
        headingId: toPanelHeadingId(to),
      }
    })
    .filter((panel): panel is TryptiquePanel => panel !== null),
)

const sectionTitle = computed<string>(
  () => (screenData.value?.headline as string | undefined) ?? 'Nos biens immobiliers',
)

const warmupTargets = computed<string[]>(() =>
  [sectionLink.value, ...panels.value.map((panel) => localePath(panel.to))].filter(
    (target, index, list) => {
      return target && target !== '/' && list.indexOf(target) === index
    },
  ),
)

// 9. Actions et handlers
const warmThreeColTargets = (): void => {
  const targets = warmupTargets.value.filter((target) => !warmedTargets.has(target))

  if (targets.length === 0) return

  targets.forEach((to) => {
    warmedTargets.add(to)

    warmQuickActionTarget({
      id: `${SCREEN_ID}:${to}`,
      to,
    })
  })

  logger.info('Warm three col property targets', {
    screenId: SCREEN_ID,
    targets,
  })
}

// 10. Watch et watchEffect
watch(warmupTargets, warmThreeColTargets, { immediate: true })

// 11. Metadonnees ecran ou page

// 12. Lifecycle
onMounted(() => {
  setScreenMeta(SCREEN_ID, {
    type: 'landing',
    logo: {
      visible: true,
    },
    layout: {
      column: columnTemplate,
      contentZone: 'none',
      imageZone: 'background',
    },
  })
})
</script>

<style scoped>
@media (max-width: 767px), (min-width: 768px) and (max-width: 1023px) and (orientation: portrait) {
  .screen-real-estate-three-col-properties__panels {
    grid-template-columns: 1fr !important;
    grid-template-rows: repeat(3, minmax(0, 1fr));
  }

  .screen-real-estate-three-col-properties__panel {
    min-height: 0 !important;
    height: 100%;
  }
}
</style>
