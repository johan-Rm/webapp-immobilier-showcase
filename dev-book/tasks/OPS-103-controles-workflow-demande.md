# OPS-103 — Contrôler les nouvelles conventions de demande

- Demande : DEM-028
- Session de création : 01a21940-493f-7ee2-9901-d4c9a15de91d
- Couche : devops
- Branche : demands/DEM-028-workflow-demandes
- Worktree : worktree/DEM-028-workflow-demandes
- État : validée ; correctif commité
- Chemins autorisés : TEST.md, codebase-integrity/domaines/construction-livraison/, infra/tests/, infra/scripts/demand_status.py, dev-book/templates/carte.md, dev-book/README.md, dev-book/demand/DEM-028-workflow-demandes.md, dev-book/tasks/OPS-103-controles-workflow-demande.md
- Dépendances : OPS-100, OPS-101, OPS-102

## Résultat et critères

Contrôler les nouvelles cartes et leur rattachement, nommage et chemins sans réinterpréter les historiques ; couvrir exemples conformes, écarts et exceptions. Vérifier les consommateurs des identités de demande et les diagnostics existants ; conserver les contrôles de contribution.

## Réalisation et preuves

Correctif : les tests des vérificateurs et le contrôle frontend utilisent
l’image préparée par `checks-rebuild`, plutôt que des dépendances Bun locales.
Relance humaine sur le correctif non commité : `make checks-rebuild`,
`make internal-tests-verifiers VERBOSE=1` et `make conventions-tests-frontend
GD_TARGET=showcase-immobilier VERBOSE=1` réussis. Les tests des vérificateurs
comptent 203 tests Python, 102 Vitest et 44 Bun ; 213 fichiers frontend examinés.
Le job GitHub `cadre` a ensuite échoué : l’image locale n’y est pas préparée.
La correction rétablit l’exécution sur le runner GitHub, qui installe les dépendances,
et conserve l’image préparée pour les exécutions locales.

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

L’humain a validé le correctif avant son commit `7d8c9f5676ad350a88f4ea3fdb73f61514024b15`.

## Commits

`b7e926a98bfb9b458c32e45a8e294ad725fbbc51` ; correctif `7d8c9f5676ad350a88f4ea3fdb73f61514024b15`.
