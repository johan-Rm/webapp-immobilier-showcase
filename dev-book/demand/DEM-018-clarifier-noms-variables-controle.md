# DEM-018 — Clarifier les noms des variables de contrôle

- Type : consolidation
- État : reconstituée et contrôlée avant livraison.
- Session de création : 01a1ee70-2dc4-7331-992b-b24155dfd09a
- Session intervenante : 01a211b5-0ab6-7733-9516-b83103d91b22

## Besoin et décisions

Le préfixe historique regroupait l’origine du site, les fixtures, la charge et l’infrastructure des contrôles. L’analyse a confirmé le renommage par responsabilité, sans alias, selon la correspondance validée dans [OPS-092](../tasks/OPS-092-aligner-recettes-controles.md#correspondance-de-migration).

L’adresse est unifiée sous `WEBAPP_BASE_URL` avec une origine propre à chaque réseau. Le port des fixtures est exposé sous `WEBAPP_TEST_PORT`. Les paramètres internes utilisent `CHECKS_`. Les états inactifs, valeurs par défaut, garde-fous, données et traces historiques sont préservés. Les consommateurs externes au dépôt restent hors vérification.

## Cartes et verdict

- [OPS-091 — Variables des contrôles d’exécution](../tasks/OPS-091-renommer-variables-execution.md). L’affectation à DevOps du workflow runtime et de la configuration Playwright est ponctuelle.
- [OPS-092 — Recettes et contrôles documentaires](../tasks/OPS-092-aligner-recettes-controles.md), après OPS-091. L’affectation de `TEST.md` à DevOps est ponctuelle.

L’humain a confirmé le périmètre et le contrôle bloquant de clôture, puis a validé les deux commits présentés par son verdict « valider ». Les limites sont conservées dans les cartes.

## Reconstitution

Branche `demands/DEM-018` depuis `develop` local à `c5a81ce0dc163a9f3918ec3ed8d6ee9220a9e4d5`.

| Portée | SHA source | SHA obtenu |
| --- | --- | --- |
| OPS-091 | `d09b4841487ab154d8483889eb99026171133987` | `f708ebb4ffeadc0415667e2fab084f9d88d1258e` |
| OPS-092 | `3cc067a6199f3ecbbef3612c634dd0697aaff2a7` | `ce4c926234dd1b40dbc9c5f21cbabfe1e88c35f6` |
| Verdict humain | `d44a9c4c2a9232a444fdf4799a89fa6bcc291561` | `07a0b47e0641c59121559c0c4b9bba60dab2188e` |
| Correctif de format | `0e1175f49758f93a68995333c5854230ed0e0e8b` | `a6c7f5be058d12de077b7275f9c66bc864252525` |
| Verdict du correctif | `c1b49355878fb7178ae80add2e2a03c929d2ebc1` | `9ccce00fb81fada9055ecef7f9a59c304f421203` |

Le brouillon approuvé d’OPS-092 est intégré au [guide des contrôles](../../docs/executer-controles.md#nommage-des-commandes). La vérification d’absence des anciens noms porte sur les fichiers suivis hors journal historique. Commande de clôture depuis la racine après le commit documentaire, avec code retour 1 et sortie vide attendus :

```bash
git grep -n -E '(^|[^[:alnum:]_]|\\[nrt])(PLAYWRIGHT_BASE_URL|QUALITY_(BASE_URL|FIXTURE_PORT|BROWSER_FIXTURES|MEDIA_FIXTURES|LOAD_PROFILE|ROUTE|PROJECT_ID|ARTICLE_ID|SESSION_FILE|MUTATION_FILES|MUTATION_PILOT|CONTAINER|UID|GID|REPO_ROOT|GIT_COMMON_DIR|COMPOSE|DOCKER|INFO|DOTENV_PROBE))([^[:alnum:]_]|$)' HEAD -- ':!dev-book'
```

### Contrôles observés

- Les trois identifiants de patch sont identiques aux sources. `git diff --check develop`, `make conventions-tests-docs` (4 étapes sur 4) et `make conventions-tests-devbook BASE=c5a81ce0dc163a9f3918ec3ed8d6ee9220a9e4d5` réussissent. Les liens du guide, de la demande et des cartes sont résolus.
- La déclaration couvre les fichiers du périmètre préparé. La vérification de la contribution sur objets Git intervient après le commit documentaire. La recherche des anciens noms dans les fichiers suivis du dossier de travail, avec la même commande sans `HEAD`, renvoie 1 et une sortie vide.
- La résolution Compose, avec `--env-file /dev/null` et `config --no-env-resolution --format json`, confirme l’origine hôte pour les contrôles de test, le nom du service Docker en développement et les arguments UID/GID. `test_lanes.py` réussit ses 26 tests avec Docker simulé.
- Depuis `webapp`, les exécutions isolées de Vitest réussissent les 22 tests de `run.vitest.ts`, les 3 cas de routage runtime de `ci-plan.vitest.ts` et les 6 refus d’origine de `load.vitest.ts`. Le premier passage combiné a atteint la limite de 55 secondes et le test d’interruption a échoué lors de deux passages avant de réussir seul puis dans son fichier complet. Vitest a aussi signalé que `@nuxt/test-utils/config` était absent de l’installation locale du principal.

### Essai humain après reprise du correctif

Le journal transmis le 25 novembre 2026 après la reprise du correctif de format confirme les 29 contrôles actifs de la [recette Showcase](../../TEST.md), tous avec un code 0. ESLint et Prettier réussissent. Playwright, k6 et Lighthouse desktop et mobile s’exécutent avec `WEBAPP_BASE_URL=http://127.0.0.1:19856`. Les résultats Lighthouse portent sur `/fr` et restent informatifs. Le journal signale 410 avertissements frontend et 66 avertissements SOLID à relire, ainsi que 41 exemptions frontend explicites.

## Déclaration de contribution

```contribution-json
{
  "version": 1,
  "corrections": [
    {
      "chemins": [
        ".github/workflows/runtime-tests.yml",
        "codebase-integrity/README.md",
        "codebase-integrity/commun/check_presentation.py",
        "codebase-integrity/domaines/fiabilite-verifications/tests/test_check_presentation.py",
        "codebase-integrity/domaines/fiabilite-verifications/tests/test_saas_api_load.py",
        "infra/docker/Dockerfile.playwright",
        "infra/docker/docker-compose.dev.yml",
        "infra/docker/docker-compose.test.yml",
        "infra/make/Makefile.dev",
        "infra/scripts/lanes.py",
        "infra/tests/test_lanes.py",
        "webapp/playwright.config.ts",
        "webapp/scripts/quality/ci-plan.vitest.ts",
        "webapp/scripts/quality/fixture-server.ts",
        "webapp/scripts/quality/lighthouse.ts",
        "webapp/scripts/quality/load.ts",
        "webapp/scripts/quality/load/scenarios.js",
        "webapp/scripts/quality/mutation-extended.ts",
        "webapp/scripts/quality/run.ts",
        "webapp/scripts/quality/run.vitest.ts",
        "webapp/scripts/quality/saas_api_load.py"
      ],
      "convention": "codebase-integrity/README.md#exécution-des-contrôles",
      "controles": [
        "infra/tests/test_lanes.py",
        "webapp/scripts/quality/run.vitest.ts",
        "webapp/scripts/quality/ci-plan.vitest.ts",
        "codebase-integrity/domaines/fiabilite-verifications/tests/test_check_presentation.py",
        "codebase-integrity/domaines/fiabilite-verifications/tests/test_saas_api_load.py"
      ]
    },
    {
      "chemins": [
        "codebase-integrity/domaines/fiabilite-verifications/scripts/check_docs.py",
        "codebase-integrity/domaines/fiabilite-verifications/tests/test_docs.py"
      ],
      "convention": "docs/README.md#autres-documents",
      "controles": [
        "codebase-integrity/domaines/fiabilite-verifications/tests/test_docs.py"
      ]
    }
  ],
  "accompagnements": [
    {
      "chemins": [
        "TEST.md",
        "docs/executer-controles.md"
      ],
      "motif": "Mettre à jour les recettes et expliquer la migration des variables."
    }
  ],
  "sans_correction": ""
}
```
