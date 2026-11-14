# DEM-007 — Dédier une couche de travail au dashboard

- Type : consolidation
- Conventions : [dev-book](../README.md).
- Session de création : 01a1ce6e-0fd8-7b72-9e6b-c6926289c5fa
- Date : 2026-11-12
- État : reconstituée et validée ; livraison vers develop en cours.
- Confirmation humaine : « confirmé », après restitution dans cette session.
- Identifiant réservé : DEM-007 ; maximum DEM-006 observé dans les références Git locales, brouillons et dev-books des worktrees, sans fetch.

Les constats et étapes datées ci-dessous conservent leur contexte historique ;
la reconstitution et son état actuel sont consignés en fin de document.

## Constat et références

Le dashboard est une cible Nuxt distincte, mais son frontend relève encore de Web
dans la [configuration des couches](../../infra/config/layers.json).
La dérogation et la consolidation différée sont tracées dans
[DEM-005](DEM-005-dashboard-saas.md).
Le développeur souhaite un périmètre de travail autonome avec branche, worktree
et accès locaux dédiés.

Références examinées : Nuxt Builder (`/home/johan/www/graines-digitales/modern-web-apps/nuxt-builder/CLAUDE.md`), qui distingue
une couche dashboard, et cadre AIDE (`/home/johan/www/lab/ai-development-engineering/AGENTS.md`)
pour l’affectation et l’isolation des worktrees. Le routage BFF/Domaine/DevOps propre
au présent projet reste celui décidé ci-dessous ; les écarts éventuels seront explicités à l’analyse.

## Convention proposée et décisions humaines

- Couche `dashboard`, branche `layers/dashboard`, worktree `worktree/dashboard`.
- Périmètre : frontend `webapp/dashboard/` et tests dédiés, à inventorier à l’analyse.
- Routes serveur conservées dans BFF, contrats dans Domaine, infrastructure dans DevOps.
- La nouvelle lane sert uniquement le dashboard ; conserver tous les accès existants.
- Développement avec rechargement automatique sur `http://localhost:19305`
  et `http://dashboard.wt-dashboard.localhost:19405` derrière le vhost local.
- Adapter ensemble routage des chemins, contrôles associés et documentation ; la
  nouvelle convention n’est pas adoptée par la seule confirmation du besoin.
- Après livraison de [DEM-006](DEM-006-commandes-lanes.md), DEM-007 devra intégrer
  Dashboard aux commandes de gestion et de consultation et en apporter les preuves,
  sans dupliquer la définition de la couche. DEM-006 ne dépend pas de DEM-007.

## Contraintes et exclusions

Préserver travaux existants, historique des cartes, branches, worktrees, données,
secrets et `.env`. Aucun transfert de travail non commité. Respecter les conditions
d’affectation et de disponibilité du [guide des worktrees](../../worktree/README.md).
Pas de nouvelle responsabilité BFF ou Domaine, de nouveaux vhosts Showcase/Client 2
sur cette lane, de changement distant ou de déploiement de production.

## Critères de conformité et preuves attendues

- Une mission frontend dashboard est routée vers la nouvelle couche sans chevauchement
  avec Web ; les fichiers et tests transverses font l’objet d’un arbitrage explicite.
- Les commandes de création et d’environnement reconnaissent la couche ; sa branche,
  son worktree, ses services et ses écritures sont isolés des couches existantes.
- Les deux URL affichent le dashboard et reflètent une modification frontend sans
  reconstruction manuelle ; le rechargement fonctionne aussi derrière Nginx.
- Les accès existants restent fonctionnels ; les hôtes non autorisés restent refusés
  selon les conventions locales applicables.
- Vérifier configuration, routage des fichiers, isolation, accès HTTP et rechargement
  automatique ; consigner résultats et limites sans inventer de réussite.
- Vérifier les commandes livrées par DEM-006 sur Dashboard : up/down/logs/rebuild,
  lane-status global/ciblé et consultation demands/tasks ; adapter ici les éventuels
  points de sélection du service et du proxy propres à cette nouvelle couche.
- Actualiser les références de couches et d’accès à leur emplacement existant.

## Questions pour l’analyse

Vérifier la disponibilité des ports 19305/19405, l’identifiant et le préfixe de couche,
les tests à affecter, les impacts globaux des contrôles et les conditions de création
du worktree. Définir le proxy de développement et son passage WebSocket pour le
rechargement. Vérifier l’ordre de réalisation avec DEM-006 et la préservation des
dérogations historiques de DEM-005. Aucune décision de besoin restante.

## Tâches issues du découpage

Toutes les cartes de cette consolidation sont affectées à DevOps existante,
branche `layers/devops`, worktree `worktree/devops`. La future Dashboard est un
résultat de la consolidation : aucune mission frontend n'y est affectée à ce stade.
Base locale vérifiée : `d612567da5d7e225ace79b73eaf34c87e82a7c3b`, qui contient
DEM-006 livrée (PR #6). Principal et quatre couches propres, même SHA ; clôture
DEM-006 et absence de mission concurrente examinées. Aucun fetch.
Session intervenante identique à la création : `01a1ce6e-0fd8-7b72-9e6b-c6926289c5fa`.
Identifiants OPS-018/019/020/021 réservés après inventaire des références Git locales,
des fichiers et brouillons de tous les worktrees ; maximum OPS-017, aucun DASH existant.

| Carte | Résultat | Réalisation | État |
| --- | --- | --- | --- |
| [OPS-018](../tasks/OPS-018-declarer-couche-dashboard.md) | Registre, frontières et préfixe DASH | Base DEM-006 livrée, aucune autre dépendance | Validée et commitée `28b798f3e1b94d3940fd5b623261778e388d100d` ; à livrer |
| [OPS-019](../tasks/OPS-019-servir-dashboard-dev-et-vhost.md) | Runtime Dashboard + vhost HMR | OPS-018 `28b798f`, trace `669db10` | Validée et commitée `0fa9f63244386ee2a39ac13a69037fba30770477` ; à livrer |
| [OPS-020](../tasks/OPS-020-verifier-et-provisionner-lane-dashboard.md) | Preuves runtime et création effective du worktree | OPS-018/019 réunies dans `71efe49` | Validée et commitée `4bada169e5c7736adcebd8bf5a28a9cc80feeed8` ; à livrer |
| [OPS-021](../tasks/OPS-021-consolider-controles-frontend-dashboard.md) | Consolidation finale des contrôles frontend et exception bornée | Réalisée en dernier après le smoke OPS-020 | Validée et commitée `7c5a6108d06e02aff76edfb2803b50e097749855` ; à livrer |

Ordre : OPS-018 → OPS-019 → OPS-020, puis OPS-021. Un seul écrivain DevOps,
sans délégation. L'ordre final d'OPS-021 est organisationnel et demandé par l'humain,
pas une dépendance de code inventée. Aucun commit consommateur avant le commit
validé de son fournisseur. Les documentations partagées sont séquencées, pas bloquées
par une dépendance artificielle de contenu.

Les branches existantes sont conservées sans rebase. `layers/dashboard` et
`worktree/dashboard` ne sont pas créés tant qu'une base portant la configuration
validée n'est pas disponible ; OPS-020 porte leur provisionnement effectif après
validation des dépendances. À la reconstitution : principal relatif `.` libre et
propre, branche `demands/DEM-007` depuis develop local vérifié, document définitif
`dev-book/demand/DEM-007-couche-dashboard.md` (actuellement absent). Retour sur develop
après intégration distante. Aucun code, environnement, service, commit ou branche créé ici.


## Correction de dépendance du 2026-11-13

Instruction humaine explicite : DEM-007 ne doit pas bloquer la demande précédente.
La vérification Dashboard initialement inscrite dans OPS-017 est rattachée au
périmètre de cette consolidation. DEM-006 termine sa vérification et sa livraison
sur les quatre couches existantes ; DEM-007 consomme ensuite ses commandes et
vérifie leur extension à Dashboard, notamment le HMR direct et derrière son vhost.
Aucune implémentation de DEM-007 n’est lancée par cette correction documentaire.


## Analyse et couverture du 2026-11-13

Inventaire borné aux fichiers suivis de la base principale ; les copies des
worktrees et artefacts .nuxt/.output ne sont pas comptés comme nouvelles occurrences.
35 fichiers suivis sous webapp/dashboard/, dont 19 Vue (18 composants/pages/layouts
et app.vue). Les seuls tests frontend dédiés sont
`webapp/tests/e2e/saas-access.spec.ts`, `webapp/tests/e2e/saas-editor.spec.ts` et
`webapp/tests/layers/dashboard.vitest.ts`. Les tests Client 2, les tests serveurs SaaS,
les contrats et le projecteur restent dans leurs couches actuelles.

| Zone lue | Constat | Carte |
| --- | --- | --- |
| layers.json et test_layer_routing.py | Pas de couche dashboard ; tests de routage au plus long préfixe ; les paths dashboard sont techniquement hors registre malgré la dérogation Web de DEM-005 | OPS-018 |
| check_commits.py et check_docs.py | Préfixes BFF/WEB/DOM/OPS/DEM seulement ; DASH absent | OPS-018 |
| environment.py et tests | Identité/ports pilotés par config ; validations des caches/sessions Dashboard à compléter, sans migration des .env existants | OPS-019 |
| lanes.py, Makefiles et tests | Découverte des couches dynamique depuis DEM-006, mais composition/service webapp-localhost figés | OPS-019 |
| Compose dev et dashboard SSR | Dashboard pas monté dans le service HMR ; l'extension SSR ajoute trois sites et ne répond pas à la lane Dashboard seule | OPS-019 |
| Nginx et sondes SSR | Liste des quatre piles historiques, cache immutable /_nuxt/ et pas d'Upgrade WebSocket ; à préserver pour SSR et ne pas réutiliser tel quel pour HMR | OPS-019/020 |
| validation-rules.ts, types placement et tests de scopes | Dashboard absent des helpers frontend et de la racine d'alias locale ; les consommateurs hériteront de cette extension | OPS-021 |
| checkFile sections/images sur 18 Vue | 18 signalements règle 1 (sections absentes), zéro image signalée ; cela ne prouve pas les autres conventions | OPS-021 |
| Guide script setup et README frontend | Le guide permet l'omission des blocs inutiles, le contrôle exige 12 balises : divergence explicitement conservée pour arbitrage, pas normalisée automatiquement | OPS-021 |
| Registre, README, guides et configurations Vitest/Playwright/CI | Mise à jour des limites et accès, sans déplacement des tests ni copie des règles ; configurations de tests restent inchangées sauf besoin justifié à l'implémentation | OPS-018/019/020/021 |

Références AIDE et Nuxt Builder lues : Dashboard et préfixe DASH rejoignent la
référence. Le maintien de Web, BFF, Domaine et DevOps et de leurs responsabilités
reste la décision spécifique du projet ; aucun passage aux sept couches du modèle
ni transfert des fichiers partagés à Dashboard n'est effectué.

Les ports 19305/19405 n'ont aucune écoute détectée dans /proc/net/tcp et tcp6 lors
de l'analyse ; ce constat ne réserve pas ces ports. Lecture netlink via ss limitée
par le sandbox et tentative privilégiée non aboutie ; l'inventaire /proc est la
preuve de remplacement. Recontrôler ports et dossier à l'exécution. Aucun accès
aux secrets, test API externe, démarrage Docker ou test HMR exécuté à l'analyse.

### Choix techniques retenus et alternatives

- Conserver les trois tests à leur emplacement actuel, avec chemins exacts Dashboard
  prioritaires sur webapp/tests/ ; évite migration et adaptation Vitest/Playwright.
- Ajouter une composition HMR Dashboard seule et un vhost dédié, sélectionnés depuis
  la configuration de couche. Écarter la réutilisation de l'extension SSR à trois
  sites : elle change les services servis, cache les assets et ne relaie pas HMR.
- Écarter les listes de couches dupliquées et les modifications globales du proxy SSR.
- Garder la préparation manuelle/idempotente et les contrôles de chemins ; aucune
  migration silencieuse des services, ports, secrets ou données existants.
- Les contrôles déterministes (routage, préfixes, chemins, scopes/alias, hôtes, nouvelle
  violation structurelle) restent bloquants. Les heuristiques frontend déjà marquées
  comme revue humaine gardent leur sévérité actuelle. La preuve HMR navigateur et la
  disponibilité réelle d'une couche restent des preuves runtime/humaines, pas un
  résultat déduit de Git ni d'une configuration Compose valide.

### Arbitrage et ordre final des contrôles frontend

Réponse humaine à la proposition de correction : « Prévoir plutôt une exception
 temporaire explicite pour ces fichiers, à arbitrer avant le découpage ».
Instruction suivante : « termine ces taches et créons une carte de consolidation
à la fin ». La correction des 18 Vue avant création de lane n'est donc pas retenue ;
OPS-021 est la carte finale demandée. Aucune correction source acceptée par déduction.

Borne technique proposée pour cette exception locale : seuls les signalements
règle 1 des 18 contenus ci-dessous sont tolérés et rapportés explicitement. Les
empreintes et la liste des sections manquantes empêchent l'extension automatique
de la tolérance à un fichier modifié ou à un nouveau fichier. Toutes les autres
règles restent actives, notamment l'ordre des sections ; aucun seuil abaissé.
Les sections d'un fichier corrigé sortent du périmètre dérogatoire. Généraliser
une politique d'omission ou prolonger cette liste exige un nouvel arbitrage tracé.
L'exception reste temporaire et visible dans le registre : ne pas déclarer les
18 sources pleinement conformes sur la seule réussite du contrôle avec exception.

L'analyse réelle des 18 Vue a appelé les fonctions checkFile existantes directement,
sans modifier leurs scopes, leurs seuils ou leurs règles. Cet inventaire ne remplace
pas l'exécution de tous les contrôles après extension du scope dans OPS-021.

La référence exécutable des 18 contenus est désormais unique :
[`temporaryExceptions`](../../codebase-integrity/domaines/qualite-code/regles.yaml),
empreintes d’origine revérifiées à l’implémentation.


## Déclaration de contribution

Les corrections de toutes les cartes sont regroupées sans doublon de chemin. Les
README référencés portent la convention ; les tests et commandes portent sa preuve.
Le guide worktree conserve ses rubriques. Les chemins inchangés ont été retirés ;
la déclaration couvre le diff réuni par rapport à develop. Les cartes et la demande
sont les traces exemptées de cette déclaration selon les règles du projet.

```contribution-json
{
  "version": 1,
  "corrections": [
    {
      "chemins": [
        "codebase-integrity/domaines/construction-livraison/tests/test_layer_routing.py",
        "codebase-integrity/domaines/construction-livraison/tests/test_worktrees.py",
        "infra/config/layers.json"
      ],
      "convention": "codebase-integrity/README.md#worktrees-et-environnements",
      "controles": [
        "codebase-integrity/domaines/construction-livraison/tests/test_layer_routing.py",
        "codebase-integrity/domaines/construction-livraison/tests/test_worktrees.py"
      ]
    },
    {
      "chemins": [
        "codebase-integrity/domaines/construction-livraison/scripts/check_commits.py",
        "codebase-integrity/domaines/construction-livraison/tests/test_commits.py"
      ],
      "convention": "codebase-integrity/README.md#contributions",
      "controles": [
        "codebase-integrity/domaines/construction-livraison/tests/test_commits.py"
      ]
    },
    {
      "chemins": [
        "codebase-integrity/domaines/fiabilite-verifications/scripts/check_docs.py",
        "codebase-integrity/domaines/fiabilite-verifications/tests/test_docs.py"
      ],
      "convention": "docs/README.md#conventions-techniques",
      "controles": [
        "codebase-integrity/domaines/fiabilite-verifications/tests/test_docs.py"
      ]
    },
    {
      "chemins": [
        "codebase-integrity/domaines/construction-livraison/scripts/environment.py",
        "codebase-integrity/domaines/construction-livraison/tests/test_environment.py",
        "infra/docker/docker-compose.dashboard-dev.yml",
        "infra/nginx/dashboard-dev.conf.template",
        "infra/scripts/check-dashboard-lane.py",
        "infra/scripts/lanes.py",
        "infra/tests/test_dashboard_lane.py",
        "infra/tests/test_lanes.py"
      ],
      "convention": "codebase-integrity/README.md#worktrees-et-environnements",
      "controles": [
        "infra/tests/test_lanes.py",
        "infra/tests/test_dashboard_lane.py",
        "codebase-integrity/domaines/construction-livraison/tests/test_environment.py",
        "infra/scripts/check-dashboard-lane.py"
      ]
    },
    {
      "chemins": [
        "codebase-integrity/commun/validation-rules.ts",
        "codebase-integrity/conventions.json",
        "codebase-integrity/domaines/architecture-dependances/tests/verify-layer-scopes.vitest.ts",
        "codebase-integrity/domaines/qualite-code/regles.yaml",
        "codebase-integrity/domaines/qualite-code/scripts/verify-script-setup-standard.ts",
        "codebase-integrity/domaines/qualite-code/tests/verify-script-setup-standard.test.ts",
        "webapp/dashboard/README.md"
      ],
      "convention": "webapp/dashboard/README.md#conventions-techniques",
      "controles": [
        "codebase-integrity/domaines/architecture-dependances/tests/verify-layer-scopes.vitest.ts",
        "codebase-integrity/domaines/qualite-code/tests/verify-script-setup-standard.test.ts"
      ]
    }
  ],
  "accompagnements": [
    {
      "chemins": [
        "codebase-integrity/README.md",
        "docs/2.architecture/14.site-layers.md",
        "infra/nginx/README.md",
        "worktree/README.md"
      ],
      "motif": "Actualiser les responsabilités, commandes, ports, accès et limites des mêmes corrections dans leurs guides de référence ; aucune nouvelle règle indépendante ni duplication de convention."
    }
  ],
  "sans_correction": ""
}
```


## Couverture et arrêt de l'étape

Ownership/préfixes : OPS-018 ; runtime/vhost et isolation : OPS-019 ; provisionnement
et preuve réelle des commandes DEM-006 : OPS-020 ; couverture frontend et exception
explicite : OPS-021, à la fin selon instruction humaine. Les tests exacts et sorties
attendues restent dans les cartes. L'exception locale ne valide aucun autre écart
nouvellement découvert et ne tranche pas la politique globale d'omission des blocs
inutiles ; toute généralisation reste à présenter à l'humain dans cette carte
finale, sans bloquer le travail indépendant de création de la lane.
Aucun code, contrôle, environnement, service, commit ou branche créé/modifié ici.

## Vérification OPS-018 du 2026-11-13

Verdict humain explicite : « validé », limité à OPS-018. Commit local
`28b798f3e1b94d3940fd5b623261778e388d100d`, sur layers/devops ; preuves et empreinte dans
[la carte](../tasks/OPS-018-declarer-couche-dashboard.md).
OPS-019 peut consommer ce commit à la prochaine implémentation ; OPS-020 attend
encore OPS-019 et OPS-021 reste en dernier. Aucun push ni intégration.

## Implémentation OPS-019 du 2026-11-13

OPS-019 réalisée depuis `669db107aaf2eb9728a8faf68c018b4b238887a1`, sans commit.
Résultats, commandes, limites et périmètre dans
[la carte](../tasks/OPS-019-servir-dashboard-dev-et-vhost.md).
OPS-020 attend son commit validé ; OPS-021 reste différée en dernier.
Aucun worktree Dashboard réel créé, aucune application démarrée.

## Verdict OPS-019 du 2026-11-13

Validation humaine explicite : « validé », limitée à OPS-019. Commit local
`0fa9f63244386ee2a39ac13a69037fba30770477`, preuves et ajustement de ligne vide
dans [la carte](../tasks/OPS-019-servir-dashboard-dev-et-vhost.md).
OPS-020 peut consommer ce commit à la prochaine implémentation ; OPS-021 reste
en dernier. Aucun push, aucune fusion, aucune application réelle démarrée.

## Réalisation finale des cartes du 2026-11-13

OPS-020 et OPS-021 sont implémentées, non commitées, à vérifier ; preuves et
limites dans leurs cartes, sans recopier les résultats détaillés. Dashboard est
provisionnée depuis `71efe4950c25246bacce5583e16f64063a6dfc77`, propre et arrêtée,
avec environnement neuf conservé. OPS-021 a été réalisée en dernier, après succès
du smoke OPS-020 ; ses avertissements restent soumis à revue humaine.
Aucun nouveau commit, push, PR ou fusion. DEM-007 reste à vérifier puis reconstituer.

## Verdict final du 2026-11-13

Validation explicite « validé » des seules OPS-020 et OPS-021 présentées, avec
leurs limites, la dérogation temporaire et les avertissements de revue conservés.
Commits locaux : OPS-020 `4bada169e5c7736adcebd8bf5a28a9cc80feeed8`,
OPS-021 `7c5a6108d06e02aff76edfb2803b50e097749855`.
Les quatre cartes DEM-007 sont désormais validées et commitées localement ;
reconstitution puis livraison restent à effectuer. Aucun push ni fusion.

## Reconstitution du 2026-11-13

Principal libre et propre vérifié sur develop `d612567da5d7e225ace79b73eaf34c87e82a7c3b` ;
branche `demands/DEM-007` créée depuis cette base locale, sans fetch. Les sept
commits validés ont été repris avec `cherry-pick -x`, sans conflit. Les arbres
obtenu et source DevOps sont identiques avant matérialisation de cette demande.
Session intervenante : `01a1ce6e-0fd8-7b72-9e6b-c6926289c5fa`.

| Source validée | Commit obtenu |
| --- | --- |
| `28b798f3e1b94d3940fd5b623261778e388d100d` | `c083251cb700dfd546f0f3d32d4200c582f29ff5` |
| `669db107aaf2eb9728a8faf68c018b4b238887a1` | `01e8862b9999e9de595b90bf334b6ad6024a5c41` |
| `0fa9f63244386ee2a39ac13a69037fba30770477` | `dbbbecd4a42b27fc2a23ce39337d28700736b1fd` |
| `71efe4950c25246bacce5583e16f64063a6dfc77` | `c5a6c3cba6ec87288b5ee3364d6473621721aae1` |
| `4bada169e5c7736adcebd8bf5a28a9cc80feeed8` | `e8ec9a248f554c5a2abece6bf66a9e7988bae165` |
| `7c5a6108d06e02aff76edfb2803b50e097749855` | `e6d5fbe20d36f3b526c573eeee5dd653c7993764` |
| `d6e57d42b272354c8e5fbd71b4828a724b0c03e4` | `5db8e994fde332f19a56d69a65989729913cf375` |

Le brouillon local est conservé. La présente demande est matérialisée pour le
commit documentaire de livraison ; aucun push, PR ou fusion effectué. Les couches
conservent leurs branches et leurs environnements ; retour principal sur develop
prévu seulement après intégration distante. Les limites techniques et la dérogation
temporaire restent celles validées dans les cartes.

Contrôles de reconstitution : `make aide-check` réussi (119 tests, registre,
types et liens conformes), `git diff --check` réussi. Déclaration de consolidation
vérifiée avec le validateur existant sur les objets develop/HEAD et le document
matérialisé : 26 chemins hors traces couverts, sans doublon. Sa référence runtime
pointe vers la convention d’environnements du README Codebase Integrity ; le guide
worktree reste un accompagnement, sans rubrique ajoutée. Le contrôle complet des
commits de contribution attend le commit documentaire de livraison.

## Livraison du 2026-11-13

Cible distante vérifiée : origin/develop `d612567da5d7e225ace79b73eaf34c87e82a7c3b`.
Rebase and merge autorisé ; aucune PR DEM-007 préexistante. Les cinq couches sont
propres et sans mission concurrente identifiée : les cartes DevOps sont validées,
Dashboard a seulement été provisionnée, les autres couches restent sur la base
DEM-006 livrée. Les anciens tips seront conservés dans le brouillon pour le suivi.
Workflows AIDE, conventions et qualité actifs ; SonarQube désactivé manuellement
sur le dépôt, donc aucune réussite Sonar revendiquée. Les contrôles de livraison
sont en cours ; la PR et les nouveaux SHA seront tracés après vérification.

## Correction CI validée du 2026-11-14

Échec identifié sur le job Client 2 de la PR #7 : le test Compose utilisait un
chemin relatif depuis webapp/. La correction présentée ajoute uniquement cwd=ROOT
à son subprocess ; validation humaine explicite « validé ». Aucun comportement
applicatif ni assertion modifié. Preuves et verdict dans OPS-019.

| Source validée | Commit obtenu |
| --- | --- |
| `297f10950166cf4c3efccee514c48ac5cd1c402b` | `84552e5483c52fc6914c3495bfe492f2f3dc26c4` |
| `e7508ec831d9fa3f6ae680516f5c9e950d65b03f` | `93958a49d46043926b2136e6102e9dc9da1f7390` |

La PR conserve sa branche et sa cible ; ses contrôles doivent repasser sur le
nouveau HEAD avant toute fusion. La déclaration couvre déjà le fichier de test.
