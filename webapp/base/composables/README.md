# Composables communs

## Rôle et responsabilités

- Orchestrer la **logique réactive réutilisable** entre l’interface, les services et les stores.
- Exposer des **données préparées**, les **états de chargement et d’erreur** nécessaires, et des **opérations aux noms explicites**.
- Définir clairement si l’état est **propre à chaque utilisation** ou **partagé entre plusieurs utilisations**.

## Conventions techniques

### Responsabilité unique

Un composable répond à un **besoin cohérent et identifiable**.

- Regrouper uniquement les états et opérations nécessaires à ce besoin.
- Séparer les responsabilités indépendantes dans des composables distincts.

### API explicite

Les noms exposés décrivent clairement les **données disponibles** et les **opérations proposées**.

- Nommer les opérations selon leur intention : `loadOffers`, `applyFilters`, `resetSelection`.
- Choisir des noms compréhensibles sans connaître la bibliothèque utilisée ou l’organisation interne du composable.

### Effets explicites

L’appelant déclenche les **requêtes réseau** et les **opérations qui modifient des données** par des fonctions explicitement exposées. La création du composable ne les déclenche pas automatiquement.

- Ne pas modifier silencieusement un store ni envoyer d’événement de suivi d’usage.
- Décrire en tête du composable les **synchronisations automatiques**, leur déclencheur et leurs conséquences.

### Réactivité déclarative

Utiliser une **valeur calculée (`computed`)** lorsqu’une donnée dépend d’autres données réactives.

- Éviter de recopier une valeur dérivée dans un état séparé maintenu par un observateur.
- Réserver les **observateurs (`watch`, `watchEffect`)** aux effets nécessaires, comme synchroniser l’URL ou une bibliothèque externe.
- Respecter la convention des **effets explicites** lorsqu’une synchronisation déclenche une requête ou modifie des données.

### Logique métier séparée

Le composable **orchestre les données et leur réactivité**. Les règles, calculs et normalisations métier appartiennent aux **services dédiés**, indépendants de Vue.

- Appeler ces services depuis le composable lorsque leur résultat alimente un état réactif.
- Conserver dans le composable les états de chargement, les erreurs et les synchronisations nécessaires à son usage.

### Taille de l’API

Un composable expose au maximum **8 propriétés dans son objet de retour**, données et fonctions comprises.

- Séparer les responsabilités lorsque cette limite est dépassée.
- Ne pas regrouper artificiellement les propriétés dans des objets imbriqués pour contourner la limite.

### État local et partagé

Le composable indique clairement si son état est **propre à chaque appel** ou **partagé entre plusieurs appelants**.

- Créer l’état local à l’intérieur du composable.
- Utiliser un mécanisme compatible avec le **rendu serveur** pour l’état partagé, afin d’isoler les données des utilisateurs entre les requêtes.
- Préciser la durée de vie de l’état et les conditions de sa réinitialisation.
