# Setup local de Showcase Immobilier

Le code Nuxt et ses données locales sont regroupés dans `webapp/`.
Les commandes Docker et Make ci-dessous se lancent depuis la racine du dépôt.

## Repartir de zéro avec Docker Compose

Procédure locale vérifiée dans les Makefiles le 4 octobre 2026. Docker Compose
est le point d’entrée des services. Les commandes ci-dessous sont à exécuter
successivement, sans paralléliser les étapes de setup.

**Le reset backend supprime toute la BDD Symfony de développement et les volumes
Compose associés, pour tous les projets de cette instance.** Les photos originales,
les fichiers `.env` et les sources du projet sont conservés.

### 1. Arrêter et nettoyer le frontend

```bash
cd /home/johan/www/graines-digitales/modern-web-apps/showcase-immobilier

docker compose --project-directory . --env-file webapp/.env -f infra/docker/docker-compose.dev.yml --profile e2e down -v --remove-orphans

# Caches uniquement : ne pas supprimer public/images ni originals
rm -rf webapp/.nuxt webapp/.output webapp/.data
mkdir -p webapp/.data
```

Le frontend n’utilise pas de volume nommé pour ses données : `.data` est un dossier
local monté dans le conteneur. Le nettoyage explicite ci-dessus le réinitialise.

### 2. Recréer le backend et sa BDD

```bash
cd /home/johan/www/graines-digitales/api/symfony-8-api-platform

make dev-clean

test -f .env.local || cp .env.example .env.local

make dev-up-build
make dev-setup
make dev-status
```

`dev-setup` installe les dépendances Composer, prépare les clés JWT et joue les
migrations. L’API est accessible sur `http://localhost:18080`.

Le seed Showcase n’existe pas encore côté backend. Ne pas lancer l’ancien
bootstrap MLK pour cette démonstration : les biens sont préparés localement
par le setup frontend. L’import dans la nouvelle BDD et la régénération du stamp
restent à préparer.

### 3. Reconstruire et préparer le frontend

```bash
cd /home/johan/www/graines-digitales/modern-web-apps/showcase-immobilier

test -f webapp/.env || cp webapp/.env.example webapp/.env

make dev-build-localhost-no-cache

docker compose --project-directory . --env-file webapp/.env -f infra/docker/docker-compose.dev.yml run --rm --no-deps \
  webapp-localhost bun run setup:local

make dev-webapp-localhost
```

Le `webapp/.env` existant est conservé et monté en lecture seule dans le conteneur de
développement ; `env_file` seul transmet les variables sans monter le fichier.
Les fixtures versionnées sont également montées en lecture seule. Si le modèle vient d’être copié, remplacer la
valeur d’exemple `NUXT_SESSION_PASSWORD` par un secret aléatoire d’au moins
32 caractères avant de démarrer le serveur.

Ouvrir `http://localhost:3000/fr`, `/en` ou `/es`. La dernière commande reste
active et affiche les logs. Les biens, galeries et localisations du catalogue
sont préparés sans appel à l’API Symfony.

### 4. Vérifier dans un autre terminal

```bash
cd /home/johan/www/graines-digitales/modern-web-apps/showcase-immobilier

make quality-check
make dev-playwright BUILD=1
```

Les tests Playwright contrôlent les affichages desktop et mobile. Les rapports
sont rangés dans `webapp/.tmp/playwright/`. La commande Playwright peut arrêter le
conteneur frontend à la fin ; relancer `make dev-webapp-localhost` au besoin.

### 5. Arrêter après le test

```bash
cd /home/johan/www/graines-digitales/modern-web-apps/showcase-immobilier

docker compose --project-directory . --env-file webapp/.env -f infra/docker/docker-compose.dev.yml --profile e2e down

cd /home/johan/www/graines-digitales/api/symfony-8-api-platform
make dev-down
```

Ces commandes d’arrêt conservent les volumes et la BDD recréée.

## Données et contrats du setup

Les sources de contrats sont versionnées dans `webapp/schemas/source/webapp/` et
`webapp/schemas/source/dtos/symfony_api/`. Les biens fictifs viennent de
`webapp/fixtures/catalog/` (catalogue Blueprint de démonstration conservé).
Les photos originales sont restaurées dans `webapp/sites/showcase-immobilier/public/images/` et `webapp/sites/showcase-immobilier/public/poc/`.
Les illustrations SVG neutres restent disponibles dans `webapp/sites/showcase-immobilier/public/demo/`.

Le setup initialise `webapp/.env` uniquement s'il manque, avec un secret neuf.
Les référentiels et les localisations du catalogue sont conservés.
Le contenu généré est rangé dans `webapp/sites/showcase-immobilier/content/{locale}/metadata/` et
`webapp/sites/showcase-immobilier/content/{locale}/accommodations/`. Les contrats sont générés dans
`webapp/schemas/interfaces/` et `webapp/schemas/dtos/`.

Le setup est rejouable avec des données fictives. S'il détecte un bien sans marqueur
`dataSource: fixture` ou un référentiel non fictif, il s'arrête avant toute écriture.
Archiver explicitement les données concernées hors du projet avant de recommencer.
Il ne purge pas automatiquement les données réelles.

## Intégrations

Les variables `SYMFONY_*`, `RESEND_API_KEY`, `CONTACT_TO_EMAIL`,
`CONTACT_REPLY_TO_EMAIL`, `CONTACT_BCC_EMAILS` et les comptes autorisés sont vides
par défaut. Le formulaire retourne une erreur tant que l'envoi n'est pas configuré.

La documentation Scalar nécessite `SCALAR_API_DOCS_ENABLED=true`.
La source de schémas locale est utilisée par défaut ; `SCHEMAS_PATH` permet une
source externe explicite. Aucun checkout externe n'est requis.

## Migration locale du 3 octobre 2026

Les anciennes configurations `.env*`, images, données synchronisées et artefacts
ont été sauvegardés hors du dépôt ; les biens et photos de démonstration ont ensuite été restaurés :
`/tmp/showcase-migration-20261003/`. Elle peut contenir des secrets et ne constitue
pas une source du nouveau setup. `/tmp` est temporaire : conserver ailleurs une
copie privée si un retour en arrière est souhaité.

Le remote `origin` désigne le dépôt Showcase. L'historique local est conservé et
contient encore des versions antérieures. Aucun historique ni fichier n'a été
poussé vers GitHub lors du nettoyage. Pour publier un historique entièrement neuf,
créer un snapshot initial du contenu nettoyé plutôt que pousser les branches historiques.

## Validation

```bash
make quality-check
docker compose --project-directory . --env-file webapp/.env -f infra/docker/docker-compose.dev.yml run --rm --no-deps webapp-localhost bun run test
docker compose --project-directory . --env-file webapp/.env -f infra/docker/docker-compose.dev.yml run --rm --no-deps webapp-localhost bun run build
```

Contrôler les trois langues, une liste de biens, une fiche fictive, le contact,
les mentions et les partenariats. Le setup ne doit joindre aucune API externe.

Le contact affiché est `contact@showcase-immobilier.example`, une adresse de
démonstration sans envoi. Aucun ancien numéro n’est réutilisé. Le stamp transparent
`webapp/sites/showcase-immobilier/public/branding/showcase-stamp.svg` est prêt pour le backend.

## Stamp côté backend

Le backend Symfony 8 utilise `Project.watermarkPath` et lit les sources dans
`Project.mediaPath/originals/`. Pour ce checkout, le stamp PNG est accessible sous
`showcase-immobilier/public/branding/showcase-stamp.png`, relativement au répertoire
des webapps. La régénération doit repartir des originaux, sans superposition sur
les photos déjà marquées. La configuration du projet backend et la régénération
n'ont pas encore été exécutées ; les intégrations restent désactivées ici.

`webapp/sites/showcase-immobilier/public/images/` reste ignoré par Git : les photos restaurées sont disponibles
localement, mais un nouveau clone aura besoin de récupérer les médias du backend
ou d'une copie de ce dossier. `webapp/sites/showcase-immobilier/public/poc/` est versionné.

Les chemins ci-dessus concernent le client historique. Voir
[les layers clients](../2.architecture/14.site-layers.md) pour une autre cible.

## Deux sites SSR locaux

Après préparation de Showcase, `make dev-webapp-ssr BUILD=1` démarre les deux
services et Nginx. Les domaines, l’isolation des cibles et `make dev-check-ssr`
sont décrits dans [le guide des layers](../2.architecture/14.site-layers.md).
Client 2 ne nécessite pas le setup des données ou les identifiants Showcase.
