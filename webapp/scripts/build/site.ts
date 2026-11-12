import { readdirSync } from 'node:fs'
import { cp, mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { resolveApplicationTarget } from '../../shared/site/registry'

/** Embarque uniquement le contenu et le thème du client construit. */
export const packageSite = async (
  source: string,
  output: string,
  id: string,
  content: string,
): Promise<void> => {
  const destination = join(output, 'site', id)
  await mkdir(destination, { recursive: true })
  await cp(content, join(destination, 'content'), { recursive: true })
  await cp(join(source, 'themes.yaml'), join(destination, 'themes.yaml'))
}

/** Conserve la politique d'alias historique, avec la source du client actif. */
export const siteTypeScriptPaths = (id: string): Record<string, string[]> => {
  const target = resolveApplicationTarget(id)
  const root = target.kind === 'dashboard' ? '../..' : '..'
  const app = `${root}/${target.root}/app`
  return {
    '#imports': ['./imports'],
    '#imports/*': ['./imports/*'],
    '#components': ['./components'],
    '@schemas/dtos': [`${root}/schemas/dtos`],
    '@schemas/dtos/*': [`${root}/schemas/dtos/*`],
    '@schemas/interfaces': [`${root}/schemas/interfaces`],
    '@schemas/interfaces/*': [`${root}/schemas/interfaces/*`],
    '~/*': [`${app}/*`],
    '@/*': [`${app}/*`],
    '@utils/*': [`${app}/utils/*`],
    '@site-assets/*': [`${app}/assets/*`],
    '@locales/*': [
      target.kind === 'dashboard' ? `${root}/dashboard/i18n/locales/*` : `${root}/i18n/locales/*`,
    ],
    '#shared': [`${root}/shared`],
    '#shared/*': [`${root}/shared/*`],
    '@schemas/*': [`${root}/schemas/*`],
    '@services/*': [`${root}/services/*`],
    '#site': [`${root}/shared/site/definition.d.ts`],
  }
}

export const writeSiteTypeScriptConfig = async (buildDir: string, id: string): Promise<void> => {
  await mkdir(buildDir, { recursive: true })
  await writeFile(
    join(buildDir, 'tsconfig.site.json'),
    JSON.stringify(
      {
        extends: './tsconfig.json',
        compilerOptions: { paths: siteTypeScriptPaths(id) },
      },
      null,
      2,
    ) + '\n',
  )
}

/** Active seulement les handlers SaaS committés ; jamais le serveur historique entier. */
export const dashboardApiHandlers = (webapp: string) => {
  const root = join(webapp, 'server/api/saas')
  const visit = (
    directory: string,
    prefix: string,
  ): { route: string; method: 'get' | 'post' | 'put' | 'delete'; handler: string }[] =>
    readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
      if (entry.isSymbolicLink()) throw new Error('[dashboard] Handler symbolique refusé')
      const path = join(directory, entry.name)
      if (entry.isDirectory()) return visit(path, prefix + '/' + entry.name)
      const match = /^(.+)\.(get|post|put|delete)\.ts$/.exec(entry.name)
      if (!match) return []
      const method = match[2] as 'get' | 'post' | 'put' | 'delete'
      const route = (prefix + (match[1] === 'index' ? '' : '/' + match[1])).replace(
        /\[([A-Za-z][A-Za-z0-9]*)\]/g,
        ':$1',
      )
      if (route.includes('[') || route.includes(']'))
        throw new Error('[dashboard] Route SaaS non prise en charge')
      return [{ route, method, handler: path }]
    })
  return visit(root, '/api/saas').sort(
    (a, b) => a.route.localeCompare(b.route) || a.method.localeCompare(b.method),
  )
}
