<template>
  <UModal :open="open" :ui="modalUi" @update:open="emit('update:open', $event)">
    <template #content>
      <div class="flex max-h-[85dvh] min-h-0 flex-col">
        <!-- Header -->
        <div class="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3">
          <h2 class="text-sm font-semibold text-white/70">Ajouter des images</h2>
          <button
            type="button"
            class="rounded p-1 text-white/30 transition-colors hover:text-white/70"
            aria-label="Fermer"
            @click="emit('update:open', false)"
          >
            <UIcon name="i-lucide-x" class="text-sm" aria-hidden="true" />
          </button>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto p-4">
          <!-- Zone dépôt -->
          <div
            class="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 text-center transition-colors"
            :class="
              isDragging
                ? 'border-[#6B7A4A] bg-[#6B7A4A]/5'
                : 'border-white/15 hover:border-white/25'
            "
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="onDrop"
          >
            <UIcon
              name="i-lucide-upload-cloud"
              class="text-3xl"
              :class="isDragging ? 'text-[#6B7A4A]' : 'text-white/25'"
              aria-hidden="true"
            />
            <p class="text-sm text-white/50">
              Glissez des images ici ou
              <button
                type="button"
                class="text-[#6B7A4A] underline underline-offset-2 transition-opacity hover:opacity-80"
                @click="fileInputRef?.click()"
              >
                choisissez des fichiers
              </button>
            </p>
            <p class="text-[0.65rem] text-white/25">JPEG, PNG, WebP</p>
            <input
              ref="fileInputRef"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              multiple
              class="hidden"
              aria-hidden="true"
              @change="onFileChange"
            />
          </div>

          <!-- File queue -->
          <div v-if="queue.length" class="mt-4 space-y-1.5">
            <div
              v-for="(item, index) in queue"
              :key="index"
              class="flex items-center gap-3 rounded bg-white/5 px-3 py-2"
            >
              <!-- Icône statut -->
              <UIcon
                :name="statusIcon(item.status)"
                class="shrink-0 text-sm"
                :class="statusColor(item.status)"
                aria-hidden="true"
              />

              <!-- Nom + erreur -->
              <div class="min-w-0 flex-1">
                <p class="truncate text-xs text-white/70">{{ item.file.name }}</p>
                <p
                  v-if="item.error"
                  class="text-[0.6rem]"
                  :class="item.status === 'warning' ? 'text-amber-400' : 'text-red-400'"
                >
                  {{ item.error }}
                </p>
              </div>

              <!-- Taille -->
              <span class="shrink-0 text-[0.6rem] text-white/25">{{
                formatSize(item.file.size)
              }}</span>

              <!-- Supprimer (si pending) -->
              <button
                v-if="item.status === 'pending'"
                type="button"
                class="shrink-0 text-white/20 transition-colors hover:text-white/60"
                :aria-label="`Retirer ${item.file.name}`"
                @click="queue.splice(index, 1)"
              >
                <UIcon name="i-lucide-x" class="text-xs" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="shrink-0 border-t border-white/10 px-4 py-3">
          <p v-if="errorCount" class="mb-2 text-xs text-red-400">
            {{ errorCount }} fichier{{ errorCount > 1 ? 's' : '' }} en erreur
          </p>
          <p v-if="warningCount" class="mb-2 text-xs text-amber-400">
            {{ warningCount }} fichier{{ warningCount > 1 ? 's' : '' }} à resynchroniser
          </p>
          <UButton
            block
            :disabled="!pendingCount || isUploading"
            :loading="isUploading"
            class="bg-[#6B7A4A]! text-white! hover:bg-[#5a6840]! disabled:opacity-40!"
            @click="handleUpload"
          >
            <template v-if="isUploading">Téléversement…</template>
            <template v-else>
              Téléverser {{ pendingCount > 1 ? `${pendingCount} fichiers` : '1 fichier' }}
            </template>
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { MediaObject } from '@schemas/interfaces'

type UploadStatus = 'pending' | 'uploading' | 'done' | 'warning' | 'error'

type MediaUploadResponse = MediaObject & {
  contentUpdated: boolean
  reconciliationRequired: boolean
}

type QueueItem = {
  file: File
  status: UploadStatus
  error?: string
}

defineOptions({ name: 'DashboardPropertyMediaPickerModal' })

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  uploaded: [mediaObjects: MediaObject[]]
}>()

const metadataStore = useMetadataStore()

const isDragging = ref(false)
const isUploading = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const queue = ref<QueueItem[]>([])

const modalUi = {
  content: 'max-w-lg bg-[#212121] text-white ring-0 shadow-none overflow-hidden',
  overlay: 'bg-black/90',
}

const pendingCount = computed<number>(
  () => queue.value.filter((i) => i.status === 'pending').length,
)
const errorCount = computed<number>(() => queue.value.filter((i) => i.status === 'error').length)
const warningCount = computed<number>(
  () => queue.value.filter((i) => i.status === 'warning').length,
)

const statusIcon = (status: UploadStatus): string => {
  if (status === 'uploading') return 'i-lucide-loader'
  if (status === 'done') return 'i-lucide-check-circle'
  if (status === 'warning') return 'i-lucide-triangle-alert'
  if (status === 'error') return 'i-lucide-alert-circle'
  return 'i-lucide-file-image'
}

const statusColor = (status: UploadStatus): string => {
  if (status === 'uploading') return 'animate-spin text-[#6B7A4A]'
  if (status === 'done') return 'text-[#6B7A4A]'
  if (status === 'warning') return 'text-amber-400'
  if (status === 'error') return 'text-red-400'
  return 'text-white/30'
}

const { locale } = useI18n()
const { isEnabledLocale, sourceLocale } = useProjectLocales()

const getUploadLocale = (): LocaleCode =>
  isEnabledLocale(locale.value) ? locale.value : sourceLocale.value

const createCaptionFromFilename = (filename: string): string =>
  filename
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const formatSize = (bytes: number): string => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

const addFiles = (files: FileList | File[]): void => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  for (const file of Array.from(files)) {
    if (!allowed.includes(file.type)) continue
    const alreadyQueued = queue.value.some(
      (i) => i.file.name === file.name && i.file.size === file.size,
    )
    if (alreadyQueued) continue
    queue.value.push({ file, status: 'pending' })
  }
}

const onDrop = (event: DragEvent): void => {
  isDragging.value = false
  if (event.dataTransfer?.files) addFiles(event.dataTransfer.files)
}

const onFileChange = (event: Event): void => {
  const input = event.target as HTMLInputElement
  if (input.files) addFiles(input.files)
  input.value = ''
}

const handleUpload = async (): Promise<void> => {
  const pending = queue.value.filter((i) => i.status === 'pending')
  if (!pending.length) return

  isUploading.value = true
  const results: MediaObject[] = []

  for (const item of pending) {
    item.status = 'uploading'
    try {
      const form = new FormData()
      form.append('file', item.file, item.file.name)
      form.append(
        'translations',
        JSON.stringify([
          {
            locale: getUploadLocale(),
            caption: createCaptionFromFilename(item.file.name),
          },
        ]),
      )

      const result = await $fetch<MediaUploadResponse>('/api/dashboard/media/upload', {
        method: 'POST',
        body: form,
      })

      metadataStore.addMediaObject(result)
      results.push(result)
      item.status = result.contentUpdated ? 'done' : 'warning'
      if (!result.contentUpdated) {
        item.error = 'Image créée dans la BDD, mais le fichier content doit être resynchronisé.'
      }
    } catch (err: unknown) {
      item.status = 'error'
      item.error = err instanceof Error ? err.message : 'Erreur'
    }
  }

  isUploading.value = false

  if (results.length) {
    emit('uploaded', results)
  }

  if (!errorCount.value) {
    emit('update:open', false)
  }
}

watch(
  () => props.open,
  (open) => {
    if (!open) {
      queue.value = []
      isDragging.value = false
      isUploading.value = false
    }
  },
)
</script>
