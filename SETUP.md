# Installer Showcase Immobilier après le clone

Depuis la racine du dépôt cloné, disposer de Make et de Docker avec le plugin
Compose. Démarrer Docker et vérifier l’accès au moteur et à Compose.

```bash
docker info --format '{{.ServerVersion}}'
docker compose version
make dev-env
```

`make dev-env` crée `webapp/.env` à partir du modèle si le fichier manque.
Dans un fichier fraîchement créé, remplacer la valeur d’exemple de
`NUXT_SESSION_PASSWORD` par un secret aléatoire d’au moins 32 caractères.

## Préparer les données de démonstration et démarrer

```bash
make dev-build-localhost
docker compose --project-directory . --env-file webapp/.env -f infra/docker/docker-compose.dev.yml run --rm --no-deps webapp-localhost bun run setup:local
make dev-webapp-localhost
```

Ouvrir [http://localhost:3000/fr](http://localhost:3000/fr). Le catalogue de
démonstration utilise les données locales. Les photos originales ignorées par
Git se récupèrent séparément selon le [guide d’installation locale](docs/1.getting-started/setup-local.md#stamp-côté-backend).

Pour arrêter le serveur au premier plan, utiliser `Ctrl+C`. Pour lancer les
contrôles depuis le dépôt principal, suivre [TEST.md](TEST.md).
