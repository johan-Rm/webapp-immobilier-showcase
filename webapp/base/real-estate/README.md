# Catalogue immobilier

## Rôle et responsabilités

Porter les screens immobiliers dans `components/screen/`. Les sous-dossiers
conservent les noms Nuxt `Screen*` et leurs variantes `LazyScreen*`.

## Conventions techniques

Seul Showcase étend cette layer : les screens dépendent encore de ses composants,
composables et stores, résolus depuis son application. Client 2 ne la charge pas.
Les surcharges du site ont priorité. Les règles frontend restent dans
[leur source unique](../../sites/showcase-immobilier/app/README.md).
