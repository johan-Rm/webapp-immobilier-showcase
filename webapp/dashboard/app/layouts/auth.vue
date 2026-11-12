<template>
  <main class="flex h-dvh w-screen items-center justify-center overflow-y-auto p-5">
    <div class="w-full max-w-md">
      <p class="text-primary mb-6 text-center text-sm font-semibold tracking-wide">
        {{ t('app.name') }}
      </p>
      <slot />
    </div>
  </main>
</template>

<script setup lang="ts">
// 4. Composables
const { t } = useI18n()
</script>
