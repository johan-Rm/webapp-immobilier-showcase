# OPS-026 — Configurer dependency-cruiser et rendre la couverture visible

- Demande : DEM-011 ; type : consolidation.
- Session de création : 01a1d56d-446b-7931-bf53-7687a7d10912
- Date : 2026-11-14
- Couche : devops
- Branche : layers/devops
- Worktree : `/home/johan/www/graines-digitales/modern-web-apps/showcase-immobilier/worktree/devops`
- État : implémentée et commitée, à vérifier ; bilan global dans OPS-031.
- Base locale vérifiée : `ca571d60c39b8b5932d74cd43dcbe4131c47c578` ; aucun fetch.
- Dépendances : OPS-023 disponible par le commit local `7344a3b48ce344aa943e646ede31051e02fc630b`, ancêtre du HEAD DevOps `461150bec36c88d11a84befc0297279eb9d6f796`.
- Référence de cadrage : `tmp/demande-consolidation-tests-conventions-nuxt.md`, relatif au principal, hors worktrees ; ne pas copier. Analyse et décisions : `tmp/analyse-tests-conventions-nuxt.md`.
- Chemins autorisés (en plus de cette carte) :

- `webapp/scripts/quality/dependency-cruiser.cjs`
- `webapp/scripts/quality/architecture.ts`
- `webapp/scripts/quality/architecture.vitest.ts`
- `codebase-integrity/domaines/architecture-dependances/regles.yaml`
- `codebase-integrity/domaines/architecture-dependances/scripts/verify-no-framework-imports.ts`
- `codebase-integrity/README.md`

## Résultat et critères

Configurer dependency-cruiser pour la règle services indépendants du framework déjà documentée. Prouver la parité avant de retirer ou déléguer le vérificateur existant ; couvrir imports statiques, sous-chemins et alias. Afficher nombre de modules/dépendances, imports non résolus et limites auto-imports/SFC, sans inventer une règle globale inter-couches ou interdire les cycles sans arbitrage. Aucun graphe vide accepté. La migration Cap Nour absente n’est pas une source récupérée.

Exclusions communes : secrets et .env, données utilisateur, code Cap Nour/Kazen en écriture, production, DEM-010, nouvelles conventions non arbitrées. Préserver les rubriques et l’ordre des README. Un résultat inconnu ne vaut pas réussite.

## Réalisation et preuves

Implémentation reprise sur la dépendance committée OPS-023. Les vérifications ci-dessous portent sur ce nouveau contenu ; les autres changements DEM-011 préexistants sont préservés.

Depuis webapp/ : bun run verify -- architecture ; bun run test scripts/quality/architecture.vitest.ts. Fixtures : import framework direct/alias interdit, import type autorisé selon contrat existant, module sans dépendance, import non résolu, jeu vide. Comparer les deux contrôles sur l’inventaire réel ; les trous de résolution doivent apparaître dans le rapport.

Les commandes ci-dessus sont maintenant disponibles dans le worktree DevOps. Pour les essais humains : lire les chemins modifiés, indiquer préparation et répertoire, conserver sortie/code/rapport, reproduire les cas négatifs dans une fixture temporaire. Préserver la saisie et les données en cas d’erreur.

Implémentation : configuration dependency-cruiser 18.7.2 dérivée de la règle YAML existante, découverte Git des services, alias issus du même registre de résolution dans une configuration TypeScript temporaire nettoyée, graphe JSON et bilan de couverture. Les imports de types restent soumis à la règle existante ; aucune exception n’a été inventée. Un jeu vide, un module demandé absent du graphe, un rapport absent, une erreur de syntaxe/configuration ou d’exécution font échouer le contrôle. Les imports non résolus sont visibles sans nouvelle interdiction générale ; aucun cycle n’est interdit implicitement. Référence officielle consultée : [règles dependency-cruiser](https://github.com/sverweij/dependency-cruiser/blob/main/doc/rules-reference.md). Le vérificateur historique est conservé, sans délégation ni suppression.

Exécution réelle : `bun run verify -- architecture` depuis webapp. 18 entrées services, 67 modules, 126 dépendances, aucune violation de la règle. Deux imports #site non résolus, dans le test du résolveur et dans server/utils/site ; ils restent à examiner selon la cible. Rapport `.tmp/quality/architecture.json`, journal `/tmp/dem011-architecture-real.log`. Comparaison réelle avec le contrôle historique : aucune violation signalée par les deux. Cette concordance sur l’inventaire présent ne prouve pas une parité exhaustive des moteurs ; le contrôle historique reste actif. Le graphe ne prétend pas couvrir les auto-imports ou les templates Vue.

Vérifications : 8 tests d’architecture couvrent module isolé, graphe vide refusé, imports directs, types, réexports, import dynamique, sous-chemins, alias pointant vers Vue et import non résolu rendu visible. Avec les 17 tests sécurité et 15 du lanceur : 40 tests réussis. Les tests utilisant des processus Node/Git ont été exécutés hors restrictions de sandbox. Lint, formatage et types stricts ciblés réussis. Les premiers essais ont révélé une configuration alias non acceptée par le schéma et un fichier TypeScript temporaire sans entrées ; les fixtures et la configuration explicite des entrées ont permis de les corriger avant ce résultat.

## Verdict humain

Aucun verdict d’implémentation. Le cadrage confirmé n’est pas une validation du code.

## Commits

Les commits techniques locaux sont autorisés par le workflow confirmé le 2026-11-15 ; ils précèdent la vérification humaine globale. Leur relevé exact est conservé dans le brouillon de la demande. Aucun push, PR ou fusion.

Commit technique local créé selon le workflow autorisé le 2026-11-15, sans verdict humain implicite ; SHA réel dans le récapitulatif du brouillon.
