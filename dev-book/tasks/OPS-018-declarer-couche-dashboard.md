# OPS-018 — Déclarer la couche Dashboard et ses frontières

- Demande : DEM-007 ; type : consolidation
- Brouillon : `tmp/demande-couche-dashboard.md`, relatif au principal, hors des worktrees ; ne pas copier.
- Demande définitive prévue : `dev-book/demand/DEM-007-couche-dashboard.md`, créée seulement à la reconstitution ; actuellement absente.
- Session de création : 01a1ce6e-0fd8-7b72-9e6b-c6926289c5fa
- Date : 2026-11-13
- Couche : devops
- Branche : layers/devops
- Worktree : worktree/devops
- Base locale vérifiée : `d612567da5d7e225ace79b73eaf34c87e82a7c3b` ; aucun fetch.
- État : validée et commitée localement, à livrer
- Chemins autorisés : `infra/config/layers.json`, `codebase-integrity/README.md`, `codebase-integrity/conventions.json`, `codebase-integrity/domaines/construction-livraison/scripts/check_commits.py`, `codebase-integrity/domaines/construction-livraison/tests/test_commits.py`, `codebase-integrity/domaines/construction-livraison/tests/test_layer_routing.py`, `codebase-integrity/domaines/construction-livraison/tests/test_worktrees.py`, `codebase-integrity/domaines/fiabilite-verifications/scripts/check_docs.py`, `codebase-integrity/domaines/fiabilite-verifications/tests/test_docs.py`, `worktree/README.md`, cette carte.
- Dépendances de réalisation : aucune ; base DEM-006 livrée d612567da5d7e225ace79b73eaf34c87e82a7c3b.
- Vérification globale : OPS-020 pour les preuves runtime ; OPS-021 pour la couverture frontend finale.

## Résultat et critères

Ajouter dashboard : id 5, préfixe DASH, branche layers/dashboard, worktree
worktree/dashboard. Ne pas renuméroter les quatre couches existantes. Attribuer
webapp/dashboard/ et les trois tests frontend dédiés identifiés dans le brouillon.
Conserver leurs emplacements : les chemins de tests exacts Dashboard priment sur
le préfixe général webapp/tests/ de Web, suivant le routage existant au plus long
préfixe. Ne pas transférer les tests BFF, contrats et infrastructures.
Déclarer dans layers.json la sélection de composition/services de développement
nécessaire à OPS-019, avec valeurs par défaut conservant le service historique.
Faire reconnaître les commits/cartes DASH par les validateurs et la portée docs.
Ne pas adopter une nouvelle politique de verdict ni modifier les scopes DEM.
Documenter la sortie de la dérogation historique DEM-005 et le futur provisionnement,
sans déplacer les cartes historiques ni créer encore la lane depuis une base non validée.

## Réalisation et preuves

Implémentation sur la base locale indiquée ci-dessus, dans le worktree DevOps.
La configuration attribue Dashboard et ses trois tests dédiés ; les quatre
identifiants existants restent inchangés. Les validateurs reconnaissent DASH.
Les README conservent leurs rubriques et documentent la transition depuis Web.
La composition déclarée reste à implémenter dans OPS-019 : aucun service ni
worktree Dashboard réel créé, aucun fichier frontend, secret ou donnée modifié.

Vérifications du 2026-11-13 : `make aide-check` réussi, 117 tests Python,
registre cohérent (15 domaines, 18 conventions), demandes et liens conformes.
Les tests couvrent les frontières Dashboard/Web/BFF/Domaine, les scopes DASH
valides et inconnus, les références de cartes, la découverte documentaire avec
lien cassé rejeté, la création idempotente et les refus de base incomplète ou
destination occupée. Les restrictions du scope DEM restent testées.
`git diff --check` réussi ; titres des deux README inchangés par rapport à HEAD.
Le diff présenté porte sur les neuf fichiers suivis de cette carte ;
`codebase-integrity/conventions.json` ne nécessite aucune modification.
Lors de la présentation, cette carte était nouvelle et non suivie ; les trois
autres cartes préparées restent conservées hors du commit OPS-018.

Les corrections et accompagnements sont déclarés dans le brouillon, sans recopier
la déclaration dans chaque carte. Réconcilier ses chemins exacts avec le diff final ;
aucune exemption implicite de couverture de contribution. Un seul écrivain DevOps.

## Verdict humain

Validation explicite le 2026-11-13 : « validé », portant sur OPS-018 seule.
Les dix fichiers présentés correspondent au relevé SHA-256 de vérification
`9cf6cd6b59aabf452653aa576dab39cfbdf61e13e6e1ddda11d334694973ca5a` ;
identité revérifiée avant ajout de cette trace. Aucun changement fonctionnel ajouté.

## Commits

Commit d’implémentation validée : `28b798f3e1b94d3940fd5b623261778e388d100d`.
Cette trace documentaire est consignée séparément. Reconstitution prévue
dans le principal libre et propre, `demands/DEM-007` depuis develop vérifié, sans
copie de réunion ; retour sur develop après intégration distante.
