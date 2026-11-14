<template>
  <section class="h-dvh min-h-0 overflow-y-auto px-5 pt-20 pb-8 sm:px-10 lg:pt-10">
    <div class="mx-auto max-w-4xl space-y-7">
      <h1 class="text-3xl font-semibold">{{ t('admin.title') }}</h1>
      <DashboardContextPicker />
      <UAlert v-if="state.error" color="error" :title="state.error" role="alert" />
      <UAlert v-if="state.success" color="success" :title="state.success" role="status" />
      <div v-if="context.platformAdmin" class="grid gap-5 md:grid-cols-2">
        <DashboardPanel kind="organization" :title="t('admin.newOrganization')">
          <form class="space-y-4" @submit.prevent="run('organization')">
            <UFormField :label="t('admin.organizationName')" name="organizationName" required>
              <UInput v-model="state.organizationName" class="w-full" required />
            </UFormField>
            <UButton
              class="dashboard-panel-action"
              type="submit"
              :loading="state.pending"
              :label="t('admin.createOrganization')"
            />
          </form>
        </DashboardPanel>
        <DashboardPanel kind="newProject" :title="t('admin.newProject')">
          <form class="space-y-4" @submit.prevent="run('project')">
            <UFormField :label="t('admin.projectName')" name="projectName" required>
              <UInput v-model="state.projectName" class="w-full" required />
            </UFormField>
            <UButton
              class="dashboard-panel-action"
              type="submit"
              :loading="state.pending"
              :disabled="!accessState.organizationId"
              :label="t('admin.createProject')"
            />
          </form>
        </DashboardPanel>
      </div>
      <DashboardPanel
        v-if="context.canManageMembers && accessState.organizationId"
        kind="members"
        :title="t('admin.collaborators')"
      >
        <form class="space-y-4" @submit.prevent="run('invite')">
          <UFormField :label="t('auth.email')" name="inviteEmail" required>
            <UInput v-model="state.email" class="w-full" type="email" required />
          </UFormField>
          <UButton
            class="dashboard-panel-action"
            type="submit"
            :loading="state.pending"
            icon="i-lucide-mail-plus"
            :label="t('admin.invite')"
          />
        </form>
        <p v-if="state.loadingMembers" class="text-muted mt-6 text-sm" role="status">
          {{ t('admin.loadingMembers') }}
        </p>
        <p v-else-if="!state.members.length && !state.error" class="text-muted mt-6 text-sm">
          {{ t('admin.emptyMembers') }}
        </p>
        <ul class="divide-default mt-6 divide-y">
          <li
            v-for="member in state.members"
            :key="member.id"
            class="flex flex-wrap items-center justify-between gap-3 py-3"
          >
            <span class="text-sm break-all">{{ member.email }}</span>
            <UButton
              color="error"
              variant="soft"
              :disabled="state.pending"
              :aria-label="t('admin.removeNamed', { email: member.email })"
              :label="t('admin.remove')"
              @click="run('remove', member.id)"
            />
          </li>
        </ul>
      </DashboardPanel>
      <UAlert v-else :title="t('admin.noRights')" />
    </div>
  </section>
</template>

<script setup lang="ts">
// 1. Imports
// 2. Types et constantes statiques
// 3. Props et emits
// 4. Composables
const { t } = useI18n()
const { state: accessState, context } = useDashboardAccess()
const { state, run } = useDashboardAdmin()
// 5. État local
// 6. Data inputs
// 7. Validation et helpers purs
// 8. Computed UI-ready
// 9. Actions et handlers
// 10. Watch et watchEffect
// 11. Métadonnées écran ou page
// 12. Lifecycle
</script>
