# OPS-025 — Scanner les dépendances du produit et de l’outillage

- Demande : DEM-011 ; type : consolidation.
- Session de création : 01a1d56d-446b-7931-bf53-7687a7d10912
- Date : 2026-11-14
- Couche : devops
- Branche : layers/devops
- Worktree : `/home/johan/www/graines-digitales/modern-web-apps/showcase-immobilier/worktree/devops`
- État : implémentée et commitée, à vérifier ; résultats et limites ci-dessous.
- Base locale vérifiée : `ca571d60c39b8b5932d74cd43dcbe4131c47c578` ; aucun fetch.
- Dépendances : OPS-023 disponible par le commit local `7344a3b48ce344aa943e646ede31051e02fc630b`, ancêtre du HEAD DevOps `461150bec36c88d11a84befc0297279eb9d6f796`.
- Référence de cadrage : `tmp/demande-consolidation-tests-conventions-nuxt.md`, relatif au principal, hors worktrees ; ne pas copier. Analyse et décisions : `tmp/analyse-tests-conventions-nuxt.md`.
- Chemins autorisés (en plus de cette carte) :

- `webapp/scripts/quality/security.ts`
- `webapp/scripts/quality/security.vitest.ts`
- `webapp/scripts/quality/security-exceptions.json`
- `codebase-integrity/README.md`

## Résultat et critères

Exécuter bun audit JSON pour les deux lockfiles, traiter et exposer les paquets non analysés, vérifier les versions Bun réelles et le schéma des retours. Bloquer high/critical, toutes dépendances de développement incluses. Exceptions par avis et paquet avec justification/date limite, aucune exception préremplie. Échec transport, JSON invalide, lockfile absent et exception expirée ne valent pas réussite. Rapports sans secrets ; aucune commande de correction automatique.

Exclusions communes : secrets et .env, données utilisateur, code Cap Nour/Kazen en écriture, production, DEM-010, nouvelles conventions non arbitrées. Préserver les rubriques et l’ordre des README. Un résultat inconnu ne vaut pas réussite.

## Réalisation et preuves

Implémentation reprise sur la dépendance committée OPS-023. Les vérifications ci-dessous portent sur ce nouveau contenu ; les autres changements DEM-011 préexistants sont préservés.

Depuis webapp/ : bun run verify -- security ; bun run test scripts/quality/security.vitest.ts. Les tests utilisent des réponses d’avis fictives : low seul non bloquant, high/critical bloquants, API indisponible et exception expirée en erreur. Puis audit réel en lecture seule sur les deux lockfiles ; consigner date et résultats, jamais « zéro faille » sans exécution.

Les commandes ci-dessus sont maintenant disponibles dans le worktree DevOps. Pour les essais humains : lire les chemins modifiés, indiquer préparation et répertoire, conserver sortie/code/rapport, reproduire les cas négatifs dans une fixture temporaire. Préserver la saisie et les données en cas d’erreur.

Implémentation : audit JSON des deux lockfiles avec Bun 1.4.0, inventaire et empreintes, normalisation des avis, blocage high/critical, exceptions exactes avis/paquet justifiées et datées (liste initiale vide). Les dépendances de développement ne sont pas exclues. Tout diagnostic du scanner, JSON inexploitable, lockfile absent, paquet hors inventaire registre, version de scanner non éprouvée ou exception invalide provoque un échec explicite ; aucun audit fix. Les schémas de registres non reconnus ne sont pas interprétés comme succès. Référence officielle consultée : [audit Bun](https://bun.com/docs/pm/cli/audit). Conventions définies dans le chapitre Audit des dépendances du README Codebase Integrity.

Exécution réelle : `bun run verify -- security` depuis webapp. Résultat bloquant attendu : 2 365 entrées de paquets Web, 169 occurrences d’avis dont 83 high/critical non exemptées ; 167 entrées Codebase Integrity, 4 occurrences d’avis moderate, aucune high/critical. Aucun paquet hors registre reconnu dans ces inventaires ; ne pas confondre occurrences par paquet et vulnérabilités distinctes. Cette mesure est ponctuelle, sans preuve de sécurité globale du produit. Rapport complet `.tmp/quality/security.json`, journal `/tmp/dem011-security-real.log`. Les lockfiles audités restent inchangés.

Vérifications ciblées : 17 tests de politique et d’exécution sécurité, 8 tests d’architecture et 15 du lanceur, soit 40 tests réussis. Couverture : low/moderate informatifs malgré le code 1 natif, high/critical bloquants, exceptions bornées et expirées, transport, schéma et diagnostics inconnus, inventaire vide, paquets locaux, deux workspaces et lockfile manquant. Lint, formatage et types stricts ciblés réussis. La configuration n’exonère aucun avis réel pour produire un succès.

## Verdict humain

Aucun verdict d’implémentation. Le cadrage confirmé n’est pas une validation du code.

## Commits

Aucun. L’implémentation de consolidation ne crée pas de commit avant validation humaine selon son skill. Les dépendances entre missions exigent les vrais commits amont validés ; aucun échange de travail non commité. Reconstitution prévue dans le principal libre et propre sur `demands/DEM-011` depuis develop vérifié.

Commit technique local créé selon le workflow autorisé le 2026-11-15, sans verdict humain implicite ; SHA réel dans le récapitulatif du brouillon.
