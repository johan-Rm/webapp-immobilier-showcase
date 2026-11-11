<template>
  <div class="bg-background text-foreground min-h-dvh w-screen overflow-hidden">
    <UMain class="min-h-dvh w-full">
      <slot />
    </UMain>
  </div>
</template>

<script setup lang="ts">
// 1. Imports

// 2. Types et constantes statiques

// 3. Props et emits

// 4. Composables, stores, routeur
// Le dashboard n'a pas d'image hero — on force isHeroImageReady à true
// pour que AppBootShell puisse terminer son cycle de vie normalement.
const isHeroImageReady = useState<boolean>('screen.real-estate-full-image.hero-ready', () => true)

// 5. Etat local

// 6. Data inputs

// 7. Validation et helpers purs

// 8. Computed UI-ready

// 9. Actions et handlers
isHeroImageReady.value = true

// 10. Watch et watchEffect

// 11. Metadonnees ecran ou page
useHead({
  meta: [
    {
      key: 'dashboard-robots',
      name: 'robots',
      content: 'noindex, nofollow',
    },
    {
      key: 'dashboard-googlebot',
      name: 'googlebot',
      content: 'noindex, nofollow',
    },
  ],
})

// 12. Lifecycle
</script>
