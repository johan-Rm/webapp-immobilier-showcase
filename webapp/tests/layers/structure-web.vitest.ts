import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'
import * as Vue from 'vue'
import { compileTemplate, parse } from 'vue/compiler-sfc'
import * as ServerRenderer from 'vue/server-renderer'

const webapp = resolve(import.meta.dirname, '../..')
const source = (path: string) => readFileSync(resolve(webapp, path), 'utf8')

function editorialTemplate() {
  const descriptor = parse(source('sites/client2-immobilier/app/layouts/editorial.vue')).descriptor
  const compiled = compileTemplate({
    source: descriptor.template!.content,
    filename: 'editorial.vue',
    id: 'editorial-layout-test',
    ssr: true,
  })
  expect(compiled.errors).toEqual([])
  const parameters: string[] = []
  const helpers: unknown[] = []
  const code = compiled.code.replace(
    /import\s*{([^}]+)}\s*from\s*["']([^"']+)["'];?/g,
    (_, names: string, module: string) => {
      const modules: Record<string, Record<string, unknown>> = {
        vue: Vue,
        'vue/server-renderer': ServerRenderer,
      }
      const exports = modules[module]
      if (!exports) throw new Error(`Import de compilation inattendu : ${module}`)
      for (const name of names.split(',')) {
        const [original, alias] = name.trim().split(/\s+as\s+/)
        parameters.push(alias || original!)
        helpers.push(exports[original!])
      }
      return ''
    },
  )
  const render = new Function(
    ...parameters,
    code.replace('export function ssrRender', 'return function ssrRender'),
  )(...helpers)
  return Vue.defineComponent({ props: { plain: Boolean }, ssrRender: render })
}

describe('composition réelle du layout éditorial Client 2', () => {
  it.each([true, false])('rend un seul main et le contenu du slot, plain=%s', async (plain) => {
    const html = await ServerRenderer.renderToString(
      Vue.createSSRApp({
        render: () =>
          Vue.h(
            editorialTemplate(),
            { plain, 'data-page': 'index' },
            {
              default: () => Vue.h('h1', 'Contenu fixture'),
            },
          ),
      }),
    )
    expect(html.match(/<main\b/g)).toHaveLength(1)
    expect(html).toContain('<h1>Contenu fixture</h1>')
    expect(html).toContain('data-page="index"')
    expect(html).toContain('data-layout="editorial"')
    expect(html.includes('editorial-layout')).toBe(!plain)
  })

  it('délègue aussi l’accueil au layout sans ajouter de main dans la page', () => {
    const template = parse(source('sites/client2-immobilier/app/pages/index.vue')).descriptor
      .template!
    expect(template.content).toContain('<NuxtLayout')
    expect(template.content).toContain('name="editorial"')
    expect(template.content).toContain(' plain')
    expect(template.content).not.toMatch(/<main\b/)
  })
})
