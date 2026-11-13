# OPS-017 — Vérifier les commandes réunies sur les couches existantes

- Demande : DEM-006 ; type : développement
- Brouillon de référence : `tmp/demande-commandes-lanes.md`, relatif au principal ; ne pas copier.
- Demande définitive prévue : `dev-book/demand/DEM-006-commandes-lanes.md`, créée à la reconstitution ; actuellement absente.
- Session de création : 01a1ce6e-0fd8-7b72-9e6b-c6926289c5fa
- Couche : devops
- Branche : layers/devops
- Worktree : worktree/devops
- Base locale vérifiée : `3be9412613e4e75ea37748338547321d36563557` ; aucun fetch.
- État : validée par l’humain ; commit local à créer ; aucune dépendance à DEM-007
- Chemins autorisés : `worktree/README.md`, `dev-book/README.md`, cette carte
- Dépendances de réalisation : OPS-014 `cf6da0f5bb84420f15a3bad3818c8dbf49448704`, OPS-015 `e5c1144e7580c8d79b92bd912d4d02d1f1618738`, OPS-016 `ca556a0f27d88bf930542ae1c8fb6e2c5de6cc80` ; traces `8eb206a` et `b9bb4fd`, présentes dans HEAD.
- Dépendances de vérification globale : Aucune autre ; cette carte réunit les preuves globales.

## Résultat et critères

Après réunion des commits validés sur la couche affectée, vérifier toute la
surface de DEM-006 sur les couches déclarées Web, BFF, Domaine et DevOps.
Ne pas copier de travail non commité. La création et la vérification de la future
couche Dashboard appartiennent à DEM-007 et ne conditionnent pas DEM-006.
Démontrer gestion et état des couches existantes, consultation
principale/globale/filtrée des demandes et compatibilité des anciennes commandes.
Consolider uniquement les liens/documentations nécessaires dans les guides
existants. Tout défaut fonctionnel retourne à sa carte propriétaire ; ne pas
modifier les contrôles de conventions pour faire passer une preuve.
Exclusions : recette métier SaaS, écriture Symfony et déploiement distant.

## Réalisation et preuves

Correction de cadrage autorisée le 2026-11-13 : « une demande faite après ne peux
pas bloquer la demande précédente […] corriger ça et permettre de terminer DEM-006 ».
Le contrôle Dashboard est transféré à DEM-007 ; aucune convention ni aucun
contrôle Codebase Integrity modifié. Vérifications réalisées dans le périmètre corrigé.
Preuves du 2026-11-13, même session réelle de création
`01a1ce6e-0fd8-7b72-9e6b-c6926289c5fa`, branche `layers/devops`,
HEAD de base `b9bb4fde08a972e2ae3206b8c1d24484dd7dd6cd` :

- Commits OPS-014/015/016 et traces présents dans l’historique ; vérification
  d’ascendance réussie. Aucun échange de code non commité.
- `python3 -B -m unittest discover -s infra/tests -p test_lanes.py` : 15 tests réussis ;
  journal `/tmp/dem006-ops017-lanes.log`.
- `python3 -B -m unittest discover -s infra/tests -p test_demand_status.py` : 9 tests
  réussis ; journal `/tmp/dem006-ops017-demands.log`. Vues demandes/cartes, filtres,
  incompatibilités d’arguments et syntaxe historique couverts.
- `make aide-check` : réussi, dont 111 tests Python ; journal
  `/tmp/dem006-ops017-aide.log`. Contrôles documentaires et `git diff --check` conformes.
- Smoke Docker réel : `/tmp/dem006-ops017-smoke.py`, journal
  `/tmp/dem006-ops017-smoke.log`. Snapshot Git temporaire du HEAD, quatre worktrees
  de test Web/BFF/Domaine/DevOps, ports disponibles et environnement neuf ; aucune
  reprise de secret, `.env`, donnée ou service utilisateur.
- Depuis la racine de cette fixture, `lane-up web`, suivi `lane-logs web`,
  `lane-rebuild web`, `lane-down web` réussis. La reconstruction recrée le conteneur ;
  la donnée témoin et les octets du `.env` sont conservés après arrêt.
- Fixture Nuxt utilisant l’image de développement locale existante : une modification
  Vue est visible dans le HTML HTTP sans reconstruction ni redémarrage du conteneur
  (identifiant et StartedAt inchangés). Le service utilise le même lanceur Nuxt dev
  et les mêmes commandes Make ; les routes métier sont isolées de la fixture.
- `lane-status` ciblé sur chacune des quatre couches : réussi. Web a été observée
  successivement running, exited et absente via Docker réel. Ancienne commande
  `make lane-up LAYER=web` depuis son worktree : réussie.
- Projet, conteneurs, réseau et image dérivée du test supprimés ; aucun nettoyage
  de service ou donnée utilisateur. Sortie du smoke : code 0.

La première fixture chargeait les routes métier sans leurs alias et retournait
HTTP 500 ; son serveur de test a été isolé, puis le smoke complet a été relancé
avec succès. Journal initial conservé dans `/tmp/dem006-ops017-smoke-initial.log`.
Aucune correction applicative ni modification de contrôle n’a été nécessaire.

Limites : fixture de développement Nuxt, pas une recette métier Showcase/Symfony
ni une mesure du rendu d’un navigateur connecté. Les tests applicatifs sans lien
avec les commandes ne sont pas rejoués. La plage complète de contribution et la
matérialisation de la demande seront contrôlées à la reconstitution/livraison ;
aucune livraison ni validation humaine de cette carte n’est présumée.

Cette carte est le seul fichier non suivi de la couche. Aucun code des trois
cartes validées, convention ou seuil modifié. La preuve Dashboard est désormais
entièrement portée par DEM-007 ; elle ne bloque plus la clôture de DEM-006.

Un seul écrivain DevOps ; cartes séquencées. Les chemins Makefile racine et guide
worktree sont affectés à DevOps pour cette demande d’outillage, sans modification
du routage des couches ni de Codebase Integrity. La trace de clôture DEM-005 et
l’état Git propre ont été examinés avant affectation.

## Verdict humain

Validation humaine explicite du 2026-11-13 : « validé », après présentation
d’OPS-017 dans son périmètre corrigé : les quatre couches existantes uniquement.
Empreinte du manifest `/tmp/dem006-ops017-presentation.json` revérifiée conforme ;
seule la présente trace de verdict est ajoutée. Les limites présentées sont conservées.

## Commits

Aucun commit. Seule une validation humaine explicite autorise les commits de carte.
La branche `demands/DEM-006` sera créée à la reconstitution depuis develop vérifié,
dans le principal libre et propre ; retour sur develop après fusion distante.
