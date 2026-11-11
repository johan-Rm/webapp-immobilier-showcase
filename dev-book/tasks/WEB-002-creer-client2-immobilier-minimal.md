# WEB-002 — Créer la cible immobilière minimale Client 2

- Demande : DEM-003 ; brouillon principal `tmp/demande-extraire-screens-immobiliers.md`
- Type : consolidation
- Session de création : 01a1c16c-2085-7141-83fa-3460f6bd4463
- Couche : web
- Branche : layers/web
- Worktree : worktree/web
- État : validée et commitée localement le 2026-11-10 ; à reconstituer
- Chemins autorisés : `webapp/sites/client2-immobilier/`, `webapp/tests/layers/client2.vitest.ts`, `webapp/tests/e2e/client2.smoke.spec.ts` ; fichiers prévus dans l’inventaire principal.
- Dépendances : OPS-003 source `3043960c8f6752ddfdfeae6ce114244fe64633b1` repris par `010cee5` ; autres dépendances et limite de correction dans les preuves.

## Résultat et critères

Créer la cible `client2-immobilier` avec `site.ts`, config Nuxt, entrée `app.vue`
et page minimale affichant « Client 2 Immobilier ». Fournir la traduction française
minimale ; Showcase garde ses trois langues. La config déclare sa propre app et
son emplacement serveur vide, sans étendre la layer des screens.

Aucun contenu immobilier fictif, menu Showcase, dashboard, image ou identifiant
Symfony ; ne pas copier `.env`. Aucun `app.vue`, plugin ou middleware Showcase
hérité. L’absence de thème et catalogue doit être supportée par l’orchestration,
pas comblée par des copies de données Showcase.

Critères : entrée SSR et titre corrects ; aucune route/dashboard, screen ou
initialisation de Showcase ; isolation vérifiable du catalogue de composants et
des routes serveur. Prévoir le smoke minimal desktop/mobile adapté à cette page,
sans exiger `[data-screen]`.

Tests : fixtures de structure de la cible et tests navigateur dédiés. Types et
build réels attendent OPS-004 ; accès par vhost attend OPS-005. Ces deux attentes
ne bloquent pas la création des fichiers. README limité au rôle propre à la cible.
Ne pas rendre les screens autonomes ni les activer ici.

## Réalisation et preuves

Implémentée, non commitée, à vérifier. Base Web : `d625724929275b98c833e03947abe8c85535c17a` ;
dépendances validées reprises avec celles de WEB-001, sans copie non commitée.
Cible minimale française, propre app et serveur vide ; aucun dashboard, catalogue,
contenu, thème ou secret Showcase. Aucun commit d’implémentation créé.

Preuves depuis ce worktree :
- `GD_TARGET=client2-immobilier bun run type-check` : réussi, préparation de la
  cible incluse (`/tmp/dem003-web-client2-types-final.log`).
- `GD_TARGET=client2-immobilier bun run build` en production SSR : réussi
  (`/tmp/dem003-web-client2-build.log`), sans contenu/thème ni hook Showcase.
- `GD_TARGET=client2-immobilier bun run test` : 44 tests / 9 fichiers réussis ;
  fixture d’isolation finale rejouée après adaptation au futur helper typé : passée.
  Composants, auto-imports et routes ne chargent pas Showcase ni ses secrets.
- Deux builds réels servis simultanément par Nginx ; page et titre SSR corrects,
  routes /fr/dashboard/login, /themes.json et API de contenu absentes (404).
- Smoke Chromium desktop/mobile : 2 réussites (`/tmp/dem003-e2e-client2.log`),
  titre français, HTML SSR et absence de requêtes d’initialisation Showcase.
  Même environnement de navigateur temporaire que WEB-001 ; aucune vidéo requise.
- Lint et diff whitespace : réussis. Pile de test arrêtée, données préservées.

Diff : les neuf nouveaux fichiers WEB-002 de l’inventaire principal, index vide.
La correction OPS-004 devra être reprise puis les contrôles rejoués dans la réunion
finale. Aucun verdict humain d’implémentation exprimé à ce stade.

## Verdict humain

Validée le 2026-11-10 : « c’est validé », après consultation du vhost
Showcase et rétablissement des données locales (69 biens, 686 images).
Validation du contenu présenté, dont les empreintes ont été revérifiées.

## Clôture des vérifications

Correction OPS-004 source `0fb11118275083408e7f7a37f6cd9d12ff3133e2`
reprise avec -x par `93eba2a` dans Web. `GD_TARGET=showcase-immobilier
bun run quality:check` et `GD_TARGET=client2-immobilier bun run type-check`
réussissent via leurs commandes ordinaires, sans configuration temporaire.
Les limitations typées décrites à l’étape 03 sont donc levées.
Les résultats se trouvent dans `/tmp/dem003-validated-showcase-quality.log`
et `/tmp/dem003-validated-client2-types.log`. Les données locales sont ignorées,
absentes des commits et conservées dans le worktree.

## Commits

- Réalisation : `669ab4cafe68b3ee92a34aa60b630b9574820156`.
Aucun push, PR ni fusion.

## Vérification après correction des contrats — 2026-11-11

Le comportement Client 2 est inchangé après la correction de préparation des
types portée par OPS-004. Les smokes existants desktop et mobile passent sur
l’artefact autonome reconstruit : HTML SSR minimal, titre, langue française,
aucune requête aux API, thèmes ou images Showcase ; dashboard et thème en 404.
Aucune erreur navigateur. Preuve : `/tmp/dem003-final-browser-client2-immobilier.log`.
Aucun `.env`, contenu ou secret Showcase utilisé par le serveur de vérification ;
serveur éphémère arrêté en fin de test. Aucune nouvelle validation humaine déduite.

Validation humaine du contrôle complémentaire le 2026-11-11 : « c’est validé ».
Le correctif commun est commité dans OPS-004 ; cette carte ne reçoit aucun changement fonctionnel.
