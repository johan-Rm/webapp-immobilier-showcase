# DEM-029 — Encadrer l’emplacement des worktrees de demande

- Type : consolidation
- Session de création : 01a21cf5-ae80-79e1-93aa-e5bca7961807
- Date : 2026-11-27
- État : cadrage confirmé par l’humain ; analyse et découpage à réaliser.

## Constat et objectif

Le worktree DEM-028, indiqué comme fusionné par l’humain, a été déplacé avec `git worktree move` vers le dossier frère `showcase-immobilier.worktrees/DEM-028-workflow-demandes` ; sa branche et ses fichiers locaux ont été conservés. Les commandes de création et de clôture imposent encore `worktree/` et le registre d’environnement peut conserver l’ancien chemin absolu. Les labels Docker peuvent eux aussi conserver un ancien répertoire de travail.

Dans la session d’interview, le dossier frère n’était pas visible et Git signalait ses entrées comme « prunable » : ce constat ne démontre pas leur état hors de cet environnement. Ne pas considérer DEM-028 comme clôturable ni son environnement comme utilisable sans vérifications effectives.

## Décisions et critères observables

- Créer les nouvelles demandes dans le dossier frère `showcase-immobilier.worktrees/`. Reprendre les demandes existantes à leur emplacement enregistré par Git, sans déplacement automatique ; préserver les anciens worktrees de couche.
- Préserver les chemins historiques des cartes et contrôler séparément le chemin courant de la demande.
- En cas de divergence entre le registre et le chemin après déplacement, fournir un diagnostic et une correction explicite contrôlée, conservant identité et ports après vérification des ressources.
- Identifier les ressources Docker portant l’ancien chemin ; prévoir leur arrêt ou leur recréation ciblés et contrôlés, sans suppression de données.
- Appliquer aux deux emplacements la même procédure de clôture contrôlée après fusion et résolution des incohérences, avec les protections existantes relatives aux preuves, à l’activité et aux données.
- Supprimer `worktree/README.md` dans la consolidation, vérifier ses références et conserver ailleurs uniquement les informations durables utiles qui ne sont pas déjà documentées.

## Périmètre et questions pour l’analyse

Examiner la création et la reprise, les contrôles de chemins des cartes, le registre et les ports, les chemins et labels Docker, la clôture après fusion, la documentation et les anciens worktrees. Définir une transition explicite sans déplacement automatique ni suppression de données. Examiner les identités ambiguës, collisions, chemins symboliques ou indisponibles, ressources actives et registre incohérent ; déterminer les refus et preuves nécessaires avant toute correction.

Définir les tests déterministes et les recettes humaines appropriés : création et reprise aux deux emplacements, collisions, préservation des traces, correction contrôlée du registre et des ports, identification Docker et clôture autorisée ou refusée. Distinguer les simulations des essais réels nécessitant des services. Mettre à jour la documentation des tests CI/CD si ceux-ci changent. Utiliser DEM-028 comme cas concret après vérification de son état réel, sans intervenir automatiquement sur ses fichiers ou ressources.

Aucune migration générale, suppression de données, modification du code ou des conventions n’est autorisée pendant cette interview. La réalisation et les choix techniques détaillés relèvent des étapes ultérieures.

## Analyse partielle — 2026-11-27

Base examinée : `develop` local `53ef9d662fa0bce1a9b7a604721b3956036678a0`, sans fetch. Lecture statique du dépôt principal ; les copies de worktrees ne sont pas comptées comme occurrences. Le dossier frère et les worktrees enregistrés sont inaccessibles dans cette session : registre réel, ressources Docker, disponibilité et état de DEM-028 restent inconnus. La couverture est donc incomplète et aucune conclusion sur sa migration ou sa clôture n'est possible.

- `infra/scripts/demand_worktree.py` construit le chemin sous `worktree/` et refuse une reprise ailleurs. `demand_delivery.py` impose le même parent, compare le chemin du registre et les labels Compose avant nettoyage, et préserve les volumes et fichiers locaux non reconnus.
- `demand_environment.py` associe cinq ports et un suffixe d'hôte à un chemin absolu dans un registre verrouillé ; un chemin différent est refusé. L'identité Compose dépend du dépôt principal et de la demande, tandis que le répertoire Compose utilise le chemin courant. Un changement de registre seul ne démontre donc pas que les conteneurs, montages et labels sont cohérents.
- `check_devbook.py` contrôle les métadonnées des cartes nouvelles par comparaison du dernier composant du chemin à la branche ; il ne vérifie pas l'identité du worktree Git. Le modèle de carte utilise le chemin interne. `demand_status.py` découvre les worktrees depuis Git et signale les sources indisponibles, sans garantir leur contenu.
- La suppression du README touche notamment `infra/docker/Dockerfile.playwright`, les sélections de `check_docs.py` et `check_readmes.py`, leurs fixtures, ainsi que `.gitignore` et la documentation. Les tests de couches et chemins `worktree/web`, `worktree/dashboard` ont un rôle historique distinct et ne doivent pas être supprimés par assimilation.

### Orientations à préciser

Privilégier une découverte Git avec vérifications explicites d'identité et d'emplacements autorisés plutôt qu'une confiance dans le seul nom du dossier ; refuser les doublons, liens symboliques et espaces indisponibles. Comparer ce choix à une liste stricte de deux parents, notamment pour la portabilité et les chemins historiques. Prévoir une correction du registre sous verrou après vérification de l'identité et des ressources, conservant les ports ; ses préconditions, modalités de sauvegarde et d'arrêt ciblé restent à concevoir. Les contrôles d'identité et de sécurité doivent être bloquants ; les diagnostics d'inventaire peuvent rester informatifs lorsqu'ils ne précèdent pas une écriture.

Couvrir par tests en dépôts et registres temporaires les deux emplacements, collisions, liens symboliques, absence, ambiguïté, ports inchangés et concurrents, incohérences Docker, données conservées et refus de clôture ; vérifier les fixtures documentaires et la construction Playwright affectée. Les tests réels de services et de transition restent humains. Les contrôles actuels et leur couverture globale doivent encore être examinés, notamment les montages Compose, les exclusions de parcours et les impacts sur `TEST.md`.

L'analyse complète, l'arbitrage des modalités et le découpage restent en attente : le worktree de demande requis dans le dossier frère et les métadonnées Git sont hors des racines d'écriture autorisées de cette session. Ne pas créer un emplacement alternatif ni modifier les espaces existants pour contourner cette limite.

### Vérification hors sandbox — 2026-11-27

Le dossier frère est accessible hors sandbox. Git y reconnaît DEM-028 sur `demands/DEM-028-workflow-demandes`, HEAD `7fcb319f3d8665704ca19c8ad55f2e8d3f9831d2` ; son état Git ordinaire ne montre aucun changement. Cela ne démontre ni l'absence de fichiers ignorés ni la disponibilité humaine. L'entrée DEM-028 est absente du registre local actuel ; aucune conclusion n'en découle sur les ressources Docker, qui n'ont pas été inspectées. Un worktree DEM-012 est également enregistré dans l'ancien emplacement. Les cinq entrées historiques de couche apparaissent « prunable » hors sandbox : aucune suppression ni réparation ne doit en être déduite.

La restriction d'écriture du sandbox reste applicable au dossier frère et aux métadonnées Git ; une opération hors sandbox autorisée sera nécessaire pour créer le worktree DEM-029 et y écrire. Le constat d'inaccessibilité précédent était propre au sandbox, pas à l'hôte.

### Arbitrage humain — 2026-11-27

L'humain confirme : seuls les deux parents contrôlés (dossier frère et ancien dossier interne) sont admis pour la reprise et la clôture après vérification Git ; correction explicite du chemin de registre sous verrou avec conservation des ports et de l'identité ; refus tant que des ressources Docker identifiées portent l'ancien chemin, avec traitement ciblé explicite préalable. Les contrôles d'identité, collisions et sécurité sont bloquants ; les diagnostics d'inventaire sont informatifs lorsqu'ils ne précèdent pas une écriture.

## Découpage préparé

| Carte | Responsabilité | Dépendances |
| --- | --- | --- |
| [OPS-105 — Créer et reprendre les worktrees de demande](../tasks/OPS-105-identifier-worktrees-demande.md) | DevOps | Aucune |
| [OPS-106 — Diagnostiquer et corriger les chemins des environnements](../tasks/OPS-106-corriger-registre-environnements.md) | DevOps | OPS-105 validée et commitée |
| [OPS-107 — Contrôler la clôture des deux emplacements](../tasks/OPS-107-cloturer-worktrees-demande.md) | DevOps | OPS-105 et OPS-106 validées et commitées |
| [OPS-108 — Adapter le contrôle des cartes et les fixtures documentaires](../tasks/OPS-108-controler-chemins-cartes.md) | DevOps | OPS-105 validée et commitée |
| [OPS-109 — Documenter la transition et retirer le README historique](../tasks/OPS-109-documenter-transition-worktrees.md) | DevOps | OPS-105 à OPS-108 validées et commitées |

Les dépendances indiquent l’ordre de réalisation ; les contrôles d’ensemble et essais réels restent à effectuer sur la contribution finale.

### Ajustement du découpage — 2026-11-27

L’humain confirme le déplacement vers OPS-105 de l’adaptation minimale de clôture et des tests concernés, pour préserver le contrat entre les commits ; OPS-107 conserve les vérifications approfondies des ressources et des refus.

### Coordination des contrôles documentaires

Les adaptations des fixtures et sélections relatives à `worktree/README.md` sont coordonnées avec sa suppression en OPS-109 : les supprimer en OPS-108 désactiverait prématurément la couverture du fichier encore présent. OPS-108 reste responsable du contrôle des chemins des cartes.

## Déclaration de contribution

```contribution-json
{
  "version": 1,
  "corrections": [
    {
      "chemins": [
        "infra/scripts/demand_worktree.py",
        "infra/scripts/demand_delivery.py",
        "infra/scripts/demand_environment.py",
        "infra/tests/test_demand_worktree.py",
        "infra/tests/test_demand_delivery.py",
        "infra/tests/test_demand_environment.py",
        "infra/make/Makefile.ai-development-engineering"
      ],
      "convention": "infra/README.md#mode-test-des-couches",
      "controles": [
        "infra/tests/test_demand_worktree.py",
        "infra/tests/test_demand_delivery.py",
        "infra/tests/test_demand_environment.py"
      ]
    },
    {
      "chemins": [
        "codebase-integrity/domaines/construction-livraison/scripts/check_devbook.py",
        "codebase-integrity/domaines/construction-livraison/tests/test_devbook.py"
      ],
      "convention": "dev-book/README.md#identification-des-missions",
      "controles": [
        "codebase-integrity/domaines/construction-livraison/tests/test_devbook.py"
      ]
    },
    {
      "chemins": [
        "codebase-integrity/domaines/fiabilite-verifications/scripts/check_docs.py",
        "codebase-integrity/domaines/fiabilite-verifications/scripts/check_readmes.py",
        "codebase-integrity/domaines/fiabilite-verifications/tests/test_docs.py",
        "codebase-integrity/domaines/construction-livraison/tests/test_worktrees.py"
      ],
      "convention": "docs/README.md#vérification-et-relecture",
      "controles": [
        "codebase-integrity/domaines/fiabilite-verifications/tests/test_docs.py",
        "codebase-integrity/domaines/construction-livraison/tests/test_worktrees.py"
      ]
    }
  ],
  "accompagnements": [
    {
      "chemins": [
        "TEST.md",
        "README.md",
        ".gitignore",
        "worktree/README.md",
        "dev-book/templates/carte.md",
        "docs/README.md",
        "docs/1.getting-started/worktrees.md",
        "docs/controles/controle-contributions.md",
        "infra/docker/Dockerfile.playwright"
      ],
      "motif": "Adapter les guides, la recette et la construction à la transition et à la suppression du README historique."
    }
  ],
  "sans_correction": ""
}
```
