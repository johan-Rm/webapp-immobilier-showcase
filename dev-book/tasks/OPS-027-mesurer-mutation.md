# OPS-027 — Mettre en place la mutation JavaScript ciblée

- Demande : DEM-011 ; type : consolidation.
- Session de création : 01a1d56d-446b-7931-bf53-7687a7d10912
- Date : 2026-11-14
- Couche : devops
- Branche : layers/devops
- Worktree : `/home/johan/www/graines-digitales/modern-web-apps/showcase-immobilier/worktree/devops`
- État : implémentée et commitée, à vérifier ; bilan global dans OPS-031.
- Base locale vérifiée : `ca571d60c39b8b5932d74cd43dcbe4131c47c578` ; aucun fetch.
- Dépendances : OPS-023, DOM-002 ; SHA à renseigner après validation des cartes amont, aucun SHA inventé.
- Référence de cadrage : `tmp/demande-consolidation-tests-conventions-nuxt.md`, relatif au principal, hors worktrees ; ne pas copier. Analyse et décisions : `tmp/analyse-tests-conventions-nuxt.md`.
- Chemins autorisés (en plus de cette carte) :

- `webapp/scripts/quality/stryker.config.mjs`
- `webapp/scripts/quality/mutation.ts`
- `webapp/scripts/quality/mutation.vitest.ts`
- `webapp/scripts/quality/vitest-mutation.config.ts`
- `codebase-integrity/README.md`

## Résultat et critères

Stryker/Vitest ciblé sur shared/saas/links.ts et ses tests directs ; sandbox jetable, pas de mutation des tests ni de génération/schema ni suites HTTP par mutant. Afficher mutants détectés/survivants/non couverts, temps et erreurs ; zéro mutant ou tests initiaux échoués ne sont pas une réussite. Score initial informatif, sans seuil zéro présenté comme protection ; seuil futur après revue humaine des survivants.

Exclusions communes : secrets et .env, données utilisateur, code Cap Nour/Kazen en écriture, production, DEM-010, nouvelles conventions non arbitrées. Préserver les rubriques et l’ordre des README. Un résultat inconnu ne vaut pas réussite.

## Réalisation et preuves

Au découpage initial, la réalisation attendait les commits amont. Ces dépendances sont désormais disponibles ; les preuves de réalisation figurent ci-dessous.

Depuis webapp/ : bun run verify -- mutation ; bun run test scripts/quality/mutation.vitest.ts. Prouver la détection d’une mutation connue dans une fixture isolée, puis produire rapport réel du module pur. Vérifier identité du code produit avant/après et fermeture des processus en interruption.

Les commandes nouvelles ci-dessus sont à créer, pas réputées disponibles aujourd’hui. Pour les essais humains : lire les chemins modifiés, indiquer préparation et répertoire, conserver sortie/code/rapport, reproduire les cas négatifs dans une fixture temporaire. Préserver la saisie et les données en cas d’erreur.

## Verdict humain

Aucun verdict d’implémentation. Le cadrage confirmé n’est pas une validation du code.

## Commits

Le workflow autorisé le 2026-11-15 permet un commit technique local par tâche terminée puis la poursuite des dépendances, avant vérification humaine globale. Les SHA réels sont consignés dans le récapitulatif du brouillon. Aucun push, PR ou fusion.

## Résultat mesuré

Dépendances disponibles : OPS-023 et DOM-002 intégrées par commits, sans copie de travail non commité. Stryker 10.1.1 et Vitest mesurent uniquement le module pur de liens dans un répertoire temporaire ; sources vérifiées identiques avant/après. Neuf tests du lanceur réussis, dont rapport vide/incomplet, erreur initiale et arrêt sur délai ; lint, formatage et TypeScript strict réussis. Score initial informatif, aucun budget adopté.

```json
{
  "detected": 47,
  "survived": 5,
  "uncovered": 0,
  "total": 52,
  "excluded": 0,
  "score": 90.38461538461539,
  "informativeScore": true,
  "durationMs": 13010,
  "sourceSha256": "49dd21b9e1b9371186246d752d9662d67f41298ea81c6b48910b908fe517550a"
}
```

Mutation connue détectée dans le rapport réel : `BlockStatement`, remplacement `{}`, statut Killed. Les cinq survivants restent à examiner humainement. Rapports JSON/HTML et détail des survivants : `webapp/.tmp/quality/mutation/`. Source conservée, répertoire temporaire supprimé, aucun processus de mesure laissé actif.
