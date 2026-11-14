# DASH-003 — Choisir et mémoriser le thème de l’espace connecté

- Demande : DEM-009 — développement.
- Brouillon : `tmp/demande-blocs-colores-theme-dashboard.md`, relatif au principal ; aucune copie dans la couche.
- Demande définitive prévue : `dev-book/demand/DEM-009-blocs-colores-theme-dashboard.md`, à créer seulement à la reconstitution.
- Session de création : 01a1d94b-2ea6-7270-a3b3-407d88574000.
- Date : 2026-11-14.
- Couche : dashboard.
- Branche : layers/dashboard.
- Worktree : worktree/dashboard.
- Base locale vérifiée : `8349181d21dab60bb7f4a659c02790f74ee56a1c`, commune à develop et Dashboard ; aucun fetch.
- État : validée par l’humain.
- Chemins autorisés : `webapp/dashboard/app/layouts/default.vue`, `webapp/dashboard/app/components/dashboard/`, `webapp/dashboard/app/composables/`, `webapp/dashboard/app/assets/css/main.css`, `webapp/dashboard/i18n/locales/fr.json`, `webapp/dashboard/nuxt.config.ts`, `webapp/dashboard/README.md`, `webapp/tests/e2e/saas-access.spec.ts`, `webapp/tests/e2e/saas-editor.spec.ts`, cette carte.
- Dépendance de réalisation : base DEM-008 ci-dessus, disponible ; aucune dépendance à DASH-002.
- Dépendance de vérification globale : DASH-002 pour les captures et contrastes des blocs dans les modes.

## Résultat et critères

Couvrir les critères 3 à 5 du brouillon. La configuration active déjà Nuxt UI color mode,
avec préférence système et repli clair ; Lucide est déjà présent. Réutiliser ce mécanisme,
sans deuxième état de thème ni stockage concurrent, sans ajout de dépendance partagée.
Le layout connecté n’a pas d’en-tête commun : il contient navigation latérale et bouton
mobile fixe. Y ajouter le contrôle commun accessible, sans recouvrir menu, contenu ou actions.
Préserver navigation et disposition des contenus, sur tous les écrans connectés.

Présenter les trois choix français explicites, utilisables au clavier et avec état annoncé.
Mémoriser localement dans le navigateur ; Automatique par défaut et suivi réactif du système.
Le choix doit persister après rechargement et navigation entre accueil, articles et administration.
Aucune préférence de compte, aucun endpoint, aucune modification du layout auth requise.
Vérifier l’hydratation SSR et l’absence de flash de thème ; ne pas lire le stockage
navigateur côté serveur. Conserver les traitements d’accessibilité du menu mobile.

Tests dédiés : navigateur neuf clair/sombre, sélection des trois modes, rechargement,
navigation, changement du système en Automatique, mode forcé indépendant du système,
clavier, mobile et absence d’erreurs d’hydratation. Réutiliser les suites existantes.
Documentation : actualiser seulement la phrase du README Dashboard annonçant l’absence
de sélecteur, dans ses rubriques actuelles ; ne pas recopier la charte.

## Réalisation et preuves

Implémentation le 2026-11-14, session de création, base indiquée ci-dessus.
En-tête connecté commun avec USelect Nuxt UI, trois libellés traduits, icônes Lucide ;
réutilisation de useColorMode sans nouveau stockage ni dépendance. Le contenu défile
sous l’en-tête fixe dans le layout ; le menu mobile conserve son parcours clavier.
Le README décrit le sélecteur dans sa rubrique existante.

Le test de rechargement a révélé un décalage préexistant entre le SSR sans données privées
et la session chargée par le middleware navigateur avant hydratation. Navigation et contenu
privés sont maintenant rendus après montage via ClientOnly, avec attente SSR explicite ;
le thème reste appliqué par le script initial Nuxt color mode. Aucun changement BFF/métier.

Contrôles réussis depuis le worktree :
- `make aide-check` : structure/liens et 119 tests du cadre.
- Depuis `codebase-integrity/`, `bun run check:conventions` : réussi, avertissements de revue préexistants.
- Depuis `webapp/`, `GD_TARGET=dashboard bun run quality:check` : lint, format et types.
- `GD_TARGET=dashboard bun run test -- tests/layers/dashboard.vitest.ts` : 1 test réussi ;
  prepare et build isolés réels. L’essai sandbox EPERM a été relancé dans l’environnement autorisé.
- `GD_TARGET=dashboard bun run build` : build SSR réussi, après les contrôles de types
  dont le prepare nettoie les sorties ; ces commandes sont donc séquencées.
- SSR temporaire sur 127.0.0.1:29305, sans toucher au service existant 19305.
  `GD_TARGET=dashboard PLAYWRIGHT_BASE_URL=http://127.0.0.1:29305 bun run test:e2e -- saas-access.spec.ts --grep 'thème mémorisé|charte, polices' --workers=2` :
  6 tests réussis sur Chromium ordinateur/mobile, clair/sombre, navigation Administration,
  persistance après rechargement, système réactif, mode forcé, clavier, contraste,
  absence d’erreur JavaScript/d’hydratation et de débordement horizontal.
- `git diff --check` réussi ; rubriques du README conservées.

Journaux hors Git : `/tmp/dem009-{quality,conventions,layer,build,browser,aide}-theme.log`.
Captures locales dans `webapp/.tmp/playwright/test-results/` (theme-selector et identité).
Chromium utilise les bibliothèques `/tmp/ops020-browser-deps/root/usr/lib/x86_64-linux-gnu`.
Les fixtures BFF vérifient l’interface, pas Symfony réel. Les contrôles d’ensemble et
captures avec les blocs sont prévus après DASH-002. Aucun verdict humain anticipé.

## Verdict humain

Le 2026-11-14, session `01a1d94b-2ea6-7270-a3b3-407d88574000` :
« c'est génial, c'est validé », après présentation du résultat complet de DEM-009,
y compris la suppression élargie des bordures et les badges teintés.
Validation globale couvrant cette carte et les SHA `7e2759f55f9cb1cd34b0f5dac054a05daf63acbf`.
Les preuves et limites techniques ci-dessus restent applicables ; aucun déploiement
ni validation du backend réel déduits de ce verdict.

## Commits

Commit local initial de DASH-003 ; SHA réel consigné dans le brouillon après création.
