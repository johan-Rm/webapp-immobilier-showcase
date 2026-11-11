<template>
  <!-- Écran final — Footer / Contact. Formulaire rattaché au bien via `propertyReference`.
       Visuel d'ambiance affiché à partir de md seulement (masqué en mobile : formulaire plein écran). -->
  <div class="flex h-full w-full flex-col overflow-hidden md:flex-row">
    <div class="relative hidden md:block md:h-full md:w-1/2">
      <AppImage
        :src="contactImage"
        alt="Terrasse extérieure et piscine de la villa au cœur du jardin"
        class="absolute inset-0 size-full object-cover"
        sizes="md:50vw"
        loading="lazy"
      />
    </div>
    <div
      class="bg-background text-foreground flex flex-1 items-center justify-center px-6 py-10 md:w-1/2 md:px-16"
    >
      <div class="w-full max-w-lg">
        <h2 class="mb-8 text-4xl font-light uppercase md:text-6xl">{{ title }}</h2>
        <FormContactProperty :property-reference="propertyReference" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 1. Imports

// 2. Types et constantes statiques

// 3. Props et emits
defineProps<{ title: string; propertyReference: string; contactImage: string }>()

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
