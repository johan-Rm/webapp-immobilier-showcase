# OPS-095 — Contrôler le rattachement des cartes et la clôture

- Demande : DEM-020
- Type : consolidation
- Brouillon au principal : `tmp/demande-consolidation-journal-demandes.md`
- Demande définitive prévue : `dev-book/demand/DEM-020-journal-versionne-demandes.md`
- Session de création : 01a2175b-509d-76f2-8a98-746661b2e1fa
- Couche : devops
- Branche : layers/devops
- Worktree : worktree/devops
- État : implémentée et commitée, à vérifier
- Chemins autorisés : codebase-integrity/README.md, codebase-integrity/domaines/construction-livraison/, infra/scripts/, infra/tests/, infra/make/Makefile.ai-development-engineering, docs/controle-contributions.md, `dev-book/tasks/OPS-095-controler-contribution-et-cloture.md`
- Dépendances : OPS-094 : 598226c3f010d8b5b6f4edc0d0b48ee09246bebe (contrat des espaces documentaires).

## Résultat et critères

- Bloquer la publication en cas de collision sur la cible vérifiée ou de nouvelle carte sans demande identifiable. Préserver les cartes historiques et signaler les limites de l’inventaire local.
- Exiger la preuve du squash humain, la correspondance du changement intégré, un espace disponible et une archive locale avant libération.
- Vérifier en dépôts temporaires une carte valide, une carte orpheline, une exception historique, une collision entre clones simulée, un squash vérifié et les refus si archive, preuve ou disponibilité manquent.

## Réalisation et preuves

Contrôles locaux de publication et de clôture, exercés en dépôts Git temporaires sans serveur. Trois scénarios réussis. Tests ciblés : `python3 -B -m unittest discover -s infra/tests -p test_demand_delivery.py`. La commande prend des SHA fournis par l’opérateur, qui vérifie la cible et le squash GitHub. La publication distante et la CI n’ont pas été exécutées.

## Verdict humain

Aucun verdict humain.

## Commits

En attente d’implémentation.

### Brouillon pour la reconstitution

Ajouter dans `docs/controle-contributions.md` une procédure pour les demandes
disposant d’un espace documentaire. Après résolution et vérification de la cible
distante, exécuter `make demand-publication-check DEMAND=DEM-NNN TARGET=<sha-cible>
HEAD=<sha-candidat>` en plus du contrôle de contribution. Un échec bloque la
publication. Les cartes historiques conservées sont exemptées du nouveau contrôle.

Après preuve du squash humain, exécuter depuis le principal
`make demand-release DEMAND=DEM-NNN TARGET=<sha-develop> SQUASH=<sha-intégré>`.
Confirmer que l’espace a cessé d’être utilisé. L’outil refuse les espaces verrouillés
ou contenant des changements ou fichiers locaux. Il compare l’arbre attendu à
l’arbre intégré et conserve la tête de demande dans une référence locale d’archive.
