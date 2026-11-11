# BFF-001 — Conserver le parsing de locale sans ternaire imbriqué

- Demande : DEM-003
- Type : consolidation
- Session de création : 01a1c16c-2085-7141-83fa-3460f6bd4463
- Couche : correction BFF transverse de la demande déjà réunie
- Branche : demands/DEM-003
- Worktree : /home/johan/www/graines-digitales/modern-web-apps/showcase-immobilier
- État : correctifs du 2026-11-11 validés par l’humain ; commit local à créer
- Chemins autorisés : `webapp/server/api/dashboard/media/upload.post.ts`, `webapp/server/tests/dashboard-media-upload.vitest.ts`, cette carte
- Dépendances : aucune pour écrire ou tester ce correctif ; résultat global avec les autres cartes DEM-003

## Résultat et critères

Dans la reprise explicitement demandée (« si c’est incomplet continue »), remplacer
le ternaire imbriqué du parsing de locale par les mêmes branches explicites.
Conserver la chaîne directe, le premier élément d’un tableau éventuellement
imbriqué et le fallback nul ; ne modifier ni auth, upload, API ni projection.

## Réalisation et preuves

Depuis `d97fbda992a67a96abff8513e1b9de4b6b5b2be6`, réécriture de `getQueryString`
uniquement. Huit cas passent sur le vrai handler avec événement H3, auth,
API et projection simulées : locale simple, tableaux, tableaux imbriqués,
valeurs vides, invalides et inconnues. Aucun appel réel à Symfony ni écriture
de contenu. Comparaison supplémentaire de 13 entrées avant/après : résultats
identiques (`/tmp/dem003-semantic-proof.json`).
Les contrôles de conventions existants terminent avec succès. La suite Showcase
incluant ces huit cas passe ; qualité et build SSR réussis (synthèse WEB-001).
Aucun commit, push ou validation humaine du résultat final.

Le test est placé dans `server/tests/`, hors des répertoires de routes Nitro.
La vérification du bundle final confirme qu’aucune route `*vitest*` n’est exposée.

## Validation des correctifs du 2026-11-11

Verdict humain explicite : « c’est validé ». Il couvre le correctif présenté,
ses tests et ses limites documentées ci-dessus. Empreinte du lot vérifiée avant
consignation : 55 fichiers inchangés depuis la présentation sur `d97fbda`.
Session intervenante : `01a1c16c-2085-7141-83fa-3460f6bd4463`.
