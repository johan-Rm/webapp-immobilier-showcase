<template>
  <div class="bg-dark flex h-full items-center justify-center px-6 py-12 text-white">
    <div class="w-full max-w-2xl space-y-6 text-center">
      <div class="text-6xl font-bold text-lime-400">{{ statusCode }}</div>
      <h1 class="font-headingPrimary text-2xl md:text-3xl">
        {{ title }}
      </h1>
      <p class="text-sm opacity-80 md:text-base">
        {{ description }}
      </p>

      <div class="flex flex-wrap justify-center gap-3">
        <button class="bg-secondary rounded px-4 py-2 font-semibold text-white" @click="goHome">
          Retourner à l’accueil
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
type ErrorProps = {
  error?: {
    statusCode?: number
    statusMessage?: string
    message?: string
  }
}

const props = defineProps<ErrorProps>()

const statusCode = computed(() => props.error?.statusCode ?? 500)

const title = computed(() => {
  if (statusCode.value === 404) return 'Page introuvable'
  if (statusCode.value >= 500) return 'Erreur serveur'
  if (statusCode.value >= 400) return 'Requête invalide'
  return 'Une erreur est survenue'
})

const description = computed(() => {
  if (statusCode.value === 404) {
    return 'La page demandée n’existe pas ou a été déplacée.'
  }
  if (statusCode.value >= 500) {
    return 'Un problème est survenu côté serveur. Veuillez réessayer plus tard.'
  }
  if (statusCode.value >= 400) {
    return 'La requête a échoué. Veuillez vérifier le lien ou les paramètres.'
  }
  return props.error?.statusMessage ?? props.error?.message ?? 'Une erreur inattendue est survenue.'
})

const goHome = (): void => {
  clearError({ redirect: '/' })
}
</script>
