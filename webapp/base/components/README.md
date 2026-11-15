# Composants communs

## Rôle et responsabilités

- Construire les **éléments d’interface réutilisables** et les **Screens**, qui composent les sections des pages.
- Afficher des **données préparées**, reçues par propriétés ou exposées par un composable.
- Gérer les **interactions locales** et transmettre les intentions utilisateur par des événements ou des actions dédiées.
- Fournir une interface **accessible**, avec des **contrats typés**, compatible avec le **rendu serveur**.

## Conventions techniques

### Logique métier

Le composant consomme les **données métier préparées** sans reconstruire les règles qui les produisent.

- Les **règles métier et normalisations** appartiennent aux services dédiés.
- Les **données dérivées de l’état global** sont exposées par les getters de store ou les composables.
- Les **transformations locales de présentation** restent autorisées dans le composant, conformément aux conventions communes du socle.

### Accès réseau

Le composant **délègue les requêtes réseau** aux pages ou aux composables dédiés.

- Ne pas appeler directement `fetch`, `$fetch`, `useFetch` ou `useAsyncData` dans un composant, y compris un Screen.
- Consommer les **données et états de chargement ou d’erreur** par propriétés ou via un composable dédié.
- Une interaction peut déclencher une opération exposée par ce composable.

### Mutations globales

Le composant lit l’**état global** et demande ses modifications par des **actions de store**, directement ou via un composable dédié.

- Ne pas modifier directement une propriété du store ni appeler `$patch` ou `$reset` depuis le composant.
- Un composable qui modifie un store passe lui aussi par ses actions.
- L’**état local d’interface** reste géré par le composant.

### Images

Les images sont affichées avec **AppImage**, qui encapsule le module image de Nuxt et centralise ses paramètres.

- Réserver les balises `img`, `NuxtImg` et `NuxtPicture` au **composant d’encapsulation à la racine de l’application**.
- Fournir les paramètres par **`v-bind` avec un preset nommé** issu de `IMAGE_PRESETS` ou `IMAGE_WARMUP_PRESETS`.
- Ne pas coder en dur les propriétés `width`, `format`, `quality`, `fit` ou `sizes`.
- Ne pas utiliser la propriété **`height`**.

### Taille des composants

Un composant Vue vise une taille maximale de **200 lignes** ; un dépassement produit un **avertissement non bloquant**, à examiner en revue.

- Découper les composants volumineux en briques de présentation plus petites, chacune avec une responsabilité identifiable.
