# DEM-013 — Renforcer les contrôles de qualité du code et des tests

- Type : consolidation
- Session de création : 01a1ee70-2dc4-7331-992b-b24155dfd09a
- État : validée humainement ; mutation étendue inactive sur décision humaine.
- Contexte de rédaction : `worktree/devops`, branche `layers/devops`.

## Besoin et décisions

La revue d’une checklist de contrôle a fait ressortir deux besoins de même priorité : repérer le code difficile à maintenir et renforcer la confiance dans les tests. Les contrôles existants et leurs limites sont référencés dans le [registre](../../codebase-integrity/conventions.json) et le [catalogue d’exécution](../../docs/controles/executer-controles.md).

Examiner quatre pistes : fonctions longues, duplication, débogage oublié et qualité des tests. Pour cette dernière, rechercher les parties insuffisamment testées et évaluer la capacité des tests existants à détecter une modification incorrecte.

Le périmètre envisagé est tout le code applicatif d’une cible choisie, existant et futur. La recherche de duplication compare aussi cette cible aux autres, sans imposer automatiquement une mutualisation.

Les résultats sont des signalements à examiner par défaut. Les cas sévères et incontestables bloquent immédiatement, y compris dans l’existant. Une exception à un blocage exige une portée précise, une justification, une approbation humaine et une date d’expiration.

## Critères et cartes

L’[analyse](../reports/qualite-code-et-tests-analyse.md) conserve les décisions détaillées, les résultats statiques et leurs limites. Les cartes suivantes relèvent de DevOps et utilisent des commits locaux distincts ; les dépendances sont les commits des cartes indiquées, à identifier après réalisation.

- [OPS-036](../tasks/OPS-036-definir-perimetre-qualite.md) : sélection des sources et inventaire commun ; commits `becebc17b24a2776cdc74aafdc1558b3acc27b62`, `ee5176c8c37a7dee5c1550bf1e8233d8247d841e` et `b9f109b7962d545b1ea3adf40530d653b6b5144b`, validés humainement.
- [OPS-037](../tasks/OPS-037-controler-fonctions-debogage.md) : fonctions, débogage et exceptions ; commits `9523f8f176fc9e01b9186894b3fc5deb1139cfed` et correctif `9dc0cfcffb954fbfc110389b65a9a54bff7b73bd`, validés humainement.
- [OPS-038](../tasks/OPS-038-detecter-duplications.md) : fragments similaires ; commit `052caab786bfd7cfc7b1b1adc01ebbfdc3fdeb26`, validés humainement.
- [OPS-039](../tasks/OPS-039-mesurer-couverture.md) : couverture par environnement ; commits `1ad209f8c3420ac9e27b3a3b56fdd99478d8fb17`, `c9700c8403a086f1bad785be315c97103bf078ba`, `3ab0e57f9b85760aa39f4d8696a18021f4789df1`, `7c0f8942276a43c9ab370a882aa432aaaa4dcb54`, `ecf00d03689d5a9ece49762406836897135b79d9` et `c58eb56c216bf0e663e4322ed469fa5bbf62a8e4`, validés humainement.
- [OPS-040](../tasks/OPS-040-etendre-mutation.md) : mutation et états non mesurables ; commits `8bd70b5d2a91c5807e765798732246efccb1e4f7`, `4dead96c9f212749b1e23eeec42b49b6281d5c7d`, `152dcb548652b6fc48cc748fc92766b4fa73f092` et `23af763a2ae329b3eb64e7e10368af3d93fcff47`, validés humainement.
- [OPS-041](../tasks/OPS-041-documenter-qualite-code-tests.md) : intégration, documentation et bilan ; commit `d577c4c9c39aa55ad6fd03413fa9f4fc83994de5`, validés humainement.

Reconstitution sur `demands/DEM-013` depuis `develop` à `e2f6d5ce99d7ad1b4b799e06ce62894f3b7c380f` : les 19 commits sources ont été repris avec `cherry-pick -x`, y compris la trace des verdicts et le brouillon commité sur autorisation humaine. Leur correspondance source → obtenu figure dans les messages Git : `git log --reverse --format='%H %b' develop..db5e7f3de255b3ef1b88f90b63a7220dcdd87fa7`.

## Vérification et livraison

Validation humaine explicite des six cartes et des limites présentées, sur la révision `23af763a2ae329b3eb64e7e10368af3d93fcff47` ; verdicts structurés dans les cartes. La mutation étendue est inactive, comme indiqué dans OPS-040. La livraison reste à réaliser.

Reconstitution : `make conventions-tests-docs` et `make conventions-tests-devbook` réussis ; la commande de mutation étendue affiche son statut inactif sans exécuter de test. Les autres preuves restent dans les cartes.

## Déclaration de contribution

```contribution-json
{
  "version": 1,
  "corrections": [
    {
      "convention": "codebase-integrity/README.md#contrôles-existants",
      "controles": [
        "codebase-integrity/domaines/fiabilite-verifications/tests/application-scope.vitest.ts",
        "codebase-integrity/domaines/qualite-code/tests/verify-functions-debug.vitest.ts",
        "codebase-integrity/domaines/qualite-code/tests/verify-duplicates.vitest.ts",
        "webapp/scripts/quality/coverage.vitest.ts",
        "webapp/scripts/quality/mutation-extended.vitest.ts",
        "webapp/scripts/quality/source-quality.vitest.ts"
      ],
      "chemins": [
        "Makefile",
        "codebase-integrity/README.md",
        "codebase-integrity/commun/application-scope.ts",
        "codebase-integrity/commun/check_presentation.py",
        "codebase-integrity/commun/debugger-exceptions.json",
        "codebase-integrity/conventions.json",
        "codebase-integrity/domaines/fiabilite-verifications/tests/application-scope.vitest.ts",
        "codebase-integrity/domaines/qualite-code/scripts/verify-duplicates.ts",
        "codebase-integrity/domaines/qualite-code/scripts/verify-functions-debug.ts",
        "codebase-integrity/domaines/qualite-code/tests/verify-duplicates.vitest.ts",
        "codebase-integrity/domaines/qualite-code/tests/verify-functions-debug.vitest.ts",
        "docs/executer-controles.md",
        "infra/make/Makefile.dev",
        "webapp/bun.lock",
        "webapp/package.json",
        "webapp/scripts/quality/coverage.ts",
        "webapp/scripts/quality/coverage.vitest.ts",
        "webapp/scripts/quality/mutation-extended.ts",
        "webapp/scripts/quality/mutation-extended.vitest.ts",
        "webapp/scripts/quality/mutation-test-selection.ts",
        "webapp/scripts/quality/run.ts",
        "webapp/scripts/quality/source-quality.ts",
        "webapp/scripts/quality/source-quality.vitest.ts",
        "webapp/vitest.config.ts"
      ]
    }
  ],
  "accompagnements": [
    {
      "chemins": ["dev-book/reports/qualite-code-et-tests-analyse.md"],
      "motif": "Conserver l’analyse et les décisions qui fondent les contrôles."
    }
  ],
  "sans_correction": ""
}
```
