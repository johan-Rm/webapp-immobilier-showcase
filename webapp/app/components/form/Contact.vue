<template>
  <UForm :state="formState" :validate="validate" class="space-y-4 md:space-y-5" @submit="onSubmit">
    <input
      v-model="formState.website"
      type="text"
      name="website"
      tabindex="-1"
      autocomplete="off"
      class="hidden"
      aria-hidden="true"
    />

    <div class="grid gap-4 md:grid-cols-2 md:gap-5">
      <UFormField label="Nom" name="lastName" :ui="fieldUi">
        <UInput
          v-model="formState.lastName"
          variant="none"
          placeholder="Votre nom"
          autocomplete="family-name"
          :maxlength="120"
          :disabled="isSubmitting"
          :ui="inputUi"
        />
      </UFormField>

      <UFormField label="Prénom" name="firstName" required :ui="fieldUi">
        <UInput
          v-model="formState.firstName"
          variant="none"
          placeholder="Votre prénom"
          autocomplete="given-name"
          :maxlength="120"
          :disabled="isSubmitting"
          :ui="inputUi"
        />
      </UFormField>
    </div>

    <UFormField label="Email" name="email" required :ui="fieldUi">
      <UInput
        v-model="formState.email"
        variant="none"
        type="email"
        placeholder="vous@exemple.com"
        autocomplete="email"
        :maxlength="254"
        :disabled="isSubmitting"
        :ui="inputUi"
      />
    </UFormField>

    <UFormField label="Téléphone" name="phone" :ui="fieldUi">
      <UInput
        v-model="formState.phone"
        variant="none"
        type="tel"
        placeholder="Votre téléphone"
        autocomplete="tel"
        :maxlength="40"
        :disabled="isSubmitting"
        :ui="inputUi"
      />
    </UFormField>

    <UFormField label="Message" name="message" required :ui="fieldUi">
      <UTextarea
        v-model="formState.message"
        variant="none"
        :rows="3"
        placeholder="Décrivez votre projet"
        :maxlength="5000"
        :disabled="isSubmitting"
        :ui="textareaUi"
      />
    </UFormField>

    <p
      v-if="submitStatus === 'success'"
      class="text-sm leading-relaxed text-white/85"
      role="status"
      aria-live="polite"
    >
      Votre message a bien été envoyé. Nous vous répondrons rapidement.
    </p>

    <p
      v-else-if="submitStatus === 'error'"
      class="text-sm leading-relaxed text-red-200"
      role="alert"
    >
      {{ submitErrorMessage }}
    </p>

    <UButton
      type="submit"
      color="neutral"
      variant="ghost"
      class="rounded-none px-0 text-xs font-medium tracking-[0.18em] text-white uppercase hover:bg-transparent hover:text-white/80"
      :loading="isSubmitting"
      :disabled="isSubmitting"
    >
      {{ isSubmitting ? 'Envoi en cours' : 'Envoyer' }}
    </UButton>
  </UForm>
</template>

<script setup lang="ts">
// 1. Imports
import type { FormError } from '@nuxt/ui'

// 2. Types et constantes statiques
type ContactFormState = {
  firstName: string
  lastName: string
  email: string
  phone: string
  message: string
  website: string
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const fieldUi = {
  label: 'text-white/75 text-[0.7rem] tracking-[0.22em] uppercase',
  container: 'mt-2',
  error: 'text-red-200',
} as const

const inputUi = {
  root: 'w-full',
  base: 'w-full bg-transparent border-0 border-b border-white/55 rounded-none px-0 py-2 text-white placeholder:text-white/45',
} as const

const textareaUi = {
  root: 'w-full',
  base: 'w-full bg-transparent border-0 border-b border-white/55 rounded-none px-0 py-2 text-white placeholder:text-white/45 resize-none',
} as const

const createInitialFormState = (): ContactFormState => ({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  message: '',
  website: '',
})

// 3. Props et emits

// 4. Composables, stores, routeur
const { isSubmitting, submitStatus, submitErrorMessage, submitContact } = useContactForm()

// 5. Etat local

// 6. Data inputs
const formState = reactive<ContactFormState>({
  ...createInitialFormState(),
})

// 7. Validation et helpers purs

// 8. Computed UI-ready

// 9. Actions et handlers
const validate = (state: Partial<ContactFormState>): FormError<string>[] => {
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
  })

  if (response.success) {
    Object.assign(formState, createInitialFormState())
  }
}

// 10. Watch et watchEffect

// 11. Metadonnees ecran ou page

// 12. Lifecycle
</script>
