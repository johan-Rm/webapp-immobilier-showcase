# DEM-006 — Simplifier les commandes des couches

- Type : développement
- Conventions : [dev-book](../README.md).
- Session de création : 01a1ce6e-0fd8-7b72-9e6b-c6926289c5fa
- Date : 2026-11-12
- État : reconstituée localement sur demands/DEM-006 ; quatre cartes validées ; contrôles qualité, conventions et tests réussis ; livraison en préparation.
- Confirmation humaine : « confirmé », après restitution du cadrage dans cette session.
- Complément confirmé : « confirmé », le 2026-11-12 dans la même session, pour les commandes de consultation des demandes et cartes ci-dessous.
- Identifiant réservé : DEM-006, après examen des références Git locales, brouillons et dev-books des worktrees ; maximum observé DEM-005, sans fetch.

## Besoin et utilisateurs

Le développeur qui pilote les couches depuis la racine doit actuellement préciser
le chemin du worktree et répéter la couche (`make -C worktree/web lane-up LAYER=web`).
Permettre un usage courant court, sans déplacement de dossier ni connaissance du chemin.
Les couches et leurs chemins restent définis par [layers.json](../../infra/config/layers.json).
Décision corrigée le 2026-11-13 : DEM-006 couvre les couches actuellement déclarées.
La prise en charge réelle et la vérification de Dashboard relèvent de
DEM-007 (consolidation distincte, brouillon local `tmp/demande-couche-dashboard.md`) après livraison de DEM-006 ; elles ne la bloquent pas.
Le développeur doit aussi pouvoir consulter les demandes non livrées et leurs cartes
depuis le terminal, sans relire manuellement les documents de chaque worktree.

## Décisions et comportement attendu

Commandes lancées depuis la racine ; `web` peut être remplacé par `bff`, `domaine` ou `devops` :

| Commande | Résultat attendu |
| --- | --- |
| `make lane-up web` | Démarrer le serveur de développement avec rechargement automatique de la couche. |
| `make lane-down web` | Arrêter sa pile en conservant ses données. |
| `make lane-logs web` | Afficher les logs de sa pile. |
| `make lane-rebuild web` | Reconstruire l’image puis relancer le serveur de développement. |
| `make lane-status web` | Afficher Docker, branche, changements Git et carte en cours pour cette couche. |
| `make lane-status` | Afficher ces informations pour toutes les couches déclarées. |

Une information inconnue reste explicitement signalée ; un arbre Git propre ne
prouve pas la disponibilité de la couche. Pour les actions ciblées, une couche
invalide ou un environnement absent provoque un arrêt explicatif, avec la commande
de préparation pertinente, sans création automatique.

### Consultation des demandes et cartes

| Commande | Résultat attendu |
| --- | --- |
| `make demands` | Afficher les demandes non livrées et leur état. |
| `make tasks` | Afficher toutes leurs cartes, regroupées par demande. |
| `make tasks DEM-005` | Afficher les cartes de la demande sélectionnée. |

Chaque carte affiche identifiant, titre, couche, état et lien vers sa source.
Inclure les cartes à faire, bloquées, en réalisation et validées restant à livrer.
Lire les brouillons, demandes versionnées et cartes des worktrees locaux ; signaler
les contradictions, informations absentes et demandes inconnues sans inventer de verdict.
Aucun registre supplémentaire ni modification des états par ces commandes.

## Contraintes et exclusions

Préserver les commandes existantes, l’isolation des couches, les données, les `.env`
et les travaux en cours. Respecter le [guide des worktrees](../../worktree/README.md).
Aucune simplification SSR, préparation automatique, création de worktree ou modification
du workflow AIDE dans cette demande. Les conventions et contrôles Codebase Integrity
ne sont pas modifiés hors consolidation déclarée.

## Critères observables et preuves attendues

- Les commandes ci-dessus fonctionnent depuis la racine pour les quatre couches,
  en ciblant exclusivement le worktree et la pile correspondants.
- `lane-up` fournit le rechargement automatique ; `lane-rebuild` reconstruit puis relance.
- `lane-status` distingue la sélection globale et ciblée, les conteneurs arrêtés,
  les changements Git et les cartes en cours ; les inconnues sont visibles.
- Les erreurs de couche ou d’environnement sont explicites et ne créent rien automatiquement.
- Les commandes existantes restent utilisables ; aucune donnée ni travail existant n’est perdu.
- Prévoir des vérifications ciblées du routage, des erreurs, des sorties d’état et du
  cycle Docker, avec des environnements isolés ; consigner les résultats et leurs limites.
- Actualiser le guide des worktrees et l’aide des commandes concernées sans dupliquer
  la référence documentaire.
- Vérifier les vues des demandes et cartes : filtres, regroupement, doublons,
  contradictions, sources absentes et identifiant de demande inconnu ; conserver
  les états partiels et les liens vers leurs sources. Actualiser l’aide Make.

## Questions ouvertes

Aucune question de besoin restante. Le choix technique et le détail des contrôles
relèvent du découpage ; ce cadrage ne vaut pas validation d’une implémentation.

## Tâches issues du découpage

Analyse du 2026-11-12, même session de création. Toutes les cartes sont affectées à
`layers/devops`, worktree `worktree/devops`, base locale
`3be9412613e4e75ea37748338547321d36563557`, identique à develop, sans fetch.
Disponibilité établie par la clôture de DEM-005 dans son brouillon et Git propre ;
les anciens états de cartes « à livrer » sont des traces historiques, pas une nouvelle mission.
Identifiants OPS-014 à OPS-017 attribués après examen des références Git locales et
fichiers des worktrees/brouillons ; maximum observé OPS-013. Branche existante conservée.

| Carte | Résultat | Dépendances de réalisation | État |
| --- | --- | --- | --- |
| [OPS-014](../tasks/OPS-014-simplifier-pilotage-lanes.md) | up/down/logs/rebuild courts et compatibles | Aucune | Validée et commitée localement, à livrer |
| [OPS-015](../tasks/OPS-015-afficher-demandes-et-cartes.md) | demands/tasks et lecture locale réutilisable | Aucune | Validée et commitée localement, à livrer |
| [OPS-016](../tasks/OPS-016-afficher-etat-lanes.md) | lane-status global/ciblé | Commits validés OPS-014 et OPS-015, présents et référencés dans la carte | Validée et commitée localement, à livrer |
| [OPS-017](../tasks/OPS-017-verifier-commandes-et-dashboard.md) | Preuves d’ensemble sur les couches existantes | Commits validés OPS-014/015/016 présents | Validée et commitée localement, à livrer |

### Choix et ordre de réalisation

Retenir des commandes Make positionnelles contrôlées et des scripts dans infra,
plutôt qu’un alias shell ou une liste de couches dupliquée. Réutiliser les validateurs
existants sans modifier leurs règles ni leur code ; découvrir les worktrees via Git
et les couches via layers.json. La lecture documentaire reste sans registre central.
Le traitement d’états contradictoires est une information de consultation, pas une
nouvelle convention de verdict ou de validation.

Un seul écrivain DevOps ; ordre proposé OPS-014, OPS-015, OPS-016, OPS-017. Les deux
premières cartes sont indépendantes, pas une autorisation de travail parallèle.
DEM-007 ne bloque ni la réalisation ni la livraison de DEM-006. La preuve réelle
de Dashboard sera portée par DEM-007 à partir des commandes livrées par DEM-006. Si cette consolidation utilise
DevOps, coordonner son affectation avant toute reprise ; ne pas déplacer une mission.
Chemins Makefile racine et guide worktree affectés à l’outillage DevOps, sans changer
les conventions du projet. Aucun code ni contrôle Codebase Integrity modifié.

### Complétude et réunion

Gestion des services : OPS-014 ; consultation demandes/cartes : OPS-015 ; état Git,
Docker et missions : OPS-016 ; compatibilité, documentation et preuve des quatre couches existantes :
OPS-017. Les critères et contrôles détaillés sont dans les cartes, sans copie ici.
Le registre de couche Dashboard, ses ports, son HMR et son vhost restent dans DEM-007.
Aucun nouveau vhost ni mode SSR demandé à DEM-006.

La branche `demands/DEM-006` sera créée seulement à la reconstitution depuis develop
vérifié dans le principal libre et propre (`.`), sans copie ni dossier de réunion.
Le document définitif prévu est `dev-book/demand/DEM-006-commandes-lanes.md` ; il
n’existe pas encore. Retour du principal sur develop après fusion distante.
Aucun commit, push, PR ou passage à l’implémentation effectué à cette étape.


### Implémentation du 2026-11-13

Même session réelle : `01a1ce6e-0fd8-7b72-9e6b-c6926289c5fa`. Reprise des seules
cartes non suivies créées lors du découpage ; branche DevOps et base inchangées.
OPS-014 et OPS-015 sont réalisées dans leur périmètre, avec aide et guide mis à jour.
17 tests ciblés réussis, smoke Docker isolé réussi, `make aide-check` réussi
(111 tests du cadre). Preuves, empreintes et limites dans les cartes correspondantes.
Les commandes sont actuellement disponibles dans le worktree DevOps, pas encore
dans le Makefile du principal ; aucun échange de code non commité entre worktrees.

OPS-016 consomme les réalisations amont OPS-014/015 : leurs commits validés restent
nécessaires avant reprise. OPS-017 attend aussi OPS-016 et les commits de DEM-007,
encore à analyser ; aucune couche Dashboard inventée. La dépendance HMR/Dashboard
ne bloque pas les deux cartes indépendantes réalisées.
Aucun verdict humain présumé, aucun commit, push, PR, reconstitution ni étape 04
lancée. Le principal reste sur develop, avec ce seul brouillon ignoré actualisé.


### Verdict et commits locaux du 2026-11-13

Validation humaine explicite : « validé », après présentation d’OPS-014/015 seulement.
Les neuf empreintes du manifest `/tmp/dem006-verification-20261113.json` ont été
revérifiées conformes avant indexation. Index initial vide ; changements communs
répartis par carte sans modifier le contenu fonctionnel présenté.

| Carte | Commit local validé |
| --- | --- |
| OPS-014 | `cf6da0f5bb84420f15a3bad3818c8dbf49448704` |
| OPS-015 | `e5c1144e7580c8d79b92bd912d4d02d1f1618738` |

Trace documentaire des SHA : `8eb206a`. OPS-016 est désormais prête : ses deux
commits amont sont présents dans layers/devops ; aucune implémentation démarrée.
OPS-017 reste non prête. Leurs deux cartes demeurent non suivies et sont préservées.
Aucun push, PR, reconstitution ou passage automatique à une autre étape.


### Implémentation OPS-016 du 2026-11-13

Même session réelle. OPS-016 réalisée sur `layers/devops`, base
`8eb206a698978572a1389fced705c32a153cc620`, en reprenant uniquement les cartes
OPS-016/017 non suivies attendues de cette mission. Commande `lane-status`
globale/ciblée disponible dans le worktree DevOps, avec aide et guide actualisés.
24 tests ciblés et `make aide-check` (111 tests du cadre) réussis ; lecture Docker
réelle effectuée sans écriture. Preuves, limites et empreintes dans OPS-016.
OPS-017 reste bloquée par le commit validé d’OPS-016 et les commits de DEM-007 ;
aucun changement d’ordre ni transfert de travail non commité. Aucun commit créé,
aucune validation humaine présumée ni étape suivante déclenchée.


### Verdict OPS-016 du 2026-11-13

Validation humaine explicite : « validé », après présentation d’OPS-016 uniquement.
Les six empreintes du manifest `/tmp/dem006-ops016-presentation.json` ont été
revérifiées conformes, index vide, branche layers/devops ; aucun changement
fonctionnel depuis la présentation.
Commit local : `ca556a0f27d88bf930542ae1c8fb6e2c5de6cc80`.
Trace documentaire du SHA : `b9bb4fd`.
OPS-014/015/016 sont validées et commitées localement, à livrer. OPS-017 reste
non implémentée et non validée, sa carte non suivie préservée ; DEM-007 reste
nécessaire à sa preuve globale. Aucun push, PR ni étape suivante déclenchée.


### Correction du périmètre OPS-017 — 2026-11-13

Instruction humaine explicite : « une demande faite après ne peux pas bloquer la
demande précédente […] corriger ça et permettre de terminer DEM-006 ».
Cette décision remplace les dépendances DEM-007 des paragraphes historiques ci-dessus.
OPS-017 vérifie exclusivement les couches actuellement déclarées (Web, BFF, Domaine,
DevOps). Tous ses commits amont sont présents : OPS-014 `cf6da0f`, OPS-015 `e5c1144`,
OPS-016 `ca556a0`, traces `8eb206a` et `b9bb4fd`. Elle est réalisable sans DEM-007.
La création de Dashboard, son vhost et la preuve que les commandes le prennent en
charge sont à réaliser et valider dans DEM-007, qui consommera DEM-006 livrée.
Les traces validées des cartes précédentes restent historiques ; leurs mentions
de vérification Dashboard n’ajoutent plus de condition à DEM-006.


### Résultat OPS-017 dans le périmètre corrigé — 2026-11-13

Vérification d’ensemble réalisée sur les quatre couches existantes. 24 tests ciblés,
111 tests AIDE et smoke Docker/Nuxt isolé réussis : cycle complet des commandes,
modification Vue reflétée sans redémarrage, statuts running/exited/absent, syntaxe
historique et préservation des données/.env. Preuves et limites dans OPS-017.
Aucun code des cartes validées ni convention modifié. Seule OPS-017 reste à faire
valider et committer avant la reconstitution de DEM-006 ; aucune attente DEM-007.
La correction du cadrage autorisée ne vaut pas verdict humain sur ce résultat.


### Validation finale des cartes — 2026-11-13

Verdict humain explicite : « validé », après présentation d’OPS-017 dans son
périmètre corrigé. Empreinte `/tmp/dem006-ops017-presentation.json` revérifiée conforme.
Commit OPS-017 : `f4f676e9daa2c30235c3f4b9798af87c1b3638fd` ; trace du SHA `2cd3cad`.
Les quatre cartes OPS-014/015/016/017 sont validées et commitées localement, à livrer.
La couche DevOps est propre, index vide. DEM-006 est prête à reconstituer sans
attendre DEM-007 ; aucun cherry-pick, push, PR ou merge déclenché à cette validation.


## Reconstitution du 2026-11-13

Même session réelle de création. Principal absolu :
`/home/johan/www/graines-digitales/modern-web-apps/showcase-immobilier` ; worktree
relatif `.`. Principal libre et propre sur develop avant création ; DEM-005 clôturée,
DEM-007 au stade de brouillon sans occupation du principal. Aucun fetch.
Branche `demands/DEM-006` créée depuis develop local vérifié
`3be9412613e4e75ea37748338547321d36563557`. Branche à retrouver après fusion distante :
`develop`. Les worktrees de couche restent sur leurs branches layers/*.

Les sept commits validés et leurs traces ont été repris par `git cherry-pick -x`,
sans conflit, dans l’ordre des dépendances. L’arbre obtenu avant matérialisation
de ce document est identique à celui de layers/devops ; aucun code non commité
consommé. Le brouillon local d’origine est conservé. Les seuls changements
supplémentaires sont cette demande définitive et ses liens dans les quatre cartes.

| SHA source validé | SHA reconstitué |
| --- | --- |
| `cf6da0f5bb84420f15a3bad3818c8dbf49448704` | `1039d823ff66c96708f3329e8a2919f0de74e6e4` |
| `e5c1144e7580c8d79b92bd912d4d02d1f1618738` | `71e33ca05bf3088fb1e54de690925b536063e584` |
| `8eb206a698978572a1389fced705c32a153cc620` | `3e8d3de354cdccd1952766e26c6baed875543440` |
| `ca556a0f27d88bf930542ae1c8fb6e2c5de6cc80` | `3f71e6f663f700d18417859a717e4e0b669de66f` |
| `b9bb4fde08a972e2ae3206b8c1d24484dd7dd6cd` | `cdcc859ed8e77d3b57c2eeb154ccbb382bb20380` |
| `f4f676e9daa2c30235c3f4b9798af87c1b3638fd` | `a31d75870f9920af2edb3028440f5823333ada46` |
| `2cd3cad5a8a0c39b0128021c9650f47e3c09c38f` | `df1cca9feda34fb7be7351a3932b07fa47457019` |

Les paragraphes précédents conservent les états historiques du travail ; la
correction active retire toute dépendance de DEM-006 à DEM-007. Le document
ci-présent est désormais la référence définitive du besoin et des verdicts.
Aucun push, PR, merge de livraison ou déploiement effectué à cette étape.
Les traces de reconstitution restent non commitées pour le commit documentaire
de livraison prévu par le workflow.


### Contrôles du résultat réuni

- Tests ciblés depuis le principal : 15 tests lanes et 9 tests demandes réussis
  (`/tmp/dem006-reconstitution-{lanes,demands}.log`).
- `make aide-check` : réussi, dont 111 tests Python, registre, types et liens
  (`/tmp/dem006-reconstitution-aide.log`). Le champ Type du brouillon a été séparé
  de sa référence aux conventions lors de la matérialisation pour respecter le
  format du document définitif ; aucune convention modifiée.
- `make tasks DEM-006` et `make lane-status` : réussis depuis la racine ; sorties
  locales `/tmp/dem006-reconstitution-{tasks,status}.txt`. Le refus d’accès Docker
  éventuel est signalé, sans modifier les services.
- `git diff develop HEAD --check` et `git diff --check` conformes. Diff commité
  entre HEAD et layers/devops vide ; code fonctionnel identique au résultat validé.
- Les preuves Docker/Nuxt d’OPS-017 portent sur ces mêmes commits fonctionnels ;
  elles ne sont pas rejouées sans modification du code. Limites conservées dans la carte.

`make contribution-check BASE=3be9412613e4e75ea37748338547321d36563557 HEAD=HEAD`
a été exécuté et refusé : document DEM-006 absent des objets Git du HEAD. Ce
contrôle lit la demande dans l’arbre final commité ; la matérialisation présente
est encore non commitée, conformément à la procédure de reconstitution. Il devra
être relancé sur la plage complète après le commit documentaire de livraison.
Journal : `/tmp/dem006-reconstitution-contribution.log`. Aucun amorçage, exception,
réécriture de commit ou modification de vérificateur pour contourner ce résultat.
Cette limite ne constitue pas une réussite du contrôle de contribution.


## Préparation de livraison du 2026-11-13

Invocation de `livrer-demande DEM-006` ; livraison complète vers develop autorisée.
Origin vérifié : `git@github.com:johan-Rm/webapp-immobilier-showcase.git`.
Après fetch, cible `origin/develop` : `3be9412613e4e75ea37748338547321d36563557`,
identique à la base de reconstitution. GitHub autorise Rebase and merge ; aucune
PR existante pour cette branche. Authentification vérifiée avec accès réseau.

Inventaire préalable : Web/BFF/Domaine propres à la base d’intégration, missions
DEM-005 clôturées ; DevOps propre au tip `2cd3cad`, ne portant que les sept commits
validés de DEM-006. DEM-007 reste un brouillon sans mission affectée et ne réserve
pas de couche. Principal réservé à cette livraison ; ses changements sont les
seules traces de reconstitution identifiées. Empreintes locales des cinq `.env`
relevées avant suivi, sans exposition de leurs valeurs.

Contrôles avant publication :

- `make quality-conventions-check` : réussi ; les remarques de revue humaine des
  guards restent des avertissements existants. Journal `/tmp/dem006-delivery-conventions.log`.
- `python3 -B -m unittest discover -s infra/tests -v` : 34 tests réussis, y compris
  tests Compose et sondes HTTP isolées ; `/tmp/dem006-delivery-infra.log`.
- `make quality-check` initial : interrompu sur EACCES en parcourant le cache local
  `/app/.data/dashboard/saas-sessions`. Aucun droit ni contenu utilisateur modifié.
  Même commande relancée avec montage d’un dossier temporaire vide sur `/app/.data`,
  sans exclusion, règle ou seuil modifié ; résultat consigné ci-dessous.

Les résultats AIDE et ciblés de reconstitution portent sur le même contenu
fonctionnel. Le commit documentaire de livraison matérialise la demande et les
quatre liens de cartes ; le contrôle de contribution sera relancé sur toute la
plage depuis la cible distante vérifiée après ce commit.

Résultat de la relance qualité isolée : réussi (lint, formatage et type-check),
code 0 ; journal `/tmp/dem006-delivery-quality-isolated.log`. Les données locales
inaccessibles n’ont été ni parcourues par cette relance ni modifiées.
