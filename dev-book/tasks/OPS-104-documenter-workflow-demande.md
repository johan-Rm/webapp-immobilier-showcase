# OPS-104 — Documenter le workflow et les validations

- Demande : DEM-028
- Session de création : 01a21940-493f-7ee2-9901-d4c9a15de91d
- Couche : devops
- Branche : demands/DEM-028-workflow-demandes
- Worktree : worktree/DEM-028-workflow-demandes
- État : validée et commitée
- Chemins autorisés : AGENTS.md, README.md, TEST.md, docs/, infra/README.md, dev-book/templates/, Makefile, dev-book/demand/DEM-028-workflow-demandes.md, dev-book/tasks/OPS-104-documenter-workflow-demande.md
- Dépendances : OPS-100, OPS-101, OPS-102, OPS-103

## Résultat et critères

Aligner instructions, guides, modèles et commandes sur les comportements réalisés et la transition. Documenter deux terminaux, prérequis, adresses, SHA final, vérifications humaines et nettoyage ciblé ; préserver les historiques et la structure des README ; actualiser TEST.md si les tests CI/CD changent.

## Réalisation et preuves

Les consignes et guides décrivent les worktrees de demande, la transition des couches, les commandes d’environnement, la clôture et la recette avant livraison sur le SHA final. Les traces historiques et les rubriques des README sont conservées.

`python3 -B codebase-integrity/domaines/fiabilite-verifications/scripts/check_docs.py` : structure, 24 README et liens locaux conformes. La recette de deux serveurs et la suite complète restent à exécuter manuellement ; aucun test avec service ni vérification distante n’a été réalisé.

## Verdict humain

```verdict-json
{
  "decision": "validé",
  "portee": "OPS-104 ; changements examinés avant commit",
  "contenu": {"type": "git", "valeur": "d27d7c979e9e3fad18487db3b1f444d61eb4c4e7"}
}
```

## Commits

`d27d7c979e9e3fad18487db3b1f444d61eb4c4e7`.
