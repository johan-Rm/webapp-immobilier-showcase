<template>
  <div class="flex h-full min-h-0 flex-col justify-end">
    <div class="flex items-center gap-4">
      <span class="block h-px w-8 bg-white" />
      <p class="text-foreground/70 text-sm tracking-[0.24em] uppercase">Dans la ville</p>
    </div>
    <LazyHeadingH3
      v-if="sectionEyebrow"
      hide-line
      size="2xl"
      color-class="foreground"
      class="whitespace-pre-line"
    >
      {{ sectionEyebrow }}
    </LazyHeadingH3>
  </div>

  <div
    class="grid min-h-0 gap-4 md:gap-6 lg:gap-8 2xl:gap-12"
    :class="
      sectionQuote && !(isPhoneDevice && isLandscape)
        ? 'grid-rows-[auto_minmax(0,1fr)]'
        : 'grid-rows-[auto]'
    "
  >
    <div class="min-h-0 overflow-hidden">
      <LazyParagraphDefault :paragraphs="sectionParagraphs" />
    </div>

    <div
      v-if="sectionQuote && !(isPhoneDevice && isLandscape)"
      class="flex min-h-0 items-center justify-center overflow-hidden"
    >
      <LazyBlockquoteOneline
        :phrase="sectionQuote"
        text-size="lg"
        class="flex-col items-center gap-2 text-center 2xl:gap-3"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
// 1. Imports

// 2. Types et constantes statiques
type EditorialContentProps = {
  sectionEyebrow: string
  sectionParagraphs: string[]
  sectionQuote: string
  isPhoneDevice: boolean
  isLandscape: boolean
}

// 3. Props et emits
defineProps<EditorialContentProps>()

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
