# app/components/

Briques de présentation et de composition visuelle.

## Rôle et responsabilités

**Rôle Nuxt :** le dossier `components/` auto-importe les composants Vue dans toute
l'application, sans import explicite ; le nom d'import dérive du chemin (les dossiers
servent de préfixe). Réf. : [doc Nuxt — `components/`](https://nuxt.com/docs/4.x/directory-structure/app/components).

**Rôle attendu :** le composant implémente le rendu dans le modèle
`page → layout → screen → composant` — affichage et composition visuelle uniquement. Il
consomme des données déjà préparées, reçues par ses props ou via un composable, et reste
passif : il ne récupère pas de données, ne mute pas l'état global et ne construit pas de
donnée métier dérivée. Il se concentre sur un rendu lisible, typé, accessible et SSR-safe.

## Conventions techniques

Aucune règle CI n'est déclarée dans ce README : les conventions qui visent les composants
(logique métier, fetch, mutation de store, images, taille de composant) sont possédées par
[../README.md](../README.md), qui en est le propriétaire et où elles sont reliées à leurs
règles YAML.
