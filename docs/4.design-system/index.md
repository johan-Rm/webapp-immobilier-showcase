# Design System

- Role: centraliser les fondations visuelles et conventions UI transverses.

Cette section couvre la configuration Tailwind, le système de tokens, les palettes de couleurs, les thèmes et la gestion du color mode.

## Sommaire

| Document                                              | Contenu                                                                 |
| ----------------------------------------------------- | ----------------------------------------------------------------------- |
| [1. Tailwind et tokens](1.tailwind-et-tokens.md)    | Config Tailwind, pattern token-based RGB, tokens sémantiques, entry CSS |
| [2. Thèmes et palettes](2.themes-et-palettes.md)    | Source `themes.yaml`, palettes, les 3 thèmes, pipeline YAML → CSS       |
| [3. Color mode et useDesignSystem](3.color-mode.md) | Composable principal, flux de changement de thème, mode cinéma          |

## Principes fondamentaux

- Les couleurs ne sont jamais définies en dur dans les templates — elles passent par des tokens sémantiques.
- Les classes `dark:` Tailwind ne sont pas utilisées — le système repose sur des variables CSS pilotées par sélecteurs CSS (`:root`, `.dark`, `.theme-kasbah`).
- `themes.yaml` est l'unique source de vérité pour les couleurs et polices.
- `useDesignSystem()` est le seul point d'entrée pour modifier le thème actif à l'exécution.
