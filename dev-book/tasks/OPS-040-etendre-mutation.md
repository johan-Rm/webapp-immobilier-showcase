# OPS-040 — Étendre la mesure de mutation

- Demande : DEM-013 ; type : consolidation
- Session de création : 01a1ee70-2dc4-7331-992b-b24155dfd09a
- Couche : devops ; branche : `layers/devops` ; worktree : `worktree/devops`
- État : implémentée, à vérifier humainement
- Chemins autorisés : `webapp/scripts/quality/`, `webapp/vitest.config.ts`, `webapp/package.json`, `webapp/bun.lock`, `infra/docker/docker-compose.quality.yml`, `infra/docker/Dockerfile.playwright`, `codebase-integrity/commun/`, cette carte.
- Dépendances : commits locaux de OPS-036 et OPS-039.

## Résultat et critères

Étendre la mutation isolée au périmètre applicatif mesurable de la cible et du partagé ; examiner Node, Bun, Nuxt et navigateur. Garder les tests hors mutation et les sources intactes. Présenter mutations détectées, survivantes, sans couverture, exclusions et fichiers non mesurables avec raison. Le score reste informatif ; une mesure prévue échouée, vide ou interrompue échoue techniquement. Ne pas annoncer une capacité non démontrée.

Tester au minimum mutation détectée et survivante, absence de couverture, non-mesurable, échec, interruption et intégrité des sources ; exécuter une mesure représentative isolée. Consigner durée et limites ici.

## Réalisation et preuves

Lanceur Stryker sur les sources TypeScript/JavaScript sélectionnées, dans une copie jetable sans fichiers `.env` ; les fichiers Vue sont signalés non mesurables. Les états par fichier distinguent mutation détectée, survivante, sans couverture et absence de mutant évaluable. Les exécutions Bun, composants Nuxt et navigateur ne sont pas instrumentées et sont signalées. Stryker utilise le mode en place uniquement dans la copie jetable, car son sandbox propre exclut les types Nuxt générés. Les rapports sont conservés dans des dossiers distincts.

Vérifications : 13 tests Vitest ciblés réussis, dont erreurs et interruption du processus ; lint et formatage ciblés conformes. Dans une copie isolée, le pilote `shared/saas/links.ts` a produit 47 mutants détectés et 5 survivants ; 30 tests directs, puis les 383 tests Node sélectionnés ont réussi avant mutation. Le fichier applicatif du worktree est resté identique à Git. La sélection complète des fichiers n’a pas été exécutée ; sa durée et les capacités au-delà de Node restent à établir. Aucune validation humaine.

## Verdict humain

Aucun verdict humain.

## Commits

À créer lors de l’implémentation.
