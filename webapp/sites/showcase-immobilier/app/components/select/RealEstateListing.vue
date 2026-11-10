<template>
  <USelect
    v-model="modelValue"
    size="xs"
    variant="ghost"
    :items="items"
    value-key="value"
    label-key="label"
    :trailing-icon="false"
    :ui="{
      base: 'cursor-pointer pointer-events-auto relative flex min-h-10 w-full items-center justify-center rounded-xl bg-white/10 px-3 py-2 text-center text-[11px] leading-tight tracking-wide whitespace-normal text-white uppercase backdrop-blur transition-all duration-300 ease-out hover:bg-white/20 hover:text-white hover:shadow-sm hover:shadow-white/10 hover:backdrop-blur-md focus:outline-none focus:bg-white/20 focus:text-white focus:shadow-sm focus:shadow-white/10 focus:backdrop-blur-md sm:h-10 sm:px-4 sm:py-0 sm:text-xs sm:tracking-wider xl:min-h-8 xl:px-8 xl:text-sm 2xl:min-h-20 2xl:px-10 2xl:text-lg',
      value:
        'block w-full whitespace-normal text-center break-keep text-balance sm:truncate xl:text-sm 2xl:text-lg',
      content:
        'bg-background ring-background cursor-pointer text-foreground xl:text-base 2xl:text-lg',
      itemActive: 'bg-white text-foreground',
      item: 'text-foreground xl:text-base 2xl:text-lg',
    }"
  >
    <span
      data-slot="value"
      class="block w-full text-center text-balance break-keep whitespace-normal sm:truncate xl:text-sm 2xl:text-lg"
    >
      {{ selectedOption?.label ?? '\u00A0' }}
    </span>

    <template #item-label="{ item }"> {{ item.label }} ({{ item.count }}) </template>
  </USelect>
</template>

<script setup lang="ts">
// 1. Imports

// 2. Types et constantes statiques
type Props = {
  items: RealEstateListingSelectOption[]
}

type RealEstateListingSelectOption = {
  label: string
  value: string
  count: number
  disabled: boolean
}

// 3. Props et emits
const props = defineProps<Props>()

const modelValue = defineModel<string>({ required: true })

// 4. Composables, stores, routeur

// 5. Etat local

// 6. Data inputs

// 7. Validation et helpers purs

// 8. Computed UI-ready

// 9. Actions et handlers
const selectedOption = computed<RealEstateListingSelectOption | undefined>(() =>
  props.items.find((item) => item.value === modelValue.value),
)

// 10. Watch et watchEffect

// 11. Metadonnees ecran ou page

// 12. Lifecycle
</script>
