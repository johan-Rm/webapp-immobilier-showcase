# OPS-024 — Contrôler les conventions adaptées avec limites explicites

- Demande : DEM-011 ; type : consolidation.
- Session de création : 01a1d56d-446b-7931-bf53-7687a7d10912
- Date : 2026-11-14
- Couche : devops
- Branche : layers/devops
- Worktree : `/home/johan/www/graines-digitales/modern-web-apps/showcase-immobilier/worktree/devops`
- État : prête à reprendre selon l’ordre des commits amont ; pas de verdict humain implicite.
- Base locale vérifiée : `ca571d60c39b8b5932d74cd43dcbe4131c47c578` ; aucun fetch.
- Dépendances : WEB-006, DASH-004 ; SHA à renseigner après validation des cartes amont, aucun SHA inventé.
- Référence de cadrage : `tmp/demande-consolidation-tests-conventions-nuxt.md`, relatif au principal, hors worktrees ; ne pas copier. Analyse et décisions : `tmp/analyse-tests-conventions-nuxt.md`.
- Chemins autorisés (en plus de cette carte) :

- `codebase-integrity/domaines/interface-internationalisation/regles.yaml`
- `codebase-integrity/domaines/interface-internationalisation/scripts/verify-ui-structure.ts`
- `codebase-integrity/domaines/interface-internationalisation/tests/verify-ui-structure.vitest.ts`
- `codebase-integrity/domaines/qualite-code/regles.yaml`
- `codebase-integrity/domaines/qualite-code/scripts/verify-code-quality.ts`
- `codebase-integrity/conventions.json`
- `codebase-integrity/package.json`
- `codebase-integrity/bun.lock`
- `codebase-integrity/README.md`

## Résultat et critères

Arbitrage de reprise confirmé le 2026-11-15 : voir l’analyse, autorisation limitée aux seules empreintes des six fichiers après preuve des sections manquantes identiques. Aucun élargissement ; traitement coordonné entre DASH-004 et OPS-024, sans transfert de code non commité.

Contrôle AST des marqueurs, valeurs statiques, unicité et propriété du main ; exemptions racines composant/conditionnelles/multiples visibles. Les Screens peuvent porter section/aside. Ne pas importer les interdictions main/screens incompatibles. Ajouter les détections informatives traductions, événements VueUse et commentaires au présent selon décisions ; ne pas transformer les gardes heuristiques existantes en blocage. Conserver template/script/style, AppImage et i18n direct, tokens et noms locaux. Toute autre convention Cap Nour reste une correspondance documentée ou une proposition non adoptée ; aucune nouvelle interdiction de réseau ou de nommage implicite. Couvrir les cibles inactives.

Exclusions communes : secrets et .env, données utilisateur, code Cap Nour/Kazen en écriture, production, DEM-010, nouvelles conventions non arbitrées. Préserver les rubriques et l’ordre des README. Un résultat inconnu ne vaut pas réussite.

## Réalisation et preuves

Aucune implémentation exécutée : les commits amont indiqués ne sont pas disponibles. Les arbitrages de reprise sont confirmés dans l’analyse ; ils ne remplacent pas ces dépendances.

Depuis codebase-integrity/ : bun run test:typescript ; bun run test:bun. Depuis racine : make aide-check et make quality-conventions-check. Fixtures : slot imbriqué après template, racine multiple/conditionnelle/composant, mauvais nom et marqueur dynamique, régions autorisées Screen, deux main. Erreur déterministe bloquante ; suggestions de revue informatives.

Les commandes nouvelles ci-dessus sont à créer, pas réputées disponibles aujourd’hui. Pour les essais humains : lire les chemins modifiés, indiquer préparation et répertoire, conserver sortie/code/rapport, reproduire les cas négatifs dans une fixture temporaire. Préserver la saisie et les données en cas d’erreur.

## Verdict humain

Aucun verdict d’implémentation. Le cadrage confirmé n’est pas une validation du code.

## Commits

Le workflow autorisé le 2026-11-15 permet un commit technique local par tâche terminée puis la poursuite des dépendances, avant vérification humaine globale. Les SHA réels sont consignés dans le récapitulatif du brouillon. Aucun push, PR ou fusion.

## Reprise après revue du socle

L’extension explicitement approuvée est réalisée dans OPS-035 avec un moteur AST commun, plutôt que dupliquer des vérificateurs. Les marqueurs, traductions, événements et commentaires y disposent de contrôles ou warnings testés. Les migrations Dashboard, empreintes DEM-007, raccordements et preuves d’intégration de cette carte restent conditionnés aux dépendances amont ; aucun commit ni validation globale déduits.
