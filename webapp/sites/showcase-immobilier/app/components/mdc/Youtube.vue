<template>
  <section class="px-6 md:px-12 md:py-14">
    <div class="mx-auto w-full max-w-3xl space-y-4">
      <p
        v-if="props.designation"
        class="text-foreground/60 text-xs font-semibold tracking-[0.32em] uppercase"
      >
        {{ props.designation }}
      </p>
      <div class="relative w-full overflow-hidden rounded-2xl bg-black/80 pt-[56.25%]">
        <iframe
          v-if="videoId"
          class="absolute inset-0 h-full w-full"
          :src="`https://www.youtube.com/embed/${videoId}`"
          :title="props.video?.name ?? 'YouTube video'"
          loading="lazy"
          allow="
            accelerometer;
            autoplay;
            clipboard-write;
            encrypted-media;
            gyroscope;
            picture-in-picture;
          "
          allowfullscreen
        />
        <div v-else class="absolute inset-0 flex items-center justify-center text-sm text-white/70">
          Vidéo indisponible.
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// 1. Imports

// 2. Types et constantes statiques
type YoutubeVideo = {
  id?: number
  name?: string
  url?: string
}

type YoutubeProps = {
  slug?: string
  designation?: string
  video?: YoutubeVideo
}

// 3. Props et emits
const props = defineProps<YoutubeProps>()

// 4. Composables, stores, routeur

// 5. Etat local

// 6. Data inputs

// 7. Validation et helpers purs
const getVideoId = (url?: string): string | null => {
  if (!url) return null
  const match = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{6,})/)
  return match?.[1] ?? null
}

// 8. Computed UI-ready
const videoId = computed(() => getVideoId(props.video?.url))

// 9. Actions et handlers

// 10. Watch et watchEffect

// 11. Metadonnees ecran ou page

// 12. Lifecycle
</script>
