# Exécuter les contrôles

> Choisir une commande, préparer son environnement et interpréter son résultat sans confondre tests applicatifs et tests des vérificateurs.

## Organisation des outils

Les [conventions Codebase Integrity](../codebase-integrity/README.md#organisation) définissent la répartition des responsabilités. Dans `codebase-integrity/`, chaque domaine porte ses scripts sous `domaines/<domaine>/scripts/`, leurs tests sous `tests/` et les paramètres déclaratifs dans `regles.yaml` lorsqu’ils existent. Les utilitaires communs résident dans `commun/`. Les tests des fonctionnalités Nuxt restent dans `webapp/`.

## Préparer et tester les vérificateurs

Depuis la racine, `make integrity-test` lance les tests des vérificateurs. Les dépendances des outils doivent être installées. Les commandes internes `check:*` du paquet webapp délèguent au paquet Codebase Integrity.

Depuis la racine du worktree :

- `make integrity-domains` affiche les conventions regroupées par domaine.
- `make conventions-docs-check` vérifie le registre, les demandes, la documentation et les README. Ses trois étapes sont expliquées et un rapport détaillé est conservé pour chacune. Cette commande ne lance pas les tests fonctionnels de l’application.
- `make conventions-check` exécute les conventions Nuxt dans l’image qualité déjà préparée, avec leurs limites de relecture humaine déclarées.
- `make integrity-test` exécute les tests Python, Vitest et Bun des vérificateurs depuis le dépôt, sans commande Bun à saisir.

Pour contrôler les traces des cartes avec une base explicite, suivre la [procédure de vérification du dev-book](verifier-traces-devbook.md). Les tests Python de ce contrôle sont inclus dans `make integrity-test` ; son exécution sur les cartes est distincte.

Pour vérifier une contribution Git, suivre la [procédure de contrôle des contributions](controle-contributions.md), qui définit la commande et l’amorçage initial.

Les [conventions documentaires](README.md#vérification-et-relecture) précisent le périmètre des README. Les commandes des environnements isolés sont décrites dans le [document des worktrees](worktrees.md).

Les [contrôles frontend AST](controle-conventions-frontend.md) expliquent les erreurs bloquantes, warnings et exemptions de structure, traduction et encapsulation.

## Choisir un contrôle

Chaque contrôle possède une commande Make explicite, sans paramètre de sélection. Le catalogue ci-dessous constitue l’interface manuelle. Le lanceur interne sélectionne les fichiers ; une sélection vide échoue. Les tests de composants concernent actuellement Dashboard : les deux sites sont refusés explicitement.

## Exécuter dans un conteneur jetable

Le fichier `infra/docker/docker-compose.quality.yml` fournit le service `verify`. Depuis la racine, définir `QUALITY_REPO_ROOT` avec le chemin absolu du dépôt du worktree et `QUALITY_GIT_COMMON_DIR` avec celui du répertoire Git commun, pour permettre la lecture de l’inventaire Git. Aucun secret `.env` n’est injecté.

Lancer ensuite :

```sh
docker compose --project-directory . --env-file /dev/null -f infra/docker/docker-compose.quality.yml --profile quality build verify
docker compose --project-directory . --env-file /dev/null -f infra/docker/docker-compose.quality.yml --profile quality run --pull never --no-deps --rm verify <famille> --target <cible>
```

Reconstruire les images après modification des sources. L’image contient les deux paquets et leurs dépendances verrouillées. Seuls les rapports `.tmp` sont montés en écriture ; les sources hôtes restent en lecture seule. Le socket Docker n’est pas monté. Les outils de charge et Lighthouse sont aussi installés dans l’image.

## Automatisation et limites

Le workflow AIDE exécute séparément `make integrity-test` (Python, Vitest et Bun), puis `make conventions-docs-check`. Les messages de la plage PR sont contrôlés par le vérificateur extrait de la base PR. Le contrôle de contribution local reste distinct ; la demande définitive de consolidation est créée lors de la reconstitution, pas pendant cette implémentation.

Les versions non livrées des commandes appartiennent au worktree où elles sont implémentées. Une exécution depuis une autre branche peut utiliser une version différente. Les cartes conservent les résultats réellement obtenus et le verdict humain.

## Commandes manuelles

Depuis la racine du worktree, lancer **`make checks-prepare`**. Une image existante est réutilisée ; aucune commande de contrôle ne reconstruit implicitement. Après modification des sources, dépendances ou outils, lancer **`make checks-rebuild`** : la fraîcheur de l’image n’est pas détectée automatiquement.

Ajouter `GD_TARGET=showcase-immobilier`, `GD_TARGET=client2-immobilier` ou `GD_TARGET=dashboard`. La première cible est utilisée par défaut. Aucun `.env` privé n’est injecté.

| Commande | Ce qui est vérifié | Limite ou prérequis |
| --- | --- | --- |
| `make test-unit` | Logique applicative, Vitest et Bun séparément | Dépendances externes simulées |
| `make test-integration` | Interactions entre modules et suites HTTP | Environnement isolé |
| `make test-components GD_TARGET=dashboard` | Formulaire pilote Nuxt | Dashboard uniquement |
| `make test-browser` | Parcours Playwright et accessibilité axe-core | `PLAYWRIGHT_BASE_URL` explicite, serveur déjà démarré |
| `make quality-lint-check` | ESLint, application et vérificateurs | Image préparée |
| `make quality-format-check` | Prettier, application et vérificateurs | Aucune correction automatique |
| `make quality-type-check` | Préparation Nuxt puis Vue TSC | Fichiers produits dans le conteneur |
| `make security-check` | Audit des deux lockfiles | Registre accessible ; high/critical bloquants |
| `make test-mutation` | Efficacité des tests avec Stryker | Module pilote ; score informatif |
| `make load-check` | Charge k6 | `QUALITY_BASE_URL` local explicite ; latences informatives |
| `make lighthouse-check PROFILE=desktop` | Audits Lighthouse et Chromium | Même origine explicite ; scores informatifs, profil mobile disponible |
| `make conventions-check` | Conventions Nuxt, responsabilités, types et SOLID | Warnings à relire ; aucune preuve de rendu |
| `make conventions-frontend-check` | Structure frontend AST | Exécution locale ; limites documentées |
| `make conventions-guards-check` | Gardes potentiellement redondantes | Relecture humaine nécessaire |
| `make conventions-services-check` | Indépendance des services | Analyse statique |
| `make conventions-architecture-check` | Imports des services avec dependency-cruiser | Imports Nuxt virtuels signalés séparément |
| `make conventions-contracts-check` | Reproductibilité des contrats locaux | Aucun contrôle du Symfony distant |
| `make conventions-docs-check` | Registre, demandes, documentation et README | Ne teste pas les fonctionnalités |
| `make conventions-devbook-check BASE=<SHA>` | Traces des cartes | Base Git explicite requise |
| `make integrity-test` | Tests Python, Vitest et Bun des vérificateurs | Exécution locale avec dépendances installées |

`make quality-check` enchaîne lint, formatage et types avec arrêt au premier échec. Plusieurs commandes explicites peuvent être données à un même appel Make. Les contrôles ne démarrent pas de serveur web ; les mesures et parcours exigent un serveur préparé séparément.

Les rapports résident dans `webapp/.tmp/quality/`, et ceux du navigateur dans `webapp/.tmp/playwright/`. Examiner les erreurs et le code de sortie avant les scores. Les budgets et références visuelles exigent un arbitrage humain. Le regroupement général et son bilan final restent en brouillon.

## Nommage des commandes

Toute **convention automatisée** utilise le préfixe **`conventions-`**. Les tests et outils tiers portent un nom direct décrivant leur action. L’interface manuelle ne demande aucun paramètre `FAMILY`. Les anciens noms restent uniquement des délégations de compatibilité, hors de l’aide et de la recette canonique. Les preuves historiques conservent les commandes réellement exécutées.
