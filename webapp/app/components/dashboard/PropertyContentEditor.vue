<template>
  <div class="flex min-h-full flex-col">
    <div
      v-for="block in displayedBlocks"
      :key="block.id"
      class="flex flex-none flex-col border-b border-white/6"
      :class="expandedBlock ? 'min-h-0 flex-1' : ''"
    >
      <div
        class="flex min-h-14 shrink-0 items-stretch transition-colors hover:bg-white/5"
        :class="expandedBlock ? 'sticky top-0 z-30 bg-[#212121]' : ''"
      >
        <button
          type="button"
          class="flex flex-1 items-center gap-3 px-4 py-3 text-left"
          @click="emit('toggle-block', block.id)"
        >
          <UIcon :name="block.icon" class="shrink-0 text-base text-white/35" aria-hidden="true" />
          <span class="flex-1 text-sm font-medium text-white/65">{{ block.label }}</span>
          <UIcon
            :name="
              expandedBlocks.has(block.id) ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'
            "
            class="shrink-0 text-xs text-white/25"
            aria-hidden="true"
          />
        </button>
        <div class="flex items-center pr-3">
          <UDropdownMenu :items="block.actions">
            <button
              type="button"
              class="rounded p-1 text-white/20 transition-colors hover:text-white/60"
              :aria-label="`Actions ${block.label}`"
            >
              <UIcon name="i-lucide-more-vertical" class="text-sm" aria-hidden="true" />
            </button>
          </UDropdownMenu>
        </div>
      </div>

      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 translate-y-1"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-1"
      >
        <div v-if="expandedBlocks.has(block.id)" class="px-4 pt-1 pb-5">
          <template v-if="block.id === 'frontmatter'">
            <div v-for="section in frontmatterSections" :key="section.id">
              <div v-if="section.separator" class="mt-4 h-px bg-[#6B7A4A]/40" />
              <div v-if="!section.hideLabel" class="sticky top-12 z-10 -mx-4 bg-[#212121] px-4">
                <p
                  class="pt-10 pb-2.5 text-[0.6rem] font-semibold tracking-[0.12em] uppercase"
                  style="color: #6b7a4a"
                >
                  {{ section.label }}
                </p>
              </div>
              <div class="grid grid-cols-2">
                <template v-for="field in section.fields" :key="field.key">
                  <DashboardOfferField
                    v-if="field.type === 'offer'"
                    :model-value="getFieldValue(field.key, field.default)"
                    @update:model-value="emit('update-field', field.key, $event)"
                  />
                  <DashboardQualitiesEditor
                    v-else-if="field.type === 'qualities'"
                    :model-value="getFieldValue(field.key, field.default)"
                    @update:model-value="emit('update-field', field.key, $event)"
                  />
                  <DashboardCategoryCodeSelect
                    v-else-if="
                      field.type === 'category-code' || field.type === 'category-code-multi'
                    "
                    :in-code-set="field.inCodeSet ?? ''"
                    :model-value="getFieldValue(field.key, field.default)"
                    :label="field.label"
                    :placeholder="field.label"
                    :multiple="field.type === 'category-code-multi'"
                    :show-label="field.showLabel !== false"
                    @update:model-value="emit('update-field', field.key, $event)"
                  />
                  <DashboardPropertyFieldEditor
                    v-else
                    :label="field.label"
                    :path="field.key"
                    :model-value="getFieldValue(field.key, field.default)"
                    :readonly="field.readonly"
                    :half="field.half"
                    :zero-as-empty="field.zeroAsEmpty"
                    :hint="field.hint"
                    @update:model-value="emit('update-field', field.key, $event)"
                  />
                </template>
              </div>
            </div>
          </template>

          <template v-else-if="block.id === 'body'">
            <DashboardTiptapEditor
              :model-value="activeDraft.body"
              @update:model-value="emit('update-body', String($event))"
            />
          </template>

          <template v-else-if="block.id === 'place'">
            <DashboardPropertyPlaceEditor
              :place-name="placeName"
              :place-text="placeText"
              :status="placeTextStatus"
              :error-message="placeTextErrorMessage"
              :is-dirty="isPlaceTextDirty"
              @update-place-text="emit('update-place-text', $event)"
            />
          </template>

          <template v-else-if="block.id === 'associated-media'">
            <DashboardPropertyAssociatedMediaEditor
              :associated-media="associatedMediaValue"
              @update:associated-media="emit('update-associated-media', $event)"
            />
          </template>

          <template v-else-if="block.id === 'screens'">
            <DashboardPropertyScreensEditor
              :screens="hasPartValue"
              :available-media="associatedMediaValue"
              @update:screens="emit('update-field', 'hasPart', $event)"
            />
          </template>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { DEFAULT_PRICE_CURRENCY } from '#shared/types/accommodation'

defineOptions({ name: 'DashboardPropertyContentEditor' })

type DashboardDraft = { frontmatter: DashboardEditableRecord; body: string }
type BlockMenuItem = { label: string; icon?: string; onSelect?: () => void }
type Block = { id: string; label: string; icon: string; actions: BlockMenuItem[][] }
type FieldConfig = {
  key: string
  label: string
  readonly?: boolean
  default?: DashboardEditableValue
  half?: boolean
  zeroAsEmpty?: boolean
  type?: 'offer' | 'qualities' | 'category-code' | 'category-code-multi'
  inCodeSet?: string
  separator?: boolean
  showLabel?: boolean
  hint?: string
}
type FrontmatterSection = {
  id: string
  label: string
  hideLabel?: boolean
  separator?: boolean
  fields: FieldConfig[]
}

const props = defineProps<{
  activeDraft: DashboardDraft
  expandedBlocks: Set<string>
  associatedMediaValue: DashboardEditableValue
  placeName: string
  placeText: string
  placeTextStatus: 'idle' | 'loading' | 'saving' | 'success' | 'error'
  placeTextErrorMessage: string | null
  isPlaceTextDirty: boolean
}>()

const emit = defineEmits<{
  'toggle-block': [id: string]
  'update-field': [path: string, value: DashboardEditableValue]
  'update-body': [value: string]
  'update-associated-media': [value: DashboardEditableValue]
  'update-place-text': [value: string]
}>()

const metadataStore = useMetadataStore()
const accommodationForm = computed(() => metadataStore.getAccommodationForm)
const dashboardContent = computed(() => metadataStore.getDashboardContent)

const frontmatterSections = computed<FrontmatterSection[]>(() => {
  const form = accommodationForm.value
  const panel = dashboardContent.value?.editor.panel.content
  const s = (k: string, fb: string) => panel?.sections[k] ?? fb
  const f = (k: string, fb: string) => form?.fields[k] ?? fb
  return [
    {
      id: 'classement',
      label: s('classement', 'Classement'),
      hideLabel: true,
      fields: [
        {
          key: 'realEstateListing',
          label: f('realEstateListing', 'Type de listing'),
          type: 'category-code' as const,
          inCodeSet: 'real-estate-listing',
          default: null,
          half: true,
        },
        {
          key: 'category',
          label: f('category', 'Catégorie'),
          type: 'category-code' as const,
          inCodeSet: 'accommodation-type',
          default: null,
          half: true,
        },
        {
          key: 'place',
          label: f('place', 'Lieu'),
          type: 'category-code' as const,
          inCodeSet: 'accommodation-place',
          default: null,
          half: true,
        },
        {
          key: 'offer',
          label: f('offer', 'Offre'),
          type: 'offer',
          half: true,
          default: { priceCurrency: DEFAULT_PRICE_CURRENCY },
        },
      ],
    },
    {
      id: 'avis',
      label: s('avis', 'Notre avis'),
      fields: [{ key: 'review', label: f('review', ''), default: null }],
    },
    {
      id: 'confort',
      label: s('confort', 'Éléments de confort'),
      fields: [
        {
          key: 'amenityFeature',
          label: f('amenityFeature', 'Équipements'),
          type: 'category-code-multi' as const,
          inCodeSet: 'amenity-feature',
          default: [],
          showLabel: false,
        },
      ],
    },
    {
      id: 'qualites',
      label: s('qualites', 'Qualités'),
      fields: [
        { key: 'qualities', label: f('qualities', 'Qualités'), type: 'qualities', default: [] },
      ],
    },
    {
      id: 'details',
      label: s('details', 'Détails'),
      fields: [
        {
          key: 'floorSize',
          label: f('floorSize', 'Surface habitable'),
          default: null,
          half: true,
          zeroAsEmpty: true,
        },
        {
          key: 'areaSize',
          label: f('areaSize', 'Surface totale'),
          default: '',
          half: true,
          zeroAsEmpty: true,
        },
        {
          key: 'landArea',
          label: f('landArea', 'Surface terrain'),
          default: null,
          half: true,
          zeroAsEmpty: true,
        },
        {
          key: 'areaTerrace',
          label: f('areaTerrace', 'Surface terrasse'),
          default: '',
          half: true,
          zeroAsEmpty: true,
        },
        {
          key: 'numberOfBedrooms',
          label: f('numberOfBedrooms', 'Chambres'),
          default: 0,
          half: true,
          zeroAsEmpty: true,
        },
        {
          key: 'numberOfRooms',
          label: f('numberOfRooms', 'Pièces'),
          default: 0,
          half: true,
          zeroAsEmpty: true,
        },
        {
          key: 'numberOfBathroomsTotal',
          label: f('numberOfBathroomsTotal', 'Salles de bain'),
          default: 0,
          half: true,
          zeroAsEmpty: true,
        },
        {
          key: 'numberOfGarages',
          label: f('numberOfGarages', 'Garages'),
          default: 0,
          half: true,
          zeroAsEmpty: true,
        },
        {
          key: 'occupancy',
          label: f('occupancy', 'Capacité'),
          default: 0,
          half: true,
          zeroAsEmpty: true,
        },
        {
          key: 'level',
          label: f('level', 'Niveau'),
          default: 0,
          half: true,
          zeroAsEmpty: true,
        },
        {
          key: 'yearBuilt',
          label: f('yearBuilt', 'Année de construction'),
          default: 0,
          half: true,
          zeroAsEmpty: true,
        },
      ],
    },
    {
      id: 'seo',
      label: s('seo', 'SEO'),
      fields: [
        {
          key: 'metaTitle',
          label: f('metaTitle', 'Méta Title'),
          default: null,
          hint: 'Si vide ce champ sera automatiquement édité',
        },
        {
          key: 'metaDescription',
          label: f('metaDescription', 'Méta Description'),
          default: null,
          hint: 'Si vide ce champ sera automatiquement édité',
        },
      ],
    },
    {
      id: 'meta',
      label: s('meta', 'Meta'),
      hideLabel: true,
      separator: false,
      fields: [
        { key: 'slug', label: f('slug', 'Slug'), readonly: true },
        { key: 'dateCreated', label: f('dateCreated', 'Créé le'), readonly: true },
        { key: 'dateModified', label: f('dateModified', 'Modifié le'), readonly: true },
      ],
    },
  ]
})

const contentBlocks = computed<Block[]>(() => {
  const panel = dashboardContent.value?.editor.panel.content
  const resetLabel = panel?.reset ?? 'Réinitialiser'
  return [
    {
      id: 'frontmatter',
      label: panel?.blocks['frontmatter'] ?? 'Caractéristiques',
      icon: 'i-lucide-file-code',
      actions: [[{ label: resetLabel, icon: 'i-lucide-rotate-ccw', onSelect: () => {} }]],
    },
    {
      id: 'body',
      label: panel?.blocks['body'] ?? 'Description',
      icon: 'i-lucide-file-text',
      actions: [[{ label: resetLabel, icon: 'i-lucide-rotate-ccw', onSelect: () => {} }]],
    },
    {
      id: 'place',
      label: panel?.blocks['place'] ?? 'Lieu',
      icon: 'i-lucide-map-pin',
      actions: [],
    },
    {
      id: 'associated-media',
      label: panel?.blocks['associatedMedia'] ?? 'Médias associés',
      icon: 'i-lucide-files',
      actions: [],
    },
    {
      id: 'screens',
      label: panel?.blocks['screens'] ?? 'Parcours',
      icon: 'i-lucide-layout-list',
      actions: [],
    },
  ]
})

// Bloc actuellement déployé (un seul à la fois, cf. toggleBlock côté slideover).
const expandedBlock = computed<Block | null>(
  () => contentBlocks.value.find((block) => props.expandedBlocks.has(block.id)) ?? null,
)

// Déployé : seul le bloc ouvert est rendu (en-tête épinglé en haut + contenu défilant).
// Replié : la liste complète des accordéons.
const displayedBlocks = computed<Block[]>(() =>
  expandedBlock.value ? [expandedBlock.value] : contentBlocks.value,
)

// Blocs `hasPart` (screens du parcours) du brouillon de la locale active.
const hasPartValue = computed<DashboardEditableValue>(() => getFieldValue('hasPart', []))

const getNestedValue = (record: DashboardEditableRecord, path: string): DashboardEditableValue => {
  const [first, ...rest] = path.split('.')
  if (!first) return null
  const current = record[first] ?? null
  if (rest.length === 0) return current
  if (current === null || typeof current !== 'object' || Array.isArray(current)) return null
  return getNestedValue(current as DashboardEditableRecord, rest.join('.'))
}

const getFieldValue = (
  path: string,
  defaultValue?: DashboardEditableValue,
): DashboardEditableValue => {
  const value = getNestedValue(props.activeDraft.frontmatter, path)
  return value ?? defaultValue ?? null
}
</script>
