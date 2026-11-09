# app/layouts/

Gabarits de mise en page communs aux routes.

## Rôle et responsabilités

**Rôle Nuxt :** un layout est une enveloppe réutilisable autour des pages. Il rend le
contenu de la route dans son `<slot />` et persiste entre les navigations qui partagent le
même gabarit. Chaque page choisit son layout via `definePageMeta({ layout })` ;
`default.vue` s'applique par défaut. Réf. : [doc Nuxt — `layouts/`](https://nuxt.com/docs/4.x/directory-structure/app/layouts).

**Rôle attendu :** le layout est le cadre structurel persistant du modèle
`page → layout → screen → composant`. Il porte le chrome commun à un ensemble de routes —
en-tête, navigation, overlays, conteneur principal — et possède le viewport (dimensions et
débordement de l'écran). Il ne connaît pas le contenu métier des pages : il fournit leur
cadre, et laisse les pages orchestrer et les screens gérer leur propre défilement interne.

## Conventions techniques

Aucune règle CI spécifique à ce dossier. Les règles transverses de la couche `app/`
s'appliquent (voir [../README.md](../README.md)).
