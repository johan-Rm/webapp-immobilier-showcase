/* eslint-disable @typescript-eslint/no-require-imports -- Configuration CommonJS requise par dependency-cruiser. */
const fs = require('node:fs')
const path = require('node:path')
const { createRequire } = require('node:module')
const integrity = createRequire(path.resolve(__dirname, '../../../codebase-integrity/package.json'))
const { parse } = integrity('yaml')
const rules = parse(
  fs.readFileSync(
    path.resolve(
      __dirname,
      '../../../codebase-integrity/domaines/architecture-dependances/regles.yaml',
    ),
    'utf8',
  ),
).rules
const rule = rules.find((entry) => entry.name === 'services-no-framework-imports')
if (!rule) throw new Error('Règle services indépendante absente')
const escape = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
module.exports = {
  forbidden: [
    {
      name: rule.name,
      severity: 'error',
      from: { path: '^(?:' + rule.paths.map((value) => escape(value) + '/').join('|') + ')' },
      to: {
        path:
          '(?:(?:^|/)node_modules/|^)(?:' +
          rule.forbiddenModules
            .map((value) => escape(value) + (value.endsWith('/') ? '' : '$'))
            .join('|') +
          ')',
      },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsPreCompilationDeps: true,
    enhancedResolveOptions: {
      extensions: ['.ts', '.js', '.json'],
      exportsFields: ['exports'],
      conditionNames: ['import', 'node', 'default'],
    },
  },
}
