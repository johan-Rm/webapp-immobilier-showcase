import { nodeTestFiles, projectFiles } from './run.ts'

export function mutationTestFiles(
  root: string,
  target: 'showcase-immobilier' | 'client2-immobilier' | 'dashboard',
  files = projectFiles(root),
): string[] {
  return nodeTestFiles(root, target, files).filter((file) => !file.startsWith('scripts/'))
}
