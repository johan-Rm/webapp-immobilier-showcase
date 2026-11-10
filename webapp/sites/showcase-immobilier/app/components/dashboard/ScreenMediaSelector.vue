<template>
  <div class="flex flex-col gap-2">
    <!-- Aucune image associée au bien : on renvoie vers le bloc Médias associés. -->
    <p v-if="availableItems.length === 0" class="py-3 text-center text-xs text-white/25">
      Ajoutez d'abord des images dans « Médias associés ».
    </p>

    <!-- Grille sélectionnable des médias du bien. -->
    <div v-else class="grid grid-cols-3 gap-2 sm:grid-cols-4">
      <button
        v-for="item in availableItems"
        :key="item.identifier"
        type="button"
        :disabled="isSelectionDisabled(item.identifier)"
        class="group relative aspect-3/2 overflow-hidden rounded border transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6B7A4A]"
        :class="selectionClass(item.identifier)"
        :aria-pressed="selectionRank(item.identifier) > 0"
        :aria-label="selectionAriaLabel(item)"
        @click="toggle(item.identifier)"
      >
        <AppImage
          v-if="item.url"
          :src="item.url"
          :alt="item.caption"
          class="size-full object-cover"
          v-bind="IMAGE_PRESETS.thumbnail"
        />
        <span v-else class="flex size-full items-center justify-center bg-white/5">
          <UIcon name="i-lucide-image" class="text-sm text-white/20" aria-hidden="true" />
        </span>

        <!-- Pastille d'ordre quand sélectionnée. -->
        <span
          v-if="selectionRank(item.identifier) > 0"
          class="absolute top-1 left-1 flex size-5 items-center justify-center rounded-full bg-[#6B7A4A] text-[0.6rem] font-bold text-white"
        >
          {{ selectionRank(item.identifier) }}
        </span>
      </button>
    </div>

    <p
      v-if="availableItems.length > 0"
      class="text-[0.6rem]"
      :class="isSelectionLimitReached ? 'text-amber-400/70' : 'text-white/25'"
    >
      {{ selectedIds.length }} / {{ selectionLimit }} image{{ selectionLimit > 1 ? 's' : '' }}.
      <template v-if="isSelectionLimitReached">
        Retirez une image pour en choisir une autre.</template
      >
      <template v-else> L'ordre des numéros est celui d'affichage dans l'écran.</template>
    </p>
  </div>
</template>

<script setup lang="ts">
// 1. Imports
import type { DashboardEditableValue } from '#shared/types/dashboardAccommodation'

import { IMAGE_PRESETS } from '~/composables/useAppImage'

defineOptions({ name: 'DashboardScreenMediaSelector' })

// 2. Types et constantes statiques
type AvailableItem = { identifier: string; url: string; caption: string }

// 3. Props et emits
const props = defineProps<{
  /** Médias sélectionnés pour l'écran : tableau ordonné de `{ image: identifiant }`. */
  modelValue: DashboardEditableValue
  /** Médias associés du bien (source de sélection). */
  availableMedia: DashboardEditableValue
  /** Nombre maximal d'images accepté par le template d'écran courant. */
  maxSelections: number
}>()
const emit = defineEmits<{ 'update:modelValue': [value: DashboardEditableValue] }>()

// 4. Composables
const metadataStore = useMetadataStore()

// 7. Helpers purs
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const readImageId = (entry: unknown): string => {
  if (!isRecord(entry)) return ''
  return typeof entry.image === 'string' ? entry.image : ''
}

// 8. Computed UI-ready
// Identifiants des médias du bien, résolus en vignettes via le store.
const availableItems = computed<AvailableItem[]>(() => {
  const byIdentifier = metadataStore.getImageObjectsByIdentifier
  const list = Array.isArray(props.availableMedia) ? props.availableMedia : []
  return list
    .map((entry) => readImageId(entry))
    .filter((identifier) => identifier.length > 0)
    .map((identifier) => {
      const media = byIdentifier.get(identifier)
      return { identifier, url: media?.url ?? '', caption: media?.caption ?? identifier }
    })
})

// Identifiants sélectionnés pour l'écran, dans l'ordre.
const selectedIds = computed<string[]>(() =>
  (Array.isArray(props.modelValue) ? props.modelValue : [])
    .map((entry) => readImageId(entry))
    .filter((identifier) => identifier.length > 0),
)
const selectionLimit = computed<number>(() => Math.max(1, props.maxSelections))
const isSelectionLimitReached = computed<boolean>(
  () => selectedIds.value.length >= selectionLimit.value,
)

// 9. Actions et handlers
// Rang d'affichage (1-indexé) d'un média dans la sélection ; 0 si non sélectionné.
const selectionRank = (identifier: string): number => selectedIds.value.indexOf(identifier) + 1
const isSelectionDisabled = (identifier: string): boolean =>
  isSelectionLimitReached.value && !selectedIds.value.includes(identifier)
const selectionClass = (identifier: string): string => {
  if (isSelectionDisabled(identifier)) return 'cursor-not-allowed border-white/5 opacity-20'
  return selectionRank(identifier) > 0
    ? 'border-[#6B7A4A] opacity-100'
    : 'border-white/10 opacity-60 hover:opacity-100'
}
const selectionAriaLabel = (item: AvailableItem): string => {
  const label = item.caption || item.identifier
  if (selectedIds.value.includes(item.identifier)) return `Retirer : ${label}`
  return isSelectionLimitReached.value ? `Limite atteinte : ${label}` : `Ajouter : ${label}`
}

const toggle = (identifier: string): void => {
  const current = selectedIds.value
  if (!current.includes(identifier) && isSelectionLimitReached.value) return
  const next = current.includes(identifier)
    ? current.filter((id) => id !== identifier)
    : [...current, identifier]
  emit('update:modelValue', next.map((image) => ({ image })) as unknown as DashboardEditableValue)
}
</script>
