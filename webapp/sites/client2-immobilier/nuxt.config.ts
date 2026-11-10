import { resolve } from 'node:path'

import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  $meta: { name: 'client2-immobilier' },
  srcDir: './app',
  serverDir: resolve(__dirname, 'server'),
  modules: ['@nuxtjs/i18n'],
  i18n: {
    defaultLocale: 'fr',
    strategy: 'no_prefix',
    detectBrowserLanguage: false,
    locales: [{ code: 'fr', language: 'fr-FR', file: 'fr.json' }],
    langDir: 'locales',
  },
})
