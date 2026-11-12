<template>
  <section class="article-screen">
    <div class="article-shell">
      <nav aria-label="Navigation">
        <NuxtLink to="/">Client 2 Immobilier</NuxtLink
        ><NuxtLink :to="`/${locale}/articles`">{{ labels.articles }}</NuxtLink>
      </nav>
      <ArticleView v-if="article" :article="article" :media="media" />
      <div v-else>
        <h1>{{ labels.articles }}</h1>
        <p v-if="!articles.length">{{ labels.empty }}</p>
        <ul v-else class="article-list">
          <li v-for="item in articles" :key="item.id">
            <h2>
              <NuxtLink :to="`/${locale}/articles/${item.slug}`">{{ item.headline }}</NuxtLink>
            </h2>
            <p>{{ item.summary }}</p>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>
<script setup lang="ts">
// 1. Imports
import type { SaasLocale, SaasPublicArticle } from '#shared/types/saas/article'
// 2. Types et constantes statiques
const translations = {
  fr: { articles: 'Articles', empty: 'Aucun article publié pour le moment.' },
  en: { articles: 'Articles', empty: 'No published articles yet.' },
  es: { articles: 'Artículos', empty: 'Todavía no hay artículos publicados.' },
}
// 3. Props et emits
const props = defineProps<{
  locale: SaasLocale
  article?: SaasPublicArticle
  articles: SaasPublicArticle[]
  media: Record<string, string>
}>()
// 4. Composables, stores, routeur
// 5. Etat local
// 6. Data inputs
// 7. Validation et helpers purs
// 8. Computed UI-ready
const labels = computed(() => translations[props.locale])
// 9. Actions et handlers
// 10. Watch et watchEffect
// 11. Metadonnees ecran ou page
// 12. Lifecycle
</script>
<style scoped>
.article-screen {
  height: 100dvh;
  width: 100vw;
  min-height: 0;
  overflow-y: auto;
}
.article-shell {
  max-width: 76rem;
  margin: auto;
  padding: clamp(1rem, 4vw, 3rem);
}
nav {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  margin-bottom: 3rem;
}
.article-list {
  list-style: none;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 22rem), 1fr));
  gap: 2rem;
}
.article-list li {
  padding: 1.5rem;
  border: 1px solid #cbd5e1;
  border-radius: 0.75rem;
  background: white;
}
</style>
