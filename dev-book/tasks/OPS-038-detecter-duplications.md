# OPS-038 — Signaler les fragments similaires

- Demande : DEM-013 ; type : consolidation
- Session de création : 01a1ee70-2dc4-7331-992b-b24155dfd09a
- Couche : devops ; branche : `layers/devops` ; worktree : `worktree/devops`
- État : implémentée, à vérifier humainement
- Chemins autorisés : `codebase-integrity/domaines/qualite-code/scripts/`, `codebase-integrity/domaines/qualite-code/tests/`, `codebase-integrity/domaines/qualite-code/regles.yaml`, `codebase-integrity/package.json`, cette carte.
- Dépendances : commit local de OPS-036 ; intégrer le commit de OPS-037 avant toute modification partagée.

## Résultat et critères

Signaler les fragments de 10 lignes non vides et 200 caractères minimum, en regroupant les fenêtres chevauchantes, à l’intérieur de la cible et par comparaison avec les autres cibles ; inclure les sources communes. Documenter la normalisation et les variantes reconnues ou manquées. Ne pas imposer une mutualisation ni modifier le code applicatif.

Tester seuils, fenêtres chevauchantes, comparaison inter-cibles, fragments distincts, code partagé et cas non détectables. Consigner commandes, résultats et limites ici.

## Réalisation et preuves

Comparaison de fenêtres de 10 lignes non vides et 200 caractères, normalisées en espaces et sans commentaires isolés ; fenêtres consécutives regroupées, y compris dans un même fichier. La comparaison des deux fichiers hors cible est exclue. Les changements de noms et autres variantes textuelles ne sont pas reconnus ; les résultats restent à relire. Raccordement public prévu dans OPS-041.

Vérifications : 4 tests Vitest ciblés réussis ; formatage Prettier ciblé. Aucune validation humaine.

## Verdict humain

Aucun verdict humain.

## Commits

À créer lors de l’implémentation.
