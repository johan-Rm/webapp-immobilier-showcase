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
