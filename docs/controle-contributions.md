# Contrôle local des contributions

> Exécuter le contrôle depuis une base explicite et comprendre l’amorçage réservé à la première installation du cadre.

## Utilisation

Depuis la racine du worktree concerné, la commande `make contribution-check BASE=<sha-cible> HEAD=<sha-candidat>` contrôle une plage explicite avec le vérificateur extrait de la base d’intégration. Remplacer les paramètres par les identifiants Git complets effectivement vérifiés.

Les [conventions de contribution](../codebase-integrity/README.md#contributions) définissent les exigences applicables. Les résultats du contrôle ne remplacent pas le verdict humain.

## Amorçage initial

L’option `--bootstrap-policy-sha` du lanceur `codebase-integrity/domaines/construction-livraison/scripts/contribution.py` permet de charger un contenu de politique explicitement approuvé lorsque la base d’intégration initiale ne porte pas encore le contrôle.

Cette opération exige un **SHA complet approuvé explicitement** et reste réservée à la **base initiale de DEM-001**. Elle ne constitue pas une option générale pour désactiver un contrôle ou remplacer la politique d’une contribution courante.

Les preuves d’approbation et d’exécution appartiennent à la demande et à ses cartes ; ce document n’en déclare aucune nouvelle.
