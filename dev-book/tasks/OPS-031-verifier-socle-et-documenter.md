# OPS-031 — Vérifier le socle complet et préparer la recette humaine

- Demande : DEM-011 ; type : consolidation.
- Session de création : 01a1d56d-446b-7931-bf53-7687a7d10912
- Date : 2026-11-14
- Couche : devops
- Branche : layers/devops
- Worktree : `/home/johan/www/graines-digitales/modern-web-apps/showcase-immobilier/worktree/devops`
- État : prête à reprendre selon l’ordre des commits amont ; pas de verdict humain implicite.
- Base locale vérifiée : `ca571d60c39b8b5932d74cd43dcbe4131c47c578` ; aucun fetch.
- Dépendances : OPS-030, WEB-006, DASH-004, DOM-002, BFF-005 ; SHA à renseigner après validation des cartes amont, aucun SHA inventé.
- Référence de cadrage : `tmp/demande-consolidation-tests-conventions-nuxt.md`, relatif au principal, hors worktrees ; ne pas copier. Analyse et décisions : `tmp/analyse-tests-conventions-nuxt.md`.
- Chemins autorisés (en plus de cette carte) :

- `docs/3.application/ci-conventions-validation.md`
- `docs/2.architecture/3.page-layout-screen-model.md`
- `codebase-integrity/README.md`
- `webapp/scripts/quality/contracts.ts`
- `webapp/scripts/quality/contracts.vitest.ts`
- `webapp/scripts/quality/manifest.vitest.ts`

## Résultat et critères

Publier un catalogue unique des commandes dans les rubriques README existantes, avec familles, cibles, déclencheurs, prérequis et limites ; les cartes renvoient à cette référence. Vérifier génération déterministe des contrats YAML dans deux répertoires temporaires et entrées invalides, sans git diff sur artefacts ignorés ni téléchargement Symfony implicite. Réconcilier la déclaration de contribution avec chaque chemin final. Préparer une recette de relecture et exécution manuelles ; distinguer résultats techniques et verdict humain, préserver DEM-010, aucun déploiement. Rassembler les commits amont seulement selon l’étape autorisée ; aucun transfert de fichiers non commité.

Exclusions communes : secrets et .env, données utilisateur, code Cap Nour/Kazen en écriture, production, DEM-010, nouvelles conventions non arbitrées. Préserver les rubriques et l’ordre des README. Un résultat inconnu ne vaut pas réussite.

## Réalisation et preuves

Aucune implémentation exécutée : les commits amont indiqués ne sont pas disponibles. Les arbitrages de reprise sont confirmés dans l’analyse ; ils ne remplacent pas ces dépendances.

Depuis webapp/ : bun run verify -- contracts ; bun run test scripts/quality/contracts.vitest.ts scripts/quality/manifest.vitest.ts ; lancer chacune des familles documentées sur les cibles pertinentes et conserver codes/rapports. Depuis racine : make aide-check, make quality-conventions-check et contrôles de contribution sur la plage explicitement vérifiée. Tableau recette : commande, résultat attendu, résultat réel, limite, verdict humain non prérempli. Les références visuelles et budgets non approuvés restent indiqués comme tels.

Les commandes nouvelles ci-dessus sont à créer, pas réputées disponibles aujourd’hui. Pour les essais humains : lire les chemins modifiés, indiquer préparation et répertoire, conserver sortie/code/rapport, reproduire les cas négatifs dans une fixture temporaire. Préserver la saisie et les données en cas d’erreur.

## Verdict humain

Aucun verdict d’implémentation. Le cadrage confirmé n’est pas une validation du code.

## Commits

Le workflow autorisé le 2026-11-15 permet un commit technique local par tâche terminée puis la poursuite des dépendances, avant vérification humaine globale. Les SHA réels sont consignés dans le récapitulatif du brouillon. Aucun push, PR ou fusion.
