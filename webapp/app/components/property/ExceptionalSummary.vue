<template>
  <!-- RÉGION C — Synthèse fixe : carte d'identité du bien (nom + prix + badges), ancrée en bas
       à gauche, indépendante du rail. Déclencheur du panneau d'informations (drawer). -->
  <button
    type="button"
    class="group fixed right-4 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] left-4 z-50 flex max-w-[calc(100vw-2rem)] cursor-pointer flex-col gap-1.5 overflow-hidden rounded-md text-left text-xs text-white transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white md:right-auto md:left-6 md:flex-row md:items-center md:gap-2"
    aria-label="Voir les informations du bien"
    aria-haspopup="dialog"
    :aria-expanded="expanded"
    @click="emit('open-info')"
  >
    <div class="flex shrink-0 flex-col px-1 leading-tight tracking-[0.01em]">
      <span class="mb-2 block h-px w-12 rounded-full bg-white/75" aria-hidden="true" />
      <span class="flex items-center gap-2">
        <span class="text-lg leading-none font-bold tracking-[0.08em] uppercase">
          {{ summary.name }}
        </span>
        <UIcon
          name="i-lucide-chevrons-up"
          class="shrink-0 text-lg text-white/75 transition-transform duration-200 group-hover:-translate-y-0.5 md:hidden"
          aria-hidden="true"
        />
      </span>
      <span class="hidden self-start text-sm font-bold whitespace-nowrap text-white md:block">
        {{ summary.price }}
      </span>
    </div>
    <div class="flex items-center justify-between gap-2 px-1 md:w-auto md:justify-start">
      <span class="text-sm font-bold whitespace-nowrap text-white md:hidden">
        {{ summary.price }}
      </span>
      <div class="flex min-w-0 items-center gap-1 overflow-hidden md:gap-1.5">
        <span
          v-for="badge in badges"
          :key="badge.full"
          class="bg-background/30 shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold text-white/75 backdrop-blur md:px-2.5 md:py-3 md:text-xs"
        >
          <span class="md:hidden">{{ badge.short }}</span>
          <span class="hidden md:inline">{{ badge.full }}</span>
        </span>
      </div>
    </div>
  </button>
</template>

<script setup lang="ts">
// 1. Imports
import type {
  ExceptionalPropertyBadge,
  ExceptionalPropertySummary,
} from '#shared/types/exceptional'

// 3. Props et emits
defineProps<{
  summary: ExceptionalPropertySummary
  badges: readonly ExceptionalPropertyBadge[]
  expanded?: boolean
}>()
const emit = defineEmits<{ 'open-info': [] }>()
</script>
