# OPS-106 — Diagnostiquer et corriger les chemins des environnements

- Demande : DEM-029
- Session de création : 01a21cf5-ae80-79e1-93aa-e5bca7961807
- Couche : devops
- Branche : demands/DEM-029-emplacement-worktrees
- Worktree : /home/johan/www/graines-digitales/modern-web-apps/showcase-immobilier.worktrees/DEM-029-emplacement-worktrees
- État : prête
- Chemins autorisés : infra/scripts/demand_environment.py, infra/scripts/demand_delivery.py, infra/tests/test_demand_environment.py, infra/tests/test_demand_delivery.py, infra/make/Makefile.ai-development-engineering, dev-book/tasks/OPS-106-corriger-registre-environnements.md, dev-book/demand/DEM-029-emplacement-worktrees.md
- Dépendances : OPS-105 validée et commitée

## Résultat et critères

Prévoir une commande explicite de diagnostic et correction du chemin sous verrou, conservant les cinq ports et le suffixe ; refuser identité ou registre ambigus et ressources Docker identifiées portant l’ancien chemin. Définir le traitement ciblé explicite sans suppression de données. Tester absence, divergence, concurrence, conflits et échecs ; ne pas supposer un registre présent.

Respecter le cadrage et les décisions de la demande. Ne pas modifier les ressources ou données des worktrees existants. Identifier les contrôles légers exécutés, les tests lourds à réaliser par l’humain et leurs limites.

## Réalisation et preuves

En attente.

## Verdict humain

Aucun verdict humain.

## Commits

En attente.
