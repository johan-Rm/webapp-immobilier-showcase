# OPS-109 — Documenter la transition et retirer le README historique

- Demande : DEM-029
- Session de création : 01a21cf5-ae80-79e1-93aa-e5bca7961807
- Couche : devops
- Branche : demands/DEM-029-emplacement-worktrees
- Worktree : /home/johan/www/graines-digitales/modern-web-apps/showcase-immobilier.worktrees/DEM-029-emplacement-worktrees
- État : validée par l’humain
- Chemins autorisés : README.md, AGENTS.md, .gitignore, worktree/README.md, docs/README.md, docs/1.getting-started/worktrees.md, docs/controles/controle-contributions.md, infra/docker/Dockerfile.playwright, TEST.md, codebase-integrity/domaines/fiabilite-verifications/scripts/check_docs.py, codebase-integrity/domaines/fiabilite-verifications/scripts/check_readmes.py, codebase-integrity/domaines/fiabilite-verifications/tests/test_docs.py, codebase-integrity/domaines/fiabilite-verifications/tests/test_readmes.py, codebase-integrity/domaines/construction-livraison/tests/test_worktrees.py, dev-book/tasks/OPS-109-documenter-transition-worktrees.md, dev-book/demand/DEM-029-emplacement-worktrees.md
- Dépendances : OPS-105 à OPS-108 validées et commitées

## Résultat et critères

Supprimer le README demandé, vérifier toutes ses références et préserver seulement les informations durables non dupliquées. Adapter au même changement les contrôles et fixtures qui référencent ce README, ainsi que Dockerfile, guides, commandes et TEST.md si les tests CI/CD changent. Fournir une recette humaine de transition et de deux environnements, sans déplacer ni supprimer automatiquement les données. Vérifier les liens et la construction Playwright selon les contraintes de tests lourds.

Respecter le cadrage et les décisions de la demande. Ne pas modifier les ressources ou données des worktrees existants. Identifier les contrôles légers exécutés, les tests lourds à réaliser par l’humain et leurs limites.

## Réalisation et preuves

Suppression du README historique, de son exception Git et de sa copie dans l’image Playwright ; les contrôles et leur fixture excluent désormais le dossier historique. Les guides décrivent les deux emplacements, la correction explicite du registre et la clôture autorisée séparément de l’intégration. Les traces historiques sont conservées. La déclaration de contribution couvre les changements de DEM-029.

Depuis ce worktree : tests Python ciblés `test_docs.py` : 30 réussis ; `test_readmes.py` : 16 réussis ; `test_worktrees.py` : 15 réussis. `make conventions-tests-docs` : 4 étapes réussies. `git diff --check` réussi. Le Dockerfile est adapté statiquement : aucune image n’a été construite. Les essais réels de transition et de deux environnements avec Docker restent à réaliser par l’humain ; aucun worktree existant ni registre réel n’a été déplacé ou modifié.

La clôture nécessite une autorisation explicite applicable, distincte de la preuve d’intégration. L’examen des ressources sans labels reconnus reste manuel.

## Verdict humain

Verdict explicite de l’humain le 2026-11-27.

```verdict-json
{
  "decision": "validé",
  "portee": "OPS-109 : changements présentés ; empreinte du guide worktrees",
  "contenu": {
    "type": "sha256",
    "fichier": "docs/1.getting-started/worktrees.md",
    "valeur": "86c66496a8f748eb1f0d811b2d8b311ac8f086414ba97fc8df607c8e25e6c16c"
  }
}
```

## Commits

`4a0dafa461675961a1be1b53e4b9ca12beed1af9`

Vérification globale : validation humaine du 27 novembre 2026 sur `95324bb638fe3bc216c54a60ff08c964d3fb8a27`, avec les limites consignées dans la demande.
