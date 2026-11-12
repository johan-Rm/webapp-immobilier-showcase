# WEB-005 — Afficher les articles publiés et leur aperçu sur Client 2

- Demande : DEM-005 ; type : développement
- Brouillon de référence : `tmp/demande-dashboard-saas.md`, relatif au dépôt principal, hors du worktree ; ne pas le copier.
- Demande définitive prévue : `dev-book/demand/DEM-005-dashboard-saas.md`, créée seulement à la reconstitution ; fichier actuellement absent, lien à ajouter alors.
- Session de création : 01a1ca56-891a-7700-97c6-a576d3d9a615
- Couche : web
- Branche : layers/web
- Worktree : worktree/web
- Base locale vérifiée : `ce1bc495a962f5eb7093a2c0bbd1a191c29871ab` ; aucun fetch.
- État : validée et commitée localement, à livrer ; intégration réelle à vérifier dans OPS-013
- Chemins autorisés : `webapp/sites/client2-immobilier/`, `webapp/tests/e2e/client2-articles.spec.ts`, `webapp/tests/layers/client2.vitest.ts`, cette carte
- Dépendances de réalisation : DOM-001 `8c1000ecc9996cd3632a323fd1ed49604ad4e929`, OPS-012 `9e9be7517117eff97fbc7974e3e7a60fc13a921b`, BFF-004 `1e52c1034578636c2a340d936b377d8d83132ef5`
- Commits nécessaires : dépendances validées ci-dessus ; consommées uniquement par leurs sources commitées dans le snapshot de contrôle.
- Dépendances de vérification globale : OPS-013

## Résultat et critères

Ajouter liste et pages articles fr/en/es, SEO et rendu des blocs à partir de la projection publiée.
Aucun appel Symfony pendant une requête visiteur ; pas de fallback exposant une langue non publiée.
Dépublication retire article/liste et données SEO publiques ; traiter slug/locale inconnus en 404.
Le rendu privé de prévisualisation réutilise les composants publics mais reçoit des données autorisées
via BFF ; aucun contournement d’accès par route directe, sérialisation SSR ou cache partagé.
Sélectionner explicitement les seuls endpoints serveur nécessaires, sans activer les routes Showcase.
Préserver l’accueil Client 2 et les builds Showcase. Pas de dépendance envers les composants Showcase.
Exclusions : refonte de marque, autres contenus, API distante sur le chemin public.

Les critères de besoin et exclusions communs restent dans le brouillon ; aucune modification
de Codebase Integrity, de règle ou de gouvernance hors consolidation déclarée.
Les métadonnées de cette carte relèvent de la trace obligatoire, même hors périmètre applicatif.
Documentation : Mettre à jour le README Client 2 pour son rôle désormais éditorial ; guide et architecture restent OPS-013.

## Réalisation et preuves

Implémentation du 2026-11-12, même session réelle que la création.
Couche `web`, branche `layers/web`, HEAD de base ci-dessus, index vide.
La carte non suivie préexistante appartient à cette même mission ; aucun changement étranger.

Listes et fiches SSR FR/EN/ES, métadonnées SEO, canonical et alternates limités aux
traductions publiées. Lecture locale d’une seule release vérifiée, sans accès Symfony.
Images par empreinte, ordre texte/image/galerie préservé, 404 des slugs/langues absents,
retrait des routes et SEO après dépublication. Accueil historique conservé.
Le renderer privé POST vérifie Bearer, projet, langue et références ; rendu Vue commun
avec échappement, absence de sérialisation du brouillon, `no-store`/`noindex` et CSP.
Usage et configuration : [README Client 2](../../webapp/sites/client2-immobilier/README.md).

État présenté : trois fichiers applicatifs suivis modifiés, douze nouveaux, plus
cette carte. Manifeste local `/tmp/dem005-web005-manifest.json` ; empreinte des
15 chemins UTF-8 triés, octet nul puis contenu, cartes exclues :
`968b2f602063adeba5f82496cb48d95319b7baa47e67f857032ab8c74a4baf50`.

Preuves depuis `/tmp/dem005-web005/webapp`, assemblage sans secrets de DevOps
`c58af06`, DOM-001, Web `ce1bc49`, serveur BFF `ad729e8`, puis seuls fichiers de cette carte :

- `GD_TARGET=client2-immobilier node node_modules/vitest/vitest.mjs run` :
  114 tests réussis, 13 fichiers, dont 11 tests HTTP de cette carte. Log
  `/tmp/dem005-web005-vitest.log`. Couvre aussi empreintes invalides, projet étranger,
  chemins symboliques, changement de slug et refus des aperçus sans droits.
- `GD_TARGET=client2-immobilier bun --no-env-file run type-check`, ESLint ciblé
  avec zéro warning et Prettier ciblé : sortie 0.
- `GD_TARGET=client2-immobilier NODE_ENV=production node node_modules/nuxt/bin/nuxt.mjs build` :
  sortie 0 ; log `/tmp/dem005-web005-build.log`. Son SSR est lancé uniquement
  sur `127.0.0.1:19505`, avec projet/secret fictifs et dossier de fixtures exclusif.
- `playwright test tests/e2e/client2-articles.spec.ts --workers=1`, avec les variables
  de fixtures du README : deux parcours réussis, Chromium ordinateur et mobile.
  SSR/SEO, vraie navigation, décodage des trois images, 404 d’une langue non publiée,
  aperçu privé, version publique inchangée par le brouillon, dépublication partielle
  et totale ; aucun domaine réseau extérieur au SSR. Log `/tmp/dem005-web005-browser.log`.
- `playwright test tests/e2e/client2.smoke.spec.ts --workers=1` : deux parcours
  historiques réussis, ordinateur/mobile, accueil et absence des initialisations
  Showcase ; log `/tmp/dem005-web005-home.log`.
- Chromium requis installé dans `/tmp/dem005-web005-browsers`, bibliothèques déjà
  disponibles sous `/tmp/dem003-browser-deps/root/usr/lib/x86_64-linux-gnu` réutilisées
  via `LD_LIBRARY_PATH` ; aucun paquet système installé. Les premiers essais sans
  navigateur/bibliothèques ont échoué ; seuls les résultats finaux ci-dessus font preuve.
  Le navigateur a aussi révélé une fonction d’en-tête non importée : correction avec
  `useResponseHeader`, puis nouveau build et reprise complète des parcours réussis.
- `make aide-check` : 111 tests réussis, structure et liens conformes.
  `bun run check:conventions` dans le snapshot avec `AIDE_GIT_ROOT` pointant Web :
  sortie 0, avertissements historiques conservés, aucun signalement Client 2.
  Aucune convention ou vérification Codebase Integrity modifiée ; `git diff --check` conforme.

Limites : aucune API réelle, donnée utilisateur ou `.env` modifié ; aucun commit.
Le BFF authentifié est testé séparément, le navigateur appelle le renderer avec un
secret de fixtures : le parcours réel dashboard → BFF → Client 2 reste à intégrer.
L’UUID du pilote doit encore être transmis au SSR Client 2 dans Compose ; les routes
SaaS du dashboard et la propagation des catégories restent des travaux fonctionnels
ouverts. OPS-013 attend le commit validé de WEB-005 ; aucune consolidation préalable.

## Verdict humain

Validation explicite du 2026-11-12 : « validé », sur WEB-005 et les limites présentées :
preuves sur fixtures, raccordement au dashboard réel et configuration Compose encore à intégrer.
Les 15 fichiers correspondent à l’empreinte présentée avant indexation ; aucun changement
fonctionnel depuis la restitution. Ce verdict ne valide pas DEM-005 entière.

## Commits

Commit local d’implémentation et de verdict : `a8cf67e7e9b2612929ad372cce060662dacca922`.
Cette trace complète le SHA sans changement fonctionnel ; aucun push, PR ou fusion.
La réunion globale est prévue dans le principal libre et propre, branche `demands/DEM-005`
créée seulement à la reconstitution depuis develop local vérifié.
