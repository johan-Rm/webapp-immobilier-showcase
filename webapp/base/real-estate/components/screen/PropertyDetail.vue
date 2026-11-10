<template>
  <section class="screen-property-detail relative h-dvh min-h-screen w-full overflow-hidden">
    <PropertyDetailDrawer
      :open="isDetailScreenActive && isAsideOpen"
      content-class="w-[38%] max-w-xl"
      aria-label="Détails du bien"
      @update:open="(value: boolean) => (value ? undefined : closeAside())"
    >
      <PropertyDetailPanel
        ref="detailPanel"
        :property="property"
        :place-label="panelData.placeLabel"
        :offer-label="panelData.offerLabel"
        :listing-label="panelData.listingLabel"
        :category-label="panelData.categoryLabel"
        :summary-items="panelData.summaryItems"
        :detail-items="panelData.detailItems"
        :feature-items="panelData.featureItems"
        :sections="panelData.sections"
      />
    </PropertyDetailDrawer>

    <!-- Variante de livrable statique : le panneau ci-dessus s'appuie sur une
         fenetre modale, qui n'est jamais rendue cote serveur. On rend donc son
         contenu directement, ancre a gauche, pour documenter cet etat. -->
    <div
      v-if="isStaticPanelsOpen"
      class="bg-background absolute inset-y-0 left-0 z-50 w-[38%] max-w-xl overflow-y-auto shadow-2xl"
      aria-label="Détails du bien"
    >
      <PropertyDetailPanel
        :property="property"
        :place-label="panelData.placeLabel"
        :offer-label="panelData.offerLabel"
        :listing-label="panelData.listingLabel"
        :category-label="panelData.categoryLabel"
        :summary-items="panelData.summaryItems"
        :detail-items="panelData.detailItems"
        :feature-items="panelData.featureItems"
        :sections="panelData.sections"
      />
    </div>

    <div class="flex h-full min-h-screen w-full min-w-0 justify-center overflow-hidden">
      <div class="relative h-full min-h-screen w-full overflow-hidden">
        <div
          v-if="galleryImages.length === 0"
          class="flex h-full min-h-screen w-full items-center justify-center bg-[#212121]"
        >
          <p class="text-xs font-light tracking-[0.4em] text-white/55 uppercase select-none">
            image non disponible
          </p>
        </div>

        <UCarousel
          v-else
          ref="galleryCarousel"
          v-slot="{ item, index }"
          :items="galleryImages"
          class="h-full min-h-screen w-full overflow-hidden"
          loop
          :arrows="galleryImages.length > 1"
          prev-icon="i-heroicons-chevron-left"
          next-icon="i-heroicons-chevron-right"
          fade
          :autoplay="{ delay: 4000 }"
          wheel-gestures
          :ui="{
            root: 'h-full min-h-screen min-w-0',
            viewport: 'h-full min-h-screen',
            container: 'h-full min-h-screen items-stretch ms-0',
            item: 'h-full min-h-screen basis-full ps-0',
            prev: 'group cursor-pointer inset-s-1 z-30 flex -translate-y-1/2 items-center gap-2 rounded-none border-0 bg-transparent px-2 py-3 text-white shadow-none ring-0 transition-all duration-200 before:block before:h-12 before:w-0.5 before:rounded-full before:bg-white before:transition-colors before:duration-200 lg:inset-s-8 lg:gap-3 lg:px-4 lg:py-6 lg:text-white/45 lg:opacity-95 lg:before:h-25 lg:before:bg-white/50 lg:hover:-translate-x-2 lg:hover:-translate-y-1/2 lg:hover:bg-transparent lg:hover:text-white lg:hover:before:bg-white [&_svg]:text-[1.5rem] [&_svg]:transition-transform [&_svg]:duration-200 lg:group-hover:[&_svg]:-translate-x-1 lg:[&_svg]:text-[2.5rem]',
            next: 'group cursor-pointer inset-e-1 z-30 flex -translate-y-1/2 items-center gap-2 rounded-none border-0 bg-transparent px-2 py-3 text-white shadow-none ring-0 transition-all duration-200 after:block after:h-12 after:w-0.5 after:rounded-full after:bg-white after:transition-colors after:duration-200 lg:inset-e-8 lg:gap-3 lg:px-4 lg:py-6 lg:text-white/45 lg:opacity-95 lg:after:h-25 lg:after:bg-white/50 lg:hover:translate-x-2 lg:hover:-translate-y-1/2 lg:hover:bg-transparent lg:hover:text-white lg:hover:after:bg-white [&_svg]:text-[1.5rem] [&_svg]:transition-transform [&_svg]:duration-200 lg:group-hover:[&_svg]:translate-x-1 lg:[&_svg]:text-[2.5rem]',
          }"
          @click.capture="scheduleGalleryAutoplayResume"
          @keydown.capture="scheduleGalleryAutoplayResumeFromKey"
          @pointerup.capture="scheduleGalleryAutoplayResume"
          @select="activeGalleryIndex = $event"
        >
          <div class="relative h-full w-full overflow-hidden">
            <AppImage
              class="absolute inset-0 h-full w-full object-cover object-center"
              :src="item.url"
              :alt="item.caption || property?.name || accommodationTexts.propertyVisual"
              loading="eager"
              :fetchpriority="getCarouselImagePriority(index)"
              v-bind="IMAGE_PRESETS.fullscreenCover"
            />
            <AppOverlay :percentage="50" />
          </div>
        </UCarousel>

        <span
          v-if="galleryImages.length > 0"
          class="pointer-events-none fixed right-4 bottom-42 left-4 z-9998 inline-flex justify-center text-center text-xs tracking-wider text-white md:absolute md:right-32 md:bottom-4 md:left-auto md:justify-end md:text-right"
        >
          <span
            class="inline-flex h-10 max-w-full items-center justify-center gap-2 px-4 shadow-lg shadow-white/1"
          >
            <UIcon
              name="i-lucide-dot"
              class="shrink-0 text-[1rem] text-white/80"
              aria-hidden="true"
            />
            <span class="line-clamp-2">{{ currentGalleryCaption || 'CAPTION DEBUG' }}</span>
            <UIcon
              name="i-lucide-dot"
              class="shrink-0 text-[1rem] text-white/80"
              aria-hidden="true"
            />
          </span>
        </span>

        <UButton
          v-if="isDetailScreenActive && !isAsideOpen"
          type="button"
          color="neutral"
          variant="solid"
          class="bg-background text-foreground fixed inset-x-0 bottom-0 z-40 flex w-full items-start justify-start rounded-t-xl px-3 pt-5 pb-[calc(env(safe-area-inset-bottom)+0.9rem)] text-left shadow-[0_-10px_30px_rgba(0,0,0,0.22)] transition hover:opacity-95 lg:hidden"
          aria-haspopup="dialog"
          :aria-expanded="isAsideOpen"
          :ui="{
            base: 'justify-start rounded-t-2xl ring-0',
          }"
          @click="openAside"
        >
          <span
            class="bg-surface text-foreground absolute -top-5 left-1/2 inline-flex -translate-x-1/2 items-center rounded-full p-2 shadow-lg shadow-black/10"
          >
            <UIcon name="i-lucide-chevrons-up" class="text-xl" aria-hidden="true" />
          </span>

          <div class="grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-x-4">
            <div class="min-w-0 self-stretch">
              <p
                class="text-foreground line-clamp-3 text-sm font-semibold tracking-[0.08em] uppercase"
              >
                {{ property?.name ?? '—' }}
              </p>
            </div>

            <div class="flex min-w-0 flex-col items-end gap-0.5 text-right">
              <span class="text-foreground/70 text-sm tracking-[0.18em] uppercase">
                {{ panelData.placeLabel }}
              </span>

              <div
                class="flex max-w-full flex-nowrap justify-end gap-x-2 overflow-hidden text-[11px] tracking-[0.16em] uppercase"
              >
                <span
                  v-for="item in mobileQuickFacts"
                  :key="item.label"
                  class="text-foreground/85 inline-flex min-w-0 items-center gap-1 truncate whitespace-nowrap"
                >
                  <UIcon :name="item.icon" class="text-foreground text-[0.9rem]" />
                  <span class="truncate">{{ item.value }}</span>
                </span>
              </div>

              <span class="text-surface text-xl font-bold tracking-[0.06em] whitespace-nowrap">
                {{ panelData.offerLabel }}
              </span>
            </div>
          </div>
        </UButton>

        <button
          v-if="isDetailScreenActive && !isAsideOpen"
          type="button"
          class="fixed bottom-4 left-6 z-40 hidden max-w-[calc(100vw-3rem)] cursor-pointer items-center gap-4 overflow-hidden text-left text-white transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white lg:flex"
          aria-label="Voir les détails du bien"
          aria-haspopup="dialog"
          :aria-expanded="isAsideOpen"
          @click="openAside"
        >
          <span class="flex shrink-0 flex-col gap-1.5">
            <!-- <span class="block h-px w-12 rounded-full bg-white/75" aria-hidden="true" /> -->
            <span class="text-lg leading-none font-bold tracking-[0.08em] uppercase">
              {{ property?.name ?? '—' }}
            </span>
            <span
              class="text-left text-sm font-bold tracking-[0.06em] whitespace-nowrap text-white"
            >
              {{ panelData.offerLabel }}
            </span>
          </span>

          <span class="flex min-w-0 items-center gap-1.5 overflow-hidden">
            <span
              v-for="badge in summaryBadges"
              :key="badge.key"
              class="bg-background/80 inline-flex shrink-0 items-center gap-1 rounded-md px-2.5 py-2.5 text-xs font-bold whitespace-nowrap text-white/80 backdrop-blur-xl"
            >
              <UIcon :name="badge.icon" class="text-[0.9rem]" aria-hidden="true" />
              {{ badge.value }}
            </span>
          </span>
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// 1. Imports
import { computed, nextTick, onBeforeUnmount, ref, useTemplateRef, watch, watchEffect } from 'vue'

import { useAccommodationStore } from '~/stores/accommodation'

// 2. Types et constantes statiques
type GalleryCarouselItem = {
  url: string
  caption: string
}

type GalleryCarouselExpose = {
  emblaApi?: {
    plugins: () => {
      autoplay?: {
        play: () => void
      }
    }
  }
}

type DetailPanelExpose = {
  resetScrollPosition: () => void
}

const SCREEN_ID = 'screen-property-detail'
const columnTemplate: ScreenColumnTemplate = 'single'
const GALLERY_AUTOPLAY_RESUME_DELAY_MS = 5000
const GALLERY_NAVIGATION_KEYS = new Set(['ArrowLeft', 'ArrowRight'])

// 3. Props et emits
const props = defineProps<{ slug: string }>()

// 4. Composables, stores, routeur
const store = useAccommodationStore()
const { screenStatus, setScreenMeta } = useScreenSystem()
const galleryCarousel = useTemplateRef<GalleryCarouselExpose>('galleryCarousel')
const detailPanel = useTemplateRef<DetailPanelExpose>('detailPanel')

// 5. Etat local
// Variante de livrable : le panneau de details s'ouvre normalement au clic.
// Sans script, il resterait inaccessible ; ce drapeau permet d'en produire une
// version deja ouverte, sans effet sur le site vivant ni sur le livrable normal.
const isStaticPanelsOpen = useRuntimeConfig().public.staticPanelsOpen === true

const isAsideOpen = ref(isStaticPanelsOpen)
const activeGalleryIndex = ref(0)
const galleryAutoplayResumeTimer = ref<ReturnType<typeof setTimeout> | null>(null)

// 6. Data inputs
const property = computed(() => store.getAccommodationBySlug(props.slug))
const { accommodationTexts, mobileQuickFacts, panelData, summaryBadges } =
  usePropertyDetailPanelData(property)

// 7. Validation et helpers purs
const getAdjacentGalleryIndexes = (index: number, total: number): number[] => {
  if (total <= 1) return []
  return [(index - 1 + total) % total, (index + 1) % total]
}

const getCarouselImagePriority = (index: number): 'high' | 'auto' | 'low' => {
  const active = activeGalleryIndex.value
  const total = galleryImages.value.length
  if (index === active) return 'high'
  if (getAdjacentGalleryIndexes(active, total).includes(index)) return 'auto'
  return 'low'
}

// 8. Computed UI-ready
// Sortie statique : aucun ecran ne devient actif faute de script. Les blocs
// d'information de la fiche (titre, prix, caracteristiques) resteraient masques.
const isStaticOutput = useRuntimeConfig().public.staticOutput === true

const isDetailScreenActive = computed(
  () => isStaticOutput || screenStatus.value.currentId === SCREEN_ID,
)

const galleryImages = computed<GalleryCarouselItem[]>(() => {
  const list = property.value?.associatedMedia
  if (!Array.isArray(list)) return []
  return list
    .filter((item) => typeof item.image?.url === 'string' && item.image.url.length > 0)
    .map((item) => ({
      url: item.image.url,
      caption: item.caption,
    }))
})
const currentGalleryCaption = computed(() => {
  return (
    galleryImages.value[activeGalleryIndex.value]?.caption ||
    galleryImages.value[0]?.caption ||
    property.value?.name ||
    ''
  )
})

const galleryImageUrls = computed<string[]>(() =>
  galleryImages.value.map((item) => item.url).filter(Boolean),
)

useImageWarmup(galleryImageUrls, {
  stateKey: 'property-detail-gallery',
  preset: 'fullscreenCover',
  batchSize: 2,
  batchDelayMs: 800,
})

// 9. Actions et handlers
const clearGalleryAutoplayResumeTimer = (): void => {
  if (galleryAutoplayResumeTimer.value === null) return

  clearTimeout(galleryAutoplayResumeTimer.value)
  galleryAutoplayResumeTimer.value = null
}

const resetDetailPanelScroll = (): void => {
  detailPanel.value?.resetScrollPosition()
}

const openAside = async (): Promise<void> => {
  isAsideOpen.value = true
  await nextTick()
  resetDetailPanelScroll()
}

const closeAside = (): void => {
  isAsideOpen.value = false
  resetDetailPanelScroll()
}

const resumeGalleryAutoplay = (): void => {
  galleryCarousel.value?.emblaApi?.plugins().autoplay?.play()
  galleryAutoplayResumeTimer.value = null
}

const scheduleGalleryAutoplayResume = (): void => {
  clearGalleryAutoplayResumeTimer()
  galleryAutoplayResumeTimer.value = setTimeout(
    resumeGalleryAutoplay,
    GALLERY_AUTOPLAY_RESUME_DELAY_MS,
  )
}

const scheduleGalleryAutoplayResumeFromKey = (event: KeyboardEvent): void => {
  if (!GALLERY_NAVIGATION_KEYS.has(event.key)) return

  scheduleGalleryAutoplayResume()
}

const preloadAdjacentGalleryImages = (index: number): void => {
  if (!import.meta.client) return

  const images = galleryImages.value
  const adjacent = getAdjacentGalleryIndexes(index, images.length)

  adjacent.forEach((i) => {
    prefetchWithPreset(images[i]?.url ?? '', 'fullscreenCover')
  })
}

// 10. Watch et watchEffect
watch(
  () => property.value?.slug,
  () => {
    clearGalleryAutoplayResumeTimer()
    activeGalleryIndex.value = 0
    closeAside()
  },
)

watch(activeGalleryIndex, preloadAdjacentGalleryImages)

watch(isDetailScreenActive, (isActive) => {
  if (!isActive) {
    closeAside()
  }
})

watchEffect(() => {
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

// 11. Metadonnees ecran ou page

// 12. Lifecycle
onBeforeUnmount(() => {
  clearGalleryAutoplayResumeTimer()
})
</script>
