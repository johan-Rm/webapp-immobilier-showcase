# OPS-094 — Ouvrir et inventorier les espaces de demande

- Demande : DEM-020
- Type : consolidation
- Brouillon au principal : `tmp/demande-consolidation-journal-demandes.md`
- Demande définitive prévue : `dev-book/demand/DEM-020-journal-versionne-demandes.md`
- Session de création : 01a2175b-509d-76f2-8a98-746661b2e1fa
- Couche : devops
- Branche : layers/devops
- Worktree : worktree/devops
- État : implémentée et commitée, à vérifier
- Chemins autorisés : infra/scripts/, infra/make/Makefile.ai-development-engineering, infra/tests/, `dev-book/tasks/OPS-094-ouvrir-et-inventorier-demandes.md`
- Dépendances : Règle OPS-093 à appliquer. Aucune dépendance de code.

## Résultat et critères

- Créer la branche et le worktree documentaire depuis une base develop explicite. Refuser une identité ambiguë ou un espace occupé et accepter la relance pour la même demande.
- Réutiliser l’inventaire pour afficher les demandes sans doublons hérités. Préserver le principal, les services et les secrets.
- Vérifier en dépôts temporaires deux ouvertures indépendantes, la réservation concurrente du même numéro, la relance et le refus d’écrasement. Consigner les commandes et résultats.

## Réalisation et preuves

Commande `make demand-open DEMAND=DEM-NNN BASE=<sha-develop>`. Tests locaux sans service avec `python3 -B -m unittest discover -s infra/tests -p test_demand_worktree.py`. Trois scénarios réussis. L’inventaire privilégie le document actif face au brouillon de même titre et conserve les sources contradictoires.

## Verdict humain

Aucun verdict humain.

## Commits

En attente d’implémentation.
