# DEM-016 — Réorganiser la CI par familles de contrôles

- Type : consolidation
- Étape : validée humainement ; reconstituée.
- Session de création : 01a1ee70-2dc4-7331-992b-b24155dfd09a
- Contexte : dépôt principal, branche `develop`.

## Constat et décisions

La CI doit rendre visibles les familles de contrôles et compléter les vérifications automatiques. L’[analyse](../reports/organisation-ci-cd-analyse.md) conserve les décisions, les exclusions et les limites ; la [carte OPS-044](../tasks/OPS-044-reorganiser-workflows.md) détaille les preuves et le verdict humain.

Les contrôles locaux lancés par l’humain sur Showcase ont réussi. Les autres cibles, les coûts et l’exécution réelle des nouveaux workflows sur GitHub restent à vérifier. Aucun audit Lighthouse ni charge SaaS réelle n’est déclenché par ces workflows.

## Reconstitution

Depuis `develop` à `b63fee7a3c9426842ab8864d7b57ee930e45eb15` sur `demands/DEM-016` :

- Implémentation : `4c012dfc111c478662741ee02ab93d5278d31980` → `2f503ab2e9f1293c4f217725051aa643f33c1502`.
- Verdict humain : `16e32106e51761bd2c980683748b101a496e1ba6` → `692405b431ae387c590fa6c736eaad9ebce94bea`.
- Renommage validé : `f616ac5f194706a57307d5fe06e79cbbdf2e8c54` → `99d32ceaa274b27d2a8740adf6cb16f448617140`.
- Verdict sur le renommage : `8e5435a826620c868ae1ab60bbc4ba2196052ebd` → `ef1c1c49a7e239f6d9274e86df64779aa1ee3a80`.

La couche DevOps conserve sa branche ; aucun workflow ni test lourd n’a été déclenché par l’agent. Les contrôles de contribution depuis la base, des documents et des cartes réussissent sur la branche reconstituée.

## Déclaration de contribution

```contribution-json
{
  "version": 1,
  "corrections": [
    {
      "convention": "codebase-integrity/README.md#exécution-des-contrôles",
      "controles": [
        "webapp/scripts/quality/ci-plan.vitest.ts",
        "webapp/scripts/quality/coverage.vitest.ts"
      ],
      "chemins": [
        ".github/workflows/ai-development-engineering.yml",
        ".github/workflows/conventions.yml",
        ".github/workflows/internal-tests.yml",
        ".github/workflows/quality-extended.yml",
        ".github/workflows/quality.yml",
        ".github/workflows/runtime-tests.yml",
        ".github/workflows/sonarqube.yml",
        "codebase-integrity/README.md",
        "codebase-integrity/conventions.json",
        "docs/executer-controles.md",
        "webapp/scripts/quality/ci-plan.vitest.ts",
        "webapp/scripts/quality/coverage.ts",
        "webapp/scripts/quality/coverage.vitest.ts"
      ]
    }
  ],
  "accompagnements": [
    {"chemins": ["dev-book/reports/organisation-ci-cd-analyse.md"], "motif": "Conserver l’analyse et les décisions confirmées."}
  ],
  "sans_correction": ""
}
```
