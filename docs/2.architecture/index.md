# Architecture

- Role: point d entree des invariants d architecture du projet.
- Source of truth: les pages de cette section

Cette section documente les frontieres structurelles de l application Nuxt, le flux des
donnees, le modele de composition des pages, les contraintes SSR et les conventions
transverses qui protegent la lisibilite du code.

Elle ne remplace pas les README locaux des dossiers applicatifs. Elle fixe les regles
globales a respecter avant d entrer dans les conventions plus specifiques de `app/`,
`services/`, `server/`, `schemas/` ou `shared/`.

Lectures prioritaires :

1. [Application Architecture](1.application-architecture.md) : couches applicatives,
   responsabilites et invariants runtime.
2. [Data Flow](2.data-flow.md) : chemin principal des donnees, du contenu source au rendu.
3. [Page, Layout, Screen Model](3.page-layout-screen-model.md) : modele de composition
   des routes editoriales.
4. [SSR Safety](4.ssr-safety.md) : garde-fous serveur/client et hydratation.
5. [Responsibility Boundaries](5.responsibility-boundaries.md) : frontieres entre
   documentation, pages, composants, composables, stores, services et serveur.
6. [Script Setup Standard](6.script-setup-standard.md) : structure attendue des fichiers
   Vue et Nuxt en `<script setup lang="ts">`.
7. [Auto Imports And Aliases](7.auto-imports-and-aliases.md) : groupes auto-importes Nuxt
   et alias de resolution du projet.
8. [Composables Standard](8.composables-standard.md) : conventions de structure, de
   responsabilite et d API pour les composables Vue/Nuxt du projet.
9. [Types Placement](9.types-placement.md) : regles de placement des types TypeScript et
   script de verification associe.
10. [Services Standard](10.services-standard.md) : organisation de la couche `services/`,
    conventions par sous-dossier et invariant framework-agnostic.
11. [Stores Standard](11.stores-standard.md) : conventions Pinia du projet, deux styles de
    store, pattern état brut / getter enrichi et règles d actions.
12. [Content Model](12.content-model.md) : organisation de `content/`, types de ressources,
    correspondance schema.org et pipeline de transformation vers les contrats applicatifs.
13. [Routing And Middleware](13.routing-and-middleware.md) : structure des routes, préfixe de
    locale, middlewares globaux, scroll behavior et conventions de navigation.

- [Layers clients immobiliers](14.site-layers.md) : composition, sélection et ajout de clients.
