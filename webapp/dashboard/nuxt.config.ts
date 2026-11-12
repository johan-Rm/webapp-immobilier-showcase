import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  $meta: { name: 'dashboard' },
  srcDir: './app',
  modules: ['@nuxt/ui', '@nuxtjs/i18n'],
  css: ['~/assets/css/main.css'],
  ui: { fonts: false, colorMode: false },
  icon: { serverBundle: { collections: ['lucide'] } },
  i18n: {
    defaultLocale: 'fr',
    strategy: 'no_prefix',
    detectBrowserLanguage: false,
    locales: [{ code: 'fr', language: 'fr-FR', file: 'fr.json' }],
    langDir: 'locales',
  },
  routeRules: {
    '/**': {
      headers: { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow' },
    },
  },
  hooks: {
    'prepare:types': async () => {
      // Vite also resolves the parent tsconfig. Never overwrite an existing site's generated types.
      const directory = resolve(__dirname, '../.nuxt')
      await mkdir(directory, { recursive: true })
      try {
        await writeFile(
          resolve(directory, 'tsconfig.site.json'),
          JSON.stringify({ extends: '../dashboard/.nuxt/tsconfig.site.json' }) + '\n',
          { flag: 'wx' },
        )
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error
      }
    },
  },
})
