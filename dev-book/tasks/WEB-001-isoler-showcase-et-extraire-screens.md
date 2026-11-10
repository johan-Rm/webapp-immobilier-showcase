# WEB-001 — Déplacer Showcase et extraire les 16 screens

- Demande : DEM-003 ; brouillon principal `tmp/demande-extraire-screens-immobiliers.md`
- Type : consolidation
- Session de création : 01a1c16c-2085-7141-83fa-3460f6bd4463
- Couche : web
- Branche : layers/web
- Worktree : worktree/web
- État : validée humainement le 2026-11-10 ; commit local autorisé
- Chemins autorisés : `webapp/app/`, `webapp/sites/showcase-immobilier/app/`, les README de cette cible et `webapp/sites/README.md`, sa `nuxt.config.ts`, `webapp/base/real-estate/`, `webapp/tests/layers/showcase-components.vitest.ts`.
- Dépendances : OPS-003 source `3043960c8f6752ddfdfeae6ce114244fe64633b1` repris par `010cee5` ; autres dépendances et limite de correction dans les preuves.

## Résultat et critères

Utiliser les 187 fichiers actuels de `webapp/app/` : 16 screens vers
`base/real-estate/components/screen/`, 171 autres fichiers vers l’app Showcase.
Préserver les pages Villa et logos déjà dans la cible. Une seule collision existe :
fusionner les réglages UI du `app.config.ts` déplacé avec l’identité et les menus
existants, sans remplacement aveugle du dossier destination.

Créer `base/real-estate/nuxt.config.ts` avec `srcDir: '.'` et une source explicite
`components/` conservant le sous-dossier `screen/` et le nommage par chemin.
Seule la config Showcase étend cette layer. Ne déplacer ni composants de support,
ni composables/stores vers le socle. Garder les sous-chemins existants et leurs
imports `~/...`, qui devront résoudre l’app active par OPS-004.

Déclarer dans la config Showcase les options qui lui appartiennent : CSS et
transitions, modules d’édition/auth, initialisations métier, serveur BFF existant
sélectionné explicitement, sitemap et packaging du contenu/thème. Le contrat reste
`SiteDefinition {id,name}` ; aucun changement de services/shared requis.
Coordonner cette extraction de config avec OPS-004, sans écrire sa config racine.

Critères : inventaire des déplacements et empreintes conservées ; mêmes composants
`Screen*`/`LazyScreen*`, aucun doublon ; surcharge Showcase prioritaire ; mêmes pages,
langues et dashboard ; plus d’application à l’ancien emplacement. Mettre à jour
les liens des README déplacés sans recopier les conventions.

Tests : assertions d’enregistrement/surcharge et de conservation des fichiers.
Types, build et smoke Showcase sont des vérifications globales dépendant de
OPS-004 ; ne pas présenter cette attente comme un échec de réalisation.
Exclure toute refonte visuelle, activation Client 2 et correction historique.

## Réalisation et preuves

Implémentée, non commitée, à vérifier. Base Web : `d625724929275b98c833e03947abe8c85535c17a`.
Les dépendances validées ont été reprises avec `cherry-pick -x` : sources
OPS-003 `3043960`, OPS-004 `943ac3e`, OPS-005 `74e6948`, trace `a25d929` ;
commits locaux `010cee5`, `af2640f`, `bb956b5`, `d625724`.
Aucun commit d’implémentation créé dans cette reprise.

187 fichiers déplacés : 180 identiques à l’octet ; sept adaptations nécessaires
(app.config fusionné, CSS @config, imports des screens de la page d’accueil et
quatre README). Les 16 screens restent tous identiques ; leurs dépendances restent
Showcase. L’ancien app est absent. Contrôle d’empreintes :
`/tmp/dem003-web-move-after.json` ; inventaire de référence avant déplacement dans
`/tmp/dem003-web-move-before.json`.

Preuves depuis ce worktree :
- `GD_TARGET=showcase-immobilier bun run test` : 69 tests / 14 fichiers réussis.
  La fixture réelle Nuxt confirme les 16 noms Screen*/LazyScreen* et une surcharge
  cliente prioritaire. `bun run lint:check` et `git diff --check` réussis.
- Build `NODE_ENV=production NITRO_PRESET=node-server GD_TARGET=showcase-immobilier
  bun run build` : réussi (`/tmp/dem003-web-showcase-build-final.log`).
- Vrais serveurs SSR simultanés derrière Nginx : français/anglais/espagnol,
  dashboard login et alias historique HTTP 200 ; routes Showcase absentes de
  Client 2. Sortie `/tmp/dem003-real-ssr-start.log`.
- Smoke Playwright existant, Chromium desktop/mobile : 2 réussites
  (`/tmp/dem003-e2e-showcase.log`). Médias du principal montés en lecture seule ;
  dossiers accommodations générés vides créés dans le seul artefact temporaire,
  nécessaires à content-version. Aucun secret utilisateur ni API externe utilisé.
  Navigateurs avec bibliothèques extraites dans /tmp ; vidéo désactivée uniquement
  dans la config locale ignorée, assertions et traces conservées.
- Conventions : types placés conformes ; images 3, structure script setup 41,
  ternaires imbriqués 3, écarts historiques conservés dans les nouveaux chemins.

Limite : `GD_TARGET=showcase-immobilier bun run type-check` signale neuf erreurs
avec les alias de la première version OPS-004 (UI et auth, sans correction métier).
Après préparation explicite Showcase, `vue-tsc --project
/tmp/dem003-types-compat.json --noEmit` passe sur ses vraies sources avec les alias
historiques adaptés. La correction OPS-004 dans Devops préserve cette politique,
mais attend validation/commit avant consommation ; le contrôle standard final reste
à reprendre après son cherry-pick. Aucun assouplissement de règle ou de strict.

Diff : `git diff` et fichiers nouveaux des chemins WEB-001 de l’inventaire ;
index vide. Cette preuve technique ne vaut pas validation humaine.

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

Commit local de réalisation de cette carte ; SHA consigné dans la trace de clôture.
Aucun push, PR ni fusion.
