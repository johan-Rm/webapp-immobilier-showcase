# app/assets/

Assets traités par le pipeline de build.

## Rôle et responsabilités

**Rôle Nuxt :** le dossier `assets/` héberge les fichiers que l'outillage de build (Vite)
transforme — styles, fontes, images — avec bundling, optimisation et fingerprinting à la
compilation. Ils sont référencés via `~/assets` et intégrés au graphe de dépendances de
l'application. Ce qui doit être servi tel quel, sans transformation, relève de `public/`.
Réf. : [doc Nuxt — `assets/`](https://nuxt.com/docs/4.x/directory-structure/app/assets).

**Rôle attendu :** cette couche centralise l'identité visuelle et les ressources de
présentation globales de l'application — point d'entrée unique des styles, thème,
typographie, transitions de navigation, fontes et déclinaisons de marque. Elle garantit un
chargement maîtrisé, sans dépendance à un CDN tiers, et un point d'entrée CSS unique dont
tout le reste dérive.

## Conventions techniques

Aucune règle CI ne couvre ce dossier à ce jour.
