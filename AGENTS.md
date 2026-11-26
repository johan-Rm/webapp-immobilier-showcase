# Consignes des agents

## Réponses et documents

Rédiger des réponses et documents concis et précis, avec les décisions et preuves nécessaires.
Chaque information a une source de référence unique : vérifier l’existant et privilégier
un lien plutôt qu’une copie. Ne créer du contenu que s’il apporte une information distincte.

## Avant d’intervenir

- Respecter les instructions explicites de l’utilisateur ; ne déléguer que sur demande explicite.
- Références : cadre AIDE dans `/home/johan/www/lab/ai-development-engineering/` ; architecture layers dans `/home/johan/www/graines-digitales/modern-web-apps/nuxt-builder/`. Toute divergence doit être explicitement validée et tracée dans la demande concernée.
- Lire la demande, la carte et la [configuration des couches](infra/config/layers.json). Respecter worktree, branche, chemins autorisés et dépendances par commits.
- Lire les README de la racine au dossier concerné et les seuls standards utiles de l’[architecture](docs/2.architecture/index.md). Préserver les rubriques et leur ordre ; appliquer les [conventions documentaires](docs/README.md#conventions-techniques).
- Les README sont limités aux responsabilités et conventions durables, sans liens, chemins ni états temporaires ; appliquer la [règle documentaire locale](docs/README.md#contenu-des-readme) et son contrôle déterministe.
- Avant toute écriture, vérifier le chemin absolu, la branche, l’index et `git status --porcelain=v1 --untracked-files=all` dans le worktree affecté.
- Une couche sale ou occupée bloque une nouvelle mission. Une reprise préserve ses changements identifiés ; un arbre propre ne prouve pas la disponibilité.
- Préserver le travail existant, les worktrees, les `.env` et les données. Aucun stash, `reset --hard`, force-push ou suppression de worktree pour résoudre une situation ; aucun rebase de branche partagée ou occupée sans coordination.

## Conventions de workflow

- Intégration : `develop` ; production : `master`. Aucune contribution de tâche sur ces branches.
- Les missions utilisent les branches et chemins définis dans `infra/config/layers.json`. Créer les worktrees uniquement sur affectation, selon les [commandes locales](docs/worktrees.md).
- Les fichiers `AGENTS.md` définissent des règles durables, applicables à toutes les demandes. Leur modification relève exclusivement d’une demande de consolidation.
- Appliquer l’étape demandée avec le skill disponible de développement ou de consolidation, sans passage automatique à la suivante. Les procédures détaillées restent dans les skills.
- `implementer-demande` et `implementer-consolidation` réalisent toute la demande avec un commit local distinct par tâche terminée, sans validation humaine intermédiaire. Ils poursuivent les dépendances sur ces commits, intégrés localement dans les couches affectées, libres et propres par avance rapide ou cherry-pick ciblé. Aucun transfert de travail non commité. L’humain vérifie ensuite la demande complète via `verifier-arbitrer-demande` ou `verifier-arbitrer-consolidation`, qui tracent les verdicts sans recréer les commits de tâches. Un commit technique ne vaut pas validation humaine. Aucun push, PR ou fusion de livraison à ces étapes.
- L’ouverture d’une demande autorise la réservation locale de son identifiant et la création de son espace documentaire sur une base `develop` explicite. Chaque étape terminée autorise un commit documentaire local. Les couches conservent les cartes techniques et leurs commits. La reconstitution réunit les commits validés dans l’espace de la demande et trace leurs SHA. Les demandes historiques conservent leurs traces.
- Invoquer `livrer-demande` ou `livrer-consolidation` autorise les contrôles, fetch, push sans forcer, PR vers `develop` et suivi des seules couches libres. L’humain effectue le Squash and merge après satisfaction des protections. Avant publication, vérifier les collisions sur la cible et les nouvelles cartes. Après preuve de l’intégration, archiver localement la tête approuvée avant de libérer le seul espace de demande disponible et propre. Une instruction limitée à la PR conserve cette limite. Aucun déploiement de production implicite.
- Hors de ces autorisations, les opérations Git d’écriture nécessitent une demande explicite.

## Contrôles et fin du travail

- Appliquer les [conventions Codebase Integrity](codebase-integrity/README.md). Leur évolution et celle des contrôles passent par une consolidation déclarée.
- Exécuter les contrôles proportionnés au changement depuis le worktree affecté ; avant PR, vérifier la plage complète par rapport à la cible d’intégration vérifiée et lancer les contrôles qualité, conventions et tests adaptés.
- Présenter le résultat, les vérifications et leurs limites, avec documentation à jour et preuves dans la carte. Un résultat inconnu ne vaut pas réussite ; une implémentation ne vaut pas validation humaine.

## Demandes et cartes

- Indiquer le type de demande : `développement` ou `consolidation`. Suivre les [conventions et modèles du dev-book](dev-book/README.md).
- Réserver `DEM-*` aux demandes dans `dev-book/demand/` ; les cartes résident dans `dev-book/tasks/`.
- Consigner la session réelle de création, issue du contexte ou de `CODEX_THREAD_ID` / `CODEX_SESSION_ID`, jamais inventée. Une source absente ou contradictoire bloque la création. Une reprise conserve la session d’origine et ajoute la session intervenante.

## Références selon la tâche

- Produit, organisation du dépôt et démarrage : [README](README.md).
- Architecture et standards applicatifs : [index d’architecture](docs/2.architecture/index.md), notamment le [modèle de pages et screens](docs/2.architecture/3.page-layout-screen-model.md) avant toute modification de page.
- Isolation des environnements : [worktrees](docs/worktrees.md) ; Git seul n’isole pas les services et les données de l’API externe.
- Autres guides durables : [index documentaire](docs/index.md).
