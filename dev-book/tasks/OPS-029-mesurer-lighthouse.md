# OPS-029 — Réaliser les audits Lighthouse desktop et mobile prioritaires

- Demande : DEM-011 ; type : consolidation.
- Session de création : 01a1d56d-446b-7931-bf53-7687a7d10912
- Date : 2026-11-14
- Couche : devops
- Branche : layers/devops
- Worktree : `/home/johan/www/graines-digitales/modern-web-apps/showcase-immobilier/worktree/devops`
- État : prête à reprendre selon l’ordre des commits amont ; pas de verdict humain implicite.
- Base locale vérifiée : `ca571d60c39b8b5932d74cd43dcbe4131c47c578` ; aucun fetch.
- Dépendances : OPS-023, OPS-028, WEB-006, DASH-004 ; SHA à renseigner après validation des cartes amont, aucun SHA inventé.
- Référence de cadrage : `tmp/demande-consolidation-tests-conventions-nuxt.md`, relatif au principal, hors worktrees ; ne pas copier. Analyse et décisions : `tmp/analyse-tests-conventions-nuxt.md`.
- Chemins autorisés (en plus de cette carte) :

- `webapp/scripts/quality/lighthouse.ts`
- `webapp/scripts/quality/lighthouse.vitest.ts`
- `webapp/scripts/quality/lighthouse/profiles.json`
- `infra/docker/Dockerfile.lighthouse`
- `infra/docker/docker-compose.quality.yml`
- `codebase-integrity/README.md`

## Résultat et critères

Reprendre les enseignements des deux scripts Kazen, pas leurs pkill, versions npx flottantes, profils implicites ou suppression des rapports. Deux commandes desktop/mobile, Chrome et Lighthouse verrouillés, attente active, PID possédé et sortie isolée. Vérifier URL finale et contenu réellement audité ; cibler SSR Showcase, articles Client 2, connexion et page privée Dashboard sur session fictive. Trois mesures par route/profil, médiane, rapports JSON/HTML et métriques brutes ; pas de score terrain promis. Tester tous runtimeError et catégories requises absentes. Priorité humaine forte.

Exclusions communes : secrets et .env, données utilisateur, code Cap Nour/Kazen en écriture, production, DEM-010, nouvelles conventions non arbitrées. Préserver les rubriques et l’ordre des README. Un résultat inconnu ne vaut pas réussite.

## Réalisation et preuves

Aucune implémentation exécutée : les commits amont indiqués ne sont pas disponibles. Les arbitrages de reprise sont confirmés dans l’analyse ; ils ne remplacent pas ces dépendances.

Depuis webapp/ : bun run verify -- lighthouse --profile desktop ; bun run verify -- lighthouse --profile mobile ; bun run test scripts/quality/lighthouse.vitest.ts. Contre-exemples : JSON invalide, interstitiel, mauvaise page finale, audit absent et processus étranger. Puis deux profils réels sur builds SSR reconstruits, versions et URL finales consignées. Politique confirmée le 2026-11-15 : erreurs d’exécution bloquantes ; scores initiaux informatifs, budgets à choisir explicitement après examen des premières mesures (voir analyse).

Les commandes nouvelles ci-dessus sont à créer, pas réputées disponibles aujourd’hui. Pour les essais humains : lire les chemins modifiés, indiquer préparation et répertoire, conserver sortie/code/rapport, reproduire les cas négatifs dans une fixture temporaire. Préserver la saisie et les données en cas d’erreur.

## Verdict humain

Aucun verdict d’implémentation. Le cadrage confirmé n’est pas une validation du code.

## Commits

Le workflow autorisé le 2026-11-15 permet un commit technique local par tâche terminée puis la poursuite des dépendances, avant vérification humaine globale. Les SHA réels sont consignés dans le récapitulatif du brouillon. Aucun push, PR ou fusion.
