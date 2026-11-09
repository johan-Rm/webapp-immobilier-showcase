<template>
  <div :class="wrapperClass">
    <!-- Recherche -->
    <div class="py-2.5">
      <input
        v-if="activeField === 'search'"
        type="text"
        class="w-full bg-transparent text-sm text-white caret-white outline-none placeholder:text-white/30"
        placeholder="Identifier..."
        :value="identifierSearch"
        aria-label="Recherche par identifier"
        @input="emit('update:identifierSearch', ($event.target as HTMLInputElement).value)"
        @blur="activeField = null"
        @keydown.escape="activeField = null"
      />
      <button
        v-else
        type="button"
        class="w-full text-left text-sm transition-colors hover:text-white/80"
        :class="identifierSearch ? 'text-white/75' : 'text-white/30'"
        aria-label="Recherche par identifier"
        @click="activeField = 'search'"
      >
        {{ identifierSearch || 'Identifier...' }}
      </button>
    </div>

    <div class="h-px" style="background-color: rgba(107, 122, 74, 0.35)" />

    <!-- Type d'offre -->
    <div :class="filterItemClass">
      <button
        type="button"
        class="flex w-full items-center justify-between text-left text-sm text-white/70 transition-colors hover:text-white/90"
        aria-label="Filtrer par type d'offre"
        @click="activeField = activeField === 'listing' ? null : 'listing'"
      >
        <span>{{ selectedListingLabel }}</span>
        <UIcon
          :name="activeField === 'listing' ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
          class="shrink-0 text-xs text-white/30"
          aria-hidden="true"
        />
      </button>
      <div v-if="activeField === 'listing'" :class="optionsClass" :style="optionsStyle">
        <button
          v-for="opt in listingOptions"
          :key="opt.value"
          type="button"
          class="flex w-full items-center gap-2 px-2 py-1 text-left text-xs transition-colors"
          :class="
            opt.value === selectedListing ? 'text-white' : 'text-white/40 hover:text-white/65'
          "
          @click="selectListing(opt.value)"
        >
          <span
            class="mt-px h-1.5 w-1.5 shrink-0 rounded-full"
            :style="
              opt.value === selectedListing
                ? 'background-color: #6B7A4A'
                : 'background-color: rgba(255,255,255,0.15)'
            "
          />
          {{ opt.label }}
        </button>
      </div>
    </div>

    <div class="h-px" style="background-color: rgba(107, 122, 74, 0.35)" />

    <!-- Catégorie -->
    <div :class="filterItemClass">
      <button
        type="button"
        class="flex w-full items-center justify-between text-left text-sm text-white/70 transition-colors hover:text-white/90"
        aria-label="Filtrer par catégorie"
        @click="activeField = activeField === 'category' ? null : 'category'"
      >
        <span>{{ selectedCategoryLabel }}</span>
        <UIcon
          :name="activeField === 'category' ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
          class="shrink-0 text-xs text-white/30"
          aria-hidden="true"
        />
      </button>
      <div v-if="activeField === 'category'" :class="optionsClass" :style="optionsStyle">
        <button
          v-for="opt in categoryOptions"
          :key="opt.value"
          type="button"
          class="flex w-full items-center gap-2 px-2 py-1 text-left text-xs transition-colors"
          :class="
            opt.value === selectedCategory ? 'text-white' : 'text-white/40 hover:text-white/65'
          "
          @click="selectCategory(opt.value)"
        >
          <span
            class="mt-px h-1.5 w-1.5 shrink-0 rounded-full"
            :style="
              opt.value === selectedCategory
                ? 'background-color: #6B7A4A'
                : 'background-color: rgba(255,255,255,0.15)'
            "
          />
          {{ opt.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 2. Types et constantes statiques
type SelectOption = { label: string; value: string }

// 3. Props et emits
const props = withDefaults(
  defineProps<{
    variant?: 'inline' | 'dropdown'
    listingOptions: SelectOption[]
    categoryOptions: SelectOption[]
    selectedListing: string
    selectedCategory: string
    identifierSearch: string
  }>(),
  { variant: 'dropdown' },
)

const emit = defineEmits<{
  'update:selectedListing': [value: string]
  'update:selectedCategory': [value: string]
  'update:identifierSearch': [value: string]
}>()

// 5. Etat local
const activeField = ref<'search' | 'listing' | 'category' | null>(null)

// 8. Computed UI-ready
const wrapperClass = computed<string>(() =>
  props.variant === 'dropdown' ? 'relative z-10 shrink-0 px-5 pt-4' : '',
)

const filterItemClass = computed<string>(() =>
  props.variant === 'dropdown' ? 'relative py-2.5' : 'py-2.5',
)

const optionsClass = computed<string>(() =>
  props.variant === 'dropdown'
    ? 'absolute top-full right-0 left-0 z-20 space-y-0.5 py-1.5'
    : 'space-y-0.5 py-0.5',
)

const optionsStyle = computed<string>(() =>
  props.variant === 'dropdown'
    ? 'background-color: #212121; border-top: 1px solid rgba(107, 122, 74, 0.35); box-shadow: 0 8px 20px rgba(0, 0, 0, 0.5);'
    : '',
)

const stripCount = (label: string): string => label.replace(/\s*\(\d+\)$/, '').trim()

const selectedListingLabel = computed<string>(() =>
  stripCount(
    props.listingOptions.find((o) => o.value === props.selectedListing)?.label ?? 'Tous les types',
  ),
)

const selectedCategoryLabel = computed<string>(() =>
  stripCount(
    props.categoryOptions.find((o) => o.value === props.selectedCategory)?.label ??
      'Toutes les catégories',
  ),
)

// 9. Actions et handlers
const selectListing = (value: string): void => {
  emit('update:selectedListing', value)
  activeField.value = null
}

const selectCategory = (value: string): void => {
  emit('update:selectedCategory', value)
  activeField.value = null
}
</script>
