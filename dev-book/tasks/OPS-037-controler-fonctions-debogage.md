# OPS-037 — Contrôler fonctions et débogage

- Demande : DEM-013 ; type : consolidation
- Session de création : 01a1ee70-2dc4-7331-992b-b24155dfd09a
- Couche : devops ; branche : `layers/devops` ; worktree : `worktree/devops`
- État : implémentée, à vérifier humainement
- Chemins autorisés : `codebase-integrity/domaines/qualite-code/scripts/`, `codebase-integrity/domaines/qualite-code/tests/`, `codebase-integrity/domaines/qualite-code/regles.yaml`, `codebase-integrity/package.json`, `codebase-integrity/commun/`, cette carte.
- Dépendances : commit local de OPS-036.

## Résultat et critères

Sur le périmètre commun, signaler les fonctions de plus de 50 lignes et de complexité supérieure à 10 selon la méthode de l’analyse ; restituer fichier et position réelle, y compris Vue. Signaler pour revue les journaux de débogage susceptibles de contenir des données de requête ou réponse. Bloquer les instructions syntaxiques `debugger` ; vérifier la règle ESLint existante avant toute duplication. Une exception à un blocage est précise, justifiée, approuvée et datée ; refus des exceptions invalides ou expirées et affichage de leur usage.

Tester seuils, imbrication, scripts Vue, faux positifs chaînes/commentaires, journaux utiles, `debugger`, exceptions et erreurs d’analyse. Ne pas corriger les sources applicatives dans cette carte. Consigner commandes, résultats et limites ici.

## Réalisation et preuves

Analyse TypeScript et scripts Vue : métriques convenues, instruction `debugger`, signalement heuristique des appels console contenant des identifiants de données et validation d’exceptions bornées par chemin, ligne, empreinte, justification, référence d’approbation et échéance. Les journaux indirects restent hors détection ; le raccordement public et la documentation relèvent de OPS-041.

Vérifications : 5 tests Vitest ciblés réussis ; vérification TypeScript ciblée réussie avec les types Node du paquet webapp ; formatage Prettier ciblé. Aucune validation humaine.

## Verdict humain

Aucun verdict humain.

## Commits

À créer lors de l’implémentation.
