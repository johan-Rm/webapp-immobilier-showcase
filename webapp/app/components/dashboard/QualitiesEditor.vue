<template>
  <div class="col-span-2 ml-0.5 border-l-2 border-l-transparent py-1.5 pr-1">
    <div v-for="(quality, index) in qualities" :key="index" class="mb-3 last:mb-0">
      <div class="mb-1.5 flex items-center gap-2">
        <input
          type="text"
          class="min-w-0 flex-1 bg-transparent text-[0.7rem] font-semibold tracking-widest text-white/50 uppercase caret-white outline-none placeholder:text-white/20"
          :value="quality.name"
          placeholder="Nom"
          @input="updateName(index, ($event.target as HTMLInputElement).value)"
        />
        <input
          :value="quality.value"
          type="number"
          inputmode="numeric"
          :min="MIN_QUALITY_VALUE"
          :max="MAX_QUALITY_VALUE"
          :step="1"
          aria-label="Note de qualité"
          class="quality-value-input h-6 w-7 shrink-0 -translate-y-1 bg-transparent px-0 text-right text-xs font-semibold text-[#6B7A4A] tabular-nums caret-[#6B7A4A] transition-colors outline-none placeholder:text-[#6B7A4A]/35 focus:text-[#7d8f57]"
          @input="updateValue(index, ($event.target as HTMLInputElement).value)"
        />
      </div>
      <USlider
        :model-value="quality.value"
        :min="MIN_QUALITY_VALUE"
        :max="MAX_QUALITY_VALUE"
        :step="1"
        :ui="{
          track: 'bg-white/10',
          range: 'bg-[#6B7A4A]',
          thumb: 'ring-[#6B7A4A] bg-[#6B7A4A]',
        }"
        @update:model-value="updateValue(index, $event as number)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'DashboardQualitiesEditor' })

type Quality = { name: string; value: number }

const MIN_QUALITY_VALUE = 0
const MAX_QUALITY_VALUE = 100

const props = defineProps<{
  modelValue: DashboardEditableValue
}>()

const emit = defineEmits<{
  'update:modelValue': [value: DashboardEditableValue]
}>()

const DEFAULT_QUALITIES: Quality[] = [
  { name: 'Confort', value: 0 },
  { name: 'Architecture', value: 0 },
  { name: 'Intérieur', value: 0 },
]

const qualities = computed<Quality[]>(() => {
  const incoming = Array.isArray(props.modelValue)
    ? props.modelValue.flatMap((item) => {
        if (item === null || typeof item !== 'object' || Array.isArray(item)) return []
        const name = typeof item.name === 'string' ? item.name : ''
        const value = typeof item.value === 'number' ? item.value : 0
        return [{ name, value }]
      })
    : []

  return DEFAULT_QUALITIES.map(({ name }) => {
    const found = incoming.find((q) => q.name === name)
    return found ?? { name, value: 0 }
  })
})

const emitUpdate = (next: Quality[]): void => {
  emit('update:modelValue', next)
}

const updateName = (index: number, name: string): void => {
  const next = qualities.value.map((q, i) => (i === index ? { ...q, name } : q))
  emitUpdate(next)
}

const normalizeQualityValue = (value: unknown): number => {
  const numericValue = typeof value === 'number' ? value : Number.parseInt(String(value).trim(), 10)

  if (!Number.isFinite(numericValue)) return MIN_QUALITY_VALUE

  return Math.min(MAX_QUALITY_VALUE, Math.max(MIN_QUALITY_VALUE, Math.round(numericValue)))
}

const updateValue = (index: number, value: unknown): void => {
  const nextValue = normalizeQualityValue(value)
  const next = qualities.value.map((q, i) => (i === index ? { ...q, value: nextValue } : q))
  emitUpdate(next)
}
</script>

<style scoped>
.quality-value-input {
  appearance: textfield;
  -moz-appearance: textfield;
}

.quality-value-input::-webkit-inner-spin-button,
.quality-value-input::-webkit-outer-spin-button {
  margin: 0;
  appearance: none;
  -webkit-appearance: none;
}
</style>
