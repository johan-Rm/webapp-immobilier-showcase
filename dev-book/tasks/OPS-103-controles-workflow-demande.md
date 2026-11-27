# OPS-103 — Contrôler les nouvelles conventions de demande

- Demande : DEM-028
- Session de création : 01a21940-493f-7ee2-9901-d4c9a15de91d
- Couche : devops
- Branche : demands/DEM-028-workflow-demandes
- Worktree : worktree/DEM-028-workflow-demandes
- État : prête à vérifier, non commitée
- Chemins autorisés : TEST.md, codebase-integrity/domaines/construction-livraison/, infra/tests/, infra/scripts/demand_status.py, dev-book/templates/carte.md, dev-book/README.md, dev-book/demand/DEM-028-workflow-demandes.md, dev-book/tasks/OPS-103-controles-workflow-demande.md
- Dépendances : OPS-100, OPS-101, OPS-102

## Résultat et critères

Contrôler les nouvelles cartes et leur rattachement, nommage et chemins sans réinterpréter les historiques ; couvrir exemples conformes, écarts et exceptions. Vérifier les consommateurs des identités de demande et les diagnostics existants ; conserver les contrôles de contribution.

## Réalisation et preuves

Le contrôle des nouvelles cartes exige une demande et une couche uniques, une branche descriptive correspondant à la demande et un worktree de même nom. Les cartes déjà présentes sur la base conservent les contrôles historiques. L’inventaire reconnaît les branches descriptives et signale les identités ambiguës sans masquer leurs sources.

`python3 -B -m unittest discover -s codebase-integrity/domaines/construction-livraison/tests -p 'test_devbook.py'` : 10 tests réussis. `python3 -B -m unittest discover -s infra/tests -p 'test_demand_status.py'` : 11 tests réussis. Le contrôle dev-book sur la base de DEM-028 vérifie cinq cartes sans écart. Aucun test avec service lancé ; la véracité des champs et l’activité réelle restent à examiner humainement.

## Verdict humain

```verdict-json
{
  "decision": "validé",
  "portee": "OPS-103 ; changement examiné avant commit le 27 novembre 2026",
  "contenu": {"type": "git", "valeur": "b7e926a98bfb9b458c32e45a8e294ad725fbbc51"}
}
```

## Commits

À renseigner après implémentation.
