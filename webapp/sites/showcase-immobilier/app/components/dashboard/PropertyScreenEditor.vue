<template>
  <div class="flex flex-col gap-4 pt-1 pb-3">
    <!-- Template (partagé entre langues) -->
    <label class="flex flex-col gap-1.5">
      <span class="text-[0.55rem] font-semibold tracking-widest uppercase" style="color: #6b7a4a">
        Type d'écran
      </span>
      <DashboardScreenTemplateSelect
        :model-value="screen.additionalType"
        @update:model-value="handleTemplateUpdate"
      />
    </label>

    <!-- Zone de texte (localisée) -->
    <label class="flex flex-col gap-1.5">
      <span class="text-[0.55rem] font-semibold tracking-widest uppercase" style="color: #6b7a4a">
        Désignation <span class="text-amber-400/70">*</span>
      </span>
      <input
        type="text"
        :value="screen.name ?? ''"
        placeholder="Ex. Les salons"
        required
        :aria-invalid="!screen.name?.trim()"
        :class="inputClass"
        @input="patch({ name: inputValue($event) })"
      />
    </label>

    <label class="flex flex-col gap-1.5">
      <span class="text-[0.55rem] font-semibold tracking-widest uppercase" style="color: #6b7a4a">
        Titre
      </span>
      <input
        type="text"
        :value="screen.headline ?? ''"
        placeholder="Ex. Vivre grand, **autour du feu**"
        :class="inputClass"
        @input="patch({ headline: inputValue($event) })"
      />
      <span class="text-[0.6rem] text-white/30">
        Entourez un passage de <code>**…**</code> pour le mettre en accent.
      </span>
    </label>

    <label class="flex flex-col gap-1.5">
      <span class="text-[0.55rem] font-semibold tracking-widest uppercase" style="color: #6b7a4a">
        Paragraphe
      </span>
      <textarea
        :value="screen.text ?? ''"
        rows="3"
        placeholder="Court paragraphe descriptif…"
        :class="[inputClass, 'resize-none']"
        @input="patch({ text: textareaValue($event) })"
      />
    </label>

    <!-- Options d'affichage (partagées) selon le template -->
    <div class="flex flex-wrap items-center gap-4">
      <label v-if="showReverse" class="flex cursor-pointer items-center gap-2">
        <USwitch
          :model-value="screen.meta?.reverse ?? false"
          :ui="{ base: 'data-[state=checked]:bg-[#6B7A4A]' }"
          @update:model-value="(value) => patchMeta({ reverse: value })"
        />
        <span class="text-xs text-white/60">Inverser les panneaux</span>
      </label>

      <label v-if="showOverlayMode" class="flex items-center gap-2">
        <span class="text-xs text-white/60">Mode superposition</span>
        <USelect
          :model-value="screen.meta?.overlayMode ?? 'dark'"
          :items="overlayModeItems"
          size="xs"
          variant="none"
          :ui="metaSelectUi"
          @update:model-value="(value) => patchMeta({ overlayMode: value as 'dark' | 'light' })"
        />
      </label>

      <label class="flex items-center gap-2">
        <span class="text-xs text-white/60">Filtre d'image</span>
        <USelect
          :model-value="screen.meta?.imageOverlay ?? 'dark'"
          :items="imageOverlayItems"
          size="xs"
          variant="none"
          :ui="metaSelectUi"
          @update:model-value="
            (value) => patchMeta({ imageOverlay: value as 'none' | 'dark' | 'light' })
          "
        />
      </label>
    </div>

    <!-- Médias (partagés) — sélection parmi les médias associés du bien -->
    <div class="flex flex-col gap-1.5">
      <span class="text-[0.55rem] font-semibold tracking-widest uppercase" style="color: #6b7a4a">
        Images
      </span>
      <DashboardScreenMediaSelector
        :model-value="screen.associatedMedia ?? []"
        :available-media="availableMedia"
        :max-selections="mediaLimit"
        @update:model-value="(value) => patch({ associatedMedia: value as DashboardScreenMedia[] })"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
// 1. Imports
import type {
  DashboardAccommodationScreen,
  DashboardEditableValue,
  DashboardScreenMedia,
  DashboardScreenMeta,
} from '#shared/types/dashboardAccommodation'

import { getDashboardScreenMediaLimit } from '#shared/types/dashboardAccommodation'

defineOptions({ name: 'DashboardPropertyScreenEditor' })

// 2. Types et constantes statiques
const inputClass =
  'w-full border-b border-[#6B7A4A]/60 bg-transparent px-0 py-2 text-sm text-white/85 caret-[#6B7A4A] transition-colors outline-none placeholder:text-white/20 focus:border-[#6B7A4A]'
const metaSelectUi = {
  base: 'min-w-24 rounded-none border-0 border-b border-[#6B7A4A]/60 bg-transparent px-0 text-white/75',
  value: 'text-xs',
  trailingIcon: 'text-white/30',
  content: 'bg-[#212121] text-white ring-1 ring-[#6B7A4A]/35 shadow-xl',
  item: 'text-xs text-white/45',
  itemActive: 'bg-[#6B7A4A]/15 text-white',
} as const
const overlayModeItems = [
  { value: 'dark', label: 'Sombre' },
  { value: 'light', label: 'Clair' },
]
const imageOverlayItems = [
  { value: 'none', label: 'Aucun' },
  { value: 'dark', label: 'Sombre' },
  { value: 'light', label: 'Clair' },
]
const TEMPLATES_WITH_REVERSE = [
  'SCREEN_ACCOMMODATION_SPLIT',
  'SCREEN_ACCOMMODATION_OVERLAY',
  'SCREEN_ACCOMMODATION_TRYPTIQUE',
]

// 3. Props et emits
const props = defineProps<{
  screen: DashboardAccommodationScreen
  /** Médias associés du bien, source de sélection des images de l'écran. */
  availableMedia: DashboardEditableValue
}>()
const emit = defineEmits<{ 'update:screen': [screen: DashboardAccommodationScreen] }>()

// 8. Computed UI-ready
const showReverse = computed(() => TEMPLATES_WITH_REVERSE.includes(props.screen.additionalType))
const showOverlayMode = computed(
  () => props.screen.additionalType === 'SCREEN_ACCOMMODATION_OVERLAY',
)
const mediaLimit = computed(() => getDashboardScreenMediaLimit(props.screen.additionalType))

// 9. Actions et handlers
const patch = (changes: Partial<DashboardAccommodationScreen>): void => {
  emit('update:screen', { ...props.screen, ...changes })
}
const patchMeta = (changes: Partial<DashboardScreenMeta>): void => {
  patch({ meta: { ...props.screen.meta, ...changes } })
}
const handleTemplateUpdate = (additionalType: string): void => {
  const mediaLimit = getDashboardScreenMediaLimit(additionalType)
  patch({
    additionalType,
    associatedMedia: props.screen.associatedMedia?.slice(0, mediaLimit) ?? [],
  })
}
const inputValue = (event: Event): string => (event.target as HTMLInputElement).value
const textareaValue = (event: Event): string => (event.target as HTMLTextAreaElement).value
</script>
