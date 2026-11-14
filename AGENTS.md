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
- Avant toute écriture, vérifier le chemin absolu, la branche, l’index et `git status --porcelain=v1 --untracked-files=all` dans le worktree affecté.
- Une couche sale ou occupée bloque une nouvelle mission. Une reprise préserve ses changements identifiés ; un arbre propre ne prouve pas la disponibilité.
- Préserver le travail existant, les worktrees, les `.env` et les données. Aucun stash, `reset --hard`, force-push ou suppression de worktree pour résoudre une situation ; aucun rebase de branche partagée ou occupée sans coordination.

## Conventions de workflow

- Intégration : `develop` ; production : `master`. Aucune contribution de tâche sur ces branches.
- Les missions utilisent les branches et chemins définis dans `infra/config/layers.json`. Créer les worktrees uniquement sur affectation, selon les [commandes locales](worktree/README.md).
- Appliquer l’étape demandée avec le skill disponible de développement ou de consolidation, sans passage automatique à la suivante. Les procédures détaillées restent dans les skills.
- En développement, `implementer-demande` réalise toute la demande et crée un commit local distinct par tâche, sans validation intermédiaire. Les échanges entre sessions ou agents exigent un commit amont disponible. L’humain vérifie la demande entièrement développée via `verifier-arbitrer-demande`, qui trace les verdicts sans recréer les commits. Un commit technique ne vaut pas validation humaine. Les autorisations de consolidation restent propres à ses skills.
- La reconstitution réunit les commits validés dans le principal libre et propre, sur `demands/DEM-NNN` depuis `develop`, avec traçabilité des SHA. Aucun échange de travail non commité.
- Invoquer `livrer-demande` ou `livrer-consolidation` autorise les contrôles, fetch, push sans forcer, PR vers `develop`, Rebase and merge et suivi des seules couches libres prévus par ces skills. Une instruction limitée à la PR conserve cette limite. Aucun déploiement de production implicite.
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
- Isolation des environnements : [worktrees](worktree/README.md) ; Git seul n’isole pas les services et les données de l’API externe.
- Autres guides durables : [index documentaire](docs/index.md).
