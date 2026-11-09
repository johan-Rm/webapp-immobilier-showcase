<template>
  <div
    class="pages-dashboard-login flex h-dvh w-screen items-center justify-center bg-[#212121] px-6"
  >
    <div class="w-full max-w-sm">
      <section class="flex flex-col gap-16 text-center">
        <div class="space-y-4">
          <div class="flex items-center justify-center gap-2">
            <LogoShowcaseMark class="h-5 w-auto shrink-0 text-[#6B7A4A]" aria-hidden="true" />
            <p class="text-xs font-semibold tracking-[0.18em] uppercase">
              <span class="text-white/40">Dashboard</span>
              <span class="text-[#6B7A4A]"> Showcase Immobilier</span>
            </p>
          </div>

          <h1 class="text-4xl leading-tight text-white uppercase sm:text-5xl lg:text-6xl">
            Showcase Immobilier
          </h1>
        </div>

        <form class="flex flex-col gap-4 text-left" @submit.prevent="onSubmit">
          <div class="flex flex-col gap-1.5">
            <label for="email" class="text-xs font-medium text-white/50">Email</label>
            <UInput
              id="email"
              v-model="form.email"
              type="email"
              name="email"
              placeholder="votre@email.com"
              autocomplete="email"
              :disabled="isLoading"
              :ui="inputUi"
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <label for="password" class="text-xs font-medium text-white/50">Mot de passe</label>
            <UInput
              id="password"
              v-model="form.password"
              type="password"
              name="password"
              autocomplete="current-password"
              :disabled="isLoading"
              :ui="inputUi"
            />
          </div>

          <div
            v-if="error"
            class="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-400"
            role="alert"
          >
            {{ error }}
          </div>

          <UButton
            type="submit"
            block
            :loading="isLoading"
            :disabled="!form.email || !form.password"
            class="mt-2 min-h-12 justify-center bg-[#6B7A4A] hover:bg-[#7d8f57] disabled:opacity-40"
          >
            Se connecter
          </UButton>
        </form>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
// 1. Imports
import LogoShowcaseMark from '~/assets/logo/showcase-picto.svg'

// 4. Composables, stores, routeur
const { loggedIn, fetch } = useUserSession()

// 6. Data inputs
await fetch()
if (loggedIn.value) {
  await navigateTo('/dashboard')
}

// 5. Etat local
const isLoading = ref(false)
const error = ref<string | null>(null)
const form = reactive({ email: '', password: '' })

const inputUi = {
  base: 'bg-[#e8ecdd] border border-[#6B7A4A]/20 text-[#212121] placeholder:text-[#212121]/40 focus:border-[#6B7A4A] focus:ring-0',
}

// 9. Handlers et actions
const onSubmit = async () => {
  error.value = null
  isLoading.value = true

  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: { email: form.email, password: form.password },
    })
    await navigateTo('/dashboard')
  } catch (err: unknown) {
    const statusCode =
      err && typeof err === 'object' && 'statusCode' in err
        ? (err as { statusCode: number }).statusCode
        : null

    if (statusCode === 401) {
      error.value = 'Identifiants invalides.'
    } else if (statusCode === 403) {
      error.value = 'Accès non autorisé à ce projet.'
    } else {
      error.value = 'Une erreur est survenue. Veuillez réessayer.'
    }
  } finally {
    isLoading.value = false
  }
}

// 11. Metadonnees ecran ou page
definePageMeta({
  layout: 'dashboard',
})
</script>

<style scoped>
/* Neutralise le fond jaune d'autofill imposé par le navigateur sur les inputs */
.pages-dashboard-login :deep(input:-webkit-autofill),
.pages-dashboard-login :deep(input:-webkit-autofill:hover),
.pages-dashboard-login :deep(input:-webkit-autofill:focus) {
  -webkit-box-shadow: 0 0 0 1000px #e8ecdd inset;
  box-shadow: 0 0 0 1000px #e8ecdd inset;
  -webkit-text-fill-color: #212121;
  caret-color: #212121;
  transition: background-color 9999s ease-in-out 0s;
}
</style>
