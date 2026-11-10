<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <div class="h-0.5 w-full shrink-0 bg-[#6B7A4A]" />

    <UTabs
      :model-value="activeSection"
      :items="sectionTabs"
      :content="false"
      variant="link"
      color="neutral"
      :ui="{
        root: 'w-full gap-0',
        list: 'border-white/10 px-2',
        indicator: 'bg-[#6B7A4A]',
        trigger:
          'data-[state=inactive]:text-white/40 hover:data-[state=inactive]:text-white/60 data-[state=active]:text-white',
      }"
      @update:model-value="emit('update:activeSection', $event as EditorSection)"
    >
      <template #list-trailing>
        <div class="ml-auto flex items-center gap-0.5 self-stretch pr-1">
          <button
            v-for="locale in localeTabs"
            :key="locale"
            type="button"
            class="rounded px-2 py-1 text-[0.65rem] font-bold uppercase transition-colors"
            :class="activeLocale === locale ? 'text-white' : 'text-white/30 hover:text-white/60'"
            :style="activeLocale === locale ? 'background-color:#6B7A4A' : ''"
            :aria-label="`Locale ${locale}`"
            @click="emit('update:activeLocale', locale)"
          >
            {{ locale }}
          </button>
          <button
            v-if="showClose"
            type="button"
            class="ml-1 rounded p-1 text-white/30 transition-colors hover:text-white/70"
            aria-label="Fermer l'editeur"
            @click="emit('close')"
          >
            <UIcon name="i-lucide-x" class="text-sm" aria-hidden="true" />
          </button>
        </div>
      </template>
    </UTabs>

    <div class="flex shrink-0 items-center gap-2 border-b border-white/10 py-2.5 pr-3 pl-4">
      <span
        v-if="accommodation?.identifier"
        class="shrink-0 rounded px-1.5 py-0.5 text-[0.6rem] font-semibold tracking-wider"
        style="color: #6b7a4a; background-color: rgba(255, 255, 255, 0.07)"
        >{{ accommodation.identifier }}</span
      >
      <input
        v-if="isEditingTitle"
        ref="titleInputRef"
        type="text"
        class="min-w-0 flex-1 bg-transparent text-sm font-semibold text-white/90 caret-white outline-none"
        :value="titleValue"
        aria-label="Modifier le nom du bien"
        @input="emit('update-field', 'name', ($event.target as HTMLInputElement).value)"
        @blur="isEditingTitle = false"
        @keydown.enter="isEditingTitle = false"
        @keydown.escape="isEditingTitle = false"
      />
      <button
        v-else
        type="button"
        class="min-w-0 flex-1 truncate text-left text-sm font-semibold text-white/70 transition-colors hover:text-white/90"
        aria-label="Modifier le nom du bien"
        @click="activateTitle"
      >
        {{ titleValue }}
      </button>
      <UDropdownMenu :items="propertyMenuItems">
        <button
          type="button"
          class="rounded p-1 text-white/30 transition-colors hover:text-white/70"
          aria-label="Actions sur le bien"
        >
          <UIcon name="i-lucide-more-vertical" class="text-sm" aria-hidden="true" />
        </button>
      </UDropdownMenu>
    </div>

    <div class="flex min-h-0 flex-1 flex-col">
      <template v-if="activeDraft">
        <div v-if="activeSection === 'content'" class="min-h-0 flex-1 overflow-y-auto">
          <DashboardPropertyContentEditor
            :active-draft="activeDraft"
            :expanded-blocks="expandedBlocks"
            :associated-media-value="associatedMediaValue"
            :place-name="placeName"
            :place-text="placeText"
            :place-text-status="placeTextStatus"
            :place-text-error-message="placeTextErrorMessage"
            :is-place-text-dirty="isPlaceTextDirty"
            @toggle-block="emit('toggle-block', $event)"
            @update-field="(path, value) => emit('update-field', path, value)"
            @update-body="emit('update-body', $event)"
            @update-associated-media="emit('update-associated-media', $event)"
            @update-place-text="emit('update-place-text', $event)"
          />
        </div>

        <DashboardPropertyMediaGallery
          v-else
          class="min-h-0 flex-1"
          :associated-media="associatedMediaValue"
          @update:associated-media="emit('update-associated-media', $event)"
        />
      </template>
    </div>

    <!-- Barre de sauvegarde modification -->
    <div class="shrink-0 border-t border-white/10 bg-[#1a1a1a] px-4 py-3">
      <!-- Statut API + isActive -->
      <div class="mb-2 flex items-center justify-between">
        <div class="flex items-center gap-1.5">
          <span
            class="inline-block h-2 w-2 rounded-full"
            :class="{
              'bg-green-500': symfonyAvailable === true,
              'bg-red-500': symfonyAvailable === false,
              'animate-pulse bg-white/30': symfonyAvailable === null,
            }"
          />
          <span class="text-xs text-white/40">
            <template v-if="symfonyAvailable === null">Vérification API…</template>
            <template v-else-if="symfonyAvailable">API disponible</template>
            <template v-else>API indisponible</template>
          </span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs text-white/20">Actif</span>
          <USwitch
            :model-value="isActiveValue"
            :ui="{
              base: 'data-[state=checked]:bg-[#6B7A4A] data-[state=unchecked]:bg-red-500/30',
            }"
            @update:model-value="emit('update-field', 'isActive', $event)"
          />
        </div>
      </div>

      <!-- Message d'erreur sauvegarde modification -->
      <p v-if="saveStatus === 'error'" class="mb-2 text-xs text-red-400">
        {{ saveErrorMessage ?? 'Erreur lors de la sauvegarde' }}
      </p>

      <!-- Avertissement markdown non mis à jour -->
      <p
        v-if="saveStatus === 'success' && saveMarkdownUpdated === false"
        class="mb-2 text-xs text-amber-400"
      >
        Sauvegarde BDD réussie — fichier local non mis à jour
      </p>

      <!-- Bouton Enregistrer modification -->
      <UButton
        block
        :disabled="saveStatus === 'saving' || !accommodation || symfonyAvailable === false"
        :loading="saveStatus === 'saving'"
        :color="saveStatus === 'error' ? 'error' : 'primary'"
        :variant="saveStatus === 'success' ? 'soft' : 'solid'"
        :class="['font-medium', saveStatus !== 'error' ? 'bg-[#6B7A4A]! hover:bg-[#5c6940]!' : '']"
        @click="emit('save')"
      >
        <template v-if="saveStatus === 'success'">Enregistré ✓</template>
        <template v-else-if="saveStatus === 'error'">Réessayer</template>
        <template v-else>Enregistrer</template>
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
type DashboardLocale = 'fr' | 'en' | 'es'
type EditorSection = 'content' | 'media'
type SaveStatus = 'idle' | 'saving' | 'success' | 'error'
type DashboardDraft = { frontmatter: DashboardEditableRecord; body: string }
type BlockMenuItem = { label: string; icon?: string; onSelect?: () => void }
defineOptions({ name: 'DashboardPropertyEditorPanel' })

defineProps<{
  activeSection: EditorSection
  activeLocale: DashboardLocale
  activeDraft: DashboardDraft | null
  accommodation?: DashboardAccommodation | null
  expandedBlocks: Set<string>
  titleValue: string
  associatedMediaValue: DashboardEditableValue
  propertyMenuItems: BlockMenuItem[][]
  placeName: string
  placeText: string
  placeTextStatus: 'idle' | 'loading' | 'saving' | 'success' | 'error'
  placeTextErrorMessage: string | null
  isPlaceTextDirty: boolean
  symfonyAvailable: boolean | null
  isActiveValue: boolean
  saveStatus: SaveStatus
  saveErrorMessage: string | null
  saveMarkdownUpdated: boolean | null
  showClose?: boolean
}>()

const emit = defineEmits<{
  'update:activeSection': [value: EditorSection]
  'update:activeLocale': [value: DashboardLocale]
  close: []
  'toggle-block': [id: string]
  'update-field': [path: string, value: DashboardEditableValue]
  'update-body': [value: string]
  'update-associated-media': [value: DashboardEditableValue]
  'update-place-text': [value: string]
  save: []
}>()

const { enabledLocales } = useProjectLocales()
// Onglets limites aux locales activees du projet courant.
const localeTabs: DashboardLocale[] = enabledLocales.value.map((locale) => locale.code)
const sectionTabs: Array<{ value: EditorSection; label: string; icon: string }> = [
  { value: 'content', label: 'Contenu', icon: 'i-lucide-file-text' },
  { value: 'media', label: 'Media', icon: 'i-lucide-images' },
]

const isEditingTitle = ref(false)
const titleInputRef = ref<HTMLInputElement | null>(null)

const activateTitle = async (): Promise<void> => {
  isEditingTitle.value = true
  await nextTick()
  titleInputRef.value?.focus()
  titleInputRef.value?.select()
}
</script>
