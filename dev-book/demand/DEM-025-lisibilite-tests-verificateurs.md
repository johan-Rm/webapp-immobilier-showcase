# DEM-025 — Rendre les tests des vérificateurs lisibles et stabiliser leur résultat

- Type : consolidation
- Session de création : 01a212d6-83eb-70a1-9a72-8dc9160ffae5
- Session intervenante : 01a21d01-fa3f-7e51-8fca-8a4c2d4e0307
- État : découpée, implémentation et vérification humaines en attente
- Branche : `demands/DEM-025-lisibilite-tests-verificateurs`
- Worktree : `worktree/DEM-025-lisibilite-tests-verificateurs`
- Base locale d’analyse : `53ef9d662fa0bce1a9b7a604721b3956036678a0`

## Besoin et décisions

Les sorties fournies lors de l’interview faisaient réussir `make internal-tests-verifiers` en mode normal et échouer sept assertions Python en mode `VERBOSE=1`, avant les moteurs suivants. Ces résultats historiques n’ont pas été reproduits sur la base d’analyse. Le présentateur parent et le présentateur imbriqué utilisent les réglages de présentation ; leur transmission au conteneur doit être vérifiée distinctement du chemin CI.

L’interview du 26 novembre 2026 confirme l’analyse de l’équivalence des tests, journaux, verdicts et codes à révision et prérequis identiques. Elle retient les deux pilotes [test_aide_runner.py](../../codebase-integrity/domaines/fiabilite-verifications/tests/test_aide_runner.py) et [test_frontend_paths.py](../../codebase-integrity/domaines/fiabilite-verifications/tests/test_frontend_paths.py), sans généraliser la documentation à tous les fichiers.

Le 27 novembre 2026, l’humain confirme : conserver ces deux pilotes, afficher les noms existants ailleurs, vérifier les deux modes par des tests ciblés bloquants puis une comparaison manuelle complète. Le skill générique `documenter-tests` est cadré séparément. Les modifications de logique et d’assertions des pilotes, la documentation des autres fichiers et l’extension aux autres commandes sont exclues ; les tests ciblés nécessaires au comportement de présentation restent dans le périmètre.

Les 203 méthodes Python `test_*` repérées statiquement dans 21 fichiers n’ont pas de docstring de méthode ; ce décompte ne mesure pas les sous-tests exécutés. Neuf fichiers Vitest et deux fichiers Bun sont sélectionnés. Les titres existants et filtres externes doivent être préservés. Les reporters et la propagation réelle du mode restent à vérifier. Le [guide des contrôles](../../docs/controles/executer-controles.md#lire-les-détails-en-direct) décrit le réglage d’affichage et les journaux.

## Critères et cartes

| Carte | Couche | Résultat | Dépendance |
| --- | --- | --- | --- |
| [OPS-110](../tasks/OPS-110-stabiliser-tests-verificateurs.md) | devops | Présentation lisible et équivalence vérifiable des deux modes | Aucune dépendance de réalisation |

Les tests ciblés couvrent les deux présentations, le passage des paramètres et un échec maîtrisé. La comparaison complète des deux modes relève de l’humain ; la lisibilité exige aussi sa revue. Les signaux et interruptions doivent conserver leur contrat explicite sans supposer l’égalité brute des codes normalisés. Aucune exception n’est décidée.

## Vérification et livraison

Aucun test, verdict d’implémentation, commit ou livraison n’est établi. Les résultats seront liés au SHA exact examiné dans la carte. Les tests complets et ceux nécessitant des services restent manuels. Toute modification des tests CI/CD actualise `TEST.md` dans le même changement.

## Déclaration de contribution

```contribution-json
{
  "version": 1,
  "corrections": [
    {
      "chemins": [
        "codebase-integrity/commun/run_check_output.py",
        "codebase-integrity/commun/test_domains.py",
        "codebase-integrity/domaines/fiabilite-verifications/tests/test_check_output.py",
        "codebase-integrity/domaines/fiabilite-verifications/tests/test_check_presentation.py",
        "infra/make/Makefile.dev"
      ],
      "convention": "codebase-integrity/README.md#exécution-des-contrôles",
      "controles": [
        "codebase-integrity/domaines/fiabilite-verifications/tests/test_check_output.py",
        "codebase-integrity/domaines/fiabilite-verifications/tests/test_check_presentation.py"
      ]
    }
  ],
  "accompagnements": [
    {
      "chemins": [
        "codebase-integrity/domaines/fiabilite-verifications/tests/test_aide_runner.py",
        "codebase-integrity/domaines/fiabilite-verifications/tests/test_frontend_paths.py",
        "docs/controles/executer-controles.md",
        "TEST.md"
      ],
      "motif": "Expliquer les deux pilotes et actualiser le guide et la recette des tests."
    }
  ],
  "sans_correction": ""
}
```
