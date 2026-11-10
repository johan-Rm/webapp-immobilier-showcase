<template>
  <div
    class="ml-0.5 border-b border-l-2 border-white/5 border-l-transparent py-1.5 pr-1"
    :class="[multiple ? 'relative col-span-2' : 'relative col-span-1']"
  >
    <p
      v-if="showLabel !== false"
      class="mb-1 text-[0.65rem] font-semibold tracking-widest text-white/20"
    >
      {{ label }}
    </p>

    <!-- Single select : dropdown custom thème sombre -->
    <template v-if="!multiple">
      <button
        type="button"
        class="flex w-full items-center justify-between text-left text-sm transition-colors hover:text-white/90"
        :class="singleModel ? 'text-white/75' : 'text-white/30'"
        :aria-label="label"
        @click="isOpen = !isOpen"
      >
        <span>{{ selectedLabel || placeholder }}</span>
        <UIcon
          :name="isOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
          class="shrink-0 text-xs text-white/30"
          aria-hidden="true"
        />
      </button>
      <div
        v-if="isOpen"
        class="absolute top-full right-0 left-0 z-20 space-y-0.5 py-1.5"
        style="
          background-color: #212121;
          border-top: 1px solid rgba(107, 122, 74, 0.35);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.5);
        "
      >
        <button
          v-for="opt in options"
          :key="opt.value"
          type="button"
          class="flex w-full items-center gap-2 px-2 py-1 text-left text-xs transition-colors"
          :class="opt.value === singleModel ? 'text-white' : 'text-white/40 hover:text-white/65'"
          @click="selectSingle(opt.value)"
        >
          <span
            class="mt-px h-1.5 w-1.5 shrink-0 rounded-full"
            :style="
              opt.value === singleModel
                ? 'background-color: #6B7A4A'
                : 'background-color: rgba(255,255,255,0.15)'
            "
          />
          {{ opt.label }}
        </button>
      </div>
    </template>

    <!-- Multiple select : chips + bouton + dropdown -->
    <template v-else>
      <div ref="wrapperRef">
        <div class="flex flex-wrap gap-1.5 pt-0.5">
          <!-- Chips sélectionnés -->
          <span
            v-for="val in multiModel"
            :key="val"
            class="flex items-center gap-1 rounded px-2 py-0.5 text-[0.65rem]"
            style="background-color: rgba(107, 122, 74, 0.18); color: #6b7a4a"
          >
            {{ labelFor(val) }}
            <button
              type="button"
              class="opacity-50 transition-opacity hover:opacity-90"
              :aria-label="`Retirer ${labelFor(val)}`"
              @click="removeTag(val)"
            >
              <UIcon name="i-lucide-x" class="text-[0.55rem]" aria-hidden="true" />
            </button>
          </span>

          <!-- Placeholder si vide -->
          <span v-if="!multiModel.length" class="py-0.5 text-[0.65rem] text-white/20">
            {{ placeholder || 'Aucun' }}
          </span>

          <!-- Bouton + -->
          <button
            type="button"
            class="flex items-center justify-center rounded px-1.5 py-0.5 text-[0.7rem] transition-colors"
            :class="isOpen ? 'text-white/60' : 'text-white/30 hover:text-white/55'"
            style="background-color: rgba(255, 255, 255, 0.07)"
            :aria-label="`Ajouter ${label}`"
            @click="toggleDropdown"
          >
            <UIcon :name="isOpen ? 'i-lucide-x' : 'i-lucide-plus'" aria-hidden="true" />
          </button>
        </div>

        <!-- Dropdown recherche + options -->
        <div
          v-if="isOpen"
          class="absolute top-full right-0 left-0 z-20"
          style="
            background-color: #212121;
            border-top: 1px solid rgba(107, 122, 74, 0.35);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.5);
          "
        >
          <!-- Input recherche -->
          <div class="px-3 pt-2 pb-1.5">
            <input
              ref="searchInputRef"
              v-model="search"
              type="text"
              class="w-full bg-transparent text-xs text-white/70 caret-white outline-none placeholder:text-white/25"
              placeholder="Rechercher…"
              @keydown.escape="isOpen = false"
              @keydown.enter.prevent="onEnterCreate"
            />
          </div>
          <div class="mx-3 h-px" style="background-color: rgba(107, 122, 74, 0.2)" />

          <!-- Liste options -->
          <div class="max-h-44 overflow-y-auto py-1.5">
            <button
              v-for="opt in filteredOptions"
              :key="opt.value"
              type="button"
              class="flex w-full items-center gap-2 px-3 py-1 text-left text-xs transition-colors"
              :class="
                multiModel.includes(opt.value) ? 'text-white' : 'text-white/40 hover:text-white/65'
              "
              @click="toggleOption(opt.value)"
            >
              <span
                class="mt-px h-1.5 w-1.5 shrink-0 rounded-full"
                :style="
                  multiModel.includes(opt.value)
                    ? 'background-color: #6B7A4A'
                    : 'background-color: rgba(255,255,255,0.15)'
                "
              />
              {{ opt.label }}
            </button>

            <!-- Option créer -->
            <button
              v-if="canCreate"
              type="button"
              class="flex w-full items-center gap-2 px-3 py-1 text-left text-xs text-white/30 transition-colors hover:text-white/60"
              :disabled="creating"
              @click="onEnterCreate"
            >
              <UIcon name="i-lucide-plus" class="shrink-0 text-[0.65rem]" aria-hidden="true" />
              Créer "{{ search }}"
            </button>

            <p v-if="!filteredOptions.length && !canCreate" class="px-3 py-1 text-xs text-white/20">
              Aucun résultat
            </p>
          </div>

          <p v-if="createError" class="px-3 pb-2 text-[0.6rem] text-red-400">{{ createError }}</p>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'DashboardCategoryCodeSelect' })

const props = defineProps<{
  inCodeSet: string
  modelValue: DashboardEditableValue
  label: string
  placeholder?: string
  multiple?: boolean
  showLabel?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: DashboardEditableValue]
}>()

const store = useMetadataStore()
const { locale } = useI18n()
const { isEnabledLocale, sourceLocale } = useProjectLocales()

const creating = ref(false)
const createError = ref<string | null>(null)
const isOpen = ref(false)
const search = ref('')
const wrapperRef = ref<HTMLElement | null>(null)
const searchInputRef = ref<HTMLInputElement | null>(null)

onClickOutside(wrapperRef, () => {
  isOpen.value = false
})

const options = computed(() => store.getOptionsForCodeSet(props.inCodeSet))

const singleModel = computed<string | null>(() =>
  typeof props.modelValue === 'string' ? props.modelValue : null,
)

const multiModel = computed<string[]>(() =>
  Array.isArray(props.modelValue)
    ? (props.modelValue.filter((v) => typeof v === 'string') as string[])
    : [],
)

const selectedLabel = computed<string>(
  () => options.value.find((o) => o.value === singleModel.value)?.label ?? singleModel.value ?? '',
)

const labelFor = (value: string): string =>
  options.value.find((o) => o.value === value)?.label ?? value

const filteredOptions = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return options.value
  return options.value.filter(
    (o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q),
  )
})

const canCreate = computed(() => {
  const q = search.value.trim()
  if (!q) return false
  return !options.value.some((o) => o.value === q || o.label === q)
})

const getCreateLocale = (): LocaleCode =>
  isEnabledLocale(locale.value) ? locale.value : sourceLocale.value

const getCreatedLabel = (
  created: { label?: string; translations?: Array<{ locale?: string; label?: string | null }> },
  fallback: string,
): string =>
  created.label ??
  created.translations?.find((translation) => translation.locale === getCreateLocale())?.label ??
  created.translations?.find((translation) => translation.label)?.label ??
  fallback

const getCreateErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message) {
    return error.message.includes('[POST]')
      ? 'Création impossible pour le moment. Réessaie ou choisis une option existante.'
      : error.message
  }
  return 'Erreur lors de la création'
}

const selectSingle = (value: string): void => {
  emit('update:modelValue', value === singleModel.value ? null : value)
  isOpen.value = false
}

const toggleDropdown = async (): Promise<void> => {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    search.value = ''
    await nextTick()
    searchInputRef.value?.focus()
  }
}

const removeTag = (value: string): void => {
  emit(
    'update:modelValue',
    multiModel.value.filter((v) => v !== value),
  )
}

const toggleOption = (value: string): void => {
  const current = multiModel.value
  const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value]
  emit('update:modelValue', next)
}

const onEnterCreate = async (): Promise<void> => {
  const code = search.value.trim()
  if (!code || !canCreate.value || creating.value) return
  creating.value = true
  createError.value = null
  try {
    const createLocale = getCreateLocale()
    const created = await $fetch<{
      '@id': string
      code?: string
      codeValue?: string
      inCodeSet: string
      label?: string
      translations?: Array<{ locale?: string; label?: string | null }>
      contentUpdated: boolean
      reconciliationRequired: boolean
    }>('/api/dashboard/category-codes', {
      method: 'POST',
      body: {
        inCodeSet: props.inCodeSet,
        locale: createLocale,
        translations: [{ locale: createLocale, label: code }],
      },
    })
    const createdCode = created.codeValue ?? created.code ?? code
    const createdLabel = getCreatedLabel(created, code)
    store.addCategoryCode({
      id: {},
      codeValue: createdCode,
      name: createdLabel,
      inCodeSet: props.inCodeSet,
    })
    toggleOption(createdCode)
    search.value = ''
    if (!created.contentUpdated) {
      createError.value = 'Code créé dans la BDD, mais le fichier content doit être resynchronisé.'
    }
  } catch (err) {
    createError.value = getCreateErrorMessage(err)
  } finally {
    creating.value = false
  }
}
</script>
