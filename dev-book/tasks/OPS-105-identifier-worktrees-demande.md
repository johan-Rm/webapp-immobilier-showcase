# OPS-105 — Créer et reprendre les worktrees de demande

- Demande : DEM-029
- Session de création : 01a21cf5-ae80-79e1-93aa-e5bca7961807
- Couche : devops
- Branche : demands/DEM-029-emplacement-worktrees
- Worktree : /home/johan/www/graines-digitales/modern-web-apps/showcase-immobilier.worktrees/DEM-029-emplacement-worktrees
- État : à vérifier par l’humain
- Chemins autorisés : infra/scripts/demand_worktree.py, infra/scripts/demand_status.py, infra/tests/test_demand_worktree.py, infra/tests/test_demand_status.py, infra/scripts/demand_delivery.py, infra/tests/test_demand_delivery.py, infra/tests/test_demand_environment.py, TEST.md, dev-book/tasks/OPS-105-identifier-worktrees-demande.md, dev-book/demand/DEM-029-emplacement-worktrees.md
- Dépendances : Aucune

## Résultat et critères

Créer dans le dossier frère et reprendre les espaces Git existants dans les deux parents autorisés. Refuser identité ambiguë, collision, lien symbolique, espace inaccessible ou étranger ; conserver les espaces historiques. Tester les cas positifs, refus et concurrence dans des dépôts temporaires.

Respecter le cadrage et les décisions de la demande. Ne pas modifier les ressources ou données des worktrees existants. Identifier les contrôles légers exécutés, les tests lourds à réaliser par l’humain et leurs limites.

## Réalisation et preuves

Création dans le dossier frère ; reprise et clôture minimales dans les deux parents enregistrés, avec refus des identités ambiguës, chemins symboliques et espaces étrangers ou indisponibles. Les tests consommateurs utilisent des dossiers frères inclus dans leurs répertoires temporaires. TEST.md recense les trois commandes ciblées.

Depuis le worktree de demande : `python3 -B -m unittest discover -s infra/tests -p 'test_demand_worktree.py'` : 9 tests réussis ; remplacer le motif par `test_demand_delivery.py` : 13 réussis ; par `test_demand_environment.py` : 7 réussis. Une première exécution des tests de clôture a révélé un masquage de variable, corrigé avant la seconde exécution. `git diff --check` réussi. Tests en dépôts temporaires ; aucun service Docker ni clôture réelle de DEM-028. Les vérifications approfondies des ressources relèvent d’OPS-107.

## Verdict humain

Verdict explicite de l’humain le 2026-11-27.

```verdict-json
{
  "decision": "validé",
  "portee": "OPS-105 : changements présentés et documents préparés à l’analyse ; empreinte du script principal",
  "contenu": {
    "type": "sha256",
    "fichier": "infra/scripts/demand_worktree.py",
    "valeur": "be34e2ac17b167a325a5df90a02f66701865e559c3e69daf1891d573bd7f4fb5"
  }
}
```

## Commits

En attente.
