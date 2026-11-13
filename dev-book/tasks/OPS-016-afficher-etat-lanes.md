# OPS-016 — Afficher un état local fiable des lanes

- Demande : DEM-006 ; type : développement
- Brouillon de référence : `tmp/demande-commandes-lanes.md`, relatif au principal ; ne pas copier.
- Référence définitive : [DEM-006](../demand/DEM-006-commandes-lanes.md) ; matérialisée à la reconstitution du 2026-11-13.
- Session de création : 01a1ce6e-0fd8-7b72-9e6b-c6926289c5fa
- Couche : devops
- Branche : layers/devops
- Worktree : worktree/devops
- Base locale vérifiée : `3be9412613e4e75ea37748338547321d36563557` ; aucun fetch.
- État : validée et commitée localement ; à livrer
- Chemins autorisés : `Makefile`, `infra/make/Makefile.ai-development-engineering`, `infra/scripts/lanes.py`, `infra/tests/test_lanes.py`, `worktree/README.md`, cette carte
- Dépendances de réalisation : OPS-014 `cf6da0f5bb84420f15a3bad3818c8dbf49448704`, OPS-015 `e5c1144e7580c8d79b92bd912d4d02d1f1618738` ; présents dans l’historique local.
- Dépendances de vérification globale : OPS-017 ; DEM-007 pour la preuve Dashboard.

## Résultat et critères

Exposer `make lane-status` pour toutes les couches déclarées et
`make lane-status web` pour une seule. Afficher Docker, branche, changements Git
suivis/indexés/non suivis et cartes en cours avec sources, en réutilisant OPS-015.
Utiliser uniquement les références Git locales ; aucun fetch. Une couche propre
ne vaut pas libre. Distinguer conteneurs arrêtés/absents, Docker inaccessible,
worktree absent et information documentaire inconnue ou contradictoire.
Le statut reste consultable sans `.env` ou service actif et ne prépare rien.
Ne pas afficher de secret ni le contenu des `.env`. La configuration définit la
liste de couches ; aucune couche Dashboard inventée avant DEM-007.
Exclusions : modifier les missions, démarrer les services ou adopter un nouveau
registre de suivi. Documentation : aide et guide existants.

## Réalisation et preuves

Reprise du 2026-11-13, session réelle inchangée :
`01a1ce6e-0fd8-7b72-9e6b-c6926289c5fa`. Worktree absolu :
`/home/johan/www/graines-digitales/modern-web-apps/showcase-immobilier/worktree/devops`,
branche `layers/devops`, HEAD de base `8eb206a698978572a1389fced705c32a153cc620`.
Index vide ; seuls les fichiers non suivis OPS-016/017, issus du découpage de la
même mission, étaient présents. Commits amont vérifiés ancêtres de HEAD.

Réalisé : commande globale/ciblée, lecture Git locale et Docker sans `.env`,
réutilisation du lecteur documentaire OPS-015, aide et guide actualisés.
Le statut Git utilise `GIT_OPTIONAL_LOCKS=0` ; aucun refresh implicite d’index demandé.
Les projets Docker sont calculés avec l’identité isolée existante ; les valeurs
personnalisées hors convention ne sont pas devinées. Aucune variable de conteneur,
contenu de fichier ou secret d’environnement affiché.

Preuves reproductibles :

- `python3 -B -m unittest discover -s infra/tests -p test_lanes.py` : 15 tests réussis,
  dont 7 nouveaux cas sur le statut (global/ciblé, fichiers indexés/non indexés/non
  suivis, renommage, worktree absent, Docker refusé/absent/arrêté/actif, timeout,
  métadonnées divergentes, clôture documentaire et couche additionnelle de fixture).
- `python3 -B -m unittest discover -s infra/tests -p test_demand_status.py` :
  9 tests de non-régression réussis. Total ciblé : 24 tests.
- `make aide-check` : réussi, dont 111 tests du cadre ; journal local
  `/tmp/dem006-ops016-aide.log`. `git diff --check` conforme.
- `make lane-status`, `make lane-status web`, `make help` : réussis. Sorties sans
  accès Docker dans `/tmp/dem006-ops016-{status,web}-sandbox.txt` ; le refus d’accès
  est explicitement distingué de l’absence de services.
- `make lane-status` avec accès Docker réel en lecture seule : réussi, sortie
  `/tmp/dem006-ops016-status-docker.txt`. Les quatre couches déclarées sont listées,
  leurs projets Docker attendus sont absents ; aucun conteneur modifié ou démarré.

Limites : états documentaires locaux, pas une preuve d’activité humaine ni de
synchronisation distante. Les anciennes cartes sans clôture reconnue restent
visibles comme incertaines. Les cas Docker actif/arrêté sont testés par simulation ;
la lecture réelle a constaté l’absence de projets attendus. La couche Dashboard
réelle et les preuves HMR restent à DEM-007/OPS-017, sans couche inventée ici.

Fichiers suivis soumis et empreintes SHA-256 :

- `Makefile` : `d8ae4ea4a2c4d0ddca77c4b82a9b7f7cf34025fcdcc58716b12779b9371f7fb8`.
- `infra/make/Makefile.ai-development-engineering` : `6b8d490d76dfb6cbaf80f80a49a94723caa5730ccef8cff02ff41aa39143b00e`.
- `infra/scripts/lanes.py` : `d9ac9226004cfc85be32e25057cc0a79e9db20de4a9f5127e82b6f9d5dac08d2`.
- `infra/tests/test_lanes.py` : `ae40012253db7d8eb320c6bc487468497e5d7b636a2a016f6f33977993827e87`.
- `worktree/README.md` : `edb52e6a19b55414723b05b435b86097b6ce39cdd1c17d4bd0bdc8d8be311698`.

Cette carte est non suivie ; OPS-017 préexistante reste intacte et non suivie.
Aucun commit, verdict humain, push ou autre étape déclenché.

Un seul écrivain DevOps ; cartes séquencées. Les chemins Makefile racine et guide
worktree sont affectés à DevOps pour cette demande d’outillage, sans modification
du routage des couches ni de Codebase Integrity. La trace de clôture DEM-005 et
l’état Git propre ont été examinés avant affectation.

## Verdict humain

Validation humaine explicite du 2026-11-13 : « validé », après présentation
d’OPS-016 uniquement. Les six empreintes du manifest
`/tmp/dem006-ops016-presentation.json` ont été revérifiées conformes avant
indexation ; aucun changement fonctionnel depuis la présentation.
Les limites présentées restent applicables ; OPS-017 n’est pas validée.

## Commits

Commit local de la carte validée : `ca556a0f27d88bf930542ae1c8fb6e2c5de6cc80`.
Trace documentaire du SHA ajoutée après création ; aucun changement fonctionnel.
La branche `demands/DEM-006` sera créée à la reconstitution depuis develop vérifié,
dans le principal libre et propre ; retour sur develop après fusion distante.
