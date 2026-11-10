<template>
  <div
    :ref="setLinePropertyRef"
    class="absolute inset-0 flex h-full w-max overflow-hidden"
    role="group"
    aria-label="Horizontal accommodations"
  >
    <div
      v-for="(screen, sIdx) in accommodations"
      :key="sIdx"
      class="relative h-full flex-none overflow-hidden"
      :style="{ width: screenWidth }"
    >
      <div class="absolute inset-0 origin-center" :style="{ transform: `scale(${zoomScale})` }">
        <!-- SINGLE -->
        <template v-if="viewModeList === 'single'">
          <div v-if="screen[0]" class="absolute inset-0">
            <template v-if="screen[0].image">
              <AppImage
                class="absolute inset-0 h-full w-full object-cover object-center"
                :src="screen[0].image"
                :alt="getAltText(screen[0].title, screen[0].city)"
                :loading="sIdx === 0 ? 'eager' : 'lazy'"
                v-bind="IMAGE_PRESETS.fullscreenCover"
              />
              <div
                v-if="cinemaMode !== 'none'"
                class="absolute inset-0"
                :class="cinemaOverlayClass"
              />
            </template>
            <div v-else class="absolute inset-0 bg-[#212121]">
              <p
                class="absolute inset-x-4 bottom-36 text-center text-xs font-light tracking-[0.4em] text-white/55 uppercase select-none sm:bottom-24 2xl:bottom-32"
              >
                image non disponible
              </p>
            </div>

            <div :class="cardOverlayClass">
              <CardTitleProperty
                :title="screen[0].title"
                :city="screen[0].city"
                :price="screen[0].price"
                :href="screen[0].href || '/'"
                :number-of-bedrooms="screen[0].numberOfBedrooms"
                :floor-size="screen[0].floorSize"
                :identifier="screen[0].identifier"
                :place-description="getPlaceDescription(undefined, screen[0].city)"
                v-bind="{ ariaLabel: getAltText(screen[0].title, screen[0].city) }"
                size="hero"
              />
            </div>
          </div>
        </template>

        <!-- QUAD -->
        <template v-else-if="viewModeList === 'quad'">
          <div
            class="list-property-grid list-property-grid--quad absolute inset-0 grid grid-cols-2 grid-rows-2 gap-0"
          >
            <div v-for="(it, i) in screen" :key="i" class="relative block overflow-hidden">
              <template v-if="it.image">
                <AppImage
                  class="absolute inset-0 h-full w-full object-cover object-center"
                  :src="it.image"
                  :alt="getAltText(it.title, it.city)"
                  :loading="sIdx === 0 && i === 0 ? 'eager' : 'lazy'"
                  v-bind="IMAGE_PRESETS.fullscreenCover"
                />
                <div
                  class="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.78),rgba(0,0,0,0.32)_55%,rgba(0,0,0,0.08))]"
                />
              </template>
              <div v-else class="bg-foreground absolute inset-0 flex items-center justify-center">
                <LogoShowcaseFull size="3xl" color-class="text-white/90" :force-visible="true" />
              </div>
              <div class="absolute right-4 bottom-[15%] left-4 z-10">
                <CardTitleProperty
                  :identifier="it.identifier"
                  :number-of-bedrooms="it.numberOfBedrooms"
                  :title="it.title"
                  :city="it.city"
                  :floor-size="it.floorSize"
                  :price="it.price"
                  :place-description="getPlaceDescription(undefined, it.city)"
                  :href="it.href"
                  v-bind="{ ariaLabel: getAltText(it.title, it.city) }"
                />
              </div>
            </div>
          </div>
        </template>

        <!-- ROW4 -->
        <template v-else>
          <div
            class="list-property-grid list-property-grid--row4 absolute inset-0 grid grid-cols-4 grid-rows-1 gap-0"
          >
            <div v-for="(it, i) in screen" :key="i" class="relative block overflow-hidden">
              <template v-if="it.image">
                <AppImage
                  class="absolute inset-0 h-full w-full object-cover object-center"
                  :src="it.image"
                  :alt="getAltText(it.title, it.city)"
                  :loading="sIdx === 0 && i === 0 ? 'eager' : 'lazy'"
                  v-bind="IMAGE_PRESETS.fullscreenCover"
                />
                <div
                  class="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.78),rgba(0,0,0,0.32)_55%,rgba(0,0,0,0.08))]"
                />
              </template>
              <div v-else class="bg-foreground absolute inset-0 flex items-center justify-center">
                <LogoShowcaseFull size="2xl" color-class="text-white/90" :force-visible="true" />
              </div>
              <div class="absolute right-4 bottom-[15%] left-4 z-10">
                <CardTitleProperty
                  :identifier="it.identifier"
                  :number-of-bedrooms="it.numberOfBedrooms"
                  :title="it.title"
                  :city="it.city"
                  :floor-size="it.floorSize"
                  :price="it.price"
                  :place-description="getPlaceDescription(undefined, it.city)"
                  :href="it.href"
                  v-bind="{ ariaLabel: getAltText(it.title, it.city) }"
                />
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 1. Imports
import type { ComponentPublicInstance } from 'vue'

// 2. Types et constantes statiques

// 3. Props et emits
const props = defineProps<{
  onLinePropertyRefUpdate: (element: HTMLDivElement | null) => void
  accommodations: PropertyItem[][]
  viewModeList: ViewModeList
  screenWidth: string
  zoomScale: number
  cinemaMode: CinemaMode
  cinemaOverlayClass: string
  getAltText: (title?: string, city?: string) => string
}>()

// 4. Composables, stores, routeur
const metadataStore = useMetadataStore()

const { isMobileLandscape } = useDeviceDetect()

// 5. Etat local

// 6. Data inputs

// 7. Validation et helpers purs
const normalize = (v?: string | null): string =>
  String(v ?? '')
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

const getPlaceDescription = (place?: string, city?: string): string | null => {
  const np = normalize(place)
  const nc = normalize(city)

  const found = metadataStore.getAccommodationPlaces.find(
    (item) => normalize(item.slug) === np || normalize(item.name) === nc,
  )

  return found?.text ?? null
}

// 8. Computed UI-ready

// 9. Actions et handlers
const cardOverlayClass = computed<string>(() => {
  const base = 'absolute z-50 flex w-full items-center justify-center'
  return isMobileLandscape.value ? `${base} top-16` : `${base} top-32 2xl:top-64`
})

const setLinePropertyRef = (el: Element | ComponentPublicInstance | null): void => {
  props.onLinePropertyRefUpdate(el instanceof HTMLDivElement ? el : null)
}

// 10. Watch et watchEffect

// 11. Metadonnees ecran ou page

// 12. Lifecycle
</script>
