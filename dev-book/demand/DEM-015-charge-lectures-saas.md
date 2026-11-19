# DEM-015 — Tests de charge des lectures BFF → API

- Type : consolidation
- Étape : validée humainement ; reconstituée.
- Session de création : 01a1ee70-2dc4-7331-992b-b24155dfd09a
- Contexte : dépôt principal, branche `develop`.

## Constat et décisions

La charge existante ne mesure pas les lectures métier de l’API SaaS via le BFF. L’[analyse](../reports/charge-bff-api-analyse.md) décrit les scénarios retenus et leurs limites ; la [carte OPS-043](../tasks/OPS-043-mesurer-charge-lectures-bff-api.md) conserve les preuves et le verdict humain.

L’humain a ensuite décidé de suspendre le contrôle : sa commande affiche un message sans lancer de test. Les scénarios restent disponibles pour une réactivation ultérieure ; l’exécution réelle et la connexion au VPS restent inconnues.

## Reconstitution

Depuis `develop` à `3233caa04a1d7499112855a0f6741e7e8f3d069c` sur `demands/DEM-015` :

- Implémentation : `7ab66e71748b288285db36d638e93b7bf7fbdb12` → `eabe4dbb15401d49ee7a6dc6c587eb14fed07e40`.
- Suspension : `b94d4b9f2905ea4499a7fd115200b34f4d00cab4` → `4185c9def2a947d11676855812234d92e0520ea9`.
- Verdict : `4ae8acbe985d512b42e73c7001e6d5af5b6f9007` → `5887a0fe246d63c1ad610111fff5a5ef1af29d93`.

Les messages des trois commits reconstitués ont été complétés avec `Demande : DEM-015` après constat du contrôle des contributions ; leurs arbres restent identiques et les commits sources sont conservés.

Les brouillons DEM-016 présents dans la couche DevOps restent hors de cette reconstitution. Aucun test de charge ni appel à l’API réelle n’est lancé par l’agent.

## Déclaration de contribution

```contribution-json
{
  "version": 1,
  "corrections": [
    {
      "convention": "codebase-integrity/README.md#exécution-des-contrôles",
      "controles": ["codebase-integrity/domaines/fiabilite-verifications/tests/test_saas_api_load.py"],
      "chemins": [
        "Makefile",
        "infra/make/Makefile.dev",
        "codebase-integrity/README.md",
        "codebase-integrity/conventions.json",
        "codebase-integrity/commun/check_presentation.py",
        "codebase-integrity/domaines/fiabilite-verifications/tests/test_saas_api_load.py",
        "docs/executer-controles.md",
        "webapp/scripts/quality/load/saas-read.js",
        "webapp/scripts/quality/saas_api_load.py"
      ]
    }
  ],
  "accompagnements": [
    {"chemins": ["dev-book/reports/charge-bff-api-analyse.md"], "motif": "Conserver l’analyse et les décisions confirmées."}
  ],
  "sans_correction": ""
}
```
