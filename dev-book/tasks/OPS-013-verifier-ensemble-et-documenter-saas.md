# OPS-013 — Vérifier l’ensemble SaaS et documenter son usage

- Demande : DEM-005 ; type : développement
- Brouillon de référence : `tmp/demande-dashboard-saas.md`, relatif au dépôt principal, hors du worktree ; ne pas le copier.
- Demande définitive prévue : `dev-book/demand/DEM-005-dashboard-saas.md`, créée seulement à la reconstitution ; fichier actuellement absent, lien à ajouter alors.
- Session de création et de reprise : 01a1ca56-891a-7700-97c6-a576d3d9a615
- Couche : devops ; branche : layers/devops ; worktree : worktree/devops
- Base locale de reprise : `37f3bae6a09fcf98244173e4f5a2a26900b16a0c` ; aucun fetch.
- État : validée humainement sur fixtures ; commit local à créer ; recette Symfony réelle différée sur instruction humaine
- Chemins autorisés : `docs/2.architecture/14.site-layers.md`, `docs/3.application/dashboard-saas-contrats.md`, `docs/1.getting-started/dashboard-saas.md`, `docs/index.md`, `docs/3.application/bff-dashboard-symfony.md`, cette carte
- Dépendances de réalisation : OPS-010, OPS-011, OPS-012, DOM-001, BFF-002, BFF-003, BFF-004, WEB-003, WEB-004, WEB-005 ; versions et compléments validés disponibles dans les HEAD ci-dessous.
- Dépendances de vérification globale : aucune autre carte ; aucun commit Symfony attendu.

## Résultat et critères

Après réunion des commits validés, vérifier les critères du brouillon dans les environnements
explicitement affectés, sans recopier de travail non commité entre missions.
Démontrer les accès multi-organisations/projets, le parcours article complet sur Client 2,
les refus directs, les révocations, l’absence de brouillons publics et la non-régression
Showcase sur mobile et bureau. Les critères produit restent dans le brouillon.

Décision humaine de cette reprise : **« Pas encore : poursuivre sur fixtures »**, en
réponse à l’absence d’environnement Symfony isolé, de projets et de comptes de test
affectés. La présente réalisation vérifie donc les adaptateurs sur API simulée ;
elle ne clôture pas les critères exigeant une instance native réelle.
Consolidation explicitement différée après développement, sans tâche ajoutée ici.
Exclusions : verdict humain, commit, reconstitution, push, PR, merge, production,
écriture API réelle et modification des conventions ou de Codebase Integrity.

Documentation : guide opérateur ajouté, contrat corrigé selon l’existant, architecture
et index actualisés ; le contrat historique BFF renvoie au SaaS sans duplication.
Les limites fonctionnelles sont centralisées dans le
[contrat SaaS](../../docs/3.application/dashboard-saas-contrats.md).

## Réalisation et preuves

Reprise du 2026-11-12, même session réelle. Les anciens états d’attente sont remplacés
par les dépendances commitées vérifiées. Assemblage jetable `/tmp/dem005-ops013`,
issu exclusivement d’archives de ces HEAD, sans branche de reconstitution :

| Couche  | HEAD consommé                              | Périmètre assemblé                 |
| ------- | ------------------------------------------ | ---------------------------------- |
| DevOps  | `37f3bae6a09fcf98244173e4f5a2a26900b16a0c` | Socle et configuration complets    |
| Domaine | `3af26ccc0bda0781928f3ef68f8682994549c637` | `webapp/shared`, `webapp/services` |
| Web     | `84675cda41964147f0a3422ea64c1725bad0ffc1` | Dashboard, Client 2, tests         |
| BFF     | `e07ff09a55ddd6cb7f28d7decedf40ba9198e414` | `webapp/server`                    |

Dépendances liées au raccordement : OPS-011 `6a9fbc626aa3149395a9b40e1b55a699907209a6`,
OPS-012 `dfef16a468116ae8b1dec27d38ec643f50d66fd2`, WEB-003
`ba6db7dc4a73f7df780a947a80c626211482ba63`, BFF-003
`f453e142889223a1a3d8dd4815cce17f8c11a039` et WEB-005
`284692102cc3af49cd0363309399c819629548ca` incluses.

Les journaux locaux ont le préfixe `/tmp/dem005-ops013-`. Résultats :

| Contrôle                                                                    | Résultat et preuve locale                                                                                             |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Types et build des trois cibles, successifs                                 | Six codes 0 ; `build-results.json`, journaux `<cible>-types.log` et `<cible>-build.log`                               |
| `bun --no-env-file run lint:check` et `format:check`                        | Codes 0 ; `lint.log`, `format.log`                                                                                    |
| Conventions, commandes de `quality-conventions-check` exécutées directement | Code 0 ; `conventions.log` ; avertissements de revue manuelle conservés, aucune règle modifiée                        |
| `node node_modules/vitest/vitest.mjs run`                                   | 185/187 réussis au premier passage ; deux dépassements de délai dans les tests compilant Nuxt, `tests.log`            |
| Reprise séparée des deux fichiers concernés avec `--maxWorkers=1`           | Dashboard layer : 1/1 ; site-targets : 4/4 ; codes 0 sans modification des délais/assertions, `rechecks.json`         |
| Client 2, `vitest run sites/client2-immobilier/server`, cible Client 2      | 11/11, code 0 ; `client2-tests.log`                                                                                   |
| Dashboard Playwright bureau/mobile, BFF simulé                              | 26/28 au premier passage ; les deux délais d’accès passent seuls, 2/2 ; `dashboard-e2e.log`, `dashboard-recheck.log`  |
| Client 2 Playwright bureau/mobile, projection isolée                        | 4/4, code 0 ; `client2-e2e.log`                                                                                       |
| Showcase Playwright bureau/mobile                                           | 2/2 après préparation des prérequis fictifs ; `showcase-final-e2e.log`                                                |
| Compose/Nginx et trois builds SSR dans des conteneurs jetables              | Code 0 ; `vhosts.log` : cinq configurations de couche, trois identités/routes, refus 421, headers privés du dashboard |
| `make aide-check`                                                           | Code 0, 111 tests Python ; `aide.log`                                                                                 |
| Documentation et `git diff --check`                                         | Codes 0 ; liens et structure vérifiés sans élargir leur portée                                                        |

Les conventions découvrent l’union des fichiers via `GIT_WORK_TREE=/tmp/dem005-ops013`,
`GIT_DIR` du worktree DevOps et `AIDE_GIT_ROOT` sur l’assemblage ; son index reste
inchangé. Les alertes heuristiques existantes nécessitent une revue manuelle : ce
code 0 ne les transforme pas en conformité humaine.

Les E2E utilisent les builds SSR sur des ports dédiés, Chromium local, un seul worker.
Showcase a d’abord échoué faute du catalogue et des photos ignorés par Git, puis sur
une fixture PNG invalide. Correction des seuls prérequis temporaires : catalogue
versionné via `CONTENT_PATH`, fixtures activées et images PNG grises 16 × 16 valides.
Aucun média utilisateur copié ; aucune assertion masquée ; rendu photographique réel
non évalué. Les essais initiaux et finaux restent dans les journaux.

Un scénario intégré temporaire supplémentaire passe (1/1, `joined.log`) : vrais
handlers H3/BFF → aperçu Client 2 réel → vrai projecteur → SSR public réel. Il
vérifie FR/EN indépendants, ES absent, brouillon invisible, révocation d’aperçu,
dépublication, échec média conservant la release et reprise idempotente. Seuls
Symfony et le téléchargement natif d’image sont simulés. Harness conservé dans
`/tmp/dem005-ops013-joined.integration.ts`, SHA-256
`097716d931cda3862af65aa8638e0e5c5bfb604c9695566716092b4c0b625833` ;
il reprend la fixture de `saas-publication.vitest.ts`, avec serveur Client 2 local,
et a été exécuté via `GD_TARGET=dashboard`, filtre `OPS-013`. Ce fichier de preuve
n’est pas ajouté au code applicatif. Les builds ne sont jamais exécutés simultanément
lors de la reprise des tests ayant expiré.

Les fixtures BFF couvrent refus de projets/références étrangers, contrôles natifs
réévalués, CSRF, révisions et conservation des données. Les doubles UI incluent
organisations/projets multiples, administrateur client et équipe SaaS. Les écrans
d’invitation simulés ne prouvent pas leur disponibilité réelle : le BFF les refuse
explicitement. Restent non prouvés : sécurité/révocation par appel direct à Symfony,
provisioning réel et traduction externe. Aucun appel à l’API déployée, aucune copie
de `.env`, aucune pile utilisateur modifiée. Les tests backend pré-merge ne sont pas
exécutés, puisqu’aucun backend n’a été modifié ni environnement isolé affecté.

Diff soumis : cinq documents autorisés et cette carte, dont guide et carte non suivis ;
index vide. Empreinte SHA-256 des cinq documents, tri des chemins UTF-8 puis chemin,
NUL et octets du fichier, carte exclue :
`3a8d0b36c0a416635441a6204aaabf8f66ff14d566d38357b1649f3f386977ed`.
Détail : `/tmp/dem005-ops013-manifest.json`. Brouillon principal mis à jour hors commit.

## Verdict humain

Verdict du 2026-11-12, même session réelle : **« validé »**, après présentation
d’OPS-013 limitée à la documentation et aux vérifications sur fixtures. La recette
Symfony réelle reste différée et les limites du contrat restent applicables.
Empreintes des cinq documents et de la carte revérifiées identiques avant ajout
de cette trace ; aucun changement fonctionnel depuis la présentation.

## Commits

Validation humaine acquise ; commit local de cette carte en cours, SHA à consigner
après création effective. Aucun push, PR ou merge autorisé par cette validation.
Reconstitution ultérieure seulement dans le principal libre et propre, sur
`demands/DEM-005` depuis develop local vérifié.
