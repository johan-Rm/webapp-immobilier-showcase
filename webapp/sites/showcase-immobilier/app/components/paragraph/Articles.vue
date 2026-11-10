<template>
  <article v-for="item in props.items" :key="item.title" class="w-full max-w-sm">
    <HeadingH3 hide-line size="2xl" text-align="center" color-class="foreground">
      <span class="block">{{ item.title }}</span>
      <span class="block">{{ item.accent }}</span>
    </HeadingH3>
    <p
      v-if="!isMobileLandscape"
      class="text-foreground/70 mt-0 px-2 whitespace-pre-line md:mt-4 md:px-4"
    >
      {{ item.description }}
    </p>
  </article>
</template>

<script setup lang="ts">
// 1. Imports

// 2. Types et constantes statiques
type ParagraphArticleItem = {
  title: string
  accent: string
  description: string
}

type ParagraphArticlesProps = {
  items: ParagraphArticleItem[]
}

// 3. Props et emits
const props = defineProps<ParagraphArticlesProps>()

// 4. Composables, stores, routeur
const { isMobileLandscape } = useDeviceDetect()

// 5. Etat local

// 6. Data inputs

// 7. Validation et helpers purs

// 8. Computed UI-ready

// 9. Actions et handlers

// 10. Watch et watchEffect

// 11. Metadonnees ecran ou page

// 12. Lifecycle
</script>
