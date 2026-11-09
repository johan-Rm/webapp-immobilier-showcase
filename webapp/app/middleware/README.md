# app/middleware/

Garde-fous de navigation exécutés avant l'entrée dans une route.

## Rôle et responsabilités

**Rôle Nuxt :** un middleware de route s'exécute avant le rendu de la route cible — côté
serveur au premier chargement, côté client ensuite — et décide de laisser passer, rediriger
(`navigateTo`) ou interrompre (`abortNavigation`) la navigation. Les middlewares globaux
(`.global.ts`) s'exécutent à chaque navigation ; les middlewares nommés s'appliquent route
par route via `definePageMeta`. Réf. : [doc Nuxt — `middleware/`](https://nuxt.com/docs/4.x/directory-structure/app/middleware).

**Rôle attendu :** cette couche fait respecter les invariants de navigation de
l'application avant tout rendu — contrôle d'accès, normalisation d'URL, garde-fous
transverses. Elle décide de l'admission dans une route ; elle reste légère et sans I/O
bloquante, et délègue toute logique métier aux couches dédiées.

## Conventions techniques

Aucune règle CI spécifique à ce dossier. Les règles transverses de la couche `app/`
s'appliquent (voir [../README.md](../README.md)).
