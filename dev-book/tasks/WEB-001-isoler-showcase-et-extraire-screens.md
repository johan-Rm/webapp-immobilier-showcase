# WEB-001 — Déplacer Showcase et extraire les 16 screens

- Demande : DEM-003 ; brouillon principal `tmp/demande-extraire-screens-immobiliers.md`
- Type : consolidation
- Session de création : 01a1c16c-2085-7141-83fa-3460f6bd4463
- Couche : web
- Branche : layers/web
- Worktree : worktree/web
- État : correctifs du 2026-11-11 validés et commités localement ; à livrer
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

- Réalisation : `ac57e313712614caa07d0780d847c6ab588dc67f`.
Aucun push, PR ni fusion.

## Reprise du 2026-11-11 — images

Reprise demandée via `implementer-demande DEM-003`, après la proposition de
commencer par les images. Correction sur le principal déjà porteur de la demande,
`demands/DEM-003`, depuis `d97fbda992a67a96abff8513e1b9de4b6b5b2be6` ;
les worktrees de couche, leurs environnements et données restent préservés.
Cette reprise n’altère pas le verdict du lot de migration précédent.

Chemins modifiés dans `webapp/sites/showcase-immobilier/app/` :
`components/property/ExceptionalLightbox.vue`, `composables/useAppImage.ts` et
`pages/villa-des-alizes.vue`. Les 12 balises brutes Villa passent par AppImage
et des presets nommés. La lightbox utilise un preset dédié avec `fit: contain`,
qualité 85 et largeur 1200. Les classes, sources, textes et stratégies de
chargement existants sont conservés ; les formats et sources responsives
passent désormais par le wrapper optimisé.

Le scanner s’arrête au premier `</template>` imbriqué : il ne signalait que deux
des douze balises brutes Villa. Toutes sont corrigées sans modification du scanner.

Preuves locales : `bun run check:app:images`, `bun run quality:check` et
`bun run build` réussis ; 80 tests Showcase réussis (16 fichiers). Le serveur de vérification
éphémère sert `/fr/villa-des-alizes` en HTTP 200 ; 21 images optimisées sont
présentes dans le HTML SSR et une source IPX répond HTTP 200 en `image/webp`.
Ce serveur est arrêté après vérification. Pas de validation visuelle humaine
ni d’annonce de réussite de la CI sur ces changements non publiés.
Logs locaux : `/tmp/dem003-reprise-quality.log`, `/tmp/dem003-reprise-tests.log`,
`/tmp/dem003-reprise-build.log`, `/tmp/dem003-reprise-ssr-proof.json`.
Complément demandé ensuite : réorganisation des sections dans 39 fichiers Vue,
réécriture de la mise à jour des légendes et du tri des dates de médias. Les
contrôles de sections et de qualité terminent désormais avec succès, sans
modification de règle. 36 fichiers conservent exactement les mêmes déclarations
AST ; les exceptions sont la lightbox (import du preset), l’éditeur de légendes
et Tiptap (helper pur hoisté pour conserver l’initialisation du composable).
Les dépendances immédiates ont été vérifiées avant réorganisation.

La régression `sites/showcase-immobilier/tests/metadata.vitest.ts` vérifie le tri
réel du store sur dates valides, invalides et antérieures à 1970, sans mutation de
la liste reçue. Les comparaisons avant/après confirment 49 paires de dates et
18 cas de mise à jour des légendes (`/tmp/dem003-semantic-proof.json`).
Les neuf commandes de conventions terminent avec le code 0 ; les avertissements
nécessitant une revue humaine restent explicitement non arbitrés par les tests.
Les deux smokes Showcase existants passent sur desktop et mobile. Vérifications
complémentaires : lightbox desktop ouverte, image chargée en `contain`, fermeture ;
galerie mobile sélectionnée avec image chargée ; connexion HTTP 200 et formulaire
visible dans les deux formats. Aucune erreur JavaScript relevée. Logs et captures
locaux : `/tmp/dem003-final-browser-showcase-immobilier.log`,
`/tmp/dem003-extra-browser-proof.json`, `/tmp/dem003-final-lightbox-desktop.png`,
`/tmp/dem003-final-gallery-mobile.png`. Pas de parcours d’édition authentifié ni
d’écriture réelle vers Symfony. Qualité, tests et build finaux :
`/tmp/dem003-final-showcase-immobilier-{quality-check,test,build}.log`.
Le correctif du parsing d’upload est suivi dans BFF-001, celui des contrats dans OPS-004.
Aucune configuration de contrôle, convention ou règle Codebase Integrity modifiée.
Aucun commit, push ou fusion à cette étape ; résultat à vérifier humainement.

## Validation des correctifs du 2026-11-11

Verdict humain explicite : « c’est validé ». Il couvre le correctif présenté,
ses tests et ses limites documentées ci-dessus. Empreinte du lot vérifiée avant
consignation : 55 fichiers inchangés depuis la présentation sur `d97fbda`.
Session intervenante : `01a1c16c-2085-7141-83fa-3460f6bd4463`.

Commit local du correctif validé : `aa3425fc4be80e6b750694066b97880a6fb637b0`. Aucun push ni fusion.
