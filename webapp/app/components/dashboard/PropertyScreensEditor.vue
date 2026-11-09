<template>
  <div class="flex flex-col gap-2">
    <!-- Liste ordonnée des screens (cartes repliables) -->
    <div
      v-for="(screen, index) in parsedScreens"
      :key="index"
      class="rounded border border-white/8 bg-white/2"
    >
      <!-- En-tête récapitulatif + actions -->
      <div class="flex items-stretch">
        <button
          type="button"
          class="flex flex-1 items-center gap-2 px-3 py-2.5 text-left"
          :aria-expanded="openIndex === index"
          @click="toggle(index)"
        >
          <UIcon
            :name="openIndex === index ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
            class="shrink-0 text-xs text-white/30"
            aria-hidden="true"
          />
          <span class="text-[0.65rem] font-bold text-white/40 tabular-nums">
            {{ String(index + 1).padStart(2, '0') }}
          </span>
          <span
            class="truncate text-sm"
            :class="screen.name ? 'text-white/70' : 'text-amber-400/70 italic'"
          >
            {{ screen.name || 'Sans désignation' }}
          </span>
          <span class="truncate text-xs text-white/30"
            >· {{ templateLabel(screen.additionalType) }}</span
          >
        </button>
        <div class="flex items-center gap-0.5 pr-2">
          <button
            type="button"
            :disabled="index === 0"
            class="rounded p-1 text-white/20 transition-colors hover:text-white/60 disabled:opacity-20"
            aria-label="Monter"
            @click="move(index, -1)"
          >
            <UIcon name="i-lucide-chevron-up" class="text-xs" aria-hidden="true" />
          </button>
          <button
            type="button"
            :disabled="index === parsedScreens.length - 1"
            class="rounded p-1 text-white/20 transition-colors hover:text-white/60 disabled:opacity-20"
            aria-label="Descendre"
            @click="move(index, 1)"
          >
            <UIcon name="i-lucide-chevron-down" class="text-xs" aria-hidden="true" />
          </button>
          <button
            type="button"
            class="rounded p-1 text-white/20 transition-colors hover:text-red-400"
            aria-label="Supprimer cet écran"
            @click="remove(index)"
          >
            <UIcon name="i-lucide-x" class="text-xs" aria-hidden="true" />
          </button>
        </div>
      </div>

      <!-- Corps d'édition (carte ouverte) -->
      <div v-if="openIndex === index" class="border-t border-white/8 px-3">
        <DashboardPropertyScreenEditor
          :screen="screen"
          :available-media="availableMedia"
          @update:screen="(updated) => update(index, updated)"
        />
      </div>
    </div>

    <!-- État vide -->
    <div
      v-if="parsedScreens.length === 0"
      class="flex flex-col items-center py-6 text-center text-white/25"
    >
      <UIcon name="i-lucide-layout-list" class="text-xl text-white/15" aria-hidden="true" />
      <p class="mt-2 text-xs">Aucun écran de parcours</p>
    </div>

    <!--
      Écran de contact figé : clôt systématiquement le parcours. Affiché en
      lecture seule, hors de `parsedScreens`, jamais persisté dans `hasPart`.
    -->
    <div class="rounded border border-white/8 bg-white/2">
      <div class="flex items-stretch">
        <div class="flex flex-1 items-center gap-2 px-3 py-2.5 text-left">
          <UIcon name="i-lucide-minus" class="shrink-0 text-xs text-white/20" aria-hidden="true" />
          <span class="text-[0.65rem] font-bold text-white/40 tabular-nums">
            {{ String(parsedScreens.length + 1).padStart(2, '0') }}
          </span>
          <span class="truncate text-sm text-white/70">Contact</span>
          <span class="truncate text-xs text-white/30">· Footer</span>
        </div>
        <div class="flex items-center pr-2">
          <span class="p-1 text-white/20" aria-label="Écran figé">
            <UIcon name="i-lucide-lock" class="text-xs" aria-hidden="true" />
          </span>
        </div>
      </div>
    </div>

    <!-- Ajouter -->
    <button
      type="button"
      class="flex w-full items-center justify-center gap-2 rounded border border-dashed border-white/10 py-2 text-xs text-white/35 transition-colors hover:border-white/20 hover:text-white/60"
      @click="add"
    >
      <UIcon name="i-lucide-plus" class="text-xs" aria-hidden="true" />
      Ajouter un écran
    </button>
  </div>
</template>

<script setup lang="ts">
// 1. Imports
import type {
  DashboardAccommodationScreen,
  DashboardEditableValue,
} from '#shared/types/dashboardAccommodation'

import { DASHBOARD_SCREEN_TEMPLATES } from '#shared/types/dashboardAccommodation'

defineOptions({ name: 'DashboardPropertyScreensEditor' })

// 2. Types et constantes statiques
const DEFAULT_TEMPLATE = 'SCREEN_ACCOMMODATION_FULL'

// 3. Props et emits
const props = defineProps<{
  screens: DashboardEditableValue
  /** Médias associés du bien, transmis aux cartes pour la sélection d'images. */
  availableMedia: DashboardEditableValue
}>()
const emit = defineEmits<{ 'update:screens': [value: DashboardEditableValue] }>()

// 5. État local
const openIndex = ref<number | null>(null)

// 7. Validation et helpers purs
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const readString = (value: unknown): string => (typeof value === 'string' ? value : '')

const toScreen = (value: unknown, index: number): DashboardAccommodationScreen => {
  const record = isRecord(value) ? value : {}
  const meta = isRecord(record.meta) ? record.meta : {}
  return {
    additionalType: readString(record.additionalType) || DEFAULT_TEMPLATE,
    position: typeof record.position === 'number' ? record.position : index + 1,
    name: readString(record.name),
    headline: readString(record.headline),
    text: readString(record.text),
    associatedMedia: Array.isArray(record.associatedMedia)
      ? (record.associatedMedia as DashboardAccommodationScreen['associatedMedia'])
      : [],
    meta: {
      ...(typeof meta.reverse === 'boolean' ? { reverse: meta.reverse } : {}),
      ...(meta.overlayMode === 'light' || meta.overlayMode === 'dark'
        ? { overlayMode: meta.overlayMode }
        : {}),
      imageOverlay:
        meta.imageOverlay === 'none' ||
        meta.imageOverlay === 'light' ||
        meta.imageOverlay === 'dark'
          ? meta.imageOverlay
          : 'dark',
    },
  }
}

const templateLabel = (additionalType: string): string =>
  DASHBOARD_SCREEN_TEMPLATES.find((template) => template.value === additionalType)?.label ??
  additionalType

// 8. Computed UI-ready
const parsedScreens = computed<DashboardAccommodationScreen[]>(() =>
  (Array.isArray(props.screens) ? props.screens : []).map(toScreen),
)

// 9. Actions et handlers
// Renvoie le tableau au parent avec des positions contiguës (1..n).
const emitScreens = (screens: DashboardAccommodationScreen[]): void => {
  const normalized = screens.map((screen, index) => ({ ...screen, position: index + 1 }))
  emit('update:screens', normalized as unknown as DashboardEditableValue)
}

const add = (): void => {
  const next = [
    ...parsedScreens.value,
    toScreen({ additionalType: DEFAULT_TEMPLATE }, parsedScreens.value.length),
  ]
  openIndex.value = next.length - 1
  emitScreens(next)
}

const remove = (index: number): void => {
  if (openIndex.value === index) openIndex.value = null
  emitScreens(parsedScreens.value.filter((_, i) => i !== index))
}

const update = (index: number, updated: DashboardAccommodationScreen): void => {
  emitScreens(parsedScreens.value.map((screen, i) => (i === index ? updated : screen)))
}

const move = (index: number, direction: 1 | -1): void => {
  const target = index + direction
  if (target < 0 || target >= parsedScreens.value.length) return
  const next = [...parsedScreens.value]
  const moved = next[index]
  const replaced = next[target]
  if (!moved || !replaced) return
  next[index] = replaced
  next[target] = moved
  openIndex.value = target
  emitScreens(next)
}

const toggle = (index: number): void => {
  openIndex.value = openIndex.value === index ? null : index
}
</script>
