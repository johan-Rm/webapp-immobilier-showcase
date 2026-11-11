# OPS-010 — Fixer les contrats SaaS et les missions backend externes

- Demande : DEM-005 ; type : développement
- Brouillon de référence : `tmp/demande-dashboard-saas.md`, relatif au dépôt principal, hors du worktree ; ne pas le copier.
- Demande définitive prévue : `dev-book/demand/DEM-005-dashboard-saas.md`, créée seulement à la reconstitution ; fichier actuellement absent, lien à ajouter alors.
- Session de création : 01a1ca56-891a-7700-97c6-a576d3d9a615
- Couche : devops
- Branche : layers/devops
- Worktree : worktree/devops
- Base locale vérifiée : `5dc9fe796cb24a4bc5d604835c4092e8a309e6dd` ; aucun fetch.
- État : validée et commitée localement ; à livrer
- Chemins autorisés : `docs/3.application/dashboard-saas-contrats.md`, cette carte
- Dépendances de réalisation : Aucune au-delà de la base locale vérifiée.
- Commits nécessaires : SHA validés à renseigner pour chaque dépendance ci-dessus avant consommation ; aucun SHA inventé.
- Dépendances de vérification globale : OPS-013

## Résultat et critères

Produire le contrat d’intégration unique depuis les preuves du brouillon, sans modifier le backend.
Fixer les champs globaux/localisés, blocs JSON versionnés, cardinalité des catégories, image principale,
SEO, contraintes slug/locale et références média ; aucun champ JSON libre non validé.
Documenter routes, erreurs, pagination, jetons côté serveur, version de révision et transitions
brouillon/publication/dépublication ; distinction entre succès Symfony et projection visible.
Définir les quatre livrables externes de la matrice du brouillon avec leurs tests et preuves.
Identifier leur branche de contribution, environnement de test et SHA avant de les déclarer disponibles.
Conserver l’auto-traduction des champs manquants en brouillon ; aucune publication implicite.
Comparer le contrat avec les providers/processors réels et le modèle de sécurité existant.
Exclusions : implémentation PHP, migration DB, écriture API, nouvelle convention ou contrôle.

Les critères de besoin et exclusions communs restent dans le brouillon ; aucune modification
de Codebase Integrity, de règle ou de gouvernance hors consolidation déclarée.
Les métadonnées de cette carte relèvent de la trace obligatoire, même hors périmètre applicatif.
Documentation : Le fichier de contrat est la source unique des détails API ; le brouillon et les cartes y renvoient.

## Réalisation et preuves

Implémentation documentaire du 2026-11-11, session `01a1ca56-891a-7700-97c6-a576d3d9a615`.
Les cartes DEM-005 non suivies retrouvées appartiennent à la même mission et sont préservées.

Livrable : [contrat SaaS](../../docs/3.application/dashboard-saas-contrats.md).
Il distingue les sources Symfony vérifiées et les interfaces futures ; matrice des champs,
blocs versionnés, routes BFF proposées, erreurs/pagination, sessions et révisions,
publication/projection/aperçu et réception des quatre lots externes.
Les branches/environnements/SHA backend restent explicitement non affectés, sans disponibilité inventée.
Restriction humaine confirmée : aucune modification de l’API Symfony à ce stade.

Contrôles exécutés depuis `worktree/devops` :
- `make aide-check` : réussi, registre, types et liens documentaires, 111 tests Python.
- `webapp/node_modules/.bin/prettier docs/3.application/dashboard-saas-contrats.md --check` : réussi.
- `git diff --check` : réussi pour les fichiers suivis ; les fichiers présentés restent non suivis.
- Vérification directe des liens du livrable et parsing JSON de son exemple : réussis.
- Backend : HEAD `9fed427658d9c0983b5982a6e6922d179a6bf4eb`, arbre propre avant/après.

État soumis : HEAD de base `5dc9fe796cb24a4bc5d604835c4092e8a309e6dd`,
branche `layers/devops`, index vide. Aucun diff de fichier suivi ; deux fichiers non suivis
constituent cette réalisation : cette carte et `docs/3.application/dashboard-saas-contrats.md`.
Empreinte SHA-256 du livrable : `f994b5c35e5bdd882fa078cb1229e933a1579d6a03ed0f8b5dd313696ff1e257`.
Les cartes OPS-011/012/013 restent non suivies, inchangées depuis le découpage.

Limites : contrat cible proposé à vérification humaine, pas de backend ni de fonctionnalité UI
implémentés ; aucun test applicatif, appel API ou envoi d’e-mail exécuté.
DOM-001 attend le commit validé OPS-010 ; aucune copie de ce document non commité vers Domaine.
Les autres cartes restent non prêtes selon la matrice, sans dépendance de réalisation élargie
aux seules vérifications globales. Aucun commit créé, aucun passage à l’étape 04 effectué.

## Verdict humain

Validation humaine explicite du 2026-11-11 : « validé », après présentation d’OPS-010.
Périmètre accepté : contrat documentaire et preuves de cette carte, empreinte inchangée.
Cette validation n’autorise aucune modification Symfony ni implémentation d’une autre carte.

## Commits

Commit local réalisé : `5eee4c05ad298775d509a1469b5642a1517699df`.
Périmètre vérifié : contrat et cette carte uniquement ; empreinte du contrat identique au verdict.
La présente mise à jour est limitée à la trace du SHA et de l’état réel.
OPS-011/012/013 restent non suivies, préservées hors index.
La réunion globale est prévue dans le principal libre et propre, branche `demands/DEM-005`
créée seulement à la reconstitution depuis develop local vérifié.
