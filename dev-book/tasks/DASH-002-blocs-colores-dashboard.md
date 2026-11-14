# DASH-002 — Donner une identité colorée aux blocs du tableau de bord

- Demande : DEM-009 — développement.
- Brouillon : `tmp/demande-blocs-colores-theme-dashboard.md`, relatif au principal ; aucune copie dans la couche.
- Demande définitive prévue : `dev-book/demand/DEM-009-blocs-colores-theme-dashboard.md`, à créer seulement à la reconstitution.
- Session de création : 01a1d94b-2ea6-7270-a3b3-407d88574000.
- Date : 2026-11-14.
- Couche : dashboard.
- Branche : layers/dashboard.
- Worktree : worktree/dashboard.
- Base locale vérifiée : `8349181d21dab60bb7f4a659c02790f74ee56a1c`, commune à develop et Dashboard ; aucun fetch.
- État : implémentée et commitée, à vérifier.
- Chemins autorisés : `webapp/dashboard/README.md`, `webapp/dashboard/nuxt.config.ts`, `webapp/dashboard/app/components/dashboard/`, `webapp/dashboard/app/assets/css/main.css`, `webapp/dashboard/app/app.config.ts`, `webapp/dashboard/i18n/locales/fr.json`, `webapp/tests/e2e/saas-access.spec.ts`, `webapp/tests/e2e/saas-editor.spec.ts`, cette carte.
- Dépendance de réalisation : base DEM-008 ci-dessus disponible ; périmètre et associations confirmés.
- Dépendance de vérification globale : résultat de DASH-003 pour vérifier le changement de mode avec les blocs ; aucune dépendance de réalisation entre ces cartes.

## Résultat et critères

Appliquer les critères 1, 2 et 5 du brouillon, référence unique de la palette.
Inventaire : Overview contient le choix organisation/projet et le projet actif ;
Administration contient création d’organisation, création de projet et collaborateurs ;
Articles contient la liste et l’édition, avec champs, actions, blocs et ressources.
Périmètre confirmé : tous les écrans du dashboard, y compris Articles et Administration.
Ne pas confondre les blocs de contenu d’un article avec de nouvelles rubriques du produit.

Répartition validée par l’humain (« Valider cette répartition », même session) : contexte → Fountain Blue / `i-lucide-building-2` ;
projet actif → Olive Green / `i-lucide-folder-open` ; pour les autres écrans,
création organisation → Copperfield / `i-lucide-building-2`, création projet → Picton Blue / `i-lucide-folder-plus`,
collaborateurs → Lavender / `i-lucide-users`, articles → Yellow Orange / `i-lucide-newspaper`,
champs → Loblolly / `i-lucide-text-cursor-input`, contenu → Dalmasca / `i-lucide-panels-top-left`,
ressources médias → Cotton Candy / `i-lucide-images`.
La palette est un choix disponible, sans obligation de consommer ses onze couleurs.

Centraliser les accents dans le thème local ; éviter toute modification globale des UCard
qui toucherait les écrans exclus. Pas de bordure ni ring décoratif sur les blocs concernés ;
préserver les contours utiles des champs et le focus clavier.
Le survol ne modifie que la teinte du fond : aucune translation, aucun curseur trompeur.
Mesurer les contrastes sur clair/sombre et au survol ; les couleurs pastel brutes peuvent
être insuffisantes sur fond clair. Le traitement a été explicitement confirmé pendant
l’implémentation : pictogrammes colorés sur pastille sombre, actions pastel avec texte sombre,
sans changer les codes fournis. Aucun arbitrage de contraste en attente.

Preuves attendues : inventaire couvert, captures ordinateur/mobile dans les deux modes,
comparaison repos/survol, absence de déplacement, clavier et parcours préservés.
Exclusions : disposition, nouvelles fonctions, thèmes clients, statuts métier, BFF et API.
Documentation : décision de répartition et mesures dans cette carte ; palette conservée dans la demande.

Le build SSR a révélé un chargement dynamique Lucide manquant (icons.json absent de la
sortie serveur). Le périmètre inclut donc la configuration locale Dashboard pour embarquer
les seules icônes utilisées dans le bundle client, sans requête externe ni nouvelle dépendance.

## Réalisation et preuves

Implémentation le 2026-11-14, session de création, après le commit DASH-003
`7e2759f55f9cb1cd34b0f5dac054a05daf63acbf`, sans transfert ni rebase.

Composant commun DashboardPanel, tokens locaux exacts de la palette, neuf associations
validées, pictogrammes Lucide et actions pastel à texte sombre. Application aux blocs
Accueil, Administration, liste/édition des articles, sous-blocs de contenu et ressources.
Les champs et le focus gardent leurs contours utiles ; les actions d’erreur/avertissement
conservent leur sémantique. Aucun déplacement au survol ni clic ajouté aux blocs informatifs.
Les sections Vue requises sont complétées dans les seuls composants touchés ; aucun contrôle
ni exception modifié. Le README conserve ses rubriques et décrit la portée locale du thème.

La revue des premières captures a détecté des glyphes absents malgré les tests de couleur :
le serveur SSR ne trouvait pas le JSON Lucide. La configuration embarque désormais les icônes
utilisées avec celles de Nuxt UI (52 icônes, 13,16 Ko non compressés), scan limité à Dashboard,
provider none, sans API externe ni nouvelle dépendance. Les tests contrôlent maintenant le
mask SVG effectif. Les captures finales montrent les glyphes, y compris dans les deux modes.

Contrôles réussis :
- Depuis `webapp/`, `GD_TARGET=dashboard bun run quality:check` : lint, format et types.
- `GD_TARGET=dashboard bun run test -- tests/layers/dashboard.vitest.ts` : 1 test,
  préparation et build isolés après correction de la configuration des icônes.
- `GD_TARGET=dashboard bun run build` : build SSR final réussi.
- `LD_LIBRARY_PATH=/tmp/ops020-browser-deps/root/usr/lib/x86_64-linux-gnu GD_TARGET=dashboard PLAYWRIGHT_BASE_URL=http://127.0.0.1:29305 bun run test:e2e -- saas-access.spec.ts saas-editor.spec.ts --workers=2` :
  **70 tests réussis**, Chromium ordinateur/mobile, clair/sombre. Couverture : parcours
  existants, trois modes et persistance, glyphes rendus, associations exactes, absence
  de bordures/ombres des blocs, teinte au survol sans déplacement, clavier et focus,
  texte ≥ 4,5:1 et pictogrammes ≥ 3:1 dans les blocs mesurés. Les couleurs de boutons
  et glyphes sur #212121 ont aussi été calculées pour toute la palette : minimum 4,77:1.
- Depuis `codebase-integrity/`, `bun run check:conventions` : réussi, nouveau Panel
  indexé pour sa découverte ; avertissements de revue préexistants, sans nouvelle exception.
- `make aide-check` : structure/liens conformes et 119 tests du cadre réussis.
- `git diff --check`, `git diff --cached --check` et format du README : réussis.

Journaux hors Git : `/tmp/dem009-quality-blocks.log`, `/tmp/dem009-layer-blocks.log`,
`/tmp/dem009-build-blocks.log`, `/tmp/dem009-browser-final.log`,
`/tmp/dem009-conventions-final.log`, `/tmp/dem009-ssr-final.log`, `/tmp/dem009-aide-final.log`.
Captures locales et mesures attachées : `webapp/.tmp/playwright/test-results/` et rapport
`webapp/.tmp/playwright/report/` ; repos, survol, Administration, Articles, édition et médias.
Captures ordinateur clair/sombre et mobile examinées ; l’appréciation humaine reste attendue.
Fixtures BFF : preuve de l’interface, pas de Symfony réel. Aucun déploiement ni image Docker
reconstruite ; source SVG et infrastructure DEM-008 inchangées. Le serveur de développement
19305 est préservé ; seul le SSR temporaire 29305 a servi aux vérifications.

## Verdict humain

Périmètre et répartition couleurs/Lucide explicitement confirmés dans cette session.
Aucun verdict d’implémentation ; la validation du besoin ne vaut pas validation du résultat.

## Commits

Commit local initial de DASH-002 ; SHA réel consigné dans le brouillon après création.
