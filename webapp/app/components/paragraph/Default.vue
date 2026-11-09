<template>
  <div
    class="flex min-h-0 flex-col space-y-2 leading-[1.5] lg:space-y-3 lg:leading-[1.55] 2xl:leading-relaxed"
  >
    <p
      v-for="(paragraph, index) in props.paragraphs"
      :key="paragraph"
      :class="['whitespace-pre-line', index === 0 ? 'block' : 'hidden md:block']"
      class="text-foreground/70"
    >
      {{ paragraph }}
    </p>
  </div>
</template>

<script setup lang="ts">
// 1. Imports

// 2. Types et constantes statiques
type ParagraphDefaultProps = {
  paragraphs: string[]
}

// 3. Props et emits
const props = defineProps<ParagraphDefaultProps>()

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
