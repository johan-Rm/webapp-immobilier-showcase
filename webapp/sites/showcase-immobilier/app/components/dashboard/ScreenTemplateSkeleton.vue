<template>
  <!-- Mini-wireframe du template d'écran. `currentColor` → se thème selon l'état (sélection).
       Aplats = zones image (opacité basse), traits = zones texte (opacité plus marquée). -->
  <svg viewBox="0 0 60 40" class="h-full w-full" fill="none" aria-hidden="true">
    <!-- FULL — 1 image plein cadre + texte bas-gauche -->
    <template v-if="template === 'SCREEN_ACCOMMODATION_FULL'">
      <rect width="60" height="40" rx="2" fill="currentColor" opacity="0.16" />
      <rect x="5" y="29" width="22" height="3" rx="1" fill="currentColor" opacity="0.42" />
      <rect x="5" y="34" width="13" height="3" rx="1" fill="currentColor" opacity="0.42" />
    </template>

    <!-- SPLIT 50/50 — image | texte -->
    <template v-else-if="template === 'SCREEN_ACCOMMODATION_SPLIT'">
      <rect width="29" height="40" rx="2" fill="currentColor" opacity="0.16" />
      <rect x="35" y="13" width="19" height="3" rx="1" fill="currentColor" opacity="0.42" />
      <rect x="35" y="19" width="15" height="3" rx="1" fill="currentColor" opacity="0.42" />
      <rect x="35" y="25" width="10" height="3" rx="1" fill="currentColor" opacity="0.26" />
    </template>

    <!-- TRIPTYQUE — collage 3 visuels + texte gauche -->
    <template v-else-if="template === 'SCREEN_ACCOMMODATION_TRYPTIQUE'">
      <rect x="4" y="14" width="12" height="3" rx="1" fill="currentColor" opacity="0.42" />
      <rect x="4" y="19" width="9" height="3" rx="1" fill="currentColor" opacity="0.42" />
      <rect x="24" y="5" width="26" height="13" rx="1.5" fill="currentColor" opacity="0.2" />
      <rect x="19" y="21" width="22" height="12" rx="1.5" fill="currentColor" opacity="0.14" />
      <rect x="44" y="14" width="12" height="20" rx="1.5" fill="currentColor" opacity="0.28" />
    </template>

    <!-- CAROUSEL — image plein cadre + texte droite + bande de vignettes -->
    <template v-else-if="template === 'SCREEN_ACCOMMODATION_CAROUSEL'">
      <rect width="60" height="40" rx="2" fill="currentColor" opacity="0.16" />
      <rect x="34" y="15" width="20" height="3" rx="1" fill="currentColor" opacity="0.42" />
      <rect x="40" y="21" width="14" height="3" rx="1" fill="currentColor" opacity="0.42" />
      <rect x="41" y="31" width="5" height="4" rx="0.5" fill="currentColor" opacity="0.34" />
      <rect x="47" y="31" width="5" height="4" rx="0.5" fill="currentColor" opacity="0.34" />
      <rect x="53" y="31" width="5" height="4" rx="0.5" fill="currentColor" opacity="0.34" />
    </template>

    <!-- OVERLAY — image plein cadre + panneau translucide gauche + texte -->
    <template v-else-if="template === 'SCREEN_ACCOMMODATION_OVERLAY'">
      <rect width="60" height="40" rx="2" fill="currentColor" opacity="0.16" />
      <rect width="27" height="40" rx="2" fill="currentColor" opacity="0.16" />
      <rect x="5" y="15" width="17" height="3" rx="1" fill="currentColor" opacity="0.45" />
      <rect x="5" y="21" width="12" height="3" rx="1" fill="currentColor" opacity="0.45" />
    </template>

    <!-- DUO — 2 visuels juxtaposés + texte bas-droite -->
    <template v-else-if="template === 'SCREEN_ACCOMMODATION_DUO'">
      <rect width="28" height="40" rx="2" fill="currentColor" opacity="0.16" />
      <rect x="31" width="29" height="40" rx="2" fill="currentColor" opacity="0.16" />
      <rect x="34" y="29" width="20" height="3" rx="1" fill="currentColor" opacity="0.42" />
      <rect x="40" y="34" width="13" height="2.5" rx="1" fill="currentColor" opacity="0.42" />
    </template>

    <!-- Fallback — cadre simple -->
    <rect v-else width="60" height="40" rx="2" fill="currentColor" opacity="0.16" />
  </svg>
</template>

<script setup lang="ts">
defineOptions({ name: 'DashboardScreenTemplateSkeleton' })

// 3. Props
defineProps<{ template: string }>()
</script>
