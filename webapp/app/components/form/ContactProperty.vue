<template>
  <UForm :state="formState" :validate="validate" class="space-y-8" @submit="onSubmit">
    <input
      v-model="formState.website"
      type="text"
      name="website"
      tabindex="-1"
      autocomplete="off"
      class="hidden"
      aria-hidden="true"
    />

    <input type="hidden" name="propertyReference" :value="props.propertyReference" />

    <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
      <UFormField name="lastName" :ui="fieldUi">
        <UInput
          v-model="formState.lastName"
          name="lastName"
          placeholder="Nom"
          aria-label="Nom"
          variant="none"
          class="border-foreground/30 w-full rounded-none border-b px-0"
          autocomplete="family-name"
          :maxlength="120"
          :disabled="isSubmitting"
          :ui="inputUi"
        />
      </UFormField>

      <UFormField name="firstName" required :ui="fieldUi">
        <UInput
          v-model="formState.firstName"
          name="firstName"
          placeholder="Prénom"
          aria-label="Prénom"
          variant="none"
          class="border-foreground/30 w-full rounded-none border-b px-0"
          autocomplete="given-name"
          :maxlength="120"
          :disabled="isSubmitting"
          :ui="inputUi"
        />
      </UFormField>
    </div>

    <UFormField name="email" required :ui="fieldUi">
      <UInput
        v-model="formState.email"
        type="email"
        name="email"
        placeholder="E-mail"
        aria-label="E-mail"
        variant="none"
        class="border-foreground/30 w-full rounded-none border-b px-0"
        autocomplete="email"
        :maxlength="254"
        :disabled="isSubmitting"
        :ui="inputUi"
      />
    </UFormField>

    <UFormField name="phone" :ui="fieldUi">
      <UInput
        v-model="formState.phone"
        type="tel"
        name="phone"
        placeholder="Téléphone"
        aria-label="Téléphone"
        variant="none"
        class="border-foreground/30 w-full rounded-none border-b px-0"
        autocomplete="tel"
        :maxlength="40"
        :disabled="isSubmitting"
        :ui="inputUi"
      />
    </UFormField>

    <UFormField name="message" required :ui="fieldUi">
      <UTextarea
        v-model="formState.message"
        name="message"
        placeholder="Message"
        aria-label="Message"
        :rows="4"
        variant="none"
        class="border-foreground/30 w-full resize-none rounded-none border-b px-0"
        :maxlength="5000"
        :disabled="isSubmitting"
        :ui="inputUi"
      />
    </UFormField>

    <p
      v-if="submitStatus === 'success'"
      class="text-foreground/80 text-sm leading-relaxed"
      role="status"
      aria-live="polite"
    >
      Votre message a bien été envoyé. Nous vous répondrons rapidement.
    </p>

    <p
      v-else-if="submitStatus === 'error'"
      class="text-sm leading-relaxed text-red-700"
      role="alert"
    >
      {{ submitErrorMessage }}
    </p>

    <!-- Bouton aligné à droite en mobile (hors zone de la synthèse fixe en bas), à gauche en desktop. -->
    <div class="flex justify-end pt-4 md:justify-start">
      <UButton
        type="submit"
        class="bg-foreground px-8 py-3 tracking-[0.2em] text-white uppercase"
        :loading="isSubmitting"
        :disabled="isSubmitting"
      >
        {{ isSubmitting ? 'Envoi en cours' : 'Envoyer' }}
      </UButton>
    </div>
  </UForm>
</template>

<script setup lang="ts">
// 1. Imports
import type { FormError } from '@nuxt/ui'

// 2. Types et constantes statiques
type ContactPropertyFormState = {
  firstName: string
  lastName: string
  email: string
  phone: string
  message: string
  website: string
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const fieldUi = {
  label: 'block mb-2 text-xs uppercase tracking-[0.3em] text-foreground/70',
  error: 'text-red-700',
} as const

const inputUi = {
  base: 'placeholder:text-foreground/40 placeholder:text-xs',
} as const

const createInitialFormState = (): ContactPropertyFormState => ({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  message: '',
  website: '',
})

// 3. Props et emits
const props = defineProps<{
  propertyReference: string
}>()

// 4. Composables, stores, routeur
const { isSubmitting, submitStatus, submitErrorMessage, submitContact } = useContactForm()

// 5. Etat local

// 6. Data inputs
const formState = reactive<ContactPropertyFormState>({
  ...createInitialFormState(),
})

// 7. Validation et helpers purs

// 8. Computed UI-ready

// 9. Actions et handlers
const validate = (state: Partial<ContactPropertyFormState>): FormError<string>[] => {
  const errors: FormError<string>[] = []

  if (!state.firstName?.trim()) {
    errors.push({ name: 'firstName', message: 'Le prénom est requis.' })
  }

  if (!state.email?.trim()) {
    errors.push({ name: 'email', message: 'L’email est requis.' })
  } else if (!EMAIL_PATTERN.test(state.email)) {
    errors.push({ name: 'email', message: 'L’email est invalide.' })
  }

  if (!state.message?.trim()) {
    errors.push({ name: 'message', message: 'Le message est requis.' })
  }

  return errors
}

const onSubmit = async (): Promise<void> => {
  const response = await submitContact({
    firstName: formState.firstName,
    lastName: formState.lastName,
    email: formState.email,
    phone: formState.phone,
    message: formState.message,
    website: formState.website,
    propertyReference: props.propertyReference,
  })

  if (response.success) {
    Object.assign(formState, createInitialFormState())
  }
}

// 10. Watch et watchEffect

// 11. Metadonnees ecran ou page

// 12. Lifecycle
</script>
