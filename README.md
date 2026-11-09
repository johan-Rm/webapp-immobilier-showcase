# Showcase Immobilier

Vitrine immobilière de démonstration pour Essaouira : Nuxt 4, Vue 3, TypeScript,
Nuxt UI et Bun, SSR et trois langues (`fr`, `en`, `es`).

Dépôt : [johan-Rm/showcase-immobilier-webapp](https://github.com/johan-Rm/showcase-immobilier-webapp).

## Organisation du dépôt

- `webapp/` : sources Nuxt, configurations, dépendances, tests et fixtures.
- `docs/` et `dev-book/` : documentation et suivi du projet.
- Racine : gouvernance, CI et infrastructure Docker/Make.

Les commandes `make` se lancent à la racine. Pour Bun :

```bash
cd webapp
bun install --frozen-lockfile
bun run dev
```

## Installation locale depuis zéro

Prérequis : Docker Compose et Make. Les schémas YAML sont inclus dans
`webapp/schemas/source/`. Le catalogue et les référentiels de démonstration sont versionnés
dans `webapp/fixtures/` ; les photos dans `webapp/public/images/` doivent être conservées
ou récupérées séparément, car ce dossier est ignoré par Git.

Depuis un checkout avec son `webapp/.env` local renseigné :

```bash
make dev-build-localhost
```

Préparer les données et contrats dans Docker :

```bash
docker compose --env-file webapp/.env -f docker-compose.dev.yml run --rm --no-deps webapp-localhost bun run setup:local
```

Puis démarrer le mode souhaité :

```bash
make dev-webapp-localhost
# Ou SSR derrière le vhost Nginx :
make dev-webapp-ssr BUILD=1
```

Développement : `http://localhost:3000/fr`. Vhost SSR :
`http://webapp.localhost:8080/fr` (également `/en` et `/es`).

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

Remplacer l'identité dans `webapp/app/app.config.ts`, les contenus dans `webapp/content/` et
les visuels dans `webapp/public/`. Configurer les connexions dans `webapp/.env` après avoir créé
les comptes et le projet backend appropriés. Les pages de mentions et de partenariats
décrivent une démonstration et doivent être adaptées au futur éditeur avant publication.

Procédure de migration : [setup local](docs/1.getting-started/setup-local.md).

Le catalogue Blueprint et ses photos sont conservés comme démonstration.
Le setup recopie `webapp/fixtures/catalog/` avec les localisations originales.
Les illustrations `webapp/public/demo/` restent disponibles en complément.
