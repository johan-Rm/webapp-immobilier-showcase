<template>
  <section class="pages-echo space-y-6">
    <!-- Page de démonstration technique : garde le contexte lisible sans dépendre du layout screen. -->
    <header class="space-y-2">
      <h1 class="text-3xl font-bold text-gray-900">Echo (Zod + types partagés)</h1>
      <p class="text-gray-600">
        Démo FEAT-009 : schéma Zod partagé, types dérivés, validation côté composable et endpoint.
      </p>
    </header>

    <!-- Formulaire volontairement minimal pour exercer la validation partagée et l'endpoint echo. -->
    <form class="space-y-4" @submit.prevent="submit">
      <label class="block space-y-2">
        <span class="text-sm font-medium text-gray-800">Message</span>
        <input
          v-model="message"
          class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none"
          type="text"
          name="message"
          autocomplete="off"
          :disabled="loading"
          placeholder="Bonjour Nuxt"
        />
      </label>

      <p v-if="validationError" class="text-sm font-medium text-red-700">
        {{ validationError }}
      </p>

      <button
        class="rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
        type="submit"
        :disabled="loading"
      >
        {{ loading ? 'Envoi…' : 'Envoyer' }}
      </button>
    </form>

    <!-- Retour d'erreur API/composable affiché hors champ pour distinguer validation et transport. -->
    <div v-if="error" class="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-900">
      <p class="font-semibold">Erreur ({{ error.status }})</p>
      <p>{{ error.message }}</p>
    </div>

    <!-- Réponse validée du serveur, utilisée pour vérifier le contrat partagé de bout en bout. -->
    <div
      v-if="echoed"
      class="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"
    >
      <p class="font-semibold">Réponse</p>
      <p>{{ echoed }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
// 1. Imports

// 2. Types et constantes statiques

// 3. Props et emits

// 4. Composables, stores, routeur
// Le composable porte l'état, la validation et l'appel endpoint afin que la page reste une démo UI.
const { message, validationError, echoed, loading, error, submit } = useEcho()

// 5. Etat local

// 6. Data inputs

// 7. Validation et helpers purs

// 8. Computed UI-ready

// 9. Actions et handlers

// 10. Watch et watchEffect

// 11. Metadonnees ecran ou page

// 12. Lifecycle
</script>
