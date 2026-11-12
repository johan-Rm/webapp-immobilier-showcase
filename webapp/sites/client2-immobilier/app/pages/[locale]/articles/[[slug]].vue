<template>
  <NuxtLayout name="editorial"
    ><ScreenArticles
      class="h-full w-full"
      :locale="locale"
      :article="data?.article"
      :articles="data?.articles || []"
      :media="data?.media || {}"
  /></NuxtLayout>
</template>
<script setup lang="ts">
// 1. Imports
import type { SaasPublicArticle, SaasLocale } from '#shared/types/saas/article'

import { saasLocaleSchema } from '#shared/schemas'
// 2. Types et constantes statiques
// 3. Props et emits
// 4. Composables, stores, routeur
const route = useRoute()
const requestUrl = useRequestURL()
useResponseHeader('Cache-Control').value = 'no-store'
// 5. Etat local
// 6. Data inputs
const parsed = saasLocaleSchema.safeParse(route.params.locale)
if (!parsed.success) throw createError({ statusCode: 404, statusMessage: 'Page introuvable' })
const locale = parsed.data
const slug = typeof route.params.slug === 'string' ? route.params.slug : ''
const { data, error } = await useAsyncData('client2-articles-' + locale + '-' + slug, () =>
  $fetch<{
    article?: SaasPublicArticle
    articles?: SaasPublicArticle[]
    media: Record<string, string>
    locales?: { locale: SaasLocale; slug: string }[]
  }>(`/api/articles/${locale}${slug ? '/' + encodeURIComponent(slug) : ''}`),
)
if (error.value)
  throw createError({
    statusCode: error.value.statusCode || 503,
    statusMessage:
      error.value.statusCode === 404 ? 'Article introuvable' : 'Articles indisponibles',
  })
// 7. Validation et helpers purs
// 8. Computed UI-ready
const title = computed(
  () =>
    data.value?.article?.metaTitle ||
    data.value?.article?.headline ||
    (locale === 'es' ? 'Artículos' : 'Articles'),
)
const description = computed(
  () => data.value?.article?.metaDescription || data.value?.article?.summary || '',
)
const canonical = new URL(`/${locale}/articles${slug ? '/' + slug : ''}`, requestUrl.origin).href
// 9. Actions et handlers
// 10. Watch et watchEffect
// 11. Metadonnees ecran ou page
definePageMeta({ layout: false, key: (route) => route.fullPath })
useHead(() => ({
  title: title.value,
  htmlAttrs: { lang: locale },
  link: [
    { rel: 'canonical', href: canonical },
    ...(data.value?.locales ?? []).map((item) => ({
      rel: 'alternate' as const,
      hreflang: item.locale,
      href: new URL(`/${item.locale}/articles/${item.slug}`, requestUrl.origin).href,
    })),
  ],
}))
useSeoMeta({
  description: () => description.value,
  ogTitle: () => title.value,
  ogDescription: () => description.value,
})
// 12. Lifecycle
</script>
