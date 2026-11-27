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
- Un worktree de demande occupé ou portant du travail étranger bloque la mission. Une reprise préserve ses changements identifiés ; un arbre propre ne prouve pas la disponibilité.
- Préserver le travail existant, les worktrees, les `.env` et les données. Aucun stash, `reset --hard`, force-push ou suppression de worktree pour résoudre une situation ; aucun rebase de branche partagée ou occupée sans coordination.

## Conventions de workflow

- Intégration : `develop` ; production : `master`. Aucune contribution de tâche sur ces branches.
- Chaque demande utilise dès l’analyse un worktree et une branche dédiés depuis `develop` local vérifié. Les cartes restent typées par couche technique ; les anciens worktrees de couche sont préservés pendant la transition. Voir les [commandes locales](docs/1.getting-started/worktrees.md).
- Les fichiers `AGENTS.md` définissent des règles durables, applicables à toutes les demandes. Leur modification relève exclusivement d’une demande de consolidation.
- Appliquer l’étape demandée avec le skill disponible de développement ou de consolidation, sans passage automatique à la suivante. Les procédures détaillées restent dans les skills.
- `implementer-demande` crée un commit local par tâche avant vérification humaine de la demande. `implementer-consolidation` présente chaque changement et attend un verdict humain explicite avant son commit ; toute correction est présentée à nouveau. Les dépendances utilisent les commits validés de la branche de demande.
- Le journal et les cartes sont tenus dans le worktree de la demande. La reconstitution n’est plus une étape des nouvelles demandes ; les traces historiques restent inchangées.
- La livraison autorise les contrôles, fetch, push sans forcer et PR vers `develop`. L’humain exécute les tests CI/CD préalables, vérifie la PR et effectue le squash merge. Après preuve d’intégration et vérification de l’absence de travail inédit et d’activité, la clôture retire les seules ressources identifiées de la demande, son worktree et sa branche. Le `.env` de ce worktree peut être supprimé ; ceux des autres worktrees et du principal restent intacts. Les données locales non identifiées bloquent la clôture. Aucun déploiement de production implicite.
- Hors de ces autorisations, les opérations Git d’écriture nécessitent une demande explicite.

## Contrôles et fin du travail

- Appliquer les [conventions Codebase Integrity](codebase-integrity/README.md). Leur évolution et celle des contrôles passent par une consolidation déclarée.
- Toute modification des tests CI/CD de Showcase Immobilier doit mettre à jour [TEST.md](TEST.md) dans le même changement. La revue de PR vérifie que les commandes, leurs paramètres, les prérequis et les résultats attendus reflètent les tests modifiés.
- Exécuter les contrôles proportionnés au changement depuis le worktree affecté ; avant PR, vérifier la plage complète par rapport à la cible d’intégration vérifiée et lancer les contrôles qualité, conventions et tests adaptés.
- Présenter le résultat, les vérifications et leurs limites, avec documentation à jour et preuves dans la carte. Un résultat inconnu ne vaut pas réussite ; une implémentation ne vaut pas validation humaine.

## Demandes et cartes

- Indiquer le type de demande : `développement` ou `consolidation`. Suivre les [conventions et modèles du dev-book](dev-book/README.md).
- Réserver `DEM-*` aux demandes dans `dev-book/demand/` ; les cartes résident dans `dev-book/tasks/`.
- Consigner la session réelle de création, issue du contexte ou de `CODEX_THREAD_ID` / `CODEX_SESSION_ID`, jamais inventée. Une source absente ou contradictoire bloque la création. Une reprise conserve la session d’origine et ajoute la session intervenante.

## Références selon la tâche

- Produit, organisation du dépôt et démarrage : [README](README.md).
- Architecture et standards applicatifs : [index d’architecture](docs/2.architecture/index.md), notamment le [modèle de pages et screens](docs/2.architecture/3.page-layout-screen-model.md) avant toute modification de page.
- Isolation des environnements : [worktrees](docs/1.getting-started/worktrees.md) ; Git seul n’isole pas les services et les données de l’API externe.
- Autres guides durables : [index documentaire](docs/index.md).
