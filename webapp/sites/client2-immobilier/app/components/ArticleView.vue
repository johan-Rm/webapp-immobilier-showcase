<template>
  <component :is="content" />
</template>
<script setup lang="ts">
// 1. Imports
import type { SaasPublicArticle } from '#shared/types/saas/article'

import { renderArticle, articleStyles } from '../utils/articleMarkup'
// 2. Types et constantes statiques
// 3. Props et emits
const props = defineProps<{ article: SaasPublicArticle; media: Record<string, string> }>()
// 4. Composables, stores, routeur
// 5. Etat local
// 6. Data inputs
// 7. Validation et helpers purs
// 8. Computed UI-ready
const content = () => renderArticle(props.article, props.media)
// 9. Actions et handlers
// 10. Watch et watchEffect
// 11. Metadonnees ecran ou page
useHead({ style: [{ textContent: articleStyles }] })
// 12. Lifecycle
</script>
