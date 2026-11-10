# app/pages/

Points d'entrée de route (routing par fichiers).

## Rôle et responsabilités

**Rôle Nuxt :** le dossier `pages/` active le routing par fichiers — chaque fichier `.vue`,
segment dynamique (`[param]`) ou catch-all (`[...slug]`) devient une route. Une page est
rendue dans `<NuxtPage />` et déclare son contexte via `definePageMeta` (layout, middleware,
validation de paramètres, meta). Réf. : [doc Nuxt — `pages/`](https://nuxt.com/docs/4.x/directory-structure/app/pages).

**Rôle attendu :** la page est le point d'entrée qui orchestre la route dans le modèle
`page → layout → screen → composant`. Elle établit le contexte de route, charge et
prefetch les données, résout les screens à afficher et déclare les métadonnées de la route
(SEO, données structurées). Elle est le garant de la composition plein écran : elle décide
quels screens composent la route et préserve le modèle « un écran par section ». Elle
délègue l'affichage aux screens et composants, et la logique métier aux couches dédiées :
elle ne transforme pas les données elle-même. Elle garantit un élément racine unique pour
les transitions et reste SSR-safe.

## Conventions techniques

Aucune règle CI spécifique à ce dossier. Les règles transverses de la couche `app/`
s'appliquent (voir [../README.md](../README.md)).
