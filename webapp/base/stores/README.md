# Stores communs

## Rôle et responsabilités

- Conserver l’**état partagé** entre composants et composables, en respectant l’isolation des utilisateurs lors du rendu serveur.
- Exposer un **contrat typé** : état, valeurs dérivées accessibles par les **getters**, et opérations proposées par les **actions**.
- Centraliser les **modifications de cet état**, sans porter la composition visuelle ni les règles métier des services.

## Conventions techniques

### État sérialisable

Le store conserve des **données brutes sérialisables**, qui peuvent être transmises du serveur au navigateur lors du rendu initial.

- Stocker les données sources ; exposer leurs valeurs dérivées par des getters.
- Garder hors de l’état les éléments DOM, connexions réseau, fonctions et instances de services.
- Ne pas placer de secrets dans un état transmis au navigateur.

### Lecture enrichie

Les getters exposent les **valeurs dérivées de l’état**, sans modifier les données sources.

- Déléguer les calculs et transformations métier aux **services dédiés**, notamment les services de mapping.
- Garder les getters **synchrones et sans effets de bord** : aucune requête réseau ni écriture dans un état.
- Laisser aux composants et composables les adaptations propres à l’affichage.

### Mutations explicites

Les modifications de l’état passent par des **actions nommées selon leur intention**.

- Exposer des opérations explicites, comme `selectOffer` ou `resetFilters`.
- Réserver les affectations directes, `$patch` et `$reset` à l’implémentation interne du store.
- Faire passer les modifications demandées par les composants et composables par ces actions.
