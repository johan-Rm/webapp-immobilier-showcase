<template>
  <!-- Logo Showcase Immobilier en haut à gauche -->
  <div
    class="pointer-events-auto absolute top-6 left-5 z-10 sm:top-8 sm:left-8 lg:top-10 lg:left-10"
  >
    <LogoShowcaseFull color-class="text-white/90" size="lg" force-visible />
  </div>

  <!-- Zone centrée : infos du bien actif -->
  <div class="grid min-h-0 flex-1 place-items-center px-5 py-10 text-center sm:px-8">
    <div v-if="accommodation" class="w-full max-w-3xl">
      <div v-if="!accommodation.preview.isActive" class="mx-auto mb-4 flex justify-center">
        <UBadge color="surface" variant="solid" icon="i-lucide-eye-off">Inactif</UBadge>
      </div>

      <div
        class="bg-background/90 mb-6 flex w-full items-center justify-center gap-1.5 rounded-lg px-5 py-1.5 text-sm font-semibold tracking-[0.16em] text-white uppercase"
      >
        <UIcon name="i-lucide-map-pin" class="shrink-0" aria-hidden="true" />
        <span class="truncate">{{ accommodation.preview.placeLabel || 'Lieu non renseigné' }}</span>
      </div>

      <h3
        class="font-heading mt-2 font-black text-white uppercase [--h3-size:clamp(1.8rem,9vw,2.8rem)] md:[--h3-size:clamp(2.4rem,3.5vw,4.6rem)]"
      >
        {{ accommodation.preview.title }}
      </h3>

      <div
        class="text-background/90 mt-3 flex flex-col items-center gap-3 px-4 font-black sm:px-6 md:flex-row md:items-end md:justify-between md:gap-6 2xl:mt-5 2xl:px-10"
      >
        <div
          class="flex max-w-full flex-wrap items-center justify-center gap-x-4 gap-y-2 uppercase sm:gap-x-5 md:justify-start md:gap-x-6 2xl:gap-x-8"
        >
          <p class="flex items-center gap-1.5 whitespace-nowrap 2xl:gap-2">
            <UIcon
              name="i-lucide-hash"
              class="text-xs md:text-base 2xl:text-lg"
              aria-hidden="true"
            />
            <span class="text-sm md:text-lg 2xl:text-2xl">
              {{ accommodation.preview.identifier || '—' }}
            </span>
          </p>

          <p class="flex items-center gap-1.5 whitespace-nowrap 2xl:gap-2">
            <UIcon
              name="i-lucide-expand"
              class="text-xs md:text-base 2xl:text-lg"
              aria-hidden="true"
            />
            <span class="text-sm md:text-lg 2xl:text-2xl">
              {{ accommodation.preview.floorSize ? `${accommodation.preview.floorSize} m²` : '—' }}
            </span>
          </p>

          <p class="flex items-center gap-1.5 whitespace-nowrap 2xl:gap-2">
            <UIcon
              name="i-lucide-bed-double"
              class="text-xs md:text-base 2xl:text-lg"
              aria-hidden="true"
            />
            <span class="text-sm md:text-lg 2xl:text-2xl">
              {{ accommodation.preview.numberOfBedrooms ?? '—' }}
            </span>
          </p>
        </div>

        <span
          class="max-w-full text-center text-[clamp(1.5rem,5vw,2.5rem)] leading-none font-black uppercase md:shrink-0 md:text-right md:text-[clamp(1.8rem,2.5vw,3rem)] 2xl:text-5xl"
        >
          {{ formattedPrice }}
        </span>
      </div>
    </div>

    <div v-else class="max-w-xl text-white">
      <p class="text-sm font-semibold tracking-[0.18em] uppercase">Aucun bien</p>
      <p class="mt-3 text-white/70">Aucun bien ne correspond aux filtres actuels.</p>
    </div>
  </div>

  <!-- Chevron gauche -->
  <button
    v-if="accommodation"
    type="button"
    class="group pointer-events-auto absolute top-1/2 left-1 z-20 flex -translate-y-1/2 items-center gap-2 bg-transparent px-2 py-3 text-white/45 transition-all duration-200 hover:-translate-x-2 hover:-translate-y-1/2 hover:text-white disabled:pointer-events-none disabled:opacity-25 lg:left-8 lg:gap-3 lg:px-4 lg:py-6"
    :disabled="filteredCount <= 1"
    aria-label="Bien précédent"
    @click="emit('prev')"
  >
    <span
      aria-hidden="true"
      class="block h-12 w-0.5 rounded-full bg-white/50 transition-colors duration-200 group-hover:bg-white lg:h-25"
    />
    <UIcon
      name="i-heroicons-chevron-left"
      class="text-[1.5rem] transition-transform duration-200 group-hover:-translate-x-1 lg:text-[2.5rem]"
      aria-hidden="true"
    />
  </button>

  <!-- Chevron droit -->
  <button
    v-if="accommodation"
    type="button"
    class="group pointer-events-auto absolute top-1/2 right-1 z-20 flex -translate-y-1/2 items-center gap-2 bg-transparent px-2 py-3 text-white/45 transition-all duration-200 hover:translate-x-2 hover:-translate-y-1/2 hover:text-white disabled:pointer-events-none disabled:opacity-25 lg:right-8 lg:gap-3 lg:px-4 lg:py-6"
    :disabled="filteredCount <= 1"
    aria-label="Bien suivant"
    @click="emit('next')"
  >
    <UIcon
      name="i-heroicons-chevron-right"
      class="text-[1.5rem] transition-transform duration-200 group-hover:translate-x-1 lg:text-[2.5rem]"
      aria-hidden="true"
    />
    <span
      aria-hidden="true"
      class="block h-12 w-0.5 rounded-full bg-white/50 transition-colors duration-200 group-hover:bg-white lg:h-25"
    />
  </button>

  <!-- Bouton modifier (bas gauche) -->
  <button
    v-if="accommodation && !hideEditAction"
    type="button"
    class="pointer-events-auto absolute right-8 bottom-6 z-20 rounded-lg px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-80"
    style="background-color: #6b7a4a"
    aria-label="Éditer le bien"
    @click="emit('edit')"
  >
    Modifier le bien
  </button>
</template>

<script setup lang="ts">
// 1. Imports

// 2. Types et constantes statiques

// 3. Props et emits
const props = defineProps<{
  accommodation: DashboardAccommodation | null
  filteredCount: number
  hideEditAction?: boolean
}>()

const emit = defineEmits<{
  prev: []
  next: []
  edit: []
}>()

// 4. Composables, stores, routeur

// 5. Etat local

// 6. Data inputs

// 7. Validation et helpers purs

// 8. Computed UI-ready
const formattedPrice = computed<string>(() => {
  const preview = props.accommodation?.preview
  if (!preview) return ''
  if (!preview.price) return preview.priceSpecification || 'Prix sur demande'

  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: preview.priceCurrency || 'EUR',
      maximumFractionDigits: 0,
    }).format(preview.price)
  } catch {
    return `${preview.price} ${preview.priceCurrency}`
  }
})

// 9. Actions et handlers

// 10. Watch et watchEffect

// 11. Metadonnees ecran ou page

// 12. Lifecycle
</script>
