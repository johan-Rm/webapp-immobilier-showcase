<template>
  <div
    class="grid h-full w-full max-w-none grid-rows-[auto_minmax(0,1fr)] gap-4 overflow-hidden"
    :class="contentTopPaddingClass"
  >
    <div class="flex min-h-0 flex-col justify-end">
      <div class="flex items-center gap-4">
        <span class="block h-px w-8 bg-white" />
        <p class="text-foreground/70 text-sm tracking-[0.24em] uppercase">
          {{ props.panel?.category }}
        </p>
      </div>
      <HeadingH3 hide-line class="uppercase" size="4xl" color-class="primary">
        {{ props.panel?.title }}
      </HeadingH3>
    </div>

    <div
      class="grid min-h-0 gap-4 md:gap-6 lg:gap-8 2xl:gap-12"
      :class="
        quoteParagraph && !shouldHideQuote ? 'grid-rows-[auto_minmax(0,1fr)]' : 'grid-rows-[auto]'
      "
    >
      <div class="min-h-0 overflow-hidden">
        <ParagraphDefault :paragraphs="bodyParagraphs" />
      </div>

      <div
        v-if="quoteParagraph && !shouldHideQuote"
        class="flex min-h-0 items-center justify-center overflow-hidden"
      >
        <BlockquoteOneline
          :phrase="quoteParagraph"
          text-size="lg"
          class="flex-col items-center gap-2 text-center 2xl:gap-3 2xl:text-[2.65rem] 2xl:leading-[1.25]"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 1. Imports
import { computed } from 'vue'

// 2. Types et constantes statiques
type PanelActiveContentItem = {
  category: string
  title: string
  image: string
  paragraphs: string[]
}

type PanelActiveContentProps = {
  panel?: PanelActiveContentItem | null
  activeIndex: number
}

// 3. Props et emits
const props = defineProps<PanelActiveContentProps>()

// 4. Composables, stores, routeur
const { isPhoneDevice, isLandscape } = useDeviceDetect()

// 5. Etat local

// 6. Data inputs

// 7. Validation et helpers purs
const shouldHideQuote = computed<boolean>(() => isPhoneDevice.value && isLandscape.value)

// 8. Computed UI-ready
const bodyParagraphs = computed(() => (props.panel?.paragraphs ?? []).slice(0, -1))

const quoteParagraph = computed(() => {
  const paragraphs = props.panel?.paragraphs ?? []
  return paragraphs.at(-1) ?? ''
})

// 9. Actions et handlers
const contentTopPaddingClass = computed<string>(() => {
  if (isPhoneDevice.value && isLandscape.value) {
    return 'pt-0 md:pt-0'
  }

  return 'pt-4 md:pt-16'
})

// 10. Watch et watchEffect

// 11. Metadonnees ecran ou page

// 12. Lifecycle
</script>

<style scoped>
p {
  font-size: clamp(1rem, 1.2vw, 1.4rem);
}
</style>
