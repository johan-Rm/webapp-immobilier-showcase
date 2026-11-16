# Exécuter les contrôles

> Choisir une commande, préparer son environnement et interpréter son résultat sans confondre tests applicatifs et tests des vérificateurs.

## Organisation des outils

Les [conventions Codebase Integrity](../codebase-integrity/README.md#organisation) définissent la répartition des responsabilités. Dans `codebase-integrity/`, chaque domaine porte ses scripts sous `domaines/<domaine>/scripts/`, leurs tests sous `tests/` et les paramètres déclaratifs dans `regles.yaml` lorsqu’ils existent. Les utilitaires communs résident dans `commun/`. Les tests des fonctionnalités Nuxt restent dans `webapp/`.

## Préparer et tester les vérificateurs

Depuis `codebase-integrity/`, installer les dépendances avec `bun install --frozen-lockfile`, puis lancer `bun run test`. Les commandes `check:*` du paquet webapp délèguent au paquet Codebase Integrity.

Depuis la racine du worktree :

- `make integrity-domains` affiche les conventions regroupées par domaine.
- `make aide-check` vérifie le registre, les demandes, la documentation et les README, puis exécute les tests Python des vérificateurs. Ses quatre étapes sont expliquées et un rapport détaillé est conservé pour chacune. Cette commande ne lance pas les tests fonctionnels de l’application.
- `make quality-conventions-check` exécute les conventions Nuxt dans Docker, avec leurs limites de relecture humaine déclarées.

Pour contrôler les traces des cartes avec une base explicite, suivre la [procédure de vérification du dev-book](verifier-traces-devbook.md). Les tests Python de ce contrôle sont inclus dans aide-check ; son exécution sur les cartes est distincte.

Pour vérifier une contribution Git, suivre la [procédure de contrôle des contributions](controle-contributions.md), qui définit la commande et l’amorçage initial.

Les [conventions documentaires](README.md#vérification-et-relecture) précisent le périmètre des README. Les commandes des environnements isolés sont décrites dans le [document des worktrees](worktrees.md).

Les [contrôles frontend AST](controle-conventions-frontend.md) expliquent les erreurs bloquantes, warnings et exemptions de structure, traduction et encapsulation.

## Choisir une famille de tests applicatifs

Depuis `webapp/`, lancer `bun run verify -- <famille> --target <cible>`. Les cibles reconnues sont `showcase-immobilier`, `client2-immobilier` et `dashboard`. Ajouter `--list` pour afficher la sélection de fichiers, les moteurs et les commandes, sans démarrer la suite ni afficher l’environnement privé.

Les familles reconnues sont `unit`, `integration`, `browser`, `conventions`, `components`, `security`, `architecture`, `mutation`, `load`, `lighthouse` et `contracts`. Toutes ces familles sont installées. Le pilote `components` concerne actuellement Dashboard ; son absence sur les deux sites provoque un refus explicite. Une sélection vide échoue.

- `unit` route séparément les tests Bun du BFF et les tests Vitest.
- `integration` inclut notamment les suites HTTP et la préparation Nuxt.
- `components` sélectionne les tests `*.nuxt.vitest.ts` dans un environnement Nuxt isolé. Sans test dédié, cette famille échoue.
- `browser` exige une variable `PLAYWRIGHT_BASE_URL` explicite et un serveur de test déjà démarré. Le lanceur ne démarre ni pile utilisateur ni API distante.

Les commandes existantes restent utilisables, notamment `bun run quality:check` et `bun run test` depuis `webapp/`.

## Exécuter dans un conteneur jetable

Le fichier `infra/docker/docker-compose.quality.yml` fournit le service `verify`. Depuis la racine, définir `QUALITY_REPO_ROOT` avec le chemin absolu du dépôt du worktree et `QUALITY_GIT_COMMON_DIR` avec celui du répertoire Git commun, pour permettre la lecture de l’inventaire Git. Aucun secret `.env` n’est injecté.

Lancer ensuite :

```sh
docker compose --project-directory . -f infra/docker/docker-compose.quality.yml --profile quality run --build --rm verify <famille> --target <cible>
```

Reconstruire les images après modification des sources. L’image contient les deux paquets et leurs dépendances verrouillées. Seuls les rapports `.tmp` sont montés en écriture ; les sources hôtes restent en lecture seule. Le socket Docker n’est pas monté. Les outils de charge et Lighthouse sont aussi installés dans l’image.

## Automatisation et limites

Le workflow AIDE exécute les tests TypeScript et Bun des vérificateurs puis `make aide-check`. Les messages de la plage PR sont contrôlés par le vérificateur extrait de la base PR. Le contrôle de contribution local reste distinct ; la demande définitive de consolidation est créée lors de la reconstitution, pas pendant cette implémentation.

Les versions non livrées des commandes appartiennent au worktree où elles sont implémentées. Une exécution depuis une autre branche peut utiliser une version différente. Les cartes conservent les résultats réellement obtenus et le verdict humain.

## Catalogue complémentaire et recette manuelle

Depuis la racine du worktree, `make quality-verify FAMILY=contracts` reconstruit l’image et exécute la famille choisie. Ajouter `GD_TARGET=dashboard` ou `GD_TARGET=client2-immobilier` pour changer de cible ; `PROFILE=mobile` sélectionne le profil Lighthouse. Aucun `.env` privé n’est injecté.

Depuis `webapp/`, utiliser le même lanceur :

| Famille | Préparation et résultat attendu | Limite |
| --- | --- | --- |
| `unit`, `integration` | Dépendances installées ; suites Vitest et Bun non vides | Dépendances externes simulées |
| `components --target dashboard` | Préparation Nuxt ; interactions du formulaire pilote | Pilote limité à Dashboard |
| `conventions` | Paquet Codebase Integrity installé ; erreurs bloquantes | Warnings à relire, pas de preuve de rendu |
| `architecture` | Imports des services analysés par dependency-cruiser | Imports Nuxt virtuels signalés séparément |
| `security` | Accès au registre ; audit des deux lockfiles | Avis high/critical bloquants, pas de scan d’image Docker |
| `contracts` | Deux générations YAML locales identiques | Ne vérifie pas le contrat Symfony distant |
| `mutation` | Stryker et Vitest ; module de liens pur muté en répertoire isolé | Score informatif, module pilote seulement |
| `load` | `QUALITY_BASE_URL` explicite sur adresse de boucle locale ; k6 disponible dans Docker | Profil `QUALITY_LOAD_PROFILE=smoke` ou `measure`, latences informatives |
| `lighthouse` | Même origine explicite ; image `dem011-lighthouse:13.0.1` construite | Trois mesures par route/profil, scores informatifs |
| `browser` | Chromium installé ; `PLAYWRIGHT_BASE_URL` explicite | Références visuelles non approuvées : captures proposées uniquement |

Le serveur de fixtures se lance avec `GD_TARGET=dashboard QUALITY_FIXTURE_PORT=19856 bun --no-env-file scripts/quality/fixture-server.ts --ssr`, après un build SSR de cette cible. Il simule l’API amont, expose uniquement la boucle locale et supprime ses propres répertoires à l’arrêt. Adapter la cible et le port, puis arrêter ce processus après la vérification. Pour les parcours Client2, activer explicitement `QUALITY_BROWSER_FIXTURES=1` et `WEB005_E2E_FIXTURES=1`. Les médias simulés CI exigent `QUALITY_MEDIA_FIXTURES=1` : ils ne valident pas les images réelles.

Construire Lighthouse depuis la racine avec `docker build -f infra/docker/Dockerfile.lighthouse -t dem011-lighthouse:13.0.1 .`. En conteneur qualité, les exécutables natifs évitent un Docker imbriqué.

Les rapports résident dans `webapp/.tmp/quality/`, et ceux du navigateur dans `webapp/.tmp/playwright/`. Conserver le code de sortie et examiner les erreurs avant les scores. Un refus de prérequis ou une exécution absente ne vaut pas réussite. Les budgets et références visuelles demandent un arbitrage humain explicite.

La recette consiste à relire les changements, lancer les familles pertinentes sur chaque cible, examiner les rapports puis consigner le verdict humain dans la carte. Les preuves d’implémentation de cette consolidation sont rassemblées dans OPS-031 ; elles ne préremplissent pas ce verdict.
