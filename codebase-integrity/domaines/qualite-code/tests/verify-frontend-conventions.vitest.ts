import { describe, expect, it } from 'vitest'

import {
  analyzeScriptSource,
  analyzeLayerConfig,
  analyzeVue,
  policyExitCode,
} from '../../../commun/frontend-policy'

const root = '/fixture/webapp'
const file = `${root}/sites/client-a/app/components/card/Offer.vue`
const source = (template = '<div data-component="card-offer" />', script = '') =>
  `<template>${template}</template>${script}`
const analyze = (content: string, path = file) => analyzeVue(content, path, root)
const codes = (content: string, path = file) =>
  analyze(content, path).map((finding) => finding.rule)

describe('syntaxe certaine et warnings frontend', () => {
  it.each(['', '<style>div { color: red }</style>', '<style scoped>div { color: red }</style>'])(
    'style facultativement scoped : %s',
    (style) => expect(analyze(source() + style)).toEqual([]),
  )
  it('accepte setup TS et refuse setup ou TS manquants', () => {
    expect(analyze(source(undefined, '<script setup lang="ts">const x = 1</script>'))).toEqual([])
    for (const script of [
      '<script lang="ts">const x = 1</script>',
      '<script setup>const x = 1</script>',
    ])
      expect(codes(source(undefined, script))).toContain('vue-script-contract')
  })
  it('refuse ordre incorrect et erreur de parsing', () => {
    expect(codes('<script setup lang="ts">const x = 1</script>' + source())).toContain(
      'vue-block-order',
    )
    expect(policyExitCode(analyze('<template><div></template>'))).toBe(1)
    expect(codes('<template lang="pug">div</template>')).toContain('template-parse')
  })
  it.each([
    '<div />',
    '<div :data-component="name" />',
    '<div data-component="Offer" />',
    '<div data-component="card-offer" :data-component="name" />',
  ])('refuse un marqueur absent, dynamique ou mal nommé : %s', (template) =>
    expect(codes(source(template))).toContain('root-marker'),
  )
  it.each([
    '<div /><aside />',
    '<div v-if="ok" />',
    '<SomeComponent />',
    '<div v-for="x in xs" />',
  ])('rapporte explicitement une racine exemptée : %s', (template) => {
    const findings = analyze(source(template))
    expect(findings).toContainEqual(
      expect.objectContaining({ severity: 'exemption', rule: 'root-marker-exemption' }),
    )
    expect(policyExitCode(findings)).toBe(0)
  })
  it('conserve le marqueur de NuxtLayout et les routes dynamiques', () =>
    expect(
      codes(
        source('<NuxtLayout data-page="locale-articles-slug" />'),
        `${root}/sites/client-b/app/pages/[locale]/articles/[[slug]].vue`,
      ),
    ).not.toContain('root-marker'))
  it('couvre Dashboard et le catalogue', () => {
    expect(
      codes(source('<div data-component="offer" />'), `${root}/dashboard/app/components/Offer.vue`),
    ).not.toContain('root-marker')
    expect(
      codes(
        source('<section data-component="screen-offer" data-section="offer" />'),
        `${root}/base/real-estate/components/screen/Offer.vue`,
      ),
    ).not.toContain('root-marker')
  })
  it('contrôle le propriétaire de main et le nombre dans un layout', () => {
    const layout = `${root}/sites/client-b/app/layouts/default.vue`
    expect(
      policyExitCode(
        analyze(
          source('<div data-layout="default"><main data-section="contenu"><slot /></main></div>'),
          layout,
        ),
      ),
    ).toBe(0)
    expect(codes(source('<div data-layout="default" />'), layout)).toContain('main-count')
    expect(
      codes(
        source('<main data-page="index" data-section="contenu" />'),
        `${root}/sites/client-b/app/pages/index.vue`,
      ),
    ).toContain('main-owner')
    expect(
      codes(
        source('<main data-component="screen-offer" data-section="contenu" />'),
        `${root}/base/real-estate/components/screen/Offer.vue`,
      ),
    ).toContain('main-owner')
  })
  it.each([
    '<div data-component="card-offer"><section data-section="a" /><aside data-section="a" /></div>',
    '<div data-component="card-offer" :data-section="x" />',
    '<div data-component="card-offer"><section v-for="x in xs" data-section="offer" /></div>',
  ])('refuse les régions invalides : %s', (template) =>
    expect(codes(source(template))).toContain('section-marker'),
  )
  it('contrôle les régions stables sans interdire aside aux Screens', () => {
    expect(
      codes(source('<section data-page="index" />'), `${root}/sites/client-b/app/pages/index.vue`),
    ).toContain('required-section')
    expect(
      policyExitCode(
        analyze(
          source('<aside data-component="screen-offer" data-section="offer" />'),
          `${root}/base/real-estate/components/screen/Offer.vue`,
        ),
      ),
    ).toBe(0)
  })
  it('signale les transformations dans les interpolations et boucles', () => {
    for (const template of [
      '<div data-component="card-offer">{{ items.filter(x => x.visible).length }}</div>',
      '<div data-component="card-offer"><span v-for="item in items.filter(x => x.visible)" /></div>',
    ])
      expect(codes(source(template))).toContain('template-transformation')
    expect(codes(source('<div data-component="card-offer">{{ readyLabel }}</div>'))).not.toContain(
      'template-transformation',
    )
  })
  it('avertit sans bloquer sur les textes, accepte traductions et valeurs éditoriales', () => {
    const findings = analyze(
      source('<div data-component="card-offer" aria-label="Offres">Voir les offres</div>'),
    )
    expect(findings.filter((finding) => finding.severity === 'warning')).toHaveLength(2)
    expect(policyExitCode(findings)).toBe(0)
    expect(
      analyze(
        source(
          '<div data-component="card-offer" :aria-label="t(\'offers\')">{{ t("offers") }}{{ editorialLabel }}</div>',
        ),
      ),
    ).toEqual([])
    expect(codes(source('<div data-component="card-offer" :aria-label="\'Offres\'" />'))).toContain(
      'untranslated-expression',
    )
    expect(
      codes(source('<div data-component="card-offer"><MDC>Texte éditorial</MDC></div>')),
    ).not.toContain('untranslated-text')
  })
  it('contrôle également les imports des composables TypeScript et signale leur historique', () => {
    const findings = analyzeScriptSource(
      'import image from "@nuxt/image"; // OPS-123',
      `${root}/sites/client-a/app/composables/useImage.ts`,
      root,
    )
    expect(findings.map((finding) => finding.rule)).toEqual(
      expect.arrayContaining(['declared-module-wrapper', 'historical-comment']),
    )
    expect(
      analyzeScriptSource('import type { ImageOptions } from "@nuxt/image"', file, root),
    ).toEqual([])
  })
  it('ne présente pas un main indirect comme un résultat de rendu certain', () => {
    const findings = analyze(
      source('<UApp data-layout="default"><slot /></UApp>'),
      `${root}/sites/client-b/app/layouts/default.vue`,
    )
    expect(findings).toContainEqual(
      expect.objectContaining({ rule: 'main-count', severity: 'warning' }),
    )
  })
  it('avertit sur les événements DOM et commentaires historiques', () => {
    expect(
      codes(
        source(
          undefined,
          '<script setup lang="ts">// OPS-123\nwindow.addEventListener("click", handler)</script>',
        ),
      ),
    ).toEqual(expect.arrayContaining(['direct-dom-event', 'historical-comment']))
    expect(
      codes(
        source(
          undefined,
          '<script setup lang="ts">useEventListener(window, "click", handler)</script>',
        ),
      ),
    ).not.toContain('direct-dom-event')
  })
  it('repère les écouteurs globaux, accès calculés et commentaires de template', () => {
    for (const call of [
      'addEventListener("click", handler)',
      'window["addEventListener"]("click", handler)',
    ]) {
      expect(codes(source(undefined, `<script setup lang="ts">${call}</script>`))).toContain(
        'direct-dom-event',
      )
    }
    expect(codes(source('<div data-component="card-offer"><!-- OPS-123 --></div>'))).toContain(
      'historical-comment',
    )
  })
  it('réserve les modules déclarés à leur wrapper et autorise i18n', () => {
    const script = '<script setup lang="ts">import image from "@nuxt/image"</script>'
    expect(codes(source(undefined, script))).toContain('declared-module-wrapper')
    expect(
      analyzeScriptSource('export * from "@nuxt/image"', file, root).map((finding) => finding.rule),
    ).toContain('declared-module-wrapper')
    expect(
      analyzeScriptSource('const moduleName = "@nuxt/image"; import(moduleName)', file, root),
    ).toContainEqual(
      expect.objectContaining({ severity: 'warning', rule: 'dynamic-import-review' }),
    )
    expect(
      analyzeScriptSource('import { type ImageOptions } from "@nuxt/image"', file, root),
    ).toEqual([])
    expect(
      codes(
        source('<div data-component="app-image" />', script),
        `${root}/sites/client-b/app/components/AppImage.vue`,
      ),
    ).not.toContain('declared-module-wrapper')
    expect(
      codes(
        source(undefined, '<script setup lang="ts">import { useI18n } from "vue-i18n"</script>'),
      ),
    ).not.toContain('declared-module-wrapper')
    expect(
      codes(source(undefined, '<script setup lang="ts">const m = import("@nuxt/image")</script>')),
    ).toContain('declared-module-wrapper')
  })
})

describe('sélection explicite des layers', () => {
  const config = (text: string, path = 'nuxt.config.ts') =>
    analyzeLayerConfig(text, `${root}/${path}`, root)
  it('accepte une racine explicite et une layer autonome', () => {
    expect(
      config(
        'const target = resolveApplicationTarget(process.env.GD_TARGET); export default defineNuxtConfig({srcDir: target.root, extends: [target.root]})',
      ),
    ).toEqual([])
    expect(
      config('export default defineNuxtConfig({srcDir: "."})', 'base/real-estate/nuxt.config.ts'),
    ).toEqual([])
  })
  it('ne confond pas un appel inutilisé avec une sélection effective des sources', () => {
    expect(
      config('resolveApplicationTarget(); export default defineNuxtConfig({srcDir: "app"})').map(
        (finding) => finding.rule,
      ),
    ).toContain('explicit-application')
    expect(
      config(
        'const target = resolveApplicationTarget(); const siteRoot = join(target.root, "app"); export default defineNuxtConfig({srcDir: siteRoot})',
      ),
    ).toEqual([])
  })
  it('détecte une extension globale même indirecte', () => {
    expect(
      config(
        'const target = resolveApplicationTarget(); const common = "./base"; export default defineNuxtConfig({srcDir: target.root, extends: [common]})',
      ).map((finding) => finding.rule),
    ).toContain('global-base-extension')
  })
  it('refuse le catalogue global et la dépendance cliente du socle', () => {
    expect(
      config(
        'resolveApplicationTarget(); export default defineNuxtConfig({srcDir: "app", extends: ["./base"]})',
      ).map((finding) => finding.rule),
    ).toContain('global-base-extension')
    expect(config('export default defineNuxtConfig({})').map((finding) => finding.rule)).toContain(
      'layer-sources',
    )
    expect(
      config(
        'export default defineNuxtConfig({srcDir: "../../sites/client-a/app"})',
        'base/catalog/nuxt.config.ts',
      ).map((finding) => finding.rule),
    ).toContain('layer-client-selection')
  })
})
