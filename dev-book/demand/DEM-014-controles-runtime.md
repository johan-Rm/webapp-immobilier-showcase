# DEM-014 — Famille des contrôles runtime

- Type : consolidation
- Étape : validée humainement.
- Session de création : 01a1ee70-2dc4-7331-992b-b24155dfd09a
- Contexte : dépôt principal, branche `develop`.

## Constat et besoin

Les parcours navigateur, les audits Lighthouse et les tests de charge nécessitent une application démarrée et une URL. Leur classement actuel ne rend pas ce prérequis immédiatement visible.

## Proposition confirmée pour analyse

Créer la famille des contrôles runtime et renommer ses commandes avec le préfixe `runtime-tests-*`. Supprimer les anciens noms, sans alias. Couvrir navigateur, Lighthouse et charge, y compris les futurs tests BFF → API. Prévoir navigateur et charge légère sur fixtures à chaque PR ; Lighthouse reste exclusivement local. La réorganisation effective des workflows relève de DEM-016.

Lighthouse est non bloquant. Pour les tests navigateur et de charge, le blocage dépend de la sévérité du scénario ; les critères et leur représentation restent à définir lors de l’analyse.

## Questions pour l’analyse

Inventorier commandes, usages, documentation et références à migrer ; préciser les prérequis serveur, les familles et les statuts affichés. Définir les niveaux de sévérité et leur traduction technique sans préjuger du résultat.

## Analyse et découpage

L’[analyse](../reports/controles-runtime-analyse.md) conserve l’inventaire, les décisions et les limites. La carte [OPS-042](../tasks/OPS-042-classer-controles-runtime.md) est validée humainement sur le commit `2d80b6a832d312409981e3dc3aafc16b2b3f583d`. L’humain indique que les tests sont passés ; leurs journaux n’ont pas été vérifiés par l’agent. Reconstitution sur `demands/DEM-014` depuis `develop` à `4c04cb2fdab715eb0ea38596961133ef0549ef27` : implémentation `2d80b6a832d312409981e3dc3aafc16b2b3f583d` → `894b0081db71457947059db1e2d70c38320c553a` ; verdict `95000d59f12e77b1163f80a2f86330ad61344f89` → `d1d49cc65639aed8e0cfeb54036892ba0b3dc361`.

Les tests ciblés et leurs preuves figurent dans la carte ; les contrôles avec serveur sont réservés à un lancement humain.

Verdict humain tracé dans le commit `95000d59f12e77b1163f80a2f86330ad61344f89`. Le contrôle dev-book avait signalé le format de session des cartes non commitées OPS-043 et OPS-044 dans le worktree DevOps ; elles restent hors de cette reconstitution.

Reconstitution : `make conventions-tests-docs` et `make conventions-tests-devbook` réussis après correction du format du type dans cette demande. Aucun test lourd ni avec serveur n’a été lancé par l’agent.

## Déclaration de contribution

```contribution-json
{
  "version": 1,
  "corrections": [
    {
      "convention": "codebase-integrity/README.md#exécution-des-contrôles",
      "controles": [
        "codebase-integrity/domaines/fiabilite-verifications/tests/test_runtime_names.py",
        "codebase-integrity/domaines/fiabilite-verifications/tests/test_check_presentation.py",
        "webapp/scripts/quality/ci-plan.vitest.ts"
      ],
      "chemins": [
        "Makefile",
        "infra/make/Makefile.dev",
        "codebase-integrity/README.md",
        "codebase-integrity/conventions.json",
        "codebase-integrity/commun/check_presentation.py",
        "codebase-integrity/commun/run_aide_checks.py",
        "codebase-integrity/domaines/fiabilite-verifications/scripts/check_runtime_names.py",
        "codebase-integrity/domaines/fiabilite-verifications/tests/test_runtime_names.py",
        "codebase-integrity/domaines/fiabilite-verifications/tests/test_aide_runner.py",
        "codebase-integrity/domaines/fiabilite-verifications/tests/test_check_presentation.py",
        "docs/executer-controles.md",
        "webapp/scripts/quality/ci-plan.vitest.ts"
      ]
    }
  ],
  "accompagnements": [
    {"chemins": ["dev-book/reports/controles-runtime-analyse.md"], "motif": "Conserver l’analyse et les décisions confirmées."}
  ],
  "sans_correction": ""
}
```
