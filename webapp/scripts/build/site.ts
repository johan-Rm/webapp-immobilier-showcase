import { cp, mkdir } from 'node:fs/promises'
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
