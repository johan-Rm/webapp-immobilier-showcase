export default {
  testRunner: 'vitest',
  plugins: ['@stryker-mutator/vitest-runner'],
  mutate: ['shared/saas/links.ts'],
  vitest: { configFile: 'scripts/quality/vitest-mutation.config.ts', related: false },
  coverageAnalysis: 'perTest',
  concurrency: 1,
  reporters: ['clear-text', 'json', 'html'],
  jsonReporter: { fileName: 'reports/mutation.json' },
  htmlReporter: { fileName: 'reports/mutation.html' },
  timeoutMS: 5000,
  timeoutFactor: 2,
  // Score informatif : aucun budget adopté avant examen humain des survivants.
}
