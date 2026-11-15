# OPS-030 — Automatiser les contrôles sur les trois cibles

- Demande : DEM-011 ; type : consolidation.
- Session de création : 01a1d56d-446b-7931-bf53-7687a7d10912
- Date : 2026-11-14
- Couche : devops
- Branche : layers/devops
- Worktree : `/home/johan/www/graines-digitales/modern-web-apps/showcase-immobilier/worktree/devops`
- État : prête à reprendre selon l’ordre des commits amont ; pas de verdict humain implicite.
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

Aucune implémentation exécutée : les commits amont indiqués ne sont pas disponibles. Les arbitrages de reprise sont confirmés dans l’analyse ; ils ne remplacent pas ces dépendances.

Depuis webapp/ : bun run test scripts/quality/ci-plan.vitest.ts ; examiner la matrice et les scripts invoqués. Tests de planification : chaque cible et famille attendue est présente, changement Dashboard pris en charge, erreur transport audit bloquante, suites informatives conservant leur rapport. L’exécution GitHub réelle appartient à la livraison ; ne pas la déclarer réussie sur lecture YAML.

Les commandes nouvelles ci-dessus sont à créer, pas réputées disponibles aujourd’hui. Pour les essais humains : lire les chemins modifiés, indiquer préparation et répertoire, conserver sortie/code/rapport, reproduire les cas négatifs dans une fixture temporaire. Préserver la saisie et les données en cas d’erreur.

## Verdict humain

Aucun verdict d’implémentation. Le cadrage confirmé n’est pas une validation du code.

## Commits

Le workflow autorisé le 2026-11-15 permet un commit technique local par tâche terminée puis la poursuite des dépendances, avant vérification humaine globale. Les SHA réels sont consignés dans le récapitulatif du brouillon. Aucun push, PR ou fusion.
