# Suite complète de contrôles à la reconstitution

À l’étape de reconstitution AIDE, lancer cette suite complète pour Showcase
Immobilier après avoir réuni les commits validés sur la branche de demande
`demands/DEM-NNN`. Lancer les commandes depuis la racine du dépôt dans les
deux terminaux.

Le catalogue et les rapports sont décrits dans le
[guide des contrôles](docs/executer-controles.md).

## Terminal 1 — Démarrer l’environnement de test

Prérequis sur l’hôte : Git, Make, Python 3 et Docker avec le plugin Compose.
Si les sources, les dépendances ou les outils ont changé depuis la construction
de l’image, lancer `make checks-rebuild` avant le démarrage.

```bash
make test-up
```

Attendre « Environnement de test prêt » puis laisser le terminal ouvert.

## Terminal 2 — Lancer la suite complète

Depuis la même racine, coller le bloc suivant. À la fin, arrêter les fixtures
avec `Ctrl+C` dans le premier terminal.

```bash
# 1. Cadre et traçabilité
make internal-tests-verifiers
make conventions-tests-docs
make conventions-tests-devbook

# 2. Outils tiers
make third-party-tests-lint GD_TARGET=showcase-immobilier
make third-party-tests-format GD_TARGET=showcase-immobilier
make third-party-tests-types GD_TARGET=showcase-immobilier
make third-party-tests-security GD_TARGET=showcase-immobilier

# 3. Conventions du projet
make conventions-tests-frontend GD_TARGET=showcase-immobilier
make conventions-tests-types-placement GD_TARGET=showcase-immobilier
make conventions-tests-images GD_TARGET=showcase-immobilier
make conventions-tests-business-logic GD_TARGET=showcase-immobilier
make conventions-tests-script-setup GD_TARGET=showcase-immobilier
make conventions-tests-responsibilities GD_TARGET=showcase-immobilier
make conventions-tests-code-quality GD_TARGET=showcase-immobilier
make conventions-tests-solid GD_TARGET=showcase-immobilier
make conventions-tests-guards GD_TARGET=showcase-immobilier
make conventions-tests-services GD_TARGET=showcase-immobilier
make conventions-tests-architecture GD_TARGET=showcase-immobilier
make conventions-tests-contracts GD_TARGET=showcase-immobilier
make conventions-tests-functions GD_TARGET=showcase-immobilier
make conventions-tests-duplicates GD_TARGET=showcase-immobilier

# 4. Tests internes
make internal-tests-unit GD_TARGET=showcase-immobilier
make internal-tests-integration GD_TARGET=showcase-immobilier
make internal-tests-mutation GD_TARGET=showcase-immobilier
make internal-tests-coverage GD_TARGET=showcase-immobilier
# Suspendu — make internal-tests-mutation-extended GD_TARGET=showcase-immobilier

# 5. Tests runtime
make runtime-tests-browser GD_TARGET=showcase-immobilier WEBAPP_BASE_URL=http://127.0.0.1:19856
make runtime-tests-load GD_TARGET=showcase-immobilier WEBAPP_BASE_URL=http://127.0.0.1:19856
make runtime-tests-lighthouse GD_TARGET=showcase-immobilier WEBAPP_BASE_URL=http://127.0.0.1:19856 PROFILE=desktop
make runtime-tests-lighthouse GD_TARGET=showcase-immobilier WEBAPP_BASE_URL=http://127.0.0.1:19856 PROFILE=mobile

# 6. SonarQube — cible Make illustrative
# make sonarqube-tests GD_TARGET=showcase-immobilier
```

Vérifier le bilan de chaque commande. L’audit des dépendances requiert l’accès
aux registres. Les rapports sont conservés sous `webapp/.tmp/quality/console/`.

Mettre à jour ce parcours dans le même changement que toute évolution des
commandes Showcase, de leurs paramètres ou de leurs prérequis.
