# Showcase Immobilier

## Rôle et responsabilités

- Fournir l’identité, les thèmes, contenus trilingues, médias et parcours publics de Showcase.
- Composer les Screens du catalogue avec les dépendances de cette application.

## Conventions techniques

### Initialisation propre à Showcase

Les plugins initialisent les **locales du projet** et le **chargement différé du rendu**.

- Résoudre les locales activées une seule fois au rendu serveur et les exposer dans l’état partagé ; le payload hydrate le client sans nouvel appel.
- Déclencher les paliers clients à la navigation : après son achèvement, après rendu avec deux frames et une phase idle, puis après la première interaction ou le délai de repli.
