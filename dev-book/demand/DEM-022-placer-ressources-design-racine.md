# DEM-022 — Placer les ressources design à la racine

- Type : développement
- Session de création : 01a20294-5e96-7f03-8096-cd1653e7508b
- Date : 2026-11-22
- État : cadrage confirmé, en attente d’analyse et de découpage.
- Confirmation humaine : « confirmé », après restitution du cadrage dans cette session.
- Identifiant réservé : DEM-022 ; maximum DEM-021 observé dans les références Git locales, les brouillons et les demandes des worktrees, sans fetch.

## Besoin et contexte

Le dossier `design/` à la racine accueillera les ressources de création graphique, notamment les maquettes et brouillons de mockups. Les références de la charte Graines Digitales se trouvent actuellement dans `resources/design/` et sont utilisées par la documentation et le dashboard, notamment lors des builds Docker. La [demande DEM-008](DEM-008-design-dashboard.md) et la [carte OPS-022](../tasks/OPS-022-references-design-dashboard.md) conservent le contexte de leur intégration.

Cette organisation concerne les personnes qui créent les maquettes et celles qui utilisent ou maintiennent les références graphiques et le dashboard.

## Résultat et critères observables

- Déplacer les ressources existantes de `resources/design/` vers `design/` à la racine en conservant chaque fichier identique.
- Adapter les références nécessaires, y compris celles de la documentation et des builds, et conserver des liens valides.
- Préserver le fonctionnement des builds et du dashboard.
- Supprimer `resources/` s’il devient vide après déplacement.
- Mettre à jour la documentation concernée et vérifier les références et comportements affectés. Les tests lourds sont lancés manuellement selon les consignes du projet.

## Exclusions et questions ouvertes

L’organisation des futurs travaux de maquettes et de mockups est exclue de cette demande. Aucun arbitrage de besoin ne reste ouvert ; l’analyse précisera les impacts et les vérifications adaptés.

## Tâches issues du découpage

| Carte | Couche | Dépendance de réalisation | État |
| --- | --- | --- | --- |
| [OPS-086 — Ressources et infrastructure](../tasks/OPS-086-deplacer-ressources-design.md) | DevOps | Aucune | Implémentée et commitée, à vérifier : `6339cae` |
| [DASH-005 — Import du pictogramme](../tasks/DASH-005-adapter-import-pictogramme.md) | Dashboard | Aucune ; contrôle de résolution après réunion avec OPS-086 | Implémentée et commitée, à vérifier : `92a199c` |

L’option de conserver une copie sous l’ancien chemin créerait deux sources et ne satisfait pas le déplacement confirmé. Les adaptations de Dashboard sont indépendantes ; les contrôles de résolution, build et dashboard portent sur les deux contributions réunies. La couche DevOps est propre sur `d6810c99e6cb8e74a74f7f60b8643dac86840fff`, avec des commits DEM-017 et DEM-021 en attente de vérification ; la couche Dashboard est propre sur `3a146b39330c2e5c78e30f855ab5e1c955aeec6f`. La reconstitution utilisera `demands/DEM-022` depuis `develop` local vérifié, puis retournera sur `develop` après livraison. Le principal contient un brouillon DEM-019 non suivi ; sa disponibilité pour la reconstitution reste à vérifier. DEM-021 prévoit une mention de `resources/` dans le README : coordonner les contributions pour éviter une documentation obsolète, sans imposer de dépendance de code.


## Implémentation — 2026-11-22

OPS-086 : commit local `6339cae` sur `layers/devops`, à vérifier ; empreintes identiques et configuration Compose vérifiées, documentation préparée dans `dev-book/reports/ops-086-documentation.md`. DASH-005 attend l’intégration de ce commit : sa carte préparée est non suivie dans le worktree Dashboard, qui n’est donc pas propre au sens du skill d’intégration. Aucun transfert du travail non commité. Builds et contrôle du dashboard non exécutés.


## Correction du découpage et suite — 2026-11-22

Le prérequis de réalisation DASH-005 était trop large : modifier un chemin connu ne nécessite pas le fichier déplacé dans le worktree ; sa résolution effective et les builds exigent les deux commits réunis. DASH-005 a été réalisée indépendamment sur `layers/dashboard`, commit `92a199c` ; aucun travail non commité n’a été transféré. Le blocage signalé précédemment est levé. Les vérifications intégrées restent à faire, ainsi que la validation humaine.


## Vérification et arbitrage — 2026-11-22

Verdict humain explicite : « validé » pour DEM-022, OPS-086 `6339cae99bebede15a4cb6d85c67e0b64e46cc42` et DASH-005 `92a199cf81eb548849fc3c62aca37e17a5bab33e`, avec les limites présentées : résolution de l’import, builds et dashboard non vérifiés ; documentation à intégrer et README à coordonner. Traces documentaires : OPS-086 `442f784`, DASH-005 `2f7bea7`. La reconstitution et la livraison restent à réaliser.


## Reconstitution — 2026-11-22

Base `develop` : `980616b09a0ae9e1791b47ab768b0589788f47c3`. Reprise par cherry-pick avec provenance :

| Source | Reconstitué | Objet |
| --- | --- | --- |
| `6339cae99bebede15a4cb6d85c67e0b64e46cc42` | `49b6b75a03146611c0edc200231a7aff338b4856` | OPS-086 |
| `442f78490a9e28eba764e7e1ccf911df5901388e` | `c6820ccaeb3ba02dbdd8f86d8db21c6c2eb39523` | Verdict OPS-086 |
| `92a199cf81eb548849fc3c62aca37e17a5bab33e` | `52f55d8923c02ac73b268ad6a0dfe9a0131074eb` | DASH-005 |
| `2f7bea7eb57fd28e9fc075d31372021cfeebf4c8` | `fa2af37011122e18ecdba75f16f580248f2f49f5` | Verdict DASH-005 |

Les deux guides ont été actualisés depuis le brouillon validé. Le README issu de DEM-021 est coordonné ici : sa référence à `resources/` devient `design/`. Les tests de build et du dashboard restent à réaliser manuellement. Après livraison, le principal doit retrouver `develop`.

Contrôles de reconstitution : contenu des deux ressources identique à `develop`, ancien dossier absent, chemin d’import résolu, configuration Compose dev et dashboard valide sans lancement de services et `git diff --check` réussi. Builds et exécution du dashboard non vérifiés. Les modifications documentaires de reconstitution restent non commitées pour l’étape de livraison.


## Contrôles de livraison

Sur le contenu `6b148ec7825b729174ba2b39123c5242f58ec2f9`, l’humain a exécuté avec succès `make dev-build-dashboard-ssr`, `make dev-dashboard-ssr` et `make dev-check-dashboard-ssr` ; il a confirmé voir le pictogramme. Les contrôles `make conventions-tests-docs`, `make internal-tests-verifiers`, `make checks-rebuild` et les contrôles lint, format et types pour `GD_TARGET=dashboard` ont réussi. Le contrôle local de contribution et celui des traces ont réussi sur la base `980616b09a0ae9e1791b47ab768b0589788f47c3`. Une exécution `VERBOSE=1` de `internal-tests-verifiers` a échoué ; l’exécution normale ultérieure a réussi.
