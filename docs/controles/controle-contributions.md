# Contrôle local des contributions

> Exécuter le contrôle depuis une base explicite et comprendre l’amorçage réservé à la première installation du cadre.

## Utilisation

Depuis la racine du worktree concerné, la commande `make contribution-check BASE=<sha-cible> HEAD=<sha-candidat>` contrôle une plage explicite avec le vérificateur extrait de la base d’intégration. Remplacer les paramètres par les identifiants Git complets effectivement vérifiés.

Les [conventions de contribution](../../codebase-integrity/README.md#contributions) définissent les exigences applicables. Les résultats du contrôle ne remplacent pas le verdict humain.

## Publication et clôture d’un espace de demande

Après vérification de la cible distante, exécuter depuis la racine du dépôt
`make demand-publication-check DEMAND=DEM-NNN TARGET=<sha-cible> HEAD=<sha-candidat>`
en plus du contrôle de contribution. Un échec bloque la publication. Les cartes
historiques conservées sont exemptées du nouveau contrôle de rattachement.

Après preuve du squash par l’humain, confirmer que l’espace a cessé d’être
utilisé. Depuis le dossier principal, exécuter
`make demand-release DEMAND=DEM-NNN TARGET=<sha-develop> SQUASH=<sha-intégré>`.
L’outil compare l’arbre attendu au commit intégré et refuse les espaces verrouillés, les changements ou fichiers locaux non identifiés et les ressources ambiguës. Il contrôle les ressources Docker de la demande, archive sa tête, puis retire son worktree et sa branche. Le seul fichier ignoré autorisé est le `.env` de ce worktree ; ceux du principal et des autres worktrees sont préservés. Un volume ou un autre fichier local bloque la clôture. Vérifier au préalable que personne n’utilise cet espace : la propreté Git ne le démontre pas.

## Amorçage initial

L’option `--bootstrap-policy-sha` du lanceur `codebase-integrity/domaines/construction-livraison/scripts/contribution.py` permet de charger un contenu de politique explicitement approuvé lorsque la base d’intégration initiale ne porte pas encore le contrôle.

Cette opération exige un **SHA complet approuvé explicitement** et reste réservée à la **base initiale de DEM-001**. Elle ne constitue pas une option générale pour désactiver un contrôle ou remplacer la politique d’une contribution courante.

Les preuves d’approbation et d’exécution appartiennent à la demande et à ses cartes ; ce document n’en déclare aucune nouvelle.
