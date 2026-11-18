# DEM-011 — Plan des cartes

Référence des décisions : [analyse](tests-conventions-nuxt-analyse.md).
Toutes les cartes sont préparées dans le dev-book de DevOps, propriétaire des traces ; leur implémentation suit leur couche déclarée, sans copie de travail non commité. Aucun démarrage automatique de mission. Les noms ont été vérifiés dans les références Git locales et les dev-books de tous les worktrees : maxima OPS-022, WEB-005, DASH-003, BFF-004, DOM-001.

| Carte | Couche | Dépendances de code | État au 2026-11-15 |
| --- | --- | --- | --- |
| [OPS-023 — Unifier les commandes et environnements de test](../tasks/OPS-023-unifier-commandes-tests.md) | devops | Base vérifiée | implémentée et commitée, à vérifier ; bilan global OPS-031 |
| [WEB-006 — Migrer les marqueurs et main des sites et du catalogue](../tasks/WEB-006-marquer-structure-sites.md) | web | Base vérifiée | implémentée et commitée, à vérifier ; bilan global OPS-031 |
| [BFF-005 — Rendre explicites les suites Bun et intégration BFF](../tasks/BFF-005-couvrir-tests-bff.md) | bff | Base vérifiée | implémentée et commitée, à vérifier ; bilan global OPS-031 |
| [DOM-002 — Vérifier les contrats locaux et préparer une cible de mutation pure](../tasks/DOM-002-verifier-contrats-locaux.md) | domaine | Base vérifiée | implémentée et commitée, à vérifier ; bilan global OPS-031 |
| [DASH-004 — Migrer la structure Dashboard et réaliser les trois pilotes](../tasks/DASH-004-pilotes-et-structure-dashboard.md) | dashboard | OPS-023 | implémentée et commitée, à vérifier ; bilan global OPS-031 |
| [OPS-024 — Contrôler les conventions adaptées avec limites explicites](../tasks/OPS-024-controler-conventions-ast.md) | devops | WEB-006, DASH-004 | implémentée et commitée, à vérifier ; bilan global OPS-031 |
| [OPS-025 — Scanner les dépendances du produit et de l’outillage](../tasks/OPS-025-scanner-vulnerabilites.md) | devops | OPS-023 | implémentée et commitée, à vérifier ; bilan global OPS-031 |
| [OPS-026 — Configurer dependency-cruiser et rendre la couverture visible](../tasks/OPS-026-controler-dependances.md) | devops | OPS-023 | implémentée et commitée, à vérifier ; bilan global OPS-031 |
| [OPS-027 — Mettre en place la mutation JavaScript ciblée](../tasks/OPS-027-mesurer-mutation.md) | devops | OPS-023, DOM-002 | implémentée et commitée, à vérifier ; bilan global OPS-031 |
| [OPS-028 — Mettre en place des scénarios k6 isolés](../tasks/OPS-028-mesurer-charge.md) | devops | OPS-023, BFF-005 | implémentée et commitée, à vérifier ; bilan global OPS-031 |
| [OPS-029 — Réaliser les audits Lighthouse desktop et mobile prioritaires](../tasks/OPS-029-mesurer-lighthouse.md) | devops | OPS-023, OPS-028, WEB-006, DASH-004 | implémentée et commitée, à vérifier ; bilan global OPS-031 |
| [OPS-030 — Automatiser les contrôles sur les trois cibles](../tasks/OPS-030-automatiser-ci.md) | devops | OPS-024, OPS-025, OPS-026, OPS-027, OPS-028, OPS-029, BFF-005, DOM-002 | implémentée et commitée, à vérifier ; bilan global OPS-031 |
| [OPS-031 — Vérifier le socle complet et préparer la recette humaine](../tasks/OPS-031-verifier-socle-et-documenter.md) | devops | OPS-030, WEB-006, DASH-004, DOM-002, BFF-005 | outils commités ; bilan bloqué par sécurité et SOLID, recette humaine ouverte |
| [OPS-032 — Contrôler la structure de tous les README](../tasks/OPS-032-controler-readme.md) | devops | Base vérifiée ; extension demandée le 2026-11-15 | implémentée et commitée, à vérifier ; bilan global OPS-031 |
| [OPS-033 — Expliquer la progression des contrôles AIDE](../tasks/OPS-033-expliquer-controles-aide.md) | devops | Base vérifiée ; demande explicite | implémentée et commitée, à vérifier ; bilan global OPS-031 |
| [OPS-034 — Vérifier les traces des cartes](../tasks/OPS-034-verifier-traces-devbook.md) | devops | Base vérifiée ; couverture explicitement approuvée | implémentée et commitée, à vérifier ; bilan global OPS-031 |
| [WEB-007 — Conventions frontend partagées](../tasks/WEB-007-centraliser-conventions-frontend.md) | web | Reprise documentaire WEB-006 ; sources à relire | implémentée et commitée, à vérifier ; bilan global OPS-031 |
| [OPS-035 — Contrôles du socle frontend](../tasks/OPS-035-completer-controles-socle.md) | devops | Moteur autonome ; sources canoniques après WEB-007 | implémentée et commitée, à vérifier ; bilan global OPS-031 |

Au relevé initial, les cinq couches étaient propres et sur ca571d60c39b8b5932d74cd43dcbe4131c47c578. Les cartes anciennes ont des états historiques parfois « à livrer » : ne pas les réécrire ni en déduire une occupation ; aucune mission active non validée n’a été repérée, à revérifier avant affectation.

OPS-023 possède package, lock et configuration de tests communs : les autres cartes utilisent ses dépendances plutôt que modifier ces fichiers concurremment. Un seul écrivain DevOps ; conserver les modifications identifiées entre cartes de la même session, sans travail étranger. Les raccordements Compose partagés sont séquentiels. Les dépendances vers OPS-031 sont justifiées par les preuves globales, pas par son édition documentaire.

Étape 05 : principal libre et propre, demands/DEM-011 depuis develop vérifié ; demande définitive dev-book/demand/DEM-011-tests-conventions-nuxt.md ; cherry-pick des seuls commits validés avec correspondance SHA. Aucun commit, branche ou transfert applicatif réalisé à l’étape 02.


Reprise du 2026-11-16 : tous les lots ont un commit local initial et leurs correctifs ciblés. Les commits applicatifs nécessaires ont été intégrés dans DevOps par cherry-pick tracé ; les couches sources conservent leurs branches. Le relevé exact est `commits-implementation-tests-conventions.json`. La déclaration de contribution est réconciliée avec l’union des chemins touchés, cartes de la demande exclues comme traces. Elle reste à intégrer à la demande définitive à l’étape 05.

Les preuves globales sont dans la carte OPS-031 et son rapport. Aucun nouveau verdict humain, push, PR ou fusion. Les seuils de sécurité et SOLID ne sont pas assouplis ; les scores Lighthouse, mutation et charge restent informatifs.

Correctif OPS-030 demandé le 2026-11-17 : préparation explicite de l’image et contrôles sans reconstruction. Commit d4e141bb338871e2e1b9a961a1ebd93cb5035329 ; neuf tests ciblés, deux contrôles réels successifs et refus d’image absente vérifiés. À vérifier humainement ; les autres réserves de DEM-011 demeurent.

Harmonisation Make demandée le 2026-11-17 : recette de contrôles sans appels directs à Bun/Node, commit 2a6cde9596c2a9d3af3e14f2ba79902df861a47a. Trente-huit tests ciblés et cinq commandes Make réelles réussis ; tests des vérificateurs 154 Python, 66 Vitest, 44 Bun. Aucun verdict nouveau ; réserves globales inchangées.

Préparation réutilisable demandée le 2026-11-17 : quality-prepare ignore une image présente ; quality-rebuild reconstruit explicitement. Commit 40e8a5db78c7339dfa23b3b0071439423edb7ef0 ; 40 tests ciblés réussis et comportement Docker réel vérifié. Aucun nouveau verdict humain.

Noms canoniques appliqués le 2026-11-17 : check FAMILY, checks-prepare/rebuild et conventions-*. Commit 6b2475cb6b60b38fc9c9e50c3ae217029c38492d ; 46 tests ciblés réussis, anciennes recettes préservées par délégation. Le correctif séparé OPS-026 rend aussi le contrôle d’architecture exécutable dans l’image (9 tests ciblés et essai Docker réussi). Aucun nouveau verdict humain.

Correction OPS-030 du 2026-11-17 : commandes explicites sans FAMILY, conventions automatisées préfixées conventions-. Catalogue : docs/executer-controles.md dans DevOps. Commit local 39deb09 ; 57 tests ciblés, 154 Python et exécutions contrats/architecture réussis, sans reconstruction implicite. Vérification humaine à effectuer.

Correctif OPS-030 eb7c5bd : conventions-docs-check limité aux trois contrôles de conventions, integrity-test séparé en local et en CI. Vérification locale : 3/3 contrôles et 264 tests réussis. CI distante non exécutée. Fichiers non suivis préexistants préservés.

Préfixes anglais confirmés le 2026-11-17 : third-party-tests- / conventions- / verifiers-. Correctif OPS-030 e563324, catalogue de référence actualisé dans DevOps. 74 tests ciblés et 264 tests des vérificateurs réussis ; exécutions réelles lint, documentation, contrats et architecture réussies sans rebuild. Anciens noms conservés comme alias ; aucun push ni verdict humain implicite.

Revue des cartes du 2026-11-17 (ddb6233) : aucune nouvelle carte ; OPS-030 porte les critères confirmés des trois préfixes, la séparation et le rattachement README. OPS-031 porte la recette et les limites, OPS-023/033 précisent la portée de leurs validations historiques. Documentation et traces de 20 cartes conformes ; union des chemins modifiés couverte par la déclaration, cartes de tâches exclues. Aucun nouvel audit sécurité/SOLID ni verdict humain. Reporting global conservé en brouillon.

Présentation et reporting autorisés le 2026-11-17, portés par OPS-030 : bandeaux à six champs, contexte par message, journaux hôtes persistants et bilan checks-run. Commit local 99bc7fe ; 74 tests ciblés, 162 Python, 66 Vitest et 44 Bun des vérificateurs réussis. Recette groupée testée avec outils simulés ; la recette complète et les échecs de la sortie humaine ne sont pas corrigés ni rejoués dans ce changement. Décompte des avertissements non consolidé explicitement. Documentation d’exécution canonique actualisée ; vérification humaine attendue. Cette autorisation remplace la précédente limitation du reporting au brouillon.

Correction des échecs d’intégration Docker le 2026-11-17, OPS-030, commit local 7b00b0f : Make absent ajouté, erreurs de démarrage explicites et intégration bornée à deux workers sans hausse des délais. Suite ciblée 53 tests réussis sur hôte et Docker ; intégration Showcase complète confirmée à 243 tests/23 fichiers, code 0. Versions, image, empreinte du journal et limites dans le rapport OPS-031. Aucun test supprimé ou ignoré ; sécurité/SOLID et verdict humain restent ouverts.

Aide navigateur du 2026-11-17, OPS-030, commit d9e7b69 : checks-fixture-start/stop ajoutés et éprouvés, préparation Nuxt + SSR dans le conteneur jetable avec surcharge de sortie Nitro. API et médias fictifs, URL locale explicite, port occupé et cible inconnue refusés, serveur arrêté après essai. 53 tests Make réussis. Les deux parcours navigateur sont exécutés mais échouent sur des erreurs IPX ; défaut ouvert consigné dans OPS-031. Le défaut composants Dashboard (configuration générée absente avant les tests) reste également ouvert et non corrigé à la demande humaine.

Correction OPS-030 du 2026-11-17 : médias simulés compatibles IPX et références JPEG accueil/navigation complétées, sans remplacement des originaux. Preuves et limites dans la carte ; deux parcours navigateur réussis. Commit local 1b402a8da4789608415829180bafd758d81c49b5 ; aucune validation humaine nouvelle.

2026-11-18 — OPS-030 : mode test intégré au cycle de vie des couches ; 21 tests Python et deux parcours Chromium réussis, suppression automatique du conteneur vérifiée. Commit local eb1ac5e769ea0fa3b64c488f8daebf506689237a. Nettoyage séparé des 22 anciens conteneurs Showcase explicitement autorisé et effectué ; preuve dans tmp/conteneurs-showcase-arretes.md.

2026-11-18 — OPS-030 : mises à jour de sécurité, 85 signalements high/critical ramenés à deux occurrences du même avis Picomatch non corrigé par l’éditeur ; zéro critique. Audit toujours bloquant sans exception. Tests unitaires, intégration, vérificateurs, types des deux cibles, lint, formatage, build SSR et deux parcours navigateur réussis ; preuves dans OPS-031. Commit local f94b0aaf8fec7fa54df50a0527001a8a32aa7b08.

Analyse Picomatch consignée dans `dev-book/reports/ops030-exposition-picomatch.md` (commit local `ccc6ffd`) ; exception proposée uniquement, arbitrage humain requis.

2026-11-18 — Bilan avant clôture actualisé dans `dev-book/reports/ops031-verification.json`, entrée `bilan_avant_cloture_2026_11_18` (commit local 334568d). Préparation composants et mutation corrigées ; sept conventions réexposées individuellement. Quatre erreurs SOLID restent bloquantes ; signalements à arbitrer. Aucun verdict humain global ni livraison.

2026-11-18 — Les 18 cartes sont validées humainement sous réserves ; [verdict global](ops031-verdict-final.json), trace locale 44711c8. Les anciens états ci-dessus sont historiques. Étape suivante : reconstitution, non réalisée.
