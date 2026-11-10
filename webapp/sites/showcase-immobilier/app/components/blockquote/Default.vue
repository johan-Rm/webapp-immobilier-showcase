<template>
  <div class="mx-auto w-full max-w-[75%] rounded-3xl px-6 py-8 md:px-10">
    <div class="text-foreground/80 mx-auto flex items-center justify-center p-4" aria-hidden="true">
      <UIcon name="i-lucide-quote" class="text-[clamp(3.5rem,5vw,4.75rem)]" />
    </div>

    <blockquote class="w-full">
      <p class="text-foreground leading-[1.35]">
        <Transition name="quote-fade" mode="out-in">
          <span :key="props.phrases[props.activeIndex] ?? ''" class="block">
            {{ props.phrases[props.activeIndex] }}
          </span>
        </Transition>
      </p>
    </blockquote>
  </div>
</template>

<script setup lang="ts">
// 1. Imports

// 2. Types et constantes statiques
type BlockquoteDefaultProps = {
  phrases: string[]
  activeIndex: number
}

// 3. Props et emits
const props = defineProps<BlockquoteDefaultProps>()

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

<style scoped>
.quote-fade-enter-active,
.quote-fade-leave-active {
  transition: opacity 300ms ease;
}

.quote-fade-enter-from,
.quote-fade-leave-to {
  opacity: 0;
}

p {
  font-size: clamp(1.5rem, 2.8vw, 6rem);
}
</style>
