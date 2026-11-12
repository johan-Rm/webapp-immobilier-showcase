<template>
  <UCard>
    <template #header>
      <h1 class="text-2xl font-semibold">{{ t(`auth.${mode}Title`) }}</h1>
      <p class="text-muted mt-2 text-sm">
        {{
          mode === 'invitation' && accessState.user
            ? t('auth.existingInvitationDescription')
            : t(`auth.${mode}Description`)
        }}
      </p>
    </template>
    <form class="space-y-5" @submit.prevent="submit">
      <UAlert v-if="state.error" color="error" :title="state.error" role="alert" />
      <UAlert v-if="state.success" color="success" :title="state.success" role="status" />
      <UAlert
        v-if="accessState.error && mode === 'login'"
        color="warning"
        :title="accessState.error"
        role="alert"
      />
      <UFormField
        v-if="mode === 'login' || mode === 'forgot'"
        :label="t('auth.email')"
        name="email"
        required
      >
        <UInput
          v-model="state.email"
          class="w-full"
          type="email"
          autocomplete="username"
          required
        />
      </UFormField>
      <UFormField
        v-if="mode !== 'forgot' && !(mode === 'invitation' && accessState.user)"
        :label="t('auth.password')"
        name="password"
        required
      >
        <UInput
          v-model="state.password"
          class="w-full"
          type="password"
          :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
          required
        />
      </UFormField>
      <p
        v-if="needsToken && !state.token && !state.success"
        class="text-error text-sm"
        role="alert"
      >
        {{ t('auth.missingToken') }}
      </p>
      <UButton
        type="submit"
        block
        :loading="state.pending"
        :disabled="needsToken && !state.token"
        :label="t(`auth.${mode}Action`)"
      />
      <UButton
        v-if="mode === 'login'"
        to="/mot-de-passe"
        variant="link"
        :label="t('auth.forgotTitle')"
      />
      <UButton
        v-if="mode === 'invitation' && !accessState.user"
        variant="link"
        :label="t('auth.existingAccount')"
        @click="loginExisting"
      />
      <UButton
        v-if="mode !== 'login'"
        to="/connexion"
        variant="link"
        :label="t('auth.backToLogin')"
      />
    </form>
  </UCard>
</template>

<script setup lang="ts">
// 3. Props
const props = defineProps<{ mode: 'login' | 'invitation' | 'forgot' | 'reset' }>()
// 4. Composables
const { t } = useI18n()
const { state, submit, loginExisting } = useDashboardAuth(props.mode)
const { state: accessState } = useDashboardAccess()
// 8. Données UI
const needsToken = computed(() => props.mode === 'invitation' || props.mode === 'reset')
</script>
