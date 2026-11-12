# Client 2 Immobilier

## Rôle et responsabilités

Cible SSR indépendante : accueil français conservé, listes et fiches articles sous
`/fr/articles`, `/en/articles`, `/es/articles`. Seules les traductions présentes dans
la projection publiée sont servies, sans requête Symfony côté visiteur.
Aucune route ou initialisation Showcase n’est activée.

## Conventions techniques

Sélection et build : [guide des layers](../../../docs/2.architecture/14.site-layers.md).
Le [contrat de projection](../../scripts/README.md) est fourni par OPS-012. Le lecteur
capture une release par requête et vérifie son empreinte. Pages et API éditoriales :
`no-store` ; médias nommés par empreinte : cache immuable. Une dépublication retire
fiche, liste et SEO courants, sans fallback de langue. Les anciennes images publiques
restent accessibles aux requêtes engagées, conformément au contrat du projecteur.

Configuration privée du SSR : `SAAS_PROJECTION_PROJECT_ID` (UUID du pilote),
`SAAS_PROJECTION_ROOT` (défaut `.data/saas-projection`, dans la racine d’exécution),
`SAAS_PREVIEW_SECRET` (au moins 32 caractères, partagé avec le BFF). Aucun identifiant
Symfony n’est nécessaire. L’extension Compose transmet explicitement l’UUID à
Client 2 ; en l’absence de cet UUID, le lecteur échoue avec HTTP 503. Aucun secret n’entre
dans la configuration publique.

`POST /api/saas-preview` reçoit le payload et le Bearer privés du BFF. Projet,
langue, blocs et médias sont validés. Le rendu Vue commun à l’article public et à
l’aperçu échappe le texte et refuse les liens exécutables, sans HTML éditorial brut.
Aperçu : `no-store`, `noindex`, CSP restrictive, aucun état de session ou brouillon
sérialisé. Les images passent par les routes BFF qui revérifient les droits.
Le raccordement au dashboard réel reste à vérifier dans OPS-013.

Tests HTTP : `server/articles.vitest.ts`. Types et build :
`GD_TARGET=client2-immobilier bun run type-check`, puis `bun run build` avec cette
même cible et les dépendances commitées indiquées dans WEB-005.

Parcours navigateur dans un snapshot isolé : démarrer `.output/server/index.mjs`
avec `SAAS_PROJECTION_PROJECT_ID=10000000-0000-4000-8000-000000000001`,
`SAAS_PROJECTION_ROOT=.tmp/web005-browser`, un `SAAS_PREVIEW_SECRET` fictif et
`NITRO_PORT=19505`. Dans ce même dossier, avec le même secret :

```bash
WEB005_E2E_FIXTURES=1 GD_TARGET=client2-immobilier \
  SAAS_PROJECTION_ROOT=.tmp/web005-browser SAAS_PREVIEW_SECRET="$SAAS_PREVIEW_SECRET" \
  PLAYWRIGHT_BASE_URL=http://127.0.0.1:19505 \
  bunx playwright test tests/e2e/client2-articles.spec.ts --workers=1
```

Le test refuse un dossier existant ; il crée puis retire ses seules fixtures.
Il couvre ordinateur/mobile, SSR, SEO, blocs, langue non publiée, aperçu privé,
conservation de la version publique et dépublication. Ne pas utiliser une pile
utilisateur ou une API réelle pour ce contrôle.
