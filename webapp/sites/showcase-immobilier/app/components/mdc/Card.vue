<template>
  <section class="px-6">
    <div
      class="border-foreground/10 bg-foreground/5 mx-auto w-full max-w-3xl rounded-2xl border p-6 md:p-8"
    >
      <p
        v-if="props.designation"
        class="text-foreground/60 text-xs font-semibold tracking-[0.32em] uppercase"
      >
        {{ props.designation }}
      </p>
      <h3 v-if="props.title" class="text-foreground mt-3 text-xl font-semibold md:text-2xl">
        {{ props.title }}
      </h3>
      <div
        v-if="props.content"
        class="text-foreground/80 mt-4 text-base leading-relaxed md:text-lg [&_ul]:mt-4 [&_ul]:space-y-2"
      >
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div v-html="props.content" />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// 1. Imports

// 2. Types et constantes statiques
type CardProps = {
  slug?: string
  designation?: string
  title?: string
  content?: string
  primaryImage?: {
    id?: number
    url?: string
    alt?: string
  }
  icon?: {
    id?: number
    url?: string
    alt?: string
  }
}

// 3. Props et emits
const props = defineProps<CardProps>()

// 4. Composables, stores, routeur

// 5. Etat local

// 6. Data inputs

// 7. Validation et helpers purs

// 8. Computed UI-ready

// 9. Actions et handlers

// 10. Watch et watchEffect

// 11. Metadonnees ecran ou page

// 12. Lifecycle
</script>
