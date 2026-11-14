import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'

// BFF contract doubles, never authentication or isolation proofs for a real Symfony instance.
const installBff = async (
  page: Page,
  options = { platformAdmin: false, memberAdmin: true, unavailable: false },
) => {
  let authenticated = false
  const calls: { method: string; path: string; body: unknown }[] = []
  const organizations = [
    { id: 'org-a', name: 'Maison Azur', canManageMembers: options.memberAdmin },
    { id: 'org-b', name: 'Atelier Vert', canManageMembers: false },
  ]
  const projects: Record<string, { id: string; name: string }[]> = {
    'org-a': [
      { id: 'site-a', name: 'Site Azur' },
      { id: 'site-a2', name: 'Maison du Port' },
    ],
    'org-b': [{ id: 'site-b', name: 'Site Vert' }],
  }
  await page.route('**/api/saas/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const path = url.pathname.replace('/api/saas', '')
    const method = request.method()
    const body = request.postData() ? request.postDataJSON() : null
    calls.push({ method, path, body })
    const json = (data: unknown, status = 200) => route.fulfill({ status, json: data })
    if (options.unavailable) return json({ error: { code: 'upstream_unavailable' } }, 503)
    if (path === '/auth/login') {
      authenticated = true
      return json({})
    }
    if (path === '/auth/logout') {
      authenticated = false
      return json({})
    }
    if (path === '/auth/session')
      return authenticated
        ? json({
            user: {
              id: 'user-a',
              email: 'client@example.test',
              platformAdmin: options.platformAdmin,
            },
          })
        : json({ error: { code: 'authentication_required' } }, 401)
    if (
      ['/auth/invitations/accept', '/auth/password/forgot', '/auth/password/reset'].includes(path)
    )
      return json({})
    if (!authenticated) return json({ error: { code: 'authentication_required' } }, 401)
    if (path === '/organizations' && method === 'GET')
      return json({ items: organizations, hasNext: false })
    if (path === '/organizations' && method === 'POST')
      return options.platformAdmin ? json({ id: 'new-org' }) : json({}, 403)
    if (path === '/projects' && method === 'POST')
      return options.platformAdmin ? json({ id: 'new-project' }) : json({}, 403)
    const projectList = path.match(/^\/organizations\/([^/]+)\/projects$/)
    if (projectList) return json({ items: projects[projectList[1]!] ?? [], hasNext: false })
    if (path.endsWith('/members') && method === 'GET')
      return json({
        items: [{ id: 'member-b', email: 'collaborateur@example.test' }],
        hasNext: false,
      })
    if (path.endsWith('/invitations') && method === 'POST') return json({ id: 'invitation-a' })
    if (path.endsWith('/members/member-b') && method === 'DELETE') return json({})
    return json({ error: { code: 'not_found' } }, 404)
  })
  return calls
}

const login = async (page: Page) => {
  await page.goto('/connexion')
  await page.waitForFunction(() =>
    Boolean(
      (document.getElementById('__nuxt') as HTMLElement & { __vue_app__?: unknown })?.__vue_app__,
    ),
  )
  await page.getByLabel('Adresse e-mail', { exact: true }).fill('client@example.test')
  await page.getByLabel('Mot de passe', { exact: true }).fill('correct-password')
  await page.getByRole('button', { name: 'Se connecter', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Vos sites, au même endroit' })).toBeVisible()
}
const administration = async (page: Page) => {
  const menu = page.getByRole('button', { name: 'Ouvrir le menu' })
  if (await menu.isVisible()) await menu.click()
  await page.getByRole('link', { name: 'Administrateurs', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Organisation et collaborateurs' })).toBeVisible()
}

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(colorScheme, () => {
    test.use({ colorScheme })
    test('connexion, menu complet, choix du contexte et déconnexion sans contenu Showcase', async ({
      page,
    }) => {
      const calls = await installBff(page)
      const errors: string[] = []
      page.on('pageerror', (error) => errors.push(error.message))
      const response = await page.goto('/connexion')
      await page.waitForFunction(() =>
        Boolean(
          (document.getElementById('__nuxt') as HTMLElement & { __vue_app__?: unknown })
            ?.__vue_app__,
        ),
      )
      expect(response?.headers()['cache-control']).toContain('no-store')
      await login(page)
      await expect(page.getByRole('heading', { name: 'Site Azur', exact: true })).toBeVisible()
      await page.getByRole('combobox', { name: 'Projet / site' }).click()
      await page.getByRole('option', { name: 'Maison du Port' }).click()
      await expect(page.getByRole('heading', { name: 'Maison du Port' })).toBeVisible()
      await page.getByRole('combobox', { name: 'Organisation', exact: true }).click()
      await page.getByRole('option', { name: 'Atelier Vert' }).click()
      await expect(page.getByRole('heading', { name: 'Site Vert', exact: true })).toBeVisible()
      await page.screenshot({ path: test.info().outputPath('dashboard.png') })
      const menu = page.getByRole('button', { name: 'Ouvrir le menu' })
      if (await menu.isVisible()) await menu.click()
      for (const name of ['Pages', 'Séjours', 'Landing Pages', 'Composants du site', 'Tarifs']) {
        await expect(
          page.getByRole('button', { name: `${name} Bientôt`, exact: true }),
        ).toBeDisabled()
      }
      await expect(page.getByRole('link', { name: 'Articles', exact: true })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Catégories', exact: true })).toHaveCount(0)
      await page.getByRole('button', { name: 'Se déconnecter', exact: true }).click()
      await expect(page.getByRole('heading', { name: 'Connexion', exact: true })).toBeVisible()
      expect(calls.some((call) => call.path.includes('google'))).toBe(false)
      expect(errors).toEqual([])
    })

    test('un administrateur client gère ses collaborateurs sans créer organisations ou projets', async ({
      page,
    }) => {
      const calls = await installBff(page)
      await login(page)
      await administration(page)
      await expect(page.getByRole('heading', { name: 'Nouvelle organisation' })).toHaveCount(0)
      await expect(page.getByRole('heading', { name: 'Nouveau projet' })).toHaveCount(0)
      await page.getByLabel('Adresse e-mail', { exact: true }).fill('nouveau@example.test')
      await page.getByRole('button', { name: 'Inviter un collaborateur' }).click()
      await expect(page.getByRole('status')).toContainText('Votre demande a été enregistrée.')
      await page
        .getByRole('button', { name: 'Retirer l’accès de collaborateur@example.test' })
        .click()
      expect(calls).toContainEqual({
        method: 'POST',
        path: '/organizations/org-a/invitations',
        body: { email: 'nouveau@example.test' },
      })
      await expect
        .poll(() =>
          calls.some((call) => call.method === 'DELETE' && call.path.endsWith('/member-b')),
        )
        .toBe(true)
      expect(
        calls.some(
          (call) => call.method === 'POST' && ['/organizations', '/projects'].includes(call.path),
        ),
      ).toBe(false)
    })

    test('un collaborateur ne dispose pas des formulaires de gestion des accès', async ({
      page,
    }) => {
      await installBff(page, { platformAdmin: false, memberAdmin: false, unavailable: false })
      await login(page)
      await administration(page)
      await expect(page.getByRole('button', { name: 'Inviter un collaborateur' })).toHaveCount(0)
      await expect(page.getByText('La gestion des collaborateurs est réservée')).toBeVisible()
    })

    test('l’équipe SaaS peut demander la création d’une organisation et d’un projet', async ({
      page,
    }) => {
      const calls = await installBff(page, {
        platformAdmin: true,
        memberAdmin: false,
        unavailable: false,
      })
      await login(page)
      await administration(page)
      await page.getByLabel('Nom de l’organisation', { exact: true }).fill('Nouveau client')
      await page.getByRole('button', { name: 'Créer l’organisation', exact: true }).click()
      await expect
        .poll(() => calls.some((call) => call.method === 'POST' && call.path === '/organizations'))
        .toBe(true)
      await page.getByLabel('Nom du projet', { exact: true }).fill('Nouveau site')
      await page.getByRole('button', { name: 'Créer le projet', exact: true }).click()
      await expect
        .poll(() => calls.some((call) => call.method === 'POST' && call.path === '/projects'))
        .toBe(true)
    })

    test('une panne ne crée aucune session et conserve les champs saisis', async ({ page }) => {
      await installBff(page, { platformAdmin: false, memberAdmin: false, unavailable: true })
      await page.goto('/connexion')
      await page.waitForFunction(() =>
        Boolean(
          (document.getElementById('__nuxt') as HTMLElement & { __vue_app__?: unknown })
            ?.__vue_app__,
        ),
      )
      await page.getByLabel('Adresse e-mail', { exact: true }).fill('client@example.test')
      await page.getByLabel('Mot de passe', { exact: true }).fill('mot-de-passe-saisi')
      await page.getByRole('button', { name: 'Se connecter', exact: true }).click()
      await expect(page.getByRole('alert')).toContainText('Impossible de terminer cette action.')
      await expect(page.getByLabel('Adresse e-mail', { exact: true })).toHaveValue(
        'client@example.test',
      )
      await expect(page.getByLabel('Mot de passe', { exact: true })).toHaveValue(
        'mot-de-passe-saisi',
      )
      await expect(page).toHaveURL(/connexion/)
    })

    test('invitation et récupération de mot de passe utilisent les jetons sans les garder dans l’URL', async ({
      page,
    }) => {
      const calls = await installBff(page)
      await page.goto('/invitation?token=invitation-secret')
      await page.waitForFunction(() =>
        Boolean(
          (document.getElementById('__nuxt') as HTMLElement & { __vue_app__?: unknown })
            ?.__vue_app__,
        ),
      )
      await expect(page).toHaveURL(/\/invitation$/)
      await page.getByLabel('Mot de passe', { exact: true }).fill('nouveau-mot-de-passe')
      await page.getByRole('button', { name: 'Accepter l’invitation' }).click()
      await expect(page.getByRole('status')).toContainText('Votre invitation est acceptée.')
      expect(calls).toContainEqual({
        method: 'POST',
        path: '/auth/invitations/accept',
        body: { token: 'invitation-secret', password: 'nouveau-mot-de-passe' },
      })
      await page.goto('/mot-de-passe')
      await page.waitForFunction(() =>
        Boolean(
          (document.getElementById('__nuxt') as HTMLElement & { __vue_app__?: unknown })
            ?.__vue_app__,
        ),
      )
      await page.getByLabel('Adresse e-mail', { exact: true }).fill('client@example.test')
      await page.getByRole('button', { name: 'Recevoir un lien' }).click()
      await expect(page.getByRole('status')).toContainText('Si cette adresse est reconnue')
      await page.goto('/reinitialiser?token=reset-secret')
      await page.waitForFunction(() =>
        Boolean(
          (document.getElementById('__nuxt') as HTMLElement & { __vue_app__?: unknown })
            ?.__vue_app__,
        ),
      )
      await expect(page).toHaveURL(/\/reinitialiser$/)
      await page.getByLabel('Mot de passe', { exact: true }).fill('autre-mot-de-passe')
      await page.getByRole('button', { name: 'Enregistrer le mot de passe' }).click()
      await expect(page.getByRole('status')).toContainText('Votre mot de passe a été mis à jour.')
      expect(calls).toContainEqual({
        method: 'POST',
        path: '/auth/password/reset',
        body: { token: 'reset-secret', password: 'autre-mot-de-passe' },
      })
    })

    test('un compte existant accepte son invitation sans changer de mot de passe', async ({
      page,
    }) => {
      const calls = await installBff(page)
      await page.goto('/invitation?token=existing-account')
      await page.waitForFunction(() =>
        Boolean(
          (document.getElementById('__nuxt') as HTMLElement & { __vue_app__?: unknown })
            ?.__vue_app__,
        ),
      )
      await expect(page).toHaveURL(/\/invitation$/)
      await page.getByRole('button', { name: 'J’ai déjà un compte : me connecter' }).click()
      await page.getByLabel('Adresse e-mail', { exact: true }).fill('client@example.test')
      await page.getByLabel('Mot de passe', { exact: true }).fill('mot-de-passe-existant')
      await page.getByRole('button', { name: 'Se connecter', exact: true }).click()
      await expect(page.getByRole('heading', { name: 'Accepter votre invitation' })).toBeVisible()
      await expect(page.getByLabel('Mot de passe', { exact: true })).toHaveCount(0)
      await page.getByRole('button', { name: 'Accepter l’invitation' }).click()
      await expect(page.getByRole('status')).toContainText('Votre invitation est acceptée.')
      expect(calls).toContainEqual({
        method: 'POST',
        path: '/auth/invitations/accept',
        body: { token: 'existing-account' },
      })
    })

    test('un accès direct sans session revient à la connexion et un lien incomplet est inutilisable', async ({
      page,
    }) => {
      await installBff(page)
      await page.goto('/administration')
      await page.waitForFunction(() =>
        Boolean(
          (document.getElementById('__nuxt') as HTMLElement & { __vue_app__?: unknown })
            ?.__vue_app__,
        ),
      )
      await expect(page.getByRole('heading', { name: 'Connexion', exact: true })).toBeVisible()
      await page.goto('/reinitialiser')
      await page.waitForFunction(() =>
        Boolean(
          (document.getElementById('__nuxt') as HTMLElement & { __vue_app__?: unknown })
            ?.__vue_app__,
        ),
      )
      await expect(page.getByRole('button', { name: 'Enregistrer le mot de passe' })).toBeDisabled()
      await expect(page.getByText('Ce lien est incomplet.')).toBeVisible()
    })
  })
}

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`identité ${colorScheme}`, () => {
    test.use({ colorScheme })

    test('charte, polices locales, contrastes et parcours clavier', async ({ page }) => {
      const errors: string[] = []
      page.on('pageerror', (error) => errors.push(error.message))
      page.on('console', (message) => {
        if (message.type() === 'warning' && /hydration/i.test(message.text()))
          errors.push(message.text())
      })
      await installBff(page)
      await page.goto('/connexion')
      await page.waitForFunction(() =>
        Boolean(
          (document.getElementById('__nuxt') as HTMLElement & { __vue_app__?: unknown })
            ?.__vue_app__,
        ),
      )
      await expect(page.locator('html')).toHaveClass(new RegExp(colorScheme))
      await expect(page.getByText('Graines Digitales', { exact: true })).toBeVisible()
      await page.evaluate(async () => {
        await document.fonts.load('400 24px Rationale')
        await document.fonts.load('400 16px Inter')
        await document.fonts.ready
      })
      expect(
        await page.evaluate(() =>
          [...document.fonts].filter((font) => font.status === 'loaded').map((font) => font.family),
        ),
      ).toEqual(expect.arrayContaining(['Rationale', 'Inter']))
      const ratios = await page.evaluate(() => {
        const root = getComputedStyle(document.documentElement)
        const rgb = (token: string) => {
          const element = document.createElement('span')
          element.style.color = root.getPropertyValue(token)
          document.body.append(element)
          const canvas = document.createElement('canvas')
          canvas.width = canvas.height = 1
          const context = canvas.getContext('2d')!
          context.fillStyle = getComputedStyle(element).color
          context.fillRect(0, 0, 1, 1)
          const channels = [...context.getImageData(0, 0, 1, 1).data].slice(0, 3)
          element.remove()
          return channels
            .map((value) => {
              const v = value / 255
              return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
            })
            .reduce((sum, value, i) => sum + value * [0.2126, 0.7152, 0.0722][i]!, 0)
        }
        const ratio = (a: string, b: string) => {
          const [x, y] = [rgb(a), rgb(b)].sort((l, r) => r - l)
          return (x! + 0.05) / (y! + 0.05)
        }
        return {
          text: ratio('--ui-text', '--ui-bg'),
          muted: ratio('--ui-text-muted', '--ui-bg-muted'),
          dimmed: ratio('--ui-text-dimmed', '--ui-bg'),
          action: ratio('--ui-primary', '--ui-text-inverted'),
          border: ratio('--ui-border', '--ui-bg'),
          focus: ratio('--ui-primary', '--ui-bg-elevated'),
          error: ratio('--ui-error', '--ui-bg'),
          success: ratio('--ui-success', '--ui-bg'),
          warning: ratio('--ui-warning', '--ui-bg'),
        }
      })
      for (const [name, ratio] of Object.entries(ratios))
        expect(ratio, name).toBeGreaterThanOrEqual(['border', 'focus'].includes(name) ? 3 : 4.5)
      await test.info().attach('contrastes', {
        body: JSON.stringify(ratios, null, 2),
        contentType: 'application/json',
      })
      await expect(page.getByRole('heading', { name: 'Connexion', exact: true })).toHaveCSS(
        'font-family',
        /Rationale/,
      )
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true)
      await page.keyboard.press('Tab')
      await expect(page.getByLabel('Adresse e-mail', { exact: true })).toBeFocused()
      await page.keyboard.type('client@example.test')
      await page.keyboard.press('Tab')
      await expect(page.getByLabel('Mot de passe', { exact: true })).toBeFocused()
      await page.keyboard.type('correct-password')
      await page.keyboard.press('Tab')
      await expect(page.getByRole('button', { name: 'Se connecter', exact: true })).toBeFocused()
      await page.screenshot({ path: test.info().outputPath('connexion.png') })
      await page.keyboard.press('Enter')
      await expect(page.getByRole('heading', { name: 'Vos sites, au même endroit' })).toBeVisible()
      const menu = page.getByRole('button', { name: 'Ouvrir le menu' })
      if (await menu.isVisible()) {
        await menu.focus()
        await page.keyboard.press('Enter')
        await expect(page.getByRole('dialog')).toBeVisible()
        await page.keyboard.press('Escape')
        await expect(page.getByRole('dialog')).not.toBeVisible()
        await expect(menu).toBeFocused()
      }
      await page.screenshot({ path: test.info().outputPath('contexte.png') })
      await administration(page)
      await page.screenshot({ path: test.info().outputPath('administration.png') })
      expect(errors).toEqual([])
    })
  })
}

test('thème mémorisé, automatique réactif et sélecteur utilisable au clavier', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (/hydration/i.test(message.text())) errors.push(message.text())
  })
  await page.emulateMedia({ colorScheme: 'dark' })
  await installBff(page)
  await login(page)
  const selector = page.getByRole('combobox', { name: 'Thème de l’interface' })
  await expect(selector).toBeVisible()
  await expect(selector).toContainText('Automatique')
  await expect(page.locator('html')).toHaveClass(/dark/)
  await page.emulateMedia({ colorScheme: 'light' })
  await expect(page.locator('html')).toHaveClass(/light/)
  await selector.focus()
  await page.keyboard.press('Enter')
  await page.getByRole('option', { name: 'Sombre', exact: true }).click()
  await expect(page.locator('html')).toHaveClass(/dark/)
  await page.reload()
  await expect(selector).toContainText('Sombre')
  await expect(page.locator('html')).toHaveClass(/dark/)
  await administration(page)
  await expect(selector).toContainText('Sombre')
  await selector.click()
  await page.getByRole('option', { name: 'Clair', exact: true }).click()
  await page.emulateMedia({ colorScheme: 'dark' })
  await expect(page.locator('html')).toHaveClass(/light/)
  await selector.click()
  await page.getByRole('option', { name: 'Automatique', exact: true }).click()
  await expect(page.locator('html')).toHaveClass(/dark/)
  await page.reload()
  await expect(selector).toContainText('Automatique')
  await page.emulateMedia({ colorScheme: 'light' })
  await expect(page.locator('html')).toHaveClass(/light/)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: test.info().outputPath('theme-selector.png') })
  expect(errors).toEqual([])
})
