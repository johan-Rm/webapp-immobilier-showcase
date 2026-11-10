# OPS-003 — Préparer le routage et la couverture des contrôles

- Demande : DEM-003 ; brouillon principal `tmp/demande-extraire-screens-immobiliers.md`
- Type : consolidation
- Session de création : 01a1c16c-2085-7141-83fa-3460f6bd4463
- Couche : devops
- Branche : layers/devops
- Worktree : worktree/devops
- État : validée humainement le 2026-11-10 ; commit local autorisé
- Chemins autorisés : `infra/config/layers.json`, `codebase-integrity/` : uniquement les fichiers de la section OPS-003 de l’inventaire principal.
- Dépendances : Base 6f4ebb114a9e856e762690b46425e11f5df65796 ; aucune dépendance de réalisation.

## Résultat et critères

Étendre le routage Web à `webapp/sites/` et `webapp/base/real-estate/`, en gardant
provisoirement `webapp/app/`. Les configurations racine et `base/nuxt.config.ts`
restent Devops. Centraliser la découverte des racines frontend pour les contrôles :
ancien app, applications clientes et catalogue ; couvrir aussi les sites inactifs.

Conserver les seuils, sévérités, modes de revue et exceptions précises. Résoudre
les alias des types selon l’application de chaque fichier, sans importer le code
client dans les services. L’exception d’images reste limitée aux vrais wrappers
`AppImage.vue`, jamais à un nom de fichier arbitraire. Garder les références
actuelles des conventions jusqu’à leur bascule finale par OPS-006.

Critères : aucun fichier contrôlé ne disparaît silencieusement ; fixtures avant/après
déplacement et deux sites ; violations détectées dans le catalogue et Client 2 ;
routage vérifié avec les préfixes configurés. Les deux `<img>` historiques des pages
Villa, déjà hors portée au premier lot, doivent réapparaître dans le bilan.

Tests : tests Python du routage, tests TypeScript des vérificateurs, `make aide-check`.
Capturer la référence des violations avant/après normalisation des chemins ; aucun
nettoyage des défauts historiques ni modification des contrôles de contribution.

Cette carte prépare les règles ; elle ne déplace pas l’interface. Les contrôles
complets sur l’arbre migré attendent la réunion de WEB-001/002. Documentation de
portée dans le README Codebase Integrity ; protocole final dans OPS-006.

## Réalisation et preuves

Implémentée le 2026-11-10, non commitée, à vérifier. Base :
`6f4ebb114a9e856e762690b46425e11f5df65796`, worktree Devops / `layers/devops`.
Routage ajouté ; découverte frontend commune pour les scanners, exceptions images
précises, alias par application et catalogue rattaché provisoirement à Showcase.
Aucun seuil, sévérité, mode de revue ou contrôle de contribution modifié.

Preuves exécutées depuis ce worktree :

- `bun run --cwd codebase-integrity test` : 109 Python, 9 Vitest et 40 Bun réussis.
- `make aide-check` : registre, demandes, documentation et 109 Python réussis.
- `bun run --cwd webapp lint:check` : réussi, incluant les contrôles.
- Comparaison des neuf scanners avec leur version à la base : types et imports
  framework conformes ; images 1 → 3 (deux écarts Villa retrouvés), script setup
  41 → 41, ternaires imbriqués 3 → 3. Les warnings restent des revues humaines.
  Résultats et sorties : `/tmp/dem003-conventions-results.json`.

Les nouvelles fixtures testent anciens/nouveaux chemins, client inactif, catalogue,
exceptions conformes et homonymes refusés, alias ~/@/@utils et routage des couches.
Couverture sur les vrais fichiers déplacés différée aux commits Web.
Diff présenté : `git diff -- codebase-integrity infra/config/layers.json` ;
nouveaux contrôles `verify-layer-scopes.vitest.ts` et `test_layer_routing.py` aux
chemins de l’inventaire principal. Aucun changement étranger ni fichier indexé.

## Verdict humain

Validée le 2026-11-10 : « parfait, validé », après présentation des trois cartes
OPS-003/004/005, de leurs preuves et des vérifications globales différées.
Cette validation couvre le périmètre préparatoire présenté ; elle ne prouve pas
les builds et parcours des vrais clients, encore dépendants des cartes Web.

## Commits

Commit de réalisation de cette carte ; SHA consigné après création dans la trace
locale de validation DEM-003.
