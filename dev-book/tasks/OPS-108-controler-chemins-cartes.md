# OPS-108 — Adapter le contrôle des cartes et les fixtures documentaires

- Demande : DEM-029
- Session de création : 01a21cf5-ae80-79e1-93aa-e5bca7961807
- Couche : devops
- Branche : demands/DEM-029-emplacement-worktrees
- Worktree : /home/johan/www/graines-digitales/modern-web-apps/showcase-immobilier.worktrees/DEM-029-emplacement-worktrees
- État : validée par l’humain
- Chemins autorisés : codebase-integrity/domaines/construction-livraison/scripts/check_devbook.py, codebase-integrity/domaines/construction-livraison/tests/test_devbook.py, codebase-integrity/domaines/fiabilite-verifications/scripts/check_docs.py, codebase-integrity/domaines/fiabilite-verifications/scripts/check_readmes.py, codebase-integrity/domaines/fiabilite-verifications/tests/test_docs.py, codebase-integrity/domaines/fiabilite-verifications/tests/test_readmes.py, codebase-integrity/domaines/construction-livraison/tests/test_worktrees.py, dev-book/templates/carte.md, TEST.md, dev-book/tasks/OPS-108-controler-chemins-cartes.md, dev-book/demand/DEM-029-emplacement-worktrees.md
- Dépendances : OPS-105 validée et commitée

## Résultat et critères

Définir et tester les chemins courants des nouvelles cartes pour les deux parents, préserver les traces historiques ; distinguer contrôle statique et vérification Git effective. Les adaptations des contrôles et fixtures liées à la suppression du README sont réalisées avec cette suppression dans OPS-109 afin de préserver leur couverture intermédiaire.

Respecter le cadrage et les décisions de la demande. Ne pas modifier les ressources ou données des worktrees existants. Identifier les contrôles légers exécutés, les tests lourds à réaliser par l’humain et leurs limites.

## Réalisation et preuves

Le contrôle accepte les formes internes historiques et les chemins absolus sous un parent `worktree` ou un parent se terminant par `.worktrees`, avec un nom cohérent avec la branche. Il refuse les formes étrangères ou avec traversée `..` et conserve le traitement historique des cartes existantes. Le modèle demande désormais le chemin absolu.

Depuis le worktree : `python3 -B -m unittest discover -s codebase-integrity/domaines/construction-livraison/tests -p test_devbook.py` : 11 tests réussis ; `python3 -B codebase-integrity/domaines/construction-livraison/scripts/check_devbook.py --base 53ef9d662fa0bce1a9b7a604721b3956036678a0` : 5 cartes sans écart ; `git diff --check` réussi. Ce contrôle est statique : il ne prouve ni l’identité du dépôt, ni l’enregistrement Git, ni l’existence ou la disponibilité de l’espace. Les commandes de worktree assurent séparément leurs propres vérifications.

## Verdict humain

Verdict explicite de l’humain le 2026-11-27.

```verdict-json
{
  "decision": "validé",
  "portee": "OPS-108 et coordination OPS-109 : changements présentés ; empreinte du contrôle",
  "contenu": {
    "type": "sha256",
    "fichier": "codebase-integrity/domaines/construction-livraison/scripts/check_devbook.py",
    "valeur": "58f8f8bd7b784943170b6d01f068271fd8bf6368f011bd0ba5faa4fba9d8e964"
  }
}
```

## Commits

`2f7f08ed58f56c664df5e80f570568170143a8a8` ; correctif `95324bb638fe3bc216c54a60ff08c964d3fb8a27`

Vérification globale : validation humaine du 27 novembre 2026 sur `95324bb638fe3bc216c54a60ff08c964d3fb8a27`, avec les limites consignées dans la demande.
