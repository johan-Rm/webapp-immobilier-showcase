# DEM-027 — Tenir TEST.md à jour lors des changements de tests CI/CD

- Type : consolidation
- État : validée humainement, à reconstituer
- Session de création : 01a211b5-0ab6-7733-9516-b83103d91b22
- Branche : `demands/DEM-027`
- Espace documentaire : `worktree/DEM-027`

## Constat

La suite de reconstitution de Showcase Immobilier est décrite dans [TEST.md](../../TEST.md). Le fichier demande déjà de répercuter les changements de commandes, de paramètres et de prérequis. [DEM-017](DEM-017-cadrer-analyse-sonarqube.md) a livré `make third-party-tests-sonar`, tandis que `TEST.md` conserve l’exemple commenté `make sonarqube-tests`, dont la cible n’existe pas.

## Décisions confirmées

Le 26 novembre 2026, l’humain a choisi la revue de PR comme mode de vérification, puis a confirmé le cadrage dans le chat par « validé ».

- Inscrire dans la section « Contrôles et fin du travail » de l’[AGENTS.md du projet](../../AGENTS.md) que toute modification des tests CI/CD de Showcase Immobilier doit mettre à jour `TEST.md` dans le même changement.
- Documenter les commandes, leurs paramètres, leurs prérequis et leurs résultats attendus dans `TEST.md`. Le [guide des contrôles](../../docs/executer-controles.md#commandes-manuelles) renvoie déjà vers la procédure de reconstitution.
- Remplacer l’ancienne cible dans `TEST.md` par `make third-party-tests-sonar` en tant qu’analyse manuelle facultative, à lancer séparément de la suite complète. Renvoyer au [guide SonarQube Cloud](../../docs/3.application/sonarqube-cloud.md#analyse-réelle) pour les prérequis et la vérification du traitement distant.

Le périmètre est documentaire. Les workflows et les contrôles automatisés sont hors périmètre.

## Critères observables à l’analyse

- La règle figure dans `AGENTS.md` et renvoie vers `TEST.md`.
- La revue de PR constate une mise à jour de `TEST.md` dans le même diff que les changements de tests CI/CD. Elle vérifie la concordance des commandes, paramètres, prérequis et résultats attendus avec les tests modifiés.
- `TEST.md` présente la cible Make existante de SonarQube hors du bloc de la suite complète et renvoie au guide en vigueur.

## Questions pour l’analyse

- Quels documents, consignes et usages de revue couvrent déjà la maintenance de `TEST.md` ?
- Où faire apparaître la vérification en revue de PR pour qu’elle soit visible sans dupliquer la règle ?

## Verdict humain

Le 26 novembre 2026, l’humain a répondu « validé » au périmètre présenté pour OPS-099, unique carte de la demande, au commit `2d9f85a6009640ad361dcbfb78e0f9032ce19306`. Le verdict structuré est porté par `dev-book/tasks/OPS-099-maintenir-test-md.md` sur `layers/devops`, dans le commit `715c3a56fd0684babe0a15d8de6b94737078e363`. La suite manuelle de `TEST.md` reste à exécuter après reconstitution.
