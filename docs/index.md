# Documentation

- Role: point d entree et gouvernance documentaire du projet.

Cette documentation complete les README locaux et centralise les conventions transverses du projet.

## Ordre de lecture

1. [Architecture](2.architecture/index.md)
2. la section thematique concernee
3. le `README.md` local du dossier concerne

## Hierarchie d autorite

1. `docs/2.architecture/` : invariants structurels et architecture globale
2. `docs/` : conventions transverses par theme
3. `./**/README.md` : conventions locales au plus pres du code
4. commentaires et JSDoc : intention locale et liens vers la doc

## Regles

- chaque information a un proprietaire principal ; les autres niveaux referencent, ne recopient pas
- mettre a jour la doc impactee dans le meme scope que le code
- toute JSDoc sur une API structurante inclut un `@see` vers `docs/` ou le README local

## Sections disponibles

- `1.getting-started` : demarrage et structure du projet
- `2.architecture` : architecture globale et invariants structurels
- `3.application` : conventions applicatives Nuxt
- `4.design-system` : fondations UI et direction graphique
- `5.content-and-i18n` : conventions de langue et contenu
- `6.schemas-and-data` : schemas, generation et contrats
- `7.server` : architecture serveur et conventions API
- `8.seo` : conventions SEO transverses

## Dashboard SaaS

- [Utilisation et exploitation](1.getting-started/dashboard-saas.md)
- [Contrat et limites](3.application/dashboard-saas-contrats.md)
