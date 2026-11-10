import { defineNuxtConfig } from 'nuxt/config'

/** Le socle réutilise app/ ; les alias et contrôles existants gardent leurs chemins. */
export default defineNuxtConfig({
  $meta: { name: 'immobilier' },
  srcDir: '../app',
})
