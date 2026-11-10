<template>
  <div class="bg-background text-foreground min-h-dvh w-screen overflow-hidden">
    <UMain class="min-h-dvh w-full">
      <slot />
    </UMain>
  </div>
</template>

<script setup lang="ts">
// Le dashboard n'a pas d'image hero — on force isHeroImageReady à true
// pour que AppBootShell puisse terminer son cycle de vie normalement.
const isHeroImageReady = useState<boolean>('screen.real-estate-full-image.hero-ready', () => true)
isHeroImageReady.value = true

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
</script>
