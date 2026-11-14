<template>
  <UCard
    class="dashboard-panel"
    :data-panel="kind"
    :ui="{ root: 'ring-0 divide-none shadow-none' }"
  >
    <div class="mb-4 flex items-center gap-3">
      <span
        class="dashboard-panel-icon inline-flex size-12 shrink-0 items-center justify-center rounded-xl"
      >
        <UIcon :name="icons[kind]" class="size-6" aria-hidden="true" />
      </span>
      <h2 v-if="title" class="text-lg font-semibold">{{ title }}</h2>
    </div>
    <slot />
  </UCard>
</template>

<script setup lang="ts">
// 1. Imports
// 2. Types et constantes statiques
const icons = {
  context: 'i-lucide-building-2',
  project: 'i-lucide-folder-open',
  organization: 'i-lucide-building-2',
  newProject: 'i-lucide-folder-plus',
  members: 'i-lucide-users',
  articles: 'i-lucide-newspaper',
  fields: 'i-lucide-text-cursor-input',
  content: 'i-lucide-panels-top-left',
  resources: 'i-lucide-images',
} as const
// 3. Props et emits
defineProps<{ kind: keyof typeof icons; title?: string }>()
// 4. Composables, stores, routeur
// 5. État local
// 6. Data inputs
// 7. Validation et helpers purs
// 8. Computed UI-ready
// 9. Actions et handlers
// 10. Watch et watchEffect
// 11. Métadonnées écran ou page
// 12. Lifecycle
</script>
