# DEM-020 — Journal versionné des demandes et cartes

- Type : consolidation
- Session de création : 01a1fee3-80c9-7002-97e7-f1b8be1aee50
- Session intervenante : 01a2175b-509d-76f2-8a98-746661b2e1fa
- État : reconstituée, suite complète manuelle réussie

## Besoin et décisions

Préparer plusieurs demandes en parallèle en gardant le dossier principal
disponible. Réserver localement une branche et un espace documentaire dès
l’ouverture. Versionner chaque étape terminée, lier les cartes à leur demande
et conserver les preuves et verdicts. Les cartes restent éditables dans leurs
couches et seuls les commits validés rejoignent la branche de demande.

La publication contrôle la cible distante vérifiée. Les cartes historiques
conservent leur format. Après le squash humain, la tête approuvée est archivée
localement avant la libération d’un espace disponible et propre. La procédure
de reprise de DEM-019 préserve sa session d’origine et sa sauvegarde. Sa reprise
effective est prévue après adoption. Les règles durables des fichiers
AGENTS.md évoluent exclusivement pendant une consolidation.

## Critères et cartes

- [OPS-093 — Définir la règle locale du journal des demandes](../tasks/OPS-093-documenter-journal-demandes.md)
- [OPS-094 — Ouvrir et inventorier les espaces de demande](../tasks/OPS-094-ouvrir-et-inventorier-demandes.md)
- [OPS-095 — Contrôler le rattachement des cartes et la clôture](../tasks/OPS-095-controler-contribution-et-cloture.md)
- [OPS-096 — Préparer la reprise de DEM-019](../tasks/OPS-096-preparer-reprise-demande-sauvegardee.md)

```contribution-json
{
  "version": 1,
  "corrections": [
    {
      "chemins": [
        "infra/make/Makefile.ai-development-engineering",
        "infra/scripts/demand_delivery.py",
        "infra/scripts/demand_status.py",
        "infra/scripts/demand_worktree.py",
        "infra/tests/test_demand_delivery.py",
        "infra/tests/test_demand_worktree.py"
      ],
      "convention": "codebase-integrity/README.md#contributions",
      "controles": [
        "infra/tests/test_demand_delivery.py",
        "infra/tests/test_demand_worktree.py"
      ]
    }
  ],
  "accompagnements": [
    {
      "chemins": [
        "AGENTS.md",
        "codebase-integrity/README.md",
        "dev-book/runbooks/2026-11-26-reprendre-demande-sauvegardee.md",
        "docs/1.getting-started/ai-workflow.md",
        "docs/controle-contributions.md",
        "docs/worktrees.md"
      ],
      "motif": "Gouvernance, usage des commandes et procédure validée de reprise d’une demande sauvegardée."
    }
  ],
  "sans_correction": ""
}
```

## Vérification et livraison

Le 26 novembre 2026, l’humain a validé les quatre cartes et les cinq commits
d’implémentation présentés. Les verdicts structurés sont dans les cartes.
L’écart OPS-095 a été présenté avec le verdict. Une réservation distante
connue peut passer le contrôle lorsque le document correspondant est absent
de la cible d’intégration.

La reconstitution part de `488ad2d60810d71ce6905baabea210a144255aa0`, sur
`demands/DEM-020-journal-versionne-demandes`.

| Portée | SHA source | SHA reconstitué |
| --- | --- | --- |
| OPS-093 | `cf791bdebe9e26892087a742fa30264529891080` | `39e25d74a80054b6df9f73525bb3b53ecd33d0b3` |
| OPS-094 | `598226c3f010d8b5b6f4edc0d0b48ee09246bebe` | `fc574ddd406fd4f9f6dfc34288fe53813049b98d` |
| OPS-095 | `0b3074d724406a5af5073ee2aae8ca1d851e8d80` | `54265640920915b8e96d44d71c2adf5d852e0b4e` |
| OPS-096 | `c9cf53c0db96b406dc0c1cb750e06c37b3eb7718` | `7b705ce172b4155db7b41db895730f317e9eed2c` |
| OPS-093 | `564ccfb3c39759cfedbf2d3ba3c9dc5e174ef464` | `c4fb6c4e68c0ce9d15943d15783920cd9a19e9d6` |
| DEM-020 | `59b90275a3573d9ffedccb4d21d53e57b34d0f73` | `841835a0f605b75bc725de08c8dc0a92b5acdd4f` |

Les six cherry-picks ont produit le même arbre que la couche source avant
l’intégration des brouillons documentaires validés. Les 15 tests ciblés
(`python3 -B -m unittest discover -s infra/tests -p 'test_demand*.py'`),
`make conventions-tests-docs` et `make conventions-tests-devbook` ont réussi
dans le principal.

Le 26 novembre 2026, l’humain a exécuté la suite complète de
[TEST.md](../../TEST.md) et confirmé le SHA testé
`66fdb75fa039363c5018b7693faa7f169e35016a` par `git rev-parse HEAD`.
Le journal transmis contient 29 bilans réussis, avec un code de sortie 0
pour chacun, dont navigateur, charge et Lighthouse desktop et mobile.
