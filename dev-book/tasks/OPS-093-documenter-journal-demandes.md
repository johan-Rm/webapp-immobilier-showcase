# OPS-093 — Définir la règle locale du journal des demandes

- Demande : DEM-020
- Type : consolidation
- Brouillon au principal : `tmp/demande-consolidation-journal-demandes.md`
- Demande définitive prévue : `dev-book/demand/DEM-020-journal-versionne-demandes.md`
- Session de création : 01a2175b-509d-76f2-8a98-746661b2e1fa
- Couche : devops
- Branche : layers/devops
- Worktree : worktree/devops
- État : implémentée et commitée, à vérifier
- Chemins autorisés : AGENTS.md, docs/worktrees.md, docs/1.getting-started/ai-workflow.md, `dev-book/tasks/OPS-093-documenter-journal-demandes.md`
- Dépendances : Aucune.

## Résultat et critères

- Documenter la réservation locale, l’espace documentaire dès l’ouverture, les commits d’étape et la responsabilité de chaque intervenant.
- Définir les exceptions historiques, la conservation d’une archive locale et la libération après preuve du squash humain.
- Relire les trois sources ensemble et consigner les références. Préserver les skills partagés et les conventions des autres projets.

## Réalisation et preuves

Règle locale et brouillon documentaire intégrés au commit de cette carte.

## Verdict humain

Aucun verdict humain.

## Commits

En attente d’implémentation.

### Brouillon pour la reconstitution

Dans `docs/worktrees.md`, documenter les espaces documentaires créés à
l’ouverture depuis une base explicite, le journal local, la vérification avant
publication et la libération après preuve du squash et archivage. Les espaces
documentaires ne démarrent aucun service et ne préparent aucun secret.

Dans `docs/1.getting-started/ai-workflow.md`, expliquer que les cartes restent
éditables dans leurs couches, que le journal référence leurs révisions et
verdicts, et que seuls les commits validés rejoignent la branche de demande.
Appliquer la dérogation locale à la création tardive prévue par les skills
communs et pointer vers le guide des worktrees.
