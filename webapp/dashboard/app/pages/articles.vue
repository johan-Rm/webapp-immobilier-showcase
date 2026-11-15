<template>
  <div data-page="articles" class="h-full w-full">
    <ClientOnly><DashboardArticles /></ClientOnly>
  </div>
</template>
<script setup lang="ts">
// 11. Metadata
definePageMeta({ middleware: 'saas-auth' })
</script>
