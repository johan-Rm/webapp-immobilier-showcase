# BFF-005 — Rendre explicites les suites Bun et intégration BFF

- Demande : DEM-011 ; type : consolidation.
- Session de création : 01a1d56d-446b-7931-bf53-7687a7d10912
- Date : 2026-11-14
- Couche : bff
- Branche : layers/bff
- Worktree : `/home/johan/www/graines-digitales/modern-web-apps/showcase-immobilier/worktree/bff`
- État : implémentée et commitée, à vérifier.
- Base locale vérifiée : `ca571d60c39b8b5932d74cd43dcbe4131c47c578` ; aucun fetch.
- Dépendances : aucune dépendance de code nouvelle ; base ci-dessus.
- Référence de cadrage : `tmp/demande-consolidation-tests-conventions-nuxt.md`, relatif au principal, hors worktrees ; ne pas copier. Analyse et décisions : `tmp/analyse-tests-conventions-nuxt.md`.
- Chemins autorisés (en plus de cette carte) :

- `webapp/server/README.md`
- `webapp/server/utils/auth/symfonyProjectMember.test.ts`
- `webapp/server/tests/saas-auth.vitest.ts`
- `webapp/server/tests/saas-editor.vitest.ts`
- `webapp/server/tests/saas-publication.vitest.ts`
- `webapp/server/tests/quality-boundaries.vitest.ts`

## Résultat et critères

Qualifer suites unitaires Bun et intégration H3, conserver autorisations, sessions, erreurs amont et conflits. Compléter seulement les manques démontrés nécessaires aux fixtures du socle, sans endpoint de test dans le produit ni écriture Symfony. Prouver que refus métier et panne technique ne sont pas confondus ; les fixtures servent ensuite aux mesures de BFF. Aucun changement d’API Symfony ou de contrat de session importé de Cap Nour.

Exclusions communes : secrets et .env, données utilisateur, code Cap Nour/Kazen en écriture, production, DEM-010, nouvelles conventions non arbitrées. Préserver les rubriques et l’ordre des README. Un résultat inconnu ne vaut pas réussite.

## Réalisation et preuves

Reprise du 2026-11-15, session de création conservée.

Ajout des tests de frontières réseau/erreurs et documentation des suites Bun et H3 ; aucun code de production modifié.

Vérifié : 11 tests de frontières (statuts, origines, authentification, redirection), 48 tests H3 SaaS existants et 7 tests Bun, tous réussis. Les appels distants sont simulés ; cela ne prouve pas le contrat réel du Symfony externe. Préparation Nuxt effectuée avec `.env.test`.

Recette depuis `worktree/bff/webapp/` : `GD_TARGET=showcase-immobilier node node_modules/vitest/vitest.mjs run server/tests/quality-boundaries.vitest.ts` ; `bun test server/utils/auth/symfonyProjectMember.test.ts`. Le premier test simule #site Dashboard ; la configuration historique Dashboard ne découvre pas encore ce nouveau fichier. Le raccordement commun attend OPS-023 commité.

Contenu présenté : inventaire des fichiers et empreintes dans `tmp/etat-implementation-tests-conventions-nuxt.json` du principal ; base inchangée indiquée ci-dessus. Sorties détaillées locales `/tmp/dem011-*`, non durables.

## Verdict humain

Aucun verdict d’implémentation. Le cadrage confirmé n’est pas une validation du code.

## Commits

Commit local de cette tâche créé à l’implémentation selon l’autorisation du 2026-11-15 ; SHA réel dans le récapitulatif du brouillon. Aucun verdict humain déduit de ce commit. Aucun push, PR ni fusion.

Reprise du workflow le 2026-11-15 : commits techniques autorisés avant vérification humaine globale ; cette carte préparée est rattachée à sa couche, sans duplication ni transfert de code applicatif non commité. Les états et consignes antérieurs décrivent l’ancien workflow.
