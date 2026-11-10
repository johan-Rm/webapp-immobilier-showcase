# app/stores/

État global partagé de l'application (Pinia).

## Rôle et responsabilités

**Rôle Pinia :** un store centralise un état global réactif partagé entre plusieurs
composants ou composables, exposé via un contrat typé (state, getters, actions). Les stores
sont auto-importés via leur `useXxxStore()` et leur state reste sérialisable pour le SSR.
Réf. : [doc Pinia — Defining a Store](https://pinia.vuejs.org/core-concepts/).

**Rôle attendu :** cette couche conserve l'état brut d'un domaine fonctionnel et en expose
une lecture enrichie — pattern « état brut, getter enrichi » : le state stocke des données
brutes sérialisables, les getters délèguent l'enrichissement aux services de mapping à la
demande. Les mutations passent par des setters explicites. Le store ne porte pas la logique
métier et ne connaît pas l'UI ; il expose un contrat typé que les composables consomment.

Les conventions détaillées (styles de store, setters défensifs, merge de listes, flags
`loading`/`error`, dépendances entre stores, règles SSR, naming) sont définies dans
[docs/2.architecture/11.stores-standard.md](../../../../../docs/2.architecture/11.stores-standard.md).

## Conventions techniques

Aucune règle CI spécifique à ce dossier. Les règles transverses de la couche `app/`
s'appliquent (voir [../README.md](../README.md)).
