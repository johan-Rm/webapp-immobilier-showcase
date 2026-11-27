# Suite complète de contrôles avant livraison

Avant livraison, lancer cette suite complète pour Showcase Immobilier depuis
la racine du worktree de la demande, sur son SHA final vérifié. Relever le SHA
avec `git rev-parse HEAD` et conserver les résultats associés à cette révision.
Utiliser les deux terminaux dans le même worktree. Le port local 19856 doit être
libre ; cette recette utilise les fixtures et ne prouve pas le fonctionnement de
l’API distante.

Le catalogue et les rapports sont décrits dans le
[guide des contrôles](docs/controles/executer-controles.md).

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
# 1. Cadre et traçabilité : vérificateurs, dont la forme des chemins des nouvelles cartes
make internal-tests-verifiers
# Worktrees, correction du registre et clôture : dépôts temporaires, Docker simulé
python3 -B -m unittest discover -s infra/tests -p "test_demand_worktree.py"
python3 -B -m unittest discover -s infra/tests -p "test_demand_delivery.py"
python3 -B -m unittest discover -s infra/tests -p "test_demand_environment.py"
# Documentation : structure, liens et exclusion des copies de worktrees
make conventions-tests-docs
make conventions-tests-devbook BASE="$(git merge-base develop HEAD)"

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
```

Vérifier le bilan de chaque commande. L’audit des dépendances requiert l’accès
aux registres. Les rapports sont conservés sous `webapp/.tmp/quality/console/`.

## Analyse SonarQube Cloud facultative

Depuis la racine du dépôt, lancer séparément `make third-party-tests-sonar`.
Suivre le [guide SonarQube Cloud](docs/3.application/sonarqube-cloud.md#analyse-réelle)
pour les prérequis et la vérification du traitement distant.
