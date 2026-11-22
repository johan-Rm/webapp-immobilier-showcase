# OPS-086 — Déplacer les ressources design et adapter l’infrastructure

- Demande : DEM-022, [brouillon du principal](../../../../tmp/demande-design-racine.md) ; demande définitive prévue à la reconstitution.
- Type : développement ; session de création : `01a20294-5e96-7f03-8096-cd1653e7508b` ; date : 2026-11-22.
- Couche : devops ; branche : `layers/devops` ; worktree : `worktree/devops`.
- État : implémentée et commitée, à vérifier.
- Chemins autorisés : `resources/design/`, `design/`, les fichiers `infra/docker/` référençant ce dossier, `docs/2.architecture/14.site-layers.md`, `docs/4.design-system/2.themes-et-palettes.md`, les liens actifs concernés dans `dev-book/`, et cette carte. Le README racine est hors périmètre : interaction avec DEM-021 à résoudre à la réunion des contributions.
- Dépendances de réalisation : aucune ; contrôle d’ensemble après intégration du commit DASH-005.

## Résultat et critères

Déplacer les deux fichiers à l’identique vers `design/` ; supprimer `resources/` s’il est vide. Adapter les chemins hôte des Compose, le Dockerfile Playwright, les liens documentaires actifs et les autres références sous responsabilité DevOps. Conserver ou adapter de façon cohérente les chemins internes au conteneur en coordination avec DASH-005. Préserver les traces historiques, sans réécrire les décisions ou preuves. Ne pas modifier les conventions, contrôles, fichiers graphiques ni organiser les futurs mockups.

## Vérifications et preuves

Comparer les empreintes avant/après, rechercher les références actives obsolètes, vérifier les liens et les configurations Compose résolues sans exposer les secrets, et relire le diff. Après réunion avec DASH-005, prévoir les vérifications des builds et du dashboard ; builds et tests exigeant des services sont manuels, avec commandes, prérequis et résultats attendus à consigner. Les résultats non observés restent inconnus ; aucune validation humaine n’est présumée.

## Résultats d’implémentation

Les empreintes SHA-256 des deux fichiers déplacés correspondent aux contenus Git initiaux. La comparaison du brouillon documentaire avec les deux passages concernés et `git diff --check` réussissent ; `docker compose --project-directory . -f infra/docker/docker-compose.dev.yml -f infra/docker/docker-compose.dashboard.yml config --no-env-resolution --no-interpolate --quiet` réussit sans démarrer de services. Le brouillon documentaire versionné vise les deux guides indiqués et sera appliqué à la reconstitution. Les anciens liens dans docs restent donc provisoirement non résolus dans cette couche. Les builds et le fonctionnement du dashboard restent inconnus.

Contrôle manuel après réunion des tâches : depuis la racine du worktree, avec Docker Compose et `webapp/.env` configuré, lancer `make dev-build-dashboard-ssr`, puis `make dev-dashboard-ssr` et `make dev-check-dashboard-ssr` ; attendre un build réussi et les sondes HTTP réussies, puis vérifier visuellement le pictogramme dans le dashboard. Ces commandes exigent des services et n’ont pas été lancées par l’agent.
