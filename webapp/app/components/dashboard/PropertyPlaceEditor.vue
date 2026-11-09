<template>
  <div class="space-y-4 px-1 py-2">
    <div class="border-b border-white/5 pb-3">
      <p class="mb-1 text-[0.65rem] font-semibold tracking-widest text-white/20">Nom du lieu</p>
      <p class="text-sm font-semibold" style="color: #6b7a4a">{{ placeName || '—' }}</p>
    </div>

    <div>
      <div class="mb-2 flex items-center justify-between gap-3">
        <p class="text-[0.65rem] font-semibold tracking-widest text-white/20">Texte du lieu</p>
      </div>
      <textarea
        class="min-h-36 w-full resize-y rounded border border-white/10 bg-white/[0.03] px-3 py-2 text-sm leading-relaxed text-white/75 caret-white transition-colors outline-none focus:border-[#6B7A4A]"
        :value="placeText"
        :disabled="status === 'loading' || status === 'saving'"
        aria-label="Texte du lieu"
        @input="emit('update-place-text', ($event.target as HTMLTextAreaElement).value)"
      />
    </div>

    <p v-if="statusMessage" class="text-xs" :class="statusMessageClass">{{ statusMessage }}</p>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'DashboardPropertyPlaceEditor' })

const props = defineProps<{
  placeName: string
  placeText: string
  status: 'idle' | 'loading' | 'saving' | 'success' | 'error'
  errorMessage: string | null
  isDirty: boolean
}>()

const emit = defineEmits<{
  'update-place-text': [value: string]
}>()

const statusMessage = computed(() => {
  if (props.errorMessage) return props.errorMessage
  if (props.status === 'loading') return 'Chargement du lieu...'
  if (props.status === 'saving') return 'Enregistrement du texte du lieu...'
  if (props.status === 'success') return 'Texte du lieu enregistré'
  return ''
})

const statusMessageClass = computed(() => {
  if (props.errorMessage || props.status === 'error') return 'text-red-400'
  if (props.status === 'success') return 'text-[#6B7A4A]'
  if (props.isDirty) return 'text-amber-300/80'
  return 'text-white/25'
})
</script>
