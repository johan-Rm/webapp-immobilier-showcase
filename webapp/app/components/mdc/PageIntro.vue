<template>
  <section class="mx-auto w-full max-w-3xl px-6">
    <div
      class="text-foreground/80 text-base leading-relaxed md:text-lg [&_p]:mt-4 [&_p:first-child]:mt-0"
    >
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div v-html="props.text ?? ''" />
    </div>
  </section>
</template>

<script setup lang="ts">
// 1. Imports

// 2. Types et constantes statiques
type PageIntroProps = {
  text?: string
}

// 3. Props et emits
const props = defineProps<PageIntroProps>()

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
