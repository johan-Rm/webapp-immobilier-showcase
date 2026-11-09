# OPS-001 — Installer le cadre et vérifier l’isolation des contributions

- Demande : DEM-001
- Session de création : 01a1bfae-52b8-7281-847e-041c81c25a52
- Couche : devops
- Branche : chore/regrouper-webapp
- Worktree : .
- État : validée par l’humain le 2026-11-09
- Chemins autorisés : ceux de la déclaration de consolidation DEM-001
- Dépendances : c365b4a6059c915ff639ffface5fa01c29fd6b3c

## Résultat et critères

Installer l’organisation approuvée, ses contrôles et l’isolation locale. Le principal
est exceptionnellement utilisé pour l’amorçage ; aucun worktree utilisateur n’est
créé avant une mission affectée. Les tests utilisent des dépôts jetables.

## Réalisation et preuves

- Gouvernance commune, quatre couches, modèles et guides adaptés aux conventions Nuxt.
- Créateur et contrôleurs de contribution adaptés du dépôt local AIDE analysé ;
  retrait des identités de sa démonstration et limitation documentaire explicite.
- Référence unique dans AGENTS ; CLAUDE renvoie vers elle. Aucun profil d’agent
  ou skill n’est installé implicitement. Configuration Codex sans permissions imposées.
- Correction du validateur de types : la fonction d’affichage `relative` masquait
  l’import Node utilisé par les frontières de répertoires ; alias distinct, règle inchangée.
- Tests applicatifs : 65 tests réussis, dont les deux régressions identifiées.
- Tests des outils : 107 tests réussis, dépôts temporaires sans remote.
- Documentation AIDE : liens et structure conformes dans la portée annoncée.
- `bun run quality:check` : ESLint, Prettier et TypeScript réussis.
- `make aide-check` : 107 tests d’outillage et contrôles documentaires/demandes réussis.
- Avant la migration des scripts : contribution sur snapshot Git jetable conforme,
  55 chemins déclarés hors demande et carte, sans commit dans le dépôt utilisateur.
- Deux piles Nuxt simultanées avec l’image dev locale existante : HTTP 200 sur
  `/fr` et `/api/project-config`, ports 19301 (Web) et 19302 (BFF). Les contenus
  de test renvoient respectivement `[fr]` et `[fr, en]`.
- Projets `showcase-immobilier-7c45bdb3-web` et `showcase-immobilier-7c45bdb3-bff`,
  réseaux distincts, montages de contenu/données propres à chaque worktree,
  sources de schémas en lecture seule. Marqueurs `.data` et cache Node distincts.
- Le premier essai a révélé que Docker créait `.data` en root lorsqu’il était absent.
  Le préparateur crée désormais les répertoires avec l’utilisateur hôte ; la preuve
  des deux piles passe après correction. Les services et le snapshot de succès
  ont été supprimés après le test. La pile utilisateur sur 3000 est conservée.
- Conventions applicatives : placement des types, absence d’imports framework,
  SOC, SOLID, gardes et logique des composants terminent avec succès ou avis de
  revue humaine. Trois familles restent bloquantes sur des fichiers applicatifs
  inchangés : images (3 violations), sections Vue (41), ternaires imbriqués (3).
  Les avertissements à revue humaine ne constituent pas une validation automatique.
- Ces écarts préexistants ne sont ni masqués ni corrigés dans cette installation.
  Ils empêchent de déclarer une PR entièrement verte et nécessitent consolidation.
- Aucun test ne prouve l’isolation d’écritures vers Symfony : aucune API réelle
  n’a été appelée par la preuve de runtime et aucun secret n’a été copié.

## Extension : domaines de conventions

- Référence examinée : guide AIDE « Conventions techniques et domaines ».
- Catalogue des 15 domaines et premier inventaire de 18 conventions/groupes
  existants dans `codebase-integrity/conventions.json`, sans copie de leurs règles.
- Un domaine unique par convention ; README source, points de contrôle, états,
  mode automatique ou revue humaine, et limites explicites.
- Trois points à implémenter : données prêtes pour les templates, encapsulation
  des modules externes et frontière métier des services. Les domaines vides
  restent explicitement non inventoriés ; aucun constat de conformité implicite.
- `make integrity-domains` affiche la vue centrale ; `make aide-check` vérifie
  les références et états. Ce contrôle ne lance pas tous les vérificateurs
  référencés et ne prouve pas que leurs règles passent.
- Huit tests supplémentaires vérifient les domaines inconnus/multiples,
  doublons, sources hors README, ancres absentes et états trompeurs.

## Extension : scripts et tests par domaine

- Demande humaine : regrouper aussi scripts et tests, sans README dans les
  sous-dossiers de Codebase Integrity. Le README racine reste la référence.
- Cinq dossiers de domaines renseignés : architecture/dépendances, qualité,
  interface/i18n, construction/livraison et fiabilité des vérifications.
- Les vérificateurs et tests de `webapp/scripts/ci/` sont déplacés ; les
  paramètres YAML suivent leur domaine. Les fonctionnalités et tests Nuxt
  restent dans `webapp/`. Le registre pointe vers les nouveaux chemins.
- Les utilitaires multi-domaines sont dans `commun/`. Le paquet outillage possède
  ses dépendances explicites, aux versions déjà utilisées, et son lockfile.
- Les commandes `check:*` historiques délèguent au nouveau paquet. Le lint et le
  formatage continuent à couvrir les contrôles ; leurs règles sont réutilisées
  depuis la configuration du projet sans duplication. Make et CI sont adaptés.
- Les 16 règles YAML ont été comparées à HEAD : contenu identique, sans
  affaiblissement. Les trois familles d’échecs historiques sont toujours détectées.
- Tests après migration : 108 tests Python, 4 tests Vitest des vérificateurs,
  40 tests Bun des vérificateurs et 61 tests applicatifs réussis. Les quatre
  tests retirés de la suite applicative ont rejoint leur domaine, sans perte.
- Déclaration actualisée : 104 chemins, suppressions et destinations comprises.
  Le contrôle de contribution sur le snapshot jetable final est conforme.
- Le contrôle de confiance extrait aussi son module commun depuis la base.
  Un test supplémentaire rejette l’influence d’un module homonyme dans un
  répertoire parent du dossier d’extraction.
- Le parcours Git est borné à `webapp/`, avec séparateur NUL. En Docker, le
  chemin Git réel est monté en lecture seule ; les caches et dépendances ne
  sont pas pris pour des sources non suivies dans une racine virtuelle.
- Smoke Docker : contrôles des types et imports framework réussis, sans
  redémarrage du service actif. Qualité complète (lint application et contrôles,
  formatage et TypeScript) réussie ; lint Docker également réussi.

## Ajustements de structure demandés

- Suppression de `docs/cadre-ia/` : procédures dans les skills, règles locales dans
  AGENTS, commandes techniques dans les README existants. Liens mis à jour.
- Workspace renommé `showcase-immobilier.code-workspace` ; workflow
  renommé `.github/workflows/ai-development-engineering.yml`, avec ses appelants.
- Dockerfiles et Compose dans `infra/docker/`, Nginx dans `infra/nginx/`, Makefiles
  secondaires dans `infra/make/`, dont `Makefile.ai-development-engineering`.
  Le Makefile racine conserve les commandes ; Compose utilise `--project-directory .`.
- Le contexte de build reste `webapp/`, avec son `.dockerignore`. La copie racine
  inutilisée est supprimée ; les certificats locaux restent ignorés à leur destination.
- Configurations Compose résolues comparées avant/après pour dev, preprod et prod :
  identiques hors chemins Dockerfile et Nginx. Préflights preprod/prod réussis avec
  des environnements temporaires ; aucun build, lancement ou déploiement effectué.
- `make aide-check` : registre, demandes, liens et 108 tests Python réussis après
  déplacement. Suppression de CLAUDE.md à la demande humaine, références adaptées.

## Révision des consignes des agents

- AGENTS suit la structure du projet de référence : consignes d’action, autorisations,
  contrôles, traçabilité et liens utiles, sans inventaire technique ni copie des skills.
- Les priorités produit rejoignent le README racine. Les consignes Nuxt UI, i18n,
  images et TypeScript restent dans leurs références techniques ; les invariants déjà
  documentés ne sont pas recopiés. Le lien de routage du README worktree est adapté.
- Les autorisations Git et l’exception d’installation sur la branche actuelle sont conservées.

## Verdict humain

Validation explicite le 2026-11-09 : « parfait tu peux tout commiter et fusionner sur develop ». Le commit global de OPS-001 et la fusion locale sont autorisés. Les trois familles d’écarts de conventions préexistants restent signalées et inchangées.

## Commits et livraison

Contrôles finaux : 108 tests Python, 4 tests Vitest et 40 tests Bun des vérificateurs,
61 tests applicatifs réussis ; lint, formatage et TypeScript réussis. Les contrôles de
conventions retrouvent les écarts préexistants documentés ci-dessus.

Intégration locale demandée dans develop, par avance rapide depuis la branche
chore/regrouper-webapp. Aucun fetch/push, PR ou déploiement n’est demandé.
L’exception temporaire d’installation dans AGENTS est levée avec cette validation.

Commit d’implémentation : `55c384120e161cf5a0f1fec43227ac9bb24a158c`.
Le contrôle de contribution sur la plage depuis la base déclarée est conforme :
un commit, déclaration complète et amorçage par le SHA du contenu validé.
