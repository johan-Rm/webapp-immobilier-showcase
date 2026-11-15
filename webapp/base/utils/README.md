# Utilitaires communs

## Rôle et responsabilités

- Fournir des **fonctions techniques simples et sans état**, propres au frontend.
- Réaliser les **calculs et transformations génériques**, indépendamment de la réactivité et du cycle de vie des composants.
- Laisser les **règles métier aux services** et l’**orchestration réactive aux composables**.

## Conventions techniques

### Pureté des fonctions

Un utilitaire produit son résultat à partir de ses **paramètres explicites**, sans modifier les données reçues ni l’environnement extérieur.

- Ne dépendre ni de la route, ni d’un store, ni du DOM.
- Ne porter aucun état réactif ni comportement de cycle de vie.
- Recevoir explicitement les valeurs variables nécessaires, comme la date courante ou la langue.

### Portée des fonctions

Un utilitaire reste au **plus près de ses usages** et rejoint le code partagé lorsque plusieurs couches en ont réellement besoin.

- Conserver localement une fonction propre à un seul usage.
- Mutualiser une fonction technique utilisée par plusieurs couches, sans dépendance à une application cliente.
- Placer les transformations métier dans les **services dédiés**.
