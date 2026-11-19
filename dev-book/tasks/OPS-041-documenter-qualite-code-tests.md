# OPS-041 — Intégrer et documenter les contrôles

- Demande : DEM-013 ; type : consolidation
- Session de création : 01a1ee70-2dc4-7331-992b-b24155dfd09a
- Couche : devops ; branche : `layers/devops` ; worktree : `worktree/devops`
- État : validée humainement
- Chemins autorisés : `codebase-integrity/README.md`, `codebase-integrity/conventions.json`, `codebase-integrity/package.json`, `codebase-integrity/commun/`, `infra/make/Makefile.dev`, `Makefile`, `docs/executer-controles.md`, `webapp/scripts/quality/`, `dev-book/demand/DEM-013-qualite-code-et-tests.md`, `dev-book/reports/qualite-code-et-tests-analyse.md`, cette carte.
- Dépendances : commits locaux de OPS-036, OPS-037, OPS-038, OPS-039 et OPS-040.

## Résultat et critères

Raccorder les contrôles aux commandes et à la présentation du projet, documenter règles, portées, coûts, exceptions, limites et prérequis dans leurs références uniques, sans modifier les rubriques des README. Compléter la déclaration structurée de contribution pour chaque chemin final et contrôle associé. Produire un bilan avec résultats réels, inventaire des zones non mesurables et corrections éventuelles à router par couche ; ne pas attribuer de verdict humain.

Vérifier les commandes, les contrôles des vérificateurs, documentation, registre et traces ; consigner les preuves et limites ici. Préserver les autres demandes, données et `.env`.

## Réalisation et preuves

Commandes publiques raccordées pour les fonctions et le débogage, les duplications, la couverture et la mutation étendue ; registre, documentation et présentation mis à jour. Les signalements restent informatifs, sauf les blocages définis dans l’analyse.

Vérifications : contrôles statiques Showcase exécutés dans Docker, sans blocage ; autres cibles contrôlées localement. `make conventions-tests-docs` et `make conventions-tests-devbook` réussissent ; `make internal-tests-verifiers` réussit (166 tests Python, 102 Vitest et 44 Bun). Quinze tests ciblés et ESLint/Prettier ciblés réussissent. Après reconstruction de l’image, `make internal-tests-coverage GD_TARGET=showcase-immobilier` réussit : 141 tests unitaires et 254 d’intégration. Statut de la mutation étendue : voir OPS-040.

## Verdict humain

Validation explicite de la demande et des six cartes avec leurs limites. La désactivation demandée est incluse dans la révision identifiée.

```verdict-json
{
  "decision": "validé",
  "portee": "OPS-041 ; validation globale DEM-013 avec limites présentées et mutation étendue inactive.",
  "contenu": {
    "type": "git",
    "valeur": "23af763a2ae329b3eb64e7e10368af3d93fcff47"
  }
}
```

## Commits

À créer lors de l’implémentation.
