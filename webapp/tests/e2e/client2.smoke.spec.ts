import { expect, test } from '@playwright/test'

test('Client 2 rend sa page SSR sans initialisation Showcase', async ({ page }) => {
  const errors: string[] = []
  const showcaseRequests: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('request', (request) => {
    if (/^\/(?:api(?:\/|$)|themes\.(?:json|css)$|images\/)/.test(new URL(request.url()).pathname)) {
      showcaseRequests.push(request.url())
    }
  })
  const response = await page.goto('/', { waitUntil: 'networkidle' })
  expect(response?.status()).toBe(200)
  expect(await response!.text()).toContain('<h1>Client 2 Immobilier</h1>')
  await expect(page.getByRole('heading', { name: 'Client 2 Immobilier' })).toBeVisible()
  await expect(page).toHaveTitle('Client 2 Immobilier')
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr')
  expect(errors).toEqual([])
  expect(showcaseRequests).toEqual([])
  expect((await page.goto('/fr/dashboard/login'))?.status()).toBe(404)
  expect((await page.goto('/themes.json'))?.status()).toBe(404)
})
