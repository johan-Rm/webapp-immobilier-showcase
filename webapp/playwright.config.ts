import { defineConfig, devices } from '@playwright/test'

import { resolveApplicationTarget } from './shared/site/registry'

const target = resolveApplicationTarget(process.env.GD_TARGET)
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000'

export default defineConfig({
  testDir: './tests/e2e',
  testMatch:
    target.kind === 'dashboard'
      ? '**/saas-*.spec.ts'
      : target.id === 'client2-immobilier'
        ? '**/client2*.spec.ts'
        : '**/home.smoke.spec.ts',
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { outputFolder: '.tmp/playwright/report', open: 'never' }]],
  outputDir: '.tmp/playwright/test-results',
  use: {
    baseURL,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium-mobile',
      use: { ...devices['Pixel 5'] },
    },
  ],
})
