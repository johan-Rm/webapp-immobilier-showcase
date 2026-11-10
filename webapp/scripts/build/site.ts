import { cp, mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

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
export const siteTypeScriptPaths = (id: string): Record<string, string[]> => ({
  '#imports': ['./imports'],
  '#imports/*': ['./imports/*'],
  '#components': ['./components'],
  '@schemas/dtos': ['../schemas/dtos'],
  '@schemas/dtos/*': ['../schemas/dtos/*'],
  '@schemas/interfaces': ['../schemas/interfaces'],
  '@schemas/interfaces/*': ['../schemas/interfaces/*'],
  '~/*': [`../sites/${id}/app/*`],
  '@/*': [`../sites/${id}/app/*`],
  '@utils/*': [`../sites/${id}/app/utils/*`],
  '@locales/*': ['../i18n/locales/*'],
  '#shared': ['../shared'],
  '#shared/*': ['../shared/*'],
  '@schemas/*': ['../schemas/*'],
  '@services/*': ['../services/*'],
  '#site': ['../shared/site/definition.d.ts'],
})

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
