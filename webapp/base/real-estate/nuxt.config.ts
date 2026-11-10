import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  $meta: { name: 'real-estate' },
  srcDir: '.',
  components: [{ path: './components', pathPrefix: true }],
})
