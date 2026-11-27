# OPS-100 — Créer et retrouver les espaces de demande

- Demande : DEM-028
- Session de création : 01a21940-493f-7ee2-9901-d4c9a15de91d
- Couche : devops
- Branche : demands/DEM-028-workflow-demandes
- Worktree : worktree/DEM-028-workflow-demandes
- État : implémentée et commitée, à vérifier
- Chemins autorisés : infra/scripts/demand_worktree.py, infra/scripts/demand_status.py, infra/make/Makefile.ai-development-engineering, infra/tests/test_demand_worktree.py, infra/tests/test_demand_status.py, dev-book/demand/DEM-028-workflow-demandes.md, dev-book/tasks/OPS-100-identite-worktree-demande.md
- Dépendances : Aucune

## Résultat et critères

Accepter une branche descriptive demands/DEM-NNN-sujet depuis develop vérifié ; détecter les collisions et réutiliser sans écraser ; maintenir les identités historiques. Couvrir les accès concurrents, reprises, branches et chemins divergents par des tests Git temporaires.

## Réalisation et preuves

Création descriptive avec verrou par identifiant, reprise de la branche attendue et prise en compte du brouillon réservé ; inventaire des branches descriptives. `python3 -B -m unittest discover -s infra/tests -p 'test_demand*.py'` : 18 tests réussis, dépôts Git temporaires. Aucun service lancé.

## Verdict humain

Verdict humain du 27 novembre 2026 : « validé » pour le commit initial `0267135813fbc57dd7cc8f59750343184c808aa0`, avec la revue signalant la reprise historique et la clôture descriptive.


Verdict humain complémentaire du 27 novembre 2026 : « validé » pour le correctif de reprise des anciennes demandes.

```verdict-json
{
  "decision": "validé",
  "portee": "OPS-100 ; correctif de reprise des branches historiques",
  "contenu": {"type": "git", "valeur": "eb29270f3a05cbef8aaf4a43664685fb309c4c76"}
}
```

## Commits

SHA référencé dans la trace de la demande.
