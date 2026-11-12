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

test('connexion, menu complet, choix du contexte et déconnexion sans contenu Showcase', async ({
  page,
}) => {
  const calls = await installBff(page)
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  const response = await page.goto('/connexion')
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
    await expect(page.getByRole('button', { name: `${name} Bientôt`, exact: true })).toBeDisabled()
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
  await page.getByRole('button', { name: 'Retirer l’accès de collaborateur@example.test' }).click()
  expect(calls).toContainEqual({
    method: 'POST',
    path: '/organizations/org-a/invitations',
    body: { email: 'nouveau@example.test' },
  })
  await expect
    .poll(() => calls.some((call) => call.method === 'DELETE' && call.path.endsWith('/member-b')))
    .toBe(true)
  expect(
    calls.some(
      (call) => call.method === 'POST' && ['/organizations', '/projects'].includes(call.path),
    ),
  ).toBe(false)
})

test('un collaborateur ne dispose pas des formulaires de gestion des accès', async ({ page }) => {
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
  await page.getByLabel('Adresse e-mail', { exact: true }).fill('client@example.test')
  await page.getByLabel('Mot de passe', { exact: true }).fill('mot-de-passe-saisi')
  await page.getByRole('button', { name: 'Se connecter', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Impossible de terminer cette action.')
  await expect(page.getByLabel('Adresse e-mail', { exact: true })).toHaveValue(
    'client@example.test',
  )
  await expect(page.getByLabel('Mot de passe', { exact: true })).toHaveValue('mot-de-passe-saisi')
  await expect(page).toHaveURL(/connexion/)
})

test('invitation et récupération de mot de passe utilisent les jetons sans les garder dans l’URL', async ({
  page,
}) => {
  const calls = await installBff(page)
  await page.goto('/invitation?token=invitation-secret')
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
  await page.getByLabel('Adresse e-mail', { exact: true }).fill('client@example.test')
  await page.getByRole('button', { name: 'Recevoir un lien' }).click()
  await expect(page.getByRole('status')).toContainText('Si cette adresse est reconnue')
  await page.goto('/reinitialiser?token=reset-secret')
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

test('un compte existant accepte son invitation sans changer de mot de passe', async ({ page }) => {
  const calls = await installBff(page)
  await page.goto('/invitation?token=existing-account')
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
  await expect(page.getByRole('heading', { name: 'Connexion', exact: true })).toBeVisible()
  await page.goto('/reinitialiser')
  await expect(page.getByRole('button', { name: 'Enregistrer le mot de passe' })).toBeDisabled()
  await expect(page.getByText('Ce lien est incomplet.')).toBeVisible()
})
