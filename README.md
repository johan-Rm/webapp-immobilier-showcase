# Showcase Immobilier

Vitrine immobilière de démonstration pour Essaouira : Nuxt 4, Vue 3, TypeScript,
Nuxt UI et Bun, SSR et trois langues (`fr`, `en`, `es`).

L’interface privilégie une exploration calme et lisible, puis la prise de contact,
sans pression commerciale. Concevoir d’abord pour le mobile ; préserver les Core Web
Vitals, le rendu serveur et le SEO par une structure sémantique indexable et un sitemap.

Dépôt : [johan-Rm/showcase-immobilier-webapp](https://github.com/johan-Rm/showcase-immobilier-webapp).

## Organisation du dépôt

- `webapp/` : socle Nuxt, configurations, dépendances, tests et fixtures.
- `webapp/sites/<client>/` : layers clients, contenus, thèmes et médias.
- `docs/` et `dev-book/` : documentation et suivi du projet.
- `infra/docker/` : Dockerfiles et configurations Compose.
- `infra/nginx/` : configuration Nginx et certificats locaux.
- `infra/make/` : Makefiles secondaires ; le `Makefile` racine expose les commandes.
- Racine : gouvernance et configuration des outils ; les workflows CI restent dans `.github/workflows/`.

Les commandes `make` se lancent à la racine. Les appels directs à Compose utilisent
`--project-directory .` pour résoudre les chemins depuis cette racine et conserver
l’identité du projet. Docker lit `webapp/.dockerignore`, son contexte de build.

Pour Bun :

```bash
cd webapp
bun install --frozen-lockfile
bun run dev
```

## Installation locale depuis zéro

Prérequis : Docker Compose et Make. Les schémas YAML sont inclus dans
`webapp/schemas/source/`. Le catalogue et les référentiels de démonstration sont versionnés
dans `webapp/fixtures/` ; les photos dans `webapp/sites/showcase-immobilier/public/images/` doivent être conservées
ou récupérées séparément, car ce dossier est ignoré par Git.

Depuis un checkout avec son `webapp/.env` local renseigné :

```bash
make dev-build-localhost
```

Préparer les données et contrats dans Docker :

```bash
docker compose --project-directory . --env-file webapp/.env -f infra/docker/docker-compose.dev.yml run --rm --no-deps webapp-localhost bun run setup:local
```

Puis démarrer le mode souhaité :

```bash
make dev-webapp-localhost
# Ou SSR derrière le vhost Nginx :
make dev-webapp-ssr BUILD=1
```

Développement : `http://localhost:3000/fr`. Les [accès SSR par pile](docs/2.architecture/14.site-layers.md#construire-et-déployer)
servent Showcase et Client 2. Vérifier avec `make dev-check-ssr`.

Le setup conserve `webapp/.env`, recopie le catalogue local et génère les contrats.
Il refuse d'écraser du contenu sans marqueur de démonstration et ne contacte
aucune API. La synchronisation Symfony et l'envoi d'emails nécessitent leurs
identifiants respectifs. Les données `dataSource: fixture` sont visibles lorsque
`ACCOMMODATION_FIXTURES_ENABLED=true`.

## Vérifications

```bash
make quality-check
make dev-playwright BUILD=1
make dev-logs
```

Le projet Compose de développement est `showcase-immobilier-dev`. La procédure
complète de reset et la préparation de `webapp/.env` sont détaillées dans
[le guide local](docs/1.getting-started/setup-local.md).

## Configuration d'un futur projet

La sélection du client et la procédure d’ajout sont décrites dans
[le guide des layers](docs/2.architecture/14.site-layers.md). Sans `GD_TARGET`,
les commandes existantes servent Showcase Immobilier.

Remplacer l'identité dans `webapp/sites/showcase-immobilier/app/app.config.ts`, les contenus dans `webapp/sites/showcase-immobilier/content/` et
les visuels dans `webapp/sites/showcase-immobilier/public/`. Configurer les connexions dans `webapp/.env` après avoir créé
les comptes et le projet backend appropriés. Les pages de mentions et de partenariats
décrivent une démonstration et doivent être adaptées au futur éditeur avant publication.

Procédure de migration : [setup local](docs/1.getting-started/setup-local.md).

Le catalogue Blueprint et ses photos sont conservés comme démonstration.
Le setup recopie `webapp/fixtures/catalog/` avec les localisations originales.
Les illustrations `webapp/sites/showcase-immobilier/public/demo/` restent disponibles en complément.

Le développement assisté par IA suit les [règles du projet](AGENTS.md#conventions-de-workflow) et les skills AIDE.
Les conventions Nuxt et les commandes de développement restent inchangées.
