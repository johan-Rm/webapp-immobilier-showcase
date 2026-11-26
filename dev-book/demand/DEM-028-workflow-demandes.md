# DEM-028 — Aligner le workflow et les environnements sur les demandes

- Type : consolidation
- Session de création : 01a21940-493f-7ee2-9901-d4c9a15de91d
- Date : 2026-11-26
- État : analysée et découpée ; implémentation à réaliser.

## Constat et objectif

Le cadre AIDE évolue vers un worktree et une branche dédiés à chaque demande dès l’analyse. Les conventions, guides, modèles et commandes de Showcase décrivent ou appliquent encore en partie les worktrees de couche et la reconstitution. L’objectif est de les aligner sur le nouveau workflow et de permettre aux développeurs de tester plusieurs demandes simultanément.

Les cartes restent typées par couche technique et sont implémentées dans le worktree de la demande, avec un commit local par tâche. La vérification humaine précède la livraison ; la reconstitution disparaît pour les nouvelles demandes.

## Décisions et critères observables

- Au moins deux demandes peuvent démarrer et tester simultanément leurs serveurs, puis être arrêtées indépendamment. Chacune dispose d’un vhost temporaire dont l’adresse reste stable entre les démarrages.
- Le site public et le dashboard sont accessibles selon les besoins de la demande. Les ressources locales sont isolées ; les demandes utilisent la même API distante et peuvent partager ses données.
- Les données locales nécessaires sont chargées au setup ou au build. Après preuve de livraison, les ressources temporaires, les données locales, le worktree et la branche locale de la demande sont retirés automatiquement, après vérification de l’absence de travail inédit. Sinon, le travail est préservé et le blocage signalé.
- Les anciens environnements de couche sont remplacés progressivement ; leur contenu et les traces historiques sont préservés pendant la transition.
- Les contrôles finaux portent sur le SHA final. L’humain exécute les tests CI/CD préalables, vérifie la PR et effectue le squash merge vers `develop`.

## Périmètre et questions pour l’analyse

Examiner les conventions et contrôles applicables, les commandes Git et de services, la documentation, les modèles et la transition des environnements existants. Définir les mécanismes d’isolation, de chargement des données, de nettoyage et les preuves associées, y compris les cas de collision et de travail inédit. Vérifier les impacts sur les contrôles et leur documentation.

Les modifications du cadre AIDE partagé et de l’API externe sont exclues. Les anciennes demandes et cartes conservent leurs traces historiques.

## Cartes et dépendances

| Carte | Résultat | Dépendance |
| --- | --- | --- |
| [OPS-100](../tasks/OPS-100-identite-worktree-demande.md) | Identité et création de demande | Aucune |
| [OPS-101](../tasks/OPS-101-environnement-demande.md) | Environnements et vhosts isolés | OPS-100 |
| [OPS-102](../tasks/OPS-102-nettoyage-demande-livree.md) | Clôture et nettoyage contrôlé | OPS-100, OPS-101 |
| [OPS-103](../tasks/OPS-103-controles-workflow-demande.md) | Contrôles et compatibilité du journal | OPS-100, OPS-101, OPS-102 |
| [OPS-104](../tasks/OPS-104-documenter-workflow-demande.md) | Guides et recette finale | OPS-100 à OPS-103 |

Les dépendances de réalisation portent sur les commits des cartes ; la validation simultanée des deux environnements est un contrôle d’ensemble manuel.

## Analyse initiale — 2026-11-26

Base locale examinée : `develop` à `a1c832a736e62609ae2836709a1ddf4d0c5f2d7a`. Aucun fetch. Les worktrees de couche sont des historiques distincts, exclus du comptage des occurrences.

- `AGENTS.md`, `docs/1.getting-started/ai-workflow.md`, `docs/1.getting-started/worktrees.md`, `dev-book/templates/carte.md`, `TEST.md` et `docs/controles/` décrivent encore la reconstitution ou l’affectation par couche. Les traces historiques des demandes et cartes ne sont pas à réécrire.
- `infra/scripts/demand_worktree.py` crée `demands/DEM-NNN` ; `demand_delivery.py` retrouve ce nom, contrôle l’arbre du squash, archive la tête et retire le worktree. Il refuse notamment les fichiers ignorés. Adapter le nommage, la découverte et la clôture sans assimiler fichiers ignorés et données jetables.
- `infra/scripts/lanes.py` résout une branche de couche ; les identités et ports de test utilisent les identifiants de couche. Compose et Nginx utilisent `AIDE_LAYER`, des ports associés et, pour le dashboard de développement, un hôte fixé. `test-up` a un port par défaut fixe. Ces mécanismes ne démontrent pas l’isolation de deux demandes.
- Des tests existent dans `infra/tests/test_demand_worktree.py`, `test_demand_delivery.py`, `test_lanes.py`, ainsi que dans Codebase Integrity et `infra/nginx/test-local-vhosts.py`. Le contrôle dev-book accepte actuellement les branches `layers/` et `demands/` : il ne garantit pas la nouvelle règle. Les tests de configuration Nginx documentés exigent Docker ; aucun service ni test lourd n’a été lancé.
- Les données et secrets locaux, les volumes de projection, la résolution des vhosts, les modes développement et test, les images et caches doivent être inventoriés avant de qualifier une ressource de jetable. L’API distante est partagée ; son isolation et sa modification sont exclues.

### Options à arbitrer

1. Identité d’environnement : proposer une identité stable par DEM, avec allocation locale persistante des ports et noms d’hôtes, détection de collision et refus explicite. Une formule fixe est plus simple mais limite la plage et ne résout pas les conflits avec d’autres processus ; l’allocation nécessite un registre et une protection contre les créations concurrentes.
2. Transition : conserver les commandes de couche pour les missions historiques pendant l’introduction des commandes par demande, puis documenter leur retrait progressif. Une suppression immédiate est plus simple mais risque de bloquer les environnements existants.
3. Nettoyage : vérifier preuve de squash, identité, absence d’activité et travail inédit ; inventorier précisément les ressources propres à la demande et refuser tout état ambigu. Nettoyer seulement les ressources explicitement identifiées comme jetables, préserver les secrets ou fichiers non reconnus et signaler un blocage. Archiver la tête avant suppression de la branche pour conserver les commits de tâches après squash.
4. Contrôles : tests déterministes bloquants sur nommage, collisions, rattachement, isolation calculée et refus de suppression ; contrôle documentaire de la nouvelle règle sans réinterpréter les traces historiques. Les essais réels de deux serveurs, des vhosts et de l’arrêt indépendant sont manuels avec Docker ; ils constituent des preuves distinctes des simulations.

L’humain a confirmé ces quatre principes le 2026-11-26. La mise en œuvre précise reste à définir dans les limites de ces décisions.

### Compléments de couverture

La recherche des références actives hors historiques et copies de worktrees inclut également `Makefile`, les scripts de diagnostic des piles, `webapp/scripts/quality/run.ts`, les tests des environnements et du routage dans Codebase Integrity, ainsi que les guides d’architecture et du dashboard. Les occurrences des runbooks et des demandes, cartes et rapports historiques sont conservées comme traces ; leur valeur normative doit être distinguée lors de l’implémentation.

`environment.py` impose actuellement la branche de couche, calcule les ports depuis son identifiant, génère un `.env` privé et refuse les destinations hors worktree ou symboliques. Il crée des répertoires de données et de cache ; le dashboard utilise aussi des sessions et un journal de publication. Ces éléments ne sont pas automatiquement considérés comme régénérables : leur provenance et leur traitement doivent être prouvés avant nettoyage. L’infrastructure documente que la perte du journal ne garantit pas la reconstitution de la file. La portée exacte des contrôles de tous les consommateurs reste à vérifier dans les cartes.
