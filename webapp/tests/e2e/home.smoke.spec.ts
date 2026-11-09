import { expect, test } from '@playwright/test'

test('home page renders without critical browser errors', async ({ page }) => {
  const browserErrors: string[] = []

  page.on('console', (message) => {
    if (message.type() === 'error') {
      browserErrors.push(message.text())
    }
  })
  page.on('pageerror', (error) => {
    browserErrors.push(error.message)
  })

  const response = await page.goto('/fr', { waitUntil: 'domcontentloaded' })

  expect(response?.ok()).toBe(true)
  await expect(page.locator('body')).toBeVisible()
  await expect(page.locator('[data-screen]').first()).toBeVisible()

  try {
    await page.waitForLoadState('networkidle', { timeout: 10_000 })
  } catch {
    // Long-lived requests should not block the smoke check.
  }

  const screenshot = await page.screenshot()

  expect(screenshot.byteLength).toBeGreaterThan(1_000)
  expect(browserErrors).toEqual([])
})
