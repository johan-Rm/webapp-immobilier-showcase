# OPS-028 — Mettre en place des scénarios k6 isolés

- Demande : DEM-011 ; type : consolidation.
- Session de création : 01a1d56d-446b-7931-bf53-7687a7d10912
- Date : 2026-11-14
- Couche : devops
- Branche : layers/devops
- Worktree : `/home/johan/www/graines-digitales/modern-web-apps/showcase-immobilier/worktree/devops`
- État : prête à reprendre selon l’ordre des commits amont ; pas de verdict humain implicite.
- Base locale vérifiée : `ca571d60c39b8b5932d74cd43dcbe4131c47c578` ; aucun fetch.
- Dépendances : OPS-023, BFF-005 ; SHA à renseigner après validation des cartes amont, aucun SHA inventé.
- Référence de cadrage : `tmp/demande-consolidation-tests-conventions-nuxt.md`, relatif au principal, hors worktrees ; ne pas copier. Analyse et décisions : `tmp/analyse-tests-conventions-nuxt.md`.
- Chemins autorisés (en plus de cette carte) :

- `webapp/scripts/quality/load.ts`
- `webapp/scripts/quality/load.vitest.ts`
- `webapp/scripts/quality/load/scenarios.js`
- `webapp/scripts/quality/fixture-server.ts`
- `infra/docker/docker-compose.quality.yml`
- `codebase-integrity/README.md`

## Résultat et critères

Charge k6 bornée sur lecture SSR et BFF en fixtures, avec origine locale explicite et refus des redirections/réseaux externes. Serveur amont simulé hors routes produit ; aucune écriture Symfony. Scénarios vérifient statuts et contenu attendu, volumes/durée bornés et arrêt garanti. Fournir profil smoke puis profil de mesure ; budgets de latence informatifs au premier relevé, erreurs fonctionnelles/exécution non masquées. Documenter la mesure matérielle et les limites, pas un engagement de capacité production.

Exclusions communes : secrets et .env, données utilisateur, code Cap Nour/Kazen en écriture, production, DEM-010, nouvelles conventions non arbitrées. Préserver les rubriques et l’ordre des README. Un résultat inconnu ne vaut pas réussite.

## Réalisation et preuves

Aucune implémentation exécutée : les commits amont indiqués ne sont pas disponibles. Les arbitrages de reprise sont confirmés dans l’analyse ; ils ne remplacent pas ces dépendances.

Depuis webapp/ : bun run verify -- load ; bun run test scripts/quality/load.vitest.ts. Fixtures de refus : origine étrangère, redirection externe, dépassement budget d’exécution ; scénario détecte réponse 500 et contenu de connexion inattendu. Mesure réelle locale sans trafic vers le backend externe ; rapport k6 relisible.

Les commandes nouvelles ci-dessus sont à créer, pas réputées disponibles aujourd’hui. Pour les essais humains : lire les chemins modifiés, indiquer préparation et répertoire, conserver sortie/code/rapport, reproduire les cas négatifs dans une fixture temporaire. Préserver la saisie et les données en cas d’erreur.

## Verdict humain

Aucun verdict d’implémentation. Le cadrage confirmé n’est pas une validation du code.

## Commits

Le workflow autorisé le 2026-11-15 permet un commit technique local par tâche terminée puis la poursuite des dépendances, avant vérification humaine globale. Les SHA réels sont consignés dans le récapitulatif du brouillon. Aucun push, PR ou fusion.
