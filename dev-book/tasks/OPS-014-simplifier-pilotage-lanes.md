# OPS-014 — Piloter les services des lanes depuis la racine

- Demande : DEM-006 ; type : développement
- Brouillon de référence : `tmp/demande-commandes-lanes.md`, relatif au principal ; ne pas copier.
- Demande définitive prévue : `dev-book/demand/DEM-006-commandes-lanes.md`, créée à la reconstitution ; actuellement absente.
- Session de création : 01a1ce6e-0fd8-7b72-9e6b-c6926289c5fa
- Couche : devops
- Branche : layers/devops
- Worktree : worktree/devops
- Base locale vérifiée : `3be9412613e4e75ea37748338547321d36563557` ; aucun fetch.
- État : validée par l’humain ; commit local à créer
- Chemins autorisés : `Makefile`, `infra/make/Makefile.ai-development-engineering`, `infra/scripts/lanes.py`, `infra/tests/test_lanes.py`, `worktree/README.md`, cette carte
- Dépendances de réalisation : aucune.
- Dépendances de vérification globale : OPS-017 ; DEM-007 pour la preuve Dashboard.

## Résultat et critères

Exposer `make lane-up web`, `make lane-down web`, `make lane-logs web` et
`make lane-rebuild web` depuis la racine, pour les couches déclarées. Résoudre le
worktree enregistré via Git et la configuration ; exécuter les validations et
commandes existantes depuis ce worktree. `up` démarre le développement HMR,
`rebuild` reconstruit puis relance. Les anciennes syntaxes avec `LAYER` restent valides.
Ne pas confondre un argument positionnel avec une cible Make arbitraire : refuser
couche inconnue, argument supplémentaire et combinaison ambiguë ; ne pas ajouter
une règle attrape-tout qui masquerait les erreurs des autres commandes.
Environnement absent/incohérent ou worktree incorrect : expliquer et proposer la
préparation adaptée, sans création automatique. Conserver données et `.env`.
Ne pas changer les conventions ni les scripts Codebase Integrity ; les appeler.
Découvrir les couches sans liste figée ; le runtime Dashboard sera vérifié après DEM-007.
Exclusions : SSR, état des lanes, lecture des cartes et création de worktrees.
Documentation : aide Make et guide worktree, sans duplication des règles.

## Réalisation et preuves

Reprise du 2026-11-13, même session réelle de création
`01a1ce6e-0fd8-7b72-9e6b-c6926289c5fa`. Base HEAD
`3be9412613e4e75ea37748338547321d36563557`, branche layers/devops.
Les seuls fichiers initialement non suivis étaient les quatre cartes DEM-006,
identifiées depuis l’analyse de cette même mission ; aucun changement étranger.

- `python3 -B -m unittest discover -s infra/tests -p test_lanes.py` : 8 tests réussis,
  vrais worktrees temporaires (chemins avec espaces), validation réelle des environnements,
  Docker simulé ; découverte d’une couche additionnelle, syntaxe historique, erreurs,
  refus de branche/lien symbolique et préservation du .env.
- Smoke réel Docker via `/tmp/dem006-smoke.py`, journal `/tmp/dem006-smoke.log` :
  up, logs suivis, rebuild avec nouvel identifiant de conteneur, down réussis ;
  `.env` et fichier témoin préservés ; projet/réseau/image temporaires supprimés.
  Image locale nginx:1.27-alpine, aucun service utilisateur ciblé ni API externe.
- Limite : le smoke prouve l’orchestration Compose, pas le HMR Nuxt. Les preuves
  HMR et de la future lane Dashboard restent à OPS-017 après DEM-007.

Contrôles communs : `make aide-check` réussi (registre, documentation, types et
111 tests Python), `git diff --check` conforme ; `make help` réussi, aide actualisée.
Le premier aperçu d’aide via `head` provoquait un pipe fermé ; relance complète
réussie dans `/tmp/dem006-help.txt`, sans modification liée à ce diagnostic.
Aucun fichier Codebase Integrity modifié. Documentation dans le guide worktree.

Fichiers de réalisation non suivis et empreintes présentées :

- `infra/scripts/lanes.py` : `4ebfcb0afaaf66594697a93e84db435ef059c449921ec3c0dde975a6dcc1871d`.
- `infra/tests/test_lanes.py` : `c1f4c61e4acdcac40ece14548369947563afc1f99df0f4d85ddefbe46b2e9ff7`.

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

Aucun commit. Seule une validation humaine explicite autorise les commits de carte.
La branche `demands/DEM-006` sera créée à la reconstitution depuis develop vérifié,
dans le principal libre et propre ; retour sur develop après fusion distante.
