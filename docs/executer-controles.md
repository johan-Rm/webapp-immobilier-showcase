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

Les [conventions documentaires](README.md#vérification-et-relecture) précisent le périmètre des README. Les commandes des environnements isolés sont décrites dans le [document des worktrees](../worktree/README.md).

Les [contrôles frontend AST](controle-conventions-frontend.md) expliquent les erreurs bloquantes, warnings et exemptions de structure, traduction et encapsulation.

## Choisir une famille de tests applicatifs

Depuis `webapp/`, lancer `bun run verify -- <famille> --target <cible>`. Les cibles reconnues sont `showcase-immobilier`, `client2-immobilier` et `dashboard`. Ajouter `--list` pour afficher la sélection de fichiers, les moteurs et les commandes, sans démarrer la suite ni afficher l’environnement privé.

Les familles reconnues sont `unit`, `integration`, `browser`, `conventions`, `components`, `security`, `architecture`, `mutation`, `load`, `lighthouse` et `contracts`. Une famille reconnue n’est pas nécessairement implémentée : une famille sans implémentation ou sans tests échoue explicitement.

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

Reconstruire les images après modification des sources. Le paquet Codebase Integrity n’est pas inclus dans cette image frontend : ses contrôles sont exécutés depuis leur paquet séparé.

## Automatisation et limites

Le workflow AIDE exécute les tests TypeScript et Bun des vérificateurs puis `make aide-check`. Il n’utilise ni variable d’amorçage ni contrôle distant de contribution. Le contrôle local de contribution reste distinct. Cette divergence avec le cadre AIDE est tracée dans [DEM-003](../dev-book/demand/DEM-003-isoler-sites-et-screens.md) ; les contrôles applicatifs restent actifs.

Les versions non livrées des commandes appartiennent au worktree où elles sont implémentées. Une exécution depuis une autre branche peut utiliser une version différente. Les cartes conservent les résultats réellement obtenus et le verdict humain.
