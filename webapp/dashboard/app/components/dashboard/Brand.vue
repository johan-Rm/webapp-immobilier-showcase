<template>
  <span class="inline-flex items-center gap-3 text-left">
    <UAvatar
      :src="`${brandSource}#svgView(viewBox(250,250,500,500))`"
      alt=""
      size="lg"
      :ui="{ root: 'rounded-none', image: 'rounded-none' }"
    />
    <span>
      <span class="font-heading text-highlighted block text-xl leading-none font-normal">{{
        t('app.brand')
      }}</span>
      <span class="text-muted mt-1 block text-xs">{{ t('app.name') }}</span>
    </span>
  </span>
</template>

<script setup lang="ts">
// 1. Imports
import brandMark from '../../../../../resources/design/Picto-fond-noir-1000x1000.svg?url'

// 2. Types et constantes statiques
// Vite may return an absolute asset URL in the browser and a relative URL during SSR.
const brandSource = new URL(brandMark, 'https://dashboard.invalid').pathname
// 3. Props et emits
// 4. Composables, stores, routeur
const { t } = useI18n()

// 5. État local
// 6. Data inputs
// 7. Validation et helpers purs
// 8. Computed UI-ready
// 9. Actions et handlers
// 10. Watch et watchEffect
// 11. Métadonnées écran ou page
// 12. Lifecycle
</script>
