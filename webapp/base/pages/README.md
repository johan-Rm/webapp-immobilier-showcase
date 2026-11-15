# Pages communes

## Rôle et responsabilités

- Définir les **points d’entrée de route** et leur contexte.
- Orchestrer le **chargement des données**, les Screens et les métadonnées de référencement.
- Déléguer le **rendu détaillé aux Screens et composants**, et les **transformations métier aux services dédiés**.

## Conventions techniques

### Composition des routes

La page **assemble les Screens nécessaires à la route**. Chaque Screen représente une section cohérente de son contenu.

- Déclarer le **layout**, les **middlewares** et les **validations de paramètres** nécessaires.
- Conserver une **racine unique**, compatible avec les transitions et le rendu serveur.

### Repère principal

Le **layout porte l’unique élément HTML `main`**, qui identifie le contenu principal de la page.

- La page et ses Screens **n’ajoutent pas de `main`**.
- Les Screens utilisent les éléments adaptés à leur contenu, notamment `section` ou `aside`.
