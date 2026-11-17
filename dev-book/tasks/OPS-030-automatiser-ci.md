# OPS-030 — Automatiser les contrôles sur les trois cibles

- Demande : DEM-011 ; type : consolidation.
- Session de création : 01a1d56d-446b-7931-bf53-7687a7d10912
- Date : 2026-11-14
- Couche : devops
- Branche : layers/devops
- Worktree : `/home/johan/www/graines-digitales/modern-web-apps/showcase-immobilier/worktree/devops`
- État : implémentée et commitée, à vérifier ; bilan global dans OPS-031.
- Base locale vérifiée : `ca571d60c39b8b5932d74cd43dcbe4131c47c578` ; aucun fetch.
- Dépendances : OPS-024, OPS-025, OPS-026, OPS-027, OPS-028, OPS-029, BFF-005, DOM-002 ; SHA à renseigner après validation des cartes amont, aucun SHA inventé.
- Référence de cadrage : `tmp/demande-consolidation-tests-conventions-nuxt.md`, relatif au principal, hors worktrees ; ne pas copier. Analyse et décisions : `tmp/analyse-tests-conventions-nuxt.md`.
- Chemins autorisés (en plus de cette carte) :

- `.github/workflows/quality.yml`
- `.github/workflows/conventions.yml`
- `.github/workflows/ai-development-engineering.yml`
- `.github/workflows/quality-extended.yml`
- `infra/docker/docker-compose.quality.yml`
- `webapp/scripts/quality/ci-plan.vitest.ts`
- `codebase-integrity/README.md`

## Résultat et critères

Parité local/CI, installations verrouillées, matrice Showcase/Client2/Dashboard. PR : types, lint/format, suites Node/Bun, conventions bloquantes confirmées, dependency-cruiser, scanner, builds SSR et smoke navigateur sur fixtures. Inclure guards et valider réellement les messages de la plage PR via vérificateur de la base ; ne pas exécuter le candidat comme autorité de contribution. Ne pas réactiver Sonar ni modifier les protections distantes. Workflow à la demande pour mutation/charge ; Lighthouse selon politique arbitrée. Joindre rapports et versions, distinguer refus, échec et étape non lancée ; pas de secret de production.

Exclusions communes : secrets et .env, données utilisateur, code Cap Nour/Kazen en écriture, production, DEM-010, nouvelles conventions non arbitrées. Préserver les rubriques et l’ordre des README. Un résultat inconnu ne vaut pas réussite.

## Réalisation et preuves

Les workflows couvrent les trois cibles et conservent les rapports même en échec. Les mesures longues restent manuelles. Le contrôle des messages utilise le vérificateur de la base PR. Aucune exécution GitHub n’a été effectuée à cette étape.

L’image qualité contient les deux paquets, Chromium, Lighthouse et k6 verrouillés. Son contexte exclut les secrets, dépendances locales et sorties de build. Les ajustements compagnons nécessaires concernent `.dockerignore`, `Dockerfile.playwright`, `Makefile.dev`, le lanceur et ses tests, le serveur de fixtures, le pilote de charge et la configuration Playwright. Le serveur de fixtures utilise une API fictive et des répertoires temporaires possédés ; l’image du héros CI est une simulation explicitement activée, jamais une preuve des médias réels.

Vérifications locales : 58 tests ciblés de qualité et vérification TypeScript réussis. `make quality-verify FAMILY=contracts` a construit l’image et comparé réellement 28 artefacts identiques. Les erreurs de sécurité restent bloquantes ; les avis existants ne sont pas exemptés. Les contrôles globaux et la recette sont consolidés dans OPS-031.

## Verdict humain

Aucun verdict d’implémentation. Le cadrage confirmé n’est pas une validation du code.

## Commits

Le workflow autorisé le 2026-11-15 permet un commit technique local par tâche terminée puis la poursuite des dépendances, avant vérification humaine globale. Les SHA réels sont consignés dans le récapitulatif du brouillon. Aucun push, PR ou fusion.

### Droits de l’image qualité

Les sources reçoivent leur propriétaire pendant la copie ; seules les racines et les caches nécessaires sont ajustés ensuite. Les dépendances installées restent lisibles sans parcours récursif coûteux. La reconstruction corrigée et les 28 contrats ont été réellement vérifiés dans l’image finale.

### Correction demandée le 2026-11-17 — réutiliser l’image

L’humain demande immédiatement dans DEM-011 de séparer préparation et exécution. `make quality-prepare` construit explicitement l’image une fois ; `quality-verify` vérifie sa présence locale puis la réutilise avec `--pull never --no-deps`, sans reconstruction ni téléchargement implicite, y compris si elle manque. Les sorties expliquent les deux étapes et rappellent de préparer à nouveau après une modification des sources. La fraîcheur n’est pas contrôlée automatiquement. Ce correctif ne met pas en œuvre le chantier plus large de présentation et de reporting, conservé en brouillon.

Chemins compagnons : `Makefile` (aide), `infra/make/Makefile.dev`, `webapp/scripts/quality/ci-plan.vitest.ts` et le catalogue `docs/executer-controles.md`. Neuf tests ciblés réussis, lint et formatage ciblés conformes, documentation et 24 README conformes. Construction explicite réelle réussie ; deux exécutions de contrats réussies ensuite, sans build. Le refus d’une image absente a été reproduit avec un nom de projet Compose isolé, sans créer d’image ni de conteneur. Aucun nouveau verdict humain.

### Correction demandée le 2026-11-17 — interface Make commune

L’humain exige une recette sans appels directs à Bun. Les contrôles lint, formatage, types, gardes et services utilisent désormais le lanceur qualité et l’image préparée, avec descriptions pédagogiques et codes d’échec préservés. Les raccourcis Make existants de contrôle sont raccordés à ce lanceur ; `integrity-test` délègue aux trois moteurs des vérificateurs. Les commandes de correction automatique ne font pas partie de cette recette. Le bilan groupé reste en brouillon.

Chemins compagnons : lanceur et ses tests, tests du plan Make, Makefile racine et Dev, catalogue documentaire. Vérifications : 38 tests ciblés réussis ; `make integrity-test` réussit avec 154 Python, 66 Vitest et 44 Bun. Les cinq raccourcis lint, formatage, types, gardes et services réussissent réellement sur Showcase dans l’image préparée, sans reconstruction ni démarrage web. Documentation, 24 README et traces conformes. Aucun verdict humain implicite.

### Préparation réutilisable demandée le 2026-11-17

L’humain demande de pouvoir rejouer la recette entière en ignorant le build déjà réalisé. `quality-prepare` construit seulement si l’image manque ; une image présente produit un message explicite de réutilisation. `quality-rebuild` reconstruit volontairement après modification des sources ou dépendances. La présence de l’image n’est pas une preuve de fraîcheur : ce dernier choix reste explicite. Les contrôles conservent leur refus d’image absente et ne reconstruisent pas implicitement. Quarante tests ciblés réussis, dont image absente, deux préparations avec un seul build, réutilisation et reconstruction explicite. Deux appels réels successifs à `quality-prepare` ont tous deux ignoré le build de l’image présente. Lint ciblé, documentation et 24 README conformes.

### Nommage confirmé le 2026-11-17

L’humain demande d’appliquer immédiatement les noms discutés : `check FAMILY=…`, `checks-prepare`, `checks-rebuild`, `conventions-check`, `conventions-guards-check` et `conventions-services-check`. Les raccourcis de qualité du code restent distincts. L’aide, les références actives et les recettes utilisent ces noms. Les anciens noms délèguent aux mêmes contrôles pour préserver les recettes existantes ; aucune règle, sévérité ni famille n’est modifiée. Les traces historiques conservent les commandes réellement exécutées. 46 tests ciblés réussis ; compatibilité des six anciens noms vérifiée. Les nouveaux noms sont exécutés réellement : préparation répétée sans build, contrats réussis, gardes et services réussis ; `conventions-check` conserve les quatre écarts SOLID bloquants. L’architecture est vérifiée après son correctif isolé OPS-026. Lint ciblé, documentation, 24 README et traces conformes.

### Commandes explicites demandées le 2026-11-17

L’humain remplace le choix public par `FAMILY` par des commandes directes. Toutes les conventions automatisées portent désormais le préfixe `conventions-`, y compris frontend, documentation, traces, architecture et contrats. Le catalogue de référence reste `docs/executer-controles.md` ; les anciennes entrées délèguent uniquement pour compatibilité. Aucun changement de sélection, de sévérité ou de construction implicite.

Vérifications : 57 tests ciblés réussis, dont les seize routages sans paramètre et plusieurs commandes dans un même appel Make ; lint ciblé, documentation et 24 README conformes. Les traces des cartes restent conformes. Exécution réelle des deux commandes explicites : 28 contrats identiques ; architecture sans violation, avec deux imports virtuels signalés. Image réutilisée sans build. Aucun nouveau verdict humain.
