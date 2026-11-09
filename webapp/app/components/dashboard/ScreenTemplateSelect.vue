<template>
  <!-- Sélecteur visuel : une carte par template, chacune avec son skeleton (wireframe fidèle). -->
  <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
    <button
      v-for="item in items"
      :key="item.value"
      type="button"
      class="flex flex-col items-center gap-1.5 rounded-md border p-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6B7A4A]"
      :class="
        modelValue === item.value
          ? 'border-[#6B7A4A] bg-[#6B7A4A]/10 text-[#6B7A4A]'
          : 'border-white/10 text-white/40 hover:border-white/25 hover:text-white/70'
      "
      :aria-pressed="modelValue === item.value"
      :aria-label="item.label"
      @click="emit('update:modelValue', item.value)"
    >
      <span class="aspect-3/2 w-full">
        <DashboardScreenTemplateSkeleton :template="item.value" />
      </span>
      <span class="text-[0.65rem] leading-tight font-medium">{{ item.label }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
// 1. Imports
import { DASHBOARD_SCREEN_TEMPLATES } from '#shared/types/dashboardAccommodation'

defineOptions({ name: 'DashboardScreenTemplateSelect' })

// 3. Props et emits
defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

// 2. Types et constantes statiques
const items: { value: string; label: string }[] = DASHBOARD_SCREEN_TEMPLATES.map((template) => ({
  value: template.value,
  label: template.label,
}))
</script>
