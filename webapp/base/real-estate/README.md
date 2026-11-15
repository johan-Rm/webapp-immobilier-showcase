# Catalogue immobilier

## Rôle et responsabilités

- Fournir les Screens immobiliers et leurs variantes de chargement différé.
- Respecter les dépendances de l’application consommatrice et la priorité des surcharges du site.

## Conventions techniques

### Composition du catalogue

Le catalogue n’est étendu que par une application qui fournit les composants, composables et stores nécessaires. Les surcharges du site priment sur les Screens du catalogue ; les noms Nuxt des Screens et de leurs variantes différées sont conservés.
