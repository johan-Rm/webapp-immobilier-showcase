# app/utils/

Helpers auto-importés de la couche Vue.

## Rôle et responsabilités

**Rôle Nuxt :** le dossier `utils/` héberge des fonctions utilitaires auto-importées
(premier niveau) disponibles partout dans la couche Vue sans import explicite. Nuxt
distingue les utils des composables : un util est un helper, pensé pur, sans état réactif
ni lien avec le cycle de vie. Réf. : [doc Nuxt — `utils/`](https://nuxt.com/docs/4.x/directory-structure/app/utils).

**Rôle attendu :** cette couche porte les helpers légers et purs propres à l'application —
transformations sans état, adaptateurs techniques. Un util ne dépend ni de la route, ni
d'un store, ni du DOM. Ce qui devient partageable au-delà de la couche Vue remonte dans
`shared/`, et la logique métier appartient aux services.

## Conventions techniques

Aucune règle CI spécifique à ce dossier. Les règles transverses de la couche `app/`
s'appliquent (voir [../README.md](../README.md)).
