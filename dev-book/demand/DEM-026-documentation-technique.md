# DEM-026 — Consolider la documentation technique

- Type : consolidation
- Date : 2026-11-26
- État : reconstituée, suite complète manuelle en attente
- Session de création : `01a217b7-1feb-7220-9163-1c0926b26aa6`

## Constat

Le référentiel documentaire AIDE réserve la racine de `docs/` à `README.md` et `index.md`. Showcase Immobilier y compte sept documents de sujet : `controle-contributions.md`, `controle-conventions-frontend.md`, `executer-controles.md`, `nginx-local.md`, `perimetre-controles-frontend.md`, `verifier-traces-devbook.md` et `worktrees.md`.

Le [README documentaire](../../docs/README.md) pose déjà le principe des explications durables et de la source unique. Le [dev-book](../README.md) conserve les demandes, les cartes, l’historique des décisions et les preuves.

## Résultat attendu

Définir le rôle de la documentation technique avant de réorganiser les fichiers. La revue couvre l’ensemble de `docs/`.

- Décrire le système tel qu’il fonctionne : architecture, responsabilités, flux, contrats et règles métier mises en œuvre. Conserver les guides durables de démarrage, d’exploitation et de vérification.
- Conserver les demandes, cartes, plans ponctuels, résultats d’exécution, preuves et verdicts dans le dev-book. Préserver les traces historiques et privilégier les liens vers les sources existantes.
- Rédiger au présent et à la voix active, avec le vocabulaire et les conventions de nommage du projet. Mettre la documentation à jour avec le code. Ajouter des schémas lorsque les flux le justifient.

## Critères de conformité à analyser

- Les seuls fichiers directement sous `docs/` sont `README.md` et `index.md`.
- Chaque document de sujet relève d’une thématique pertinente et figure dans son sommaire. Les thématiques sont accessibles depuis le sommaire principal et les liens concernés restent valides.
- Chaque document apporte une explication durable et distincte. Les guides de vérification décrivent les commandes, prérequis et résultats attendus. Les preuves d’exécution restent dans le dev-book.

## Arbitrage et verdict humain

Le 26 novembre 2026, l’humain confirme le contrôle bloquant des fichiers à la racine, de la navigation et des liens locaux. Les noms des thématiques sont conservés. Les métadonnées, ressources, README et sommaires sont dispensés d’entrée comme pages. La durabilité du contenu relève de la relecture humaine. Le contrôle des liens externes et l’ajout systématique de résumés restent hors périmètre.

L’humain autorise trois corrections de référence dans les fichiers racine et neuf corrections de destination dans des traces historiques. Le verdict « ok validé » couvre les deux cartes et les commits présentés sur la projection contrôlée.

## Reconstitution

Branche `demands/DEM-026-documentation-technique`, depuis `develop` à `a63d32ba4f28f15f4e55f706b2432ca19e5f7fd2`.

| Élément | SHA source | SHA reconstitué |
| --- | --- | --- |
| [OPS-097](../tasks/OPS-097-reclasser-documentation-technique.md) | `fe8adbedc74480ecf91fc4020c2c3906df1e6a15` | `74c6b17188f404d583414b2c2e81928e07b936df` |
| [OPS-098](../tasks/OPS-098-controler-structure-documentation.md) | `ed0e2e787ee91c583bc36ef30c87d96bbe8ed50f` | `9489a668257407415f0529c19c7efd79cbab1d93` |
| Trace documentaire des verdicts | `e89ba40fae049f51318f5a16082ea95ab710b9a5` | `75d90740bdcd808b9e367586447c0a10ee861e9c` |

Les patchs sont intégrés dans cet ordre. Les ajouts de DEM-020 sur les espaces de demande et la publication restent dans les guides déplacés. Leurs liens relatifs et le renvoi depuis le guide Workflow IA suivent les nouveaux chemins. La trace de DEM-020 conserve les chemins historiques.

## Vérifications

Le contrôle ciblé `make conventions-tests-docs` réussit sur la reconstitution, quatre étapes sur quatre, code 0. La suite complète de `TEST.md` attend l’exécution humaine sur le SHA reconstitué.

## Déclaration de contribution

```contribution-json
{
  "version": 1,
  "corrections": [
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
        "AGENTS.md",
        "TEST.md",
        "codebase-integrity/domaines/fiabilite-verifications/scripts/check_runtime_names.py",
        "dev-book/demand/DEM-004-vhosts-locaux.md",
        "dev-book/demand/DEM-006-commandes-lanes.md",
        "dev-book/demand/DEM-007-couche-dashboard.md",
        "dev-book/demand/DEM-013-qualite-code-et-tests.md",
        "dev-book/demand/DEM-018-clarifier-noms-variables-controle.md",
        "dev-book/reports/ops-097-documentation.patch",
        "dev-book/reports/ops-098-activation-controle-documentaire.patch",
        "dev-book/reports/releve-har-firefox-chargement-images.md",
        "dev-book/tasks/OPS-008-router-vhosts-par-pile.md",
        "dev-book/tasks/OPS-012-servir-dashboard-et-projeter-articles.md",
        "dev-book/tasks/OPS-043-mesurer-charge-lectures-bff-api.md",
        "dev-book/tasks/OPS-044-reorganiser-workflows.md",
        "docs/1.getting-started/ai-workflow.md",
        "docs/1.getting-started/dashboard-saas.md",
        "docs/1.getting-started/index.md",
        "docs/1.getting-started/nginx-local.md",
        "docs/1.getting-started/setup-local.md",
        "docs/1.getting-started/worktrees.md",
        "docs/2.architecture/14.site-layers.md",
        "docs/2.architecture/7.auto-imports-and-aliases.md",
        "docs/3.application/ci-conventions-validation.md",
        "docs/3.application/index.md",
        "docs/4.design-system/1.tailwind-et-tokens.md",
        "docs/4.design-system/3.color-mode.md",
        "docs/4.design-system/index.md",
        "docs/6.schemas-and-data/2.interface-generation.md",
        "docs/9.performance/image-loading-order-firefox.md",
        "docs/9.performance/index.md",
        "docs/README.md",
        "docs/controle-contributions.md",
        "docs/controle-conventions-frontend.md",
        "docs/controles/controle-contributions.md",
        "docs/controles/controle-conventions-frontend.md",
        "docs/controles/executer-controles.md",
        "docs/controles/index.md",
        "docs/controles/perimetre-controles-frontend.md",
        "docs/controles/verifier-traces-devbook.md",
        "docs/executer-controles.md",
        "docs/index.md",
        "docs/nginx-local.md",
        "docs/perimetre-controles-frontend.md",
        "docs/verifier-traces-devbook.md",
        "docs/worktrees.md"
      ],
      "motif": "Réorganisation documentaire, traçabilité et adaptation des références aux chemins validés."
    }
  ],
  "sans_correction": ""
}
```
