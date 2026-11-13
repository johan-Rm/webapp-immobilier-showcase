# OPS-015 — Consulter les demandes et cartes locales

- Demande : DEM-006 ; type : développement
- Brouillon de référence : `tmp/demande-commandes-lanes.md`, relatif au principal ; ne pas copier.
- Demande définitive prévue : `dev-book/demand/DEM-006-commandes-lanes.md`, créée à la reconstitution ; actuellement absente.
- Session de création : 01a1ce6e-0fd8-7b72-9e6b-c6926289c5fa
- Couche : devops
- Branche : layers/devops
- Worktree : worktree/devops
- Base locale vérifiée : `3be9412613e4e75ea37748338547321d36563557` ; aucun fetch.
- État : validée et commitée localement ; à livrer
- Chemins autorisés : `Makefile`, `infra/make/Makefile.ai-development-engineering`, `infra/scripts/demand_status.py`, `infra/tests/test_demand_status.py`, `worktree/README.md`, cette carte
- Dépendances de réalisation : aucune.
- Dépendances de vérification globale : OPS-017 ; DEM-007 pour la preuve Dashboard.

## Résultat et critères

Exposer `make demands`, `make tasks` et `make tasks DEM-005`. Afficher demandes
non livrées et cartes regroupées avec identifiant, titre, couche, état et source.
Lire le tmp du principal, les demandes versionnées et les cartes des worktrees Git
locaux, y compris les fichiers non commités. Aucune lecture distante ni registre.
Inclure à faire, bloquées, en réalisation et validées restant à livrer.
Dédupliquer les copies identiques par identifiant ; conserver les états partiels,
les sources contradictoires et leur incertitude plutôt que choisir un verdict
sur la seule date ou présence d’un commit. Une demande globalement livrée ne doit
pas réapparaître à cause d’une ancienne carte « à livrer » : exploiter la trace de
clôture explicite en la citant et signaler les ambiguïtés non résolues.
Source absente/inaccessible ou format non interprétable : information visible.
Demande inconnue : diagnostic explicite ; zéro résultat connu : liste vide claire.
Aucun état modifié. Fournir la lecture sous une forme réutilisable par OPS-016.
Exclusions : jugement de disponibilité, migration documentaire, Docker et contrôles
Codebase Integrity. Documentation : aide Make et guide worktree.

## Réalisation et preuves

Reprise du 2026-11-13, même session réelle de création
`01a1ce6e-0fd8-7b72-9e6b-c6926289c5fa`. Base HEAD
`3be9412613e4e75ea37748338547321d36563557`, branche layers/devops.
Les seuls fichiers initialement non suivis étaient les quatre cartes DEM-006,
identifiées depuis l’analyse de cette même mission ; aucun changement étranger.

- `python3 -B -m unittest discover -s infra/tests -p test_demand_status.py` : 9 tests
  réussis (doublons, états partiels/divergents, clôture globale, sources absentes ou
  illisibles, orphelins, filtre et identifiants invalides).
- `make demands` et `make tasks DEM-006` réussis depuis ce worktree ; sorties locales
  `/tmp/dem006-demands.txt` et `/tmp/dem006-tasks.txt` (régénérables, états évolutifs).
- Les clôtures explicites DEM-003/004/005 sont reconnues malgré leurs métadonnées
  historiques. Aucun verdict déduit de Git. Les autres formulations non reconnues
  restent affichées avec état déclaré et avertissement de clôture non établie.
- Limite : interprétation bornée de documents Markdown libres, pas une preuve
  d’activité humaine ni d’état distant ; les contradictions restent à examiner.

Contrôles communs : `make aide-check` réussi (registre, documentation, types et
111 tests Python), `git diff --check` conforme ; `make help` réussi, aide actualisée.
Le premier aperçu d’aide via `head` provoquait un pipe fermé ; relance complète
réussie dans `/tmp/dem006-help.txt`, sans modification liée à ce diagnostic.
Aucun fichier Codebase Integrity modifié. Documentation dans le guide worktree.

Fichiers de réalisation non suivis et empreintes présentées :

- `infra/scripts/demand_status.py` : `aa3d9e0b147fcd3e995f7efe22a357cca1ab250532ad20b19f2c18f2641dd018`.
- `infra/tests/test_demand_status.py` : `2223320a0a2b6acaf0d5d5c098dadb98764c6fd565ab815853f777bb4b784aae`.

Les changements suivis communs à OPS-014/015 sont `Makefile`,
`infra/make/Makefile.ai-development-engineering` et `worktree/README.md`.
À la validation, répartir leurs hunks entre les deux cartes sans embarquer le
périmètre de l’autre : pilotage/dispatch lane et aide associée pour OPS-014 ;
consultation/dispatch demandes et aide associée pour OPS-015. Aucun index préparé.

Un seul écrivain DevOps ; cartes séquencées. Les chemins Makefile racine et guide
worktree sont affectés à DevOps pour cette demande d’outillage, sans modification
du routage des couches ni de Codebase Integrity. La trace de clôture DEM-005 et
l’état Git propre ont été examinés avant affectation.

## Verdict humain

Validation humaine explicite du 2026-11-13 : « validé », après présentation commune
d’OPS-014 et OPS-015 uniquement. Empreintes revérifiées conformes au manifest
`/tmp/dem006-verification-20261113.json` ; aucune modification fonctionnelle depuis
la présentation. Les limites présentées restent applicables.

## Commits

Commit local de la carte validée : `e5c1144e7580c8d79b92bd912d4d02d1f1618738`.
Trace documentaire du SHA ajoutée après création ; aucun changement fonctionnel.
La branche `demands/DEM-006` sera créée à la reconstitution depuis develop vérifié,
dans le principal libre et propre ; retour sur develop après fusion distante.
