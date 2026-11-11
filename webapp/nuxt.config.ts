import type { SiteDefinition } from './shared/types/site'

import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'

import { createJiti } from 'jiti'

import { runSchemaHook } from './scripts/build/schema-hook'
import { writeSiteTypeScriptConfig } from './scripts/build/site'
import { resolveSiteId } from './shared/site/registry'

const siteId = resolveSiteId(process.env.GD_TARGET)
const siteRoot = resolve(__dirname, 'sites', siteId)
if (!existsSync(join(siteRoot, 'nuxt.config.ts')) || !existsSync(join(siteRoot, 'site.ts'))) {
  throw new Error(`[site] Client inconnu : ${siteId}`)
}
const site = await createJiti(import.meta.url).import<SiteDefinition>(join(siteRoot, 'site.ts'), {
  default: true,
})
if (site.id !== siteId || !site.name?.trim()) {
  throw new Error(`[site] Identité invalide pour ${siteId}`)
}

export default defineNuxtConfig({
  srcDir: join(siteRoot, 'app'),
  extends: [siteRoot],
  compatibilityDate: '2025-07-15',
  ssr: true,
  devtools: { enabled: false },
  dir: { public: join(siteRoot, 'public') },
  typescript: { strict: true },
  alias: {
    '~': join(siteRoot, 'app'),
    '@': join(siteRoot, 'app'),
    '@utils': join(siteRoot, 'app/utils'),
    '@site-assets': join(siteRoot, 'app/assets'),
    '#site': join(siteRoot, 'site.ts'),
    '@schemas': resolve(__dirname, 'schemas'),
    '@services': resolve(__dirname, 'services'),
    '@locales': resolve(__dirname, 'i18n/locales'),
    ...(process.env.DIGITAL_ORCHESTRATION_CORE_PATH?.trim()
      ? { '@DigitalOrchestrationCore': resolve(process.env.DIGITAL_ORCHESTRATION_CORE_PATH.trim()) }
      : {}),
  },
  hooks: {
    'prepare:types': async () => {
      await runSchemaHook()
      await writeSiteTypeScriptConfig(resolve(__dirname, '.nuxt'), siteId)
    },
  },
  nitro: {
    alias: { '#site': join(siteRoot, 'site.ts') },
  },
})
