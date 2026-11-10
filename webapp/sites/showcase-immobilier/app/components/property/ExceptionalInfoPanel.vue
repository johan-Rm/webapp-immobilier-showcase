<template>
  <!-- RÉGION F — Panneau d'infos du bien (drawer). Ouvert depuis la synthèse fixe.
       Chrome (voile, fermeture, transitions, focus-trap) délégué au shell PropertyDetailDrawer ;
       ce composant ne porte que le contenu (nom, localisation, badges, référence, CTA visite). -->
  <PropertyDetailDrawer
    :open="open"
    content-class="w-[min(88vw,24rem)]"
    aria-label="Informations du bien"
    @update:open="(value: boolean) => (value ? undefined : emit('close'))"
  >
    <div class="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-8 md:px-8 md:py-10">
      <span class="bg-foreground/70 block h-px w-12 rounded-full" aria-hidden="true" />
      <h2 class="mt-4 text-2xl font-bold tracking-[0.04em] uppercase">{{ summary.name }}</h2>
      <p class="text-foreground/60 mt-1 text-sm">{{ summary.location }}</p>

      <ul class="mt-8 flex flex-wrap gap-2">
        <li
          v-for="badge in badges"
          :key="badge.full"
          class="border-foreground/15 bg-foreground/5 rounded-md border px-3 py-1.5 text-xs font-bold tracking-[0.04em]"
        >
          {{ badge.full }}
        </li>
      </ul>

      <dl class="text-foreground/70 mt-8 text-sm">
        <dt class="text-foreground/45 text-xs tracking-[0.18em] uppercase">
          {{ labels.reference }}
        </dt>
        <dd class="mt-1 font-medium">{{ summary.reference }}</dd>
      </dl>

      <button
        type="button"
        class="border-foreground/50 hover:bg-foreground hover:text-background focus-visible:outline-foreground mt-auto inline-flex items-center justify-center gap-2 rounded-md border px-5 py-3 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2"
        @click="emit('request-visit')"
      >
        {{ labels.requestVisit }} <span aria-hidden="true">→</span>
      </button>
    </div>
  </PropertyDetailDrawer>
</template>

<script setup lang="ts">
// 1. Imports
import type {
  ExceptionalPropertyBadge,
  ExceptionalPropertySummary,
} from '#shared/types/exceptional'

// 3. Props et emits
defineProps<{
  open: boolean
  summary: ExceptionalPropertySummary
  badges: readonly ExceptionalPropertyBadge[]
  labels: { reference: string; requestVisit: string }
}>()
const emit = defineEmits<{ close: []; 'request-visit': [] }>()
</script>
