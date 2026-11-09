# app/plugins/

Plugins Nuxt exécutés à la création de l'application.

## Rôle et responsabilités

Rôle Nuxt : un plugin s'exécute une fois à l'instanciation de l'app — côté serveur, côté
client, ou les deux selon le suffixe (`.server.ts`, `.client.ts`, aucun). C'est le point
d'initialisation : préparer un état avant le rendu, brancher des hooks du cycle de vie
Nuxt, enregistrer des injections ou des directives.

Rôle dans ce projet : initialiser l'état runtime dont le rendu et les middlewares ont
besoin avant la première navigation. À ce titre, ce dossier est responsable de :

- résoudre une seule fois en SSR les locales activées du projet (API Symfony) et les
  exposer via `useState('project.locales')`, hydratées côté client par le payload sans
  refetch (`project-locales.ts`)
- piloter les paliers de chargement différé côté client à partir des hooks `page:start` /
  `page:finish` : navigation terminée, post-rendu (2 frames + idle), palier passif après
  première interaction ou fallback (`deferred-runtime.client.ts`)

La chaîne de résolution des locales est documentée dans
[docs/2.architecture/13.routing-and-middleware.md](../../../docs/2.architecture/13.routing-and-middleware.md).

## Conventions techniques

Aucune règle CI spécifique à ce dossier. Les règles transverses de la couche `app/`
s'appliquent (voir [../README.md](../README.md)).
