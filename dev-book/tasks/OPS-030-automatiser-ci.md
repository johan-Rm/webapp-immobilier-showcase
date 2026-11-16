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
