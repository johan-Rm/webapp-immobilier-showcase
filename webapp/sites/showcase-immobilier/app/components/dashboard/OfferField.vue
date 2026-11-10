<template>
  <div
    class="col-span-1 ml-0.5 border-b border-l-2 border-white/5 py-1.5 pr-1 transition-colors"
    :class="isOpen ? 'border-l-[#6B7A4A] bg-white/2.5' : 'border-l-transparent hover:bg-white/2.5'"
  >
    <UPopover
      v-model:open="isOpen"
      :content="{ side: 'right', sideOffset: 12 }"
      :ui="{ content: 'bg-[#1c1c1c] border border-white/10 shadow-xl p-0 min-w-52 rounded-lg' }"
    >
      <button type="button" class="flex w-full flex-col text-left" :aria-label="`Modifier l'offre`">
        <p class="mb-1 text-[0.65rem] font-semibold tracking-widest text-white/20">Offre</p>
        <p
          class="text-sm transition-colors"
          :class="formattedPrice ? 'text-white/65' : 'text-white/25'"
        >
          {{ formattedPrice || '—' }}
        </p>
        <p class="mt-0.5 text-[0.6rem]" style="color: #6b7a4a">
          {{ availability || 'Disponible' }}
        </p>
      </button>
      <template #content>
        <div class="flex flex-col divide-y divide-white/5 py-1">
          <div class="px-3 py-2">
            <p class="mb-1 text-[0.6rem] font-semibold tracking-widest text-white/20">Prix</p>
            <input
              type="number"
              class="w-full bg-transparent text-sm text-white caret-white outline-none placeholder:text-white/20"
              :value="price ?? ''"
              placeholder="—"
              @input="updatePrice($event)"
            />
          </div>
          <div class="px-3 py-2">
            <p class="mb-1 text-[0.6rem] font-semibold tracking-widest text-white/20">Type</p>
            <input
              type="text"
              class="w-full bg-transparent text-sm text-white caret-white outline-none placeholder:text-white/20"
              :value="priceSpecification"
              placeholder="—"
              @input="updateSpecification($event)"
            />
          </div>
          <div class="px-3 py-2">
            <p class="mb-1 text-[0.6rem] font-semibold tracking-widest text-white/20">
              Disponibilité
            </p>
            <input
              type="text"
              class="w-full bg-transparent text-sm text-white/40 caret-white outline-none placeholder:text-white/20"
              :value="availability"
              placeholder="—"
              @input="updateAvailability($event)"
            />
          </div>
        </div>
      </template>
    </UPopover>
  </div>
</template>

<script setup lang="ts">
import { DEFAULT_PRICE_CURRENCY } from '#shared/types/accommodation'

defineOptions({ name: 'DashboardOfferField' })

const props = defineProps<{
  modelValue: DashboardEditableValue
}>()

const emit = defineEmits<{
  'update:modelValue': [value: DashboardEditableValue]
}>()

const isOpen = ref(false)

const offerObj = computed<DashboardEditableRecord>(() => {
  const v = props.modelValue
  if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
    return v as DashboardEditableRecord
  }
  return {}
})

const toNumber = (value: DashboardEditableValue | undefined): number | null => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value !== 'string') return null
  const parsed = Number(value.trim())
  return Number.isFinite(parsed) ? parsed : null
}

const price = computed<number | null>(() => {
  return toNumber(offerObj.value.price)
})

const priceCurrency = computed<string>(() => {
  const v = offerObj.value.priceCurrency
  return typeof v === 'string' && v ? v : DEFAULT_PRICE_CURRENCY
})

const priceSpecification = computed<string>(() => {
  const v = offerObj.value.priceSpecification
  return typeof v === 'string' ? v : ''
})

const availability = computed<string>(() => {
  const v = offerObj.value.availability
  return typeof v === 'string' ? v : ''
})

const formattedPrice = computed<string>(() => {
  if (price.value === null) return ''
  const formatted = price.value.toLocaleString('fr-FR')
  return `${formatted} ${priceCurrency.value}`
})

const emitUpdate = (patch: Record<string, DashboardEditableValue>): void => {
  emit('update:modelValue', { ...offerObj.value, ...patch })
}

const updatePrice = (event: Event): void => {
  const raw = (event.target as HTMLInputElement).value
  if (raw === '') {
    emitUpdate({ price: null })
    return
  }
  const parsed = Number(raw)
  emitUpdate({ price: Number.isFinite(parsed) ? parsed : null })
}

const updateSpecification = (event: Event): void => {
  emitUpdate({ priceSpecification: (event.target as HTMLInputElement).value })
}

const updateAvailability = (event: Event): void => {
  emitUpdate({ availability: (event.target as HTMLInputElement).value })
}
</script>
