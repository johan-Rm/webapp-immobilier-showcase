<template>
  <!-- Desktop : slideover gauche -->
  <USlideover
    :open="isOpen"
    :side="isMobile ? 'bottom' : 'left'"
    :ui="slideroverUi"
    @update:open="handleOpenUpdate"
  >
    <template #content>
      <div class="flex h-dvh min-h-0 flex-col">
        <section
          v-if="process === 'edit'"
          class="flex min-h-0 flex-1 flex-col"
          data-property-editor-process="edit"
        >
          <DashboardPropertyEditorPanel
            :active-section="activeSection"
            :active-locale="activeLocale"
            :active-draft="activeDraft"
            :accommodation="accommodation"
            :expanded-blocks="expandedBlocks"
            :title-value="titleDraftValue"
            :associated-media-value="associatedMediaValue"
            :property-menu-items="propertyMenuItems"
            :place-name="placeName"
            :place-text="placeText"
            :place-text-status="placeTextStatus"
            :place-text-error-message="placeTextErrorMessage"
            :is-place-text-dirty="isPlaceTextDirty"
            :symfony-available="symfonyAvailable"
            :is-active-value="isActiveValue"
            :save-status="saveStatus"
            :save-error-message="saveErrorMessage"
            :save-markdown-updated="saveMarkdownUpdated"
            show-close
            @update:active-section="activeSection = $event"
            @update:active-locale="activeLocale = $event"
            @close="isOpen = false"
            @toggle-block="toggleBlock"
            @update-field="updateField"
            @update-body="updateBody"
            @update-associated-media="updateAssociatedMedia"
            @update-place-text="updatePlaceText"
            @save="handleSave"
          />
        </section>

        <section v-else class="flex min-h-0 flex-1 flex-col" data-property-editor-process="create">
          <DashboardPropertyCreatorPanel
            @close="handleCreatorClose"
            @draft-created="handleCreatorDraftCreated"
            @created="handleCreatorCreated"
          />
        </section>
      </div>
    </template>
  </USlideover>

  <!-- Confirmation de suppression d'un brouillon non finalisé (option A) -->
  <UModal
    v-model:open="isDiscardModalOpen"
    :ui="{ content: 'max-w-sm bg-[#212121] text-white ring-0 shadow-none', overlay: 'bg-black/80' }"
  >
    <template #content>
      <div class="p-5">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-trash-2" class="text-base text-red-400" aria-hidden="true" />
          <h3 class="text-sm font-semibold text-white">Supprimer le brouillon ?</h3>
        </div>
        <p class="mt-2 text-xs leading-relaxed text-white/60">
          Ce brouillon de bien n'a pas été finalisé. Tu pourras annuler la suppression pendant
          quelques secondes.
        </p>
        <div class="mt-5 flex justify-end gap-2">
          <UButton
            type="button"
            color="neutral"
            variant="ghost"
            class="text-white/55 hover:bg-white/10 hover:text-white"
            @click="isDiscardModalOpen = false"
          >
            Annuler
          </UButton>
          <UButton type="button" color="error" @click="confirmDiscard"> Supprimer </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { useDashboardPlaceText } from '~/composables/dashboard/useDashboardPlaceText'
import { useDashboardSave } from '~/composables/dashboard/useDashboardSave'
import { useSymfonyStatus } from '~/composables/dashboard/useSymfonyStatus'

type DashboardLocale = 'fr' | 'en' | 'es'
type EditorSection = 'content' | 'media'
type EditorProcess = 'edit' | 'create'
type DashboardDraft = { frontmatter: DashboardEditableRecord; body: string }
type BlockMenuItem = { label: string; icon?: string; onSelect?: () => void }
defineOptions({ name: 'DashboardPropertyEditorSlideover' })

const props = defineProps<{
  open: boolean
  process: EditorProcess
  accommodation?: DashboardAccommodation | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'update:process': [value: EditorProcess]
  saved: []
  created: [identifier: string]
}>()

const activeSection = ref<EditorSection>('content')
const activeLocale = ref<DashboardLocale>('fr')
const drafts = ref<Record<DashboardLocale, DashboardDraft> | null>(null)
const dirtyLocalizedFields = ref<
  Record<DashboardLocale, Set<DashboardLocalizedAccommodationField>>
>({
  fr: new Set(),
  en: new Set(),
  es: new Set(),
})
const expandedBlocks = ref<Set<string>>(new Set<string>())
const isMobile = ref(false)
const localeLoadToken = ref(0)
const skipNextLocaleLoad = ref(false)
// Brouillon de création en cours : identifier renvoyé au premier POST, et indicateur
// de finalisation (le bien existe alors et ne doit plus être purgé à la fermeture).
const creatorDraftIdentifier = ref<string | null>(null)
const creatorFinalized = ref(false)
const isDiscardModalOpen = ref(false)
const toast = useToast()

const {
  status: saveStatus,
  errorMessage: saveErrorMessage,
  markdownUpdated: saveMarkdownUpdated,
  freshAccommodation: savedFreshAccommodation,
  freshTranslations: savedFreshTranslations,
  saveMultilingual,
  reset: resetSave,
} = useDashboardSave()
const {
  placeName,
  placeText,
  status: placeTextStatus,
  errorMessage: placeTextErrorMessage,
  isDirty: isPlaceTextDirty,
  loadPlaceText,
  updatePlaceText,
  savePlaceText,
} = useDashboardPlaceText()
const { available: symfonyAvailable, check: checkSymfonyStatus } = useSymfonyStatus()
const { enabledLocales, sourceLocale: projectSourceLocale } = useProjectLocales()

const slideroverUi = computed(() =>
  isMobile.value
    ? {
        content: 'max-h-[82dvh] bg-[#212121] text-white ring-0 shadow-none',
        overlay: 'bg-black/55',
      }
    : {
        content:
          'max-w-[min(92vw,34rem)] bg-[#212121] text-white ring-0 sm:ring-0 shadow-none sm:shadow-none',
        overlay: 'bg-black/55',
      },
)

onMounted(() => {
  const mq = window.matchMedia('(max-width: 1023px)')
  isMobile.value = mq.matches
  const handler = (e: MediaQueryListEvent) => {
    isMobile.value = e.matches
  }
  mq.addEventListener('change', handler)
  onUnmounted(() => mq.removeEventListener('change', handler))
})

const cloneEditableRecord = (value: DashboardEditableRecord): DashboardEditableRecord =>
  JSON.parse(JSON.stringify(value)) as DashboardEditableRecord

const cloneEditableValue = (value: DashboardEditableValue): DashboardEditableValue =>
  JSON.parse(JSON.stringify(value)) as DashboardEditableValue

const localizedFieldSet = new Set<string>(DASHBOARD_LOCALIZED_ACCOMMODATION_FIELDS)
// Onglets limites aux locales activees du projet (les drafts restent indexes
// sur le catalogue complet, voir createDrafts).
const localeTabs: DashboardLocale[] = enabledLocales.value.map((locale) => locale.code)

const isDashboardLocale = (value: string | undefined): value is DashboardLocale =>
  value === 'fr' || value === 'en' || value === 'es'

const createDirtyState = (): Record<
  DashboardLocale,
  Set<DashboardLocalizedAccommodationField>
> => ({
  fr: new Set(),
  en: new Set(),
  es: new Set(),
})

const isLocalizedField = (path: string): path is DashboardLocalizedAccommodationField =>
  localizedFieldSet.has(path)

const normalizeRelationCode = (
  value: DashboardEditableValue | undefined,
  fallback: string,
): DashboardEditableValue => {
  if (typeof value === 'string' && value.trim()) return value
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const record = value as DashboardEditableRecord
    if (typeof record.slug === 'string' && record.slug.trim()) return record.slug
    if (typeof record.codeValue === 'string' && record.codeValue.trim()) return record.codeValue
  }
  return fallback || null
}

const withPreviewFallbacks = (accommodation: DashboardAccommodation): DashboardEditableRecord => {
  const frontmatter = cloneEditableRecord(accommodation.frontmatter)
  frontmatter.realEstateListing = normalizeRelationCode(
    frontmatter.realEstateListing,
    accommodation.preview.listingSlug,
  )
  frontmatter.category = normalizeRelationCode(
    frontmatter.category,
    accommodation.preview.categorySlug,
  )
  frontmatter.place = normalizeRelationCode(frontmatter.place, accommodation.preview.placeSlug)
  return frontmatter
}

const createDraftFromAccommodation = (accommodation: DashboardAccommodation): DashboardDraft => ({
  frontmatter: withPreviewFallbacks(accommodation),
  body: accommodation.body ?? '',
})

const createDraftFromTranslation = (
  accommodation: DashboardAccommodation,
  translation: DashboardAccommodationTranslationPayload,
): DashboardDraft => {
  let frontmatter = withPreviewFallbacks(accommodation)
  DASHBOARD_LOCALIZED_ACCOMMODATION_FIELDS.forEach((field) => {
    if (field === 'body' || !Object.hasOwn(translation, field)) return
    frontmatter = setNestedValue(frontmatter, field, translation[field] ?? null)
  })

  return {
    frontmatter,
    body: translation.body ?? '',
  }
}

const createFallbackDraft = (accommodation?: DashboardAccommodation | null): DashboardDraft => {
  const frontmatter = accommodation ? withPreviewFallbacks(accommodation) : {}
  DASHBOARD_LOCALIZED_ACCOMMODATION_FIELDS.forEach((field) => {
    frontmatter[field] = ''
  })
  return { frontmatter, body: '' }
}

const createDrafts = (
  accommodation?: DashboardAccommodation | null,
): Record<DashboardLocale, DashboardDraft> => {
  const sourceLocale = isDashboardLocale(accommodation?.locale)
    ? accommodation.locale
    : projectSourceLocale.value
  const fallback = createFallbackDraft(accommodation)
  const result: Record<DashboardLocale, DashboardDraft> = {
    fr: { frontmatter: cloneEditableRecord(fallback.frontmatter), body: fallback.body },
    en: { frontmatter: cloneEditableRecord(fallback.frontmatter), body: fallback.body },
    es: { frontmatter: cloneEditableRecord(fallback.frontmatter), body: fallback.body },
  }

  if (accommodation) {
    result[sourceLocale] = createDraftFromAccommodation(accommodation)
  }

  return result
}

const setNestedValue = (
  record: DashboardEditableRecord,
  path: string,
  value: DashboardEditableValue,
): DashboardEditableRecord => {
  const [first, ...rest] = path.split('.')
  if (!first) return record
  if (rest.length === 0) return { ...record, [first]: value }
  const parent = record[first]
  const parentObj =
    parent !== null && typeof parent === 'object' && !Array.isArray(parent)
      ? (parent as DashboardEditableRecord)
      : {}
  return { ...record, [first]: setNestedValue(parentObj, rest.join('.'), value) }
}

const getNestedValue = (record: DashboardEditableRecord, path: string): DashboardEditableValue => {
  const [first, ...rest] = path.split('.')
  if (!first) return null
  const current = record[first] ?? null
  if (rest.length === 0) return current
  if (current === null || typeof current !== 'object' || Array.isArray(current)) return null
  return getNestedValue(current as DashboardEditableRecord, rest.join('.'))
}

const isOpen = computed<boolean>({
  get: () => props.open,
  set: (value) => emit('update:open', value),
})

const process = computed<EditorProcess>({
  get: () => props.process,
  set: (value) => emit('update:process', value),
})

const activeDraft = computed<DashboardDraft | null>(
  () => drafts.value?.[activeLocale.value] ?? null,
)

const associatedMediaValue = computed<DashboardEditableValue>(
  () => activeDraft.value?.frontmatter.associatedMedia ?? [],
)

const isActiveValue = computed<boolean>(
  () => getNestedValue(activeDraft.value?.frontmatter ?? {}, 'isActive') !== false,
)

const activePlaceCode = computed<string | null>(() => {
  const value = getNestedValue(activeDraft.value?.frontmatter ?? {}, 'place')
  return typeof value === 'string' && value.trim() ? value : null
})

const titleDraftValue = computed<string>(() => {
  if (!activeDraft.value) return props.accommodation?.preview.title ?? 'Bien immobilier'
  const name = getNestedValue(activeDraft.value.frontmatter, 'name')
  return typeof name === 'string' && name
    ? name
    : (props.accommodation?.preview.title ?? 'Bien immobilier')
})

const router = useRouter()

const propertyMenuItems = computed<BlockMenuItem[][]>(() => [
  [
    {
      label: 'Voir sur le site',
      icon: 'i-lucide-external-link',
      // TODO: ouvrir dans un nouvel onglet quand la page publique sera stable
      onSelect: () => {
        if (!props.accommodation) return
        const { listingSlug, categorySlug, slug } = props.accommodation.preview
        router.push(`/properties/${listingSlug}/${categorySlug}/${slug}`)
      },
    },
  ],
])

const discardCreatorDraft = async (identifier: string): Promise<void> => {
  try {
    await $fetch(`/api/dashboard/accommodations/${encodeURIComponent(identifier)}`, {
      method: 'DELETE',
    })
    toast.add({
      title: 'Brouillon supprimé',
      icon: 'i-lucide-trash-2',
      color: 'info',
    })
  } catch {
    // Échec de la purge : le brouillon (inactif) subsiste côté Symfony — on le signale
    // plutôt que d'afficher un faux succès.
    toast.add({
      title: 'Suppression du brouillon impossible',
      icon: 'i-lucide-alert-triangle',
      color: 'error',
    })
  }
}

const needsDiscardConfirm = (): boolean =>
  process.value === 'create' && Boolean(creatorDraftIdentifier.value) && !creatorFinalized.value

const resetCreatorState = (): void => {
  creatorDraftIdentifier.value = null
  creatorFinalized.value = false
}

const closeEditorNow = (): void => {
  resetCreatorState()
  isOpen.value = false
}

// Fermeture demandée : si un brouillon non finalisé existe, on ouvre la modale de
// confirmation (sans fermer) ; sinon on ferme directement.
const requestClose = (): void => {
  if (needsDiscardConfirm()) {
    isDiscardModalOpen.value = true
    return
  }
  closeEditorNow()
}

const confirmDiscard = (): void => {
  const identifier = creatorDraftIdentifier.value
  isDiscardModalOpen.value = false
  closeEditorNow()
  if (identifier) void discardCreatorDraft(identifier)
}

// Purge best-effort au déchargement de la page (onglet fermé, navigation) : la modale ne
// peut pas s'afficher. `fetch` keepalive survit au unload — `navigator.sendBeacon` est
// limité au POST, inutilisable sur une route DELETE. La session cookie suffit à
// `requireUserSession`. Pas de toast : la page disparaît.
const discardDraftOnUnload = (): void => {
  if (!needsDiscardConfirm()) return
  const identifier = creatorDraftIdentifier.value
  if (!identifier) return
  void fetch(`/api/dashboard/accommodations/${encodeURIComponent(identifier)}`, {
    method: 'DELETE',
    keepalive: true,
  }).catch(() => undefined)
}

onMounted(() => {
  window.addEventListener('pagehide', discardDraftOnUnload)
  onUnmounted(() => window.removeEventListener('pagehide', discardDraftOnUnload))
})

const handleOpenUpdate = (value: boolean): void => {
  if (value) {
    isOpen.value = true
    return
  }
  requestClose()
}

const handleCreatorClose = (): void => {
  requestClose()
}

const handleCreatorDraftCreated = (identifier: string): void => {
  creatorDraftIdentifier.value = identifier
}

// Bien finalisé : il existe désormais, plus de purge, on remonte au workspace qui
// bascule vers l'édition du bien créé.
const handleCreatorCreated = (identifier: string): void => {
  creatorFinalized.value = true
  creatorDraftIdentifier.value = null
  emit('created', identifier)
}

const toggleBlock = (id: string): void => {
  if (expandedBlocks.value.has(id)) {
    expandedBlocks.value = new Set()
  } else {
    expandedBlocks.value = new Set([id])
  }
}

const updateField = (path: string, value: DashboardEditableValue): void => {
  if (!drafts.value) return
  const locale = activeLocale.value
  const nextValue = cloneEditableValue(value)

  if (isLocalizedField(path)) {
    drafts.value[locale].frontmatter = setNestedValue(
      drafts.value[locale].frontmatter,
      path,
      nextValue,
    )
    dirtyLocalizedFields.value[locale].add(path)
    return
  }

  // `hasPart` est hybride (structure partagée, textes localisés) : on l'écrit sur la locale
  // active uniquement, pour ne pas écraser les textes des autres langues avec ceux de la
  // locale courante. La propagation de la structure aux autres locales se fait à la
  // sauvegarde (mergeHasPartLocales).
  if (path === 'hasPart') {
    drafts.value[locale].frontmatter = setNestedValue(
      drafts.value[locale].frontmatter,
      path,
      nextValue,
    )
    return
  }

  localeTabs.forEach((draftLocale) => {
    drafts.value![draftLocale].frontmatter = setNestedValue(
      drafts.value![draftLocale].frontmatter,
      path,
      nextValue,
    )
  })
}

const updateBody = (value: string): void => {
  if (!drafts.value) return
  drafts.value[activeLocale.value].body = value
  dirtyLocalizedFields.value[activeLocale.value].add('body')
}

const updateAssociatedMedia = (value: DashboardEditableValue): void => {
  if (!drafts.value) return
  const cloned = cloneEditableValue(value)
  localeTabs.forEach((locale) => {
    if (drafts.value![locale]) {
      drafts.value![locale].frontmatter.associatedMedia = cloned
    }
  })
}

const saveActivePlaceText = async (): Promise<boolean> => {
  return savePlaceText(activePlaceCode.value, activeLocale.value)
}

const toTranslationValue = (
  draft: DashboardDraft,
  field: DashboardLocalizedAccommodationField,
): string | null => {
  if (field === 'body') return draft.body
  const value = getNestedValue(draft.frontmatter, field)
  return typeof value === 'string' ? value : null
}

const buildTranslations = (): DashboardAccommodationTranslationPayload[] => {
  if (!drafts.value) return []

  return localeTabs
    .map((locale): DashboardAccommodationTranslationPayload | null => {
      const fields = dirtyLocalizedFields.value[locale]
      if (fields.size === 0) return null

      const translation: DashboardAccommodationTranslationPayload = { locale }
      fields.forEach((field) => {
        translation[field] = toTranslationValue(drafts.value![locale], field)
      })
      return translation
    })
    .filter((translation): translation is DashboardAccommodationTranslationPayload =>
      Boolean(translation),
    )
}

const buildActiveLocaleTranslation = (): DashboardAccommodationTranslationPayload | null => {
  if (!activeDraft.value) return null

  const translation: DashboardAccommodationTranslationPayload = { locale: activeLocale.value }
  DASHBOARD_LOCALIZED_ACCOMMODATION_FIELDS.forEach((field) => {
    translation[field] = toTranslationValue(activeDraft.value!, field)
  })
  return translation
}

const ensureTranslations = (
  translations: DashboardAccommodationTranslationPayload[],
): DashboardAccommodationTranslationPayload[] => {
  if (translations.length > 0) return translations

  const activeTranslation = buildActiveLocaleTranslation()
  return activeTranslation ? [activeTranslation] : []
}

const resolveSaveLocale = (
  translations: DashboardAccommodationTranslationPayload[],
): LocaleCode => {
  return translations.length > 1
    ? projectSourceLocale.value
    : (translations[0]?.locale ?? activeLocale.value)
}

const loadLocaleDrafts = async (accommodation?: DashboardAccommodation | null): Promise<void> => {
  if (!accommodation) return

  const token = localeLoadToken.value + 1
  localeLoadToken.value = token

  let translations: DashboardAccommodationTranslationPayload[] = []
  try {
    const response = await $fetch<DashboardAccommodationTranslationsResponse>(
      `/api/dashboard/accommodations/${encodeURIComponent(accommodation.identifier)}/translations`,
    )
    translations = response.translations
  } catch {
    translations = []
  }

  if (localeLoadToken.value !== token || !drafts.value) return

  translations.forEach((translation) => {
    const locale = translation.locale
    if (!isDashboardLocale(locale)) return
    if (dirtyLocalizedFields.value[locale].size > 0) return
    drafts.value![locale] = createDraftFromTranslation(accommodation, translation)
  })
}

const handleSave = async (): Promise<void> => {
  if (!props.accommodation || !activeDraft.value) return

  const placeSaved = await saveActivePlaceText()
  if (!placeSaved) {
    toast.add({
      title: placeTextErrorMessage.value ?? 'Enregistrement du lieu impossible',
      icon: 'i-lucide-alert-triangle',
      color: 'error',
    })
    return
  }

  const translations = ensureTranslations(buildTranslations())
  const payload: DashboardAccommodationSavePayload = {
    ...props.accommodation,
    locale: activeLocale.value,
    frontmatter: activeDraft.value.frontmatter,
    body: activeDraft.value.body,
    ...(translations.length > 0 && { translations }),
  }

  const ok = await saveMultilingual(payload, resolveSaveLocale(translations))
  if (!ok) {
    toast.add({
      title: saveErrorMessage.value ?? 'Erreur lors de la sauvegarde',
      icon: 'i-lucide-alert-triangle',
      color: 'error',
    })
    return
  }

  dirtyLocalizedFields.value = createDirtyState()
  const fresh = savedFreshAccommodation.value
  if (fresh) {
    drafts.value = createDrafts(fresh)
    savedFreshTranslations.value.forEach((translation) => {
      const locale = translation.locale
      if (!isDashboardLocale(locale)) return
      drafts.value![locale] = createDraftFromTranslation(fresh, translation)
    })
    skipNextLocaleLoad.value = true
  }

  toast.add({
    title: 'Bien enregistré',
    icon: 'i-lucide-save',
    color: 'success',
  })
  emit('saved')
}

watch(
  () => props.accommodation?.slug,
  async () => {
    drafts.value = createDrafts(props.accommodation)
    dirtyLocalizedFields.value = createDirtyState()
    activeSection.value = 'content'
    activeLocale.value = isDashboardLocale(props.accommodation?.locale)
      ? props.accommodation.locale
      : projectSourceLocale.value
    expandedBlocks.value = new Set<string>()
    resetSave()
    if (skipNextLocaleLoad.value) {
      skipNextLocaleLoad.value = false
      return
    }
    if (isOpen.value) {
      await loadLocaleDrafts(props.accommodation)
    }
  },
  { immediate: true },
)

watch(isOpen, async (open) => {
  if (!open) {
    expandedBlocks.value = new Set<string>()
    return
  }
  if (open && symfonyAvailable.value === null) {
    checkSymfonyStatus()
  }
  await loadLocaleDrafts(props.accommodation)
})

// Nouvelle création : repartir d'un état de brouillon vierge.
watch(process, (value) => {
  if (value === 'create') resetCreatorState()
})

watch(
  [activePlaceCode, activeLocale],
  async ([placeCode, locale]) => {
    await loadPlaceText(placeCode, locale)
  },
  { immediate: true },
)
</script>
