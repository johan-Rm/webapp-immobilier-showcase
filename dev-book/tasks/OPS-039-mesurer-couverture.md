# OPS-039 — Mesurer la couverture par cible

- Demande : DEM-013 ; type : consolidation
- Session de création : 01a1ee70-2dc4-7331-992b-b24155dfd09a
- Couche : devops ; branche : `layers/devops` ; worktree : `worktree/devops`
- État : implémentée, à vérifier humainement
- Chemins autorisés : `webapp/scripts/quality/`, `webapp/vitest.config.ts`, `webapp/package.json`, `webapp/bun.lock`, `infra/docker/docker-compose.quality.yml`, `infra/docker/Dockerfile.playwright`, `codebase-integrity/commun/`, cette carte.
- Dépendances : commit local de OPS-036 ; intégrer les commits précédents avant toute modification partagée.

## Résultat et critères

Mesurer la couverture des sources applicatives sélectionnées avec les suites et environnements disponibles ; examiner explicitement Node, Bun, Nuxt et navigateur. Rapporter les fichiers non mesurables et leur raison, les tests non exécutés, les exclusions validées et le code non couvert. Ne pas compter les fichiers non mesurables comme couverts. Une suite prévue échouée ou une mesure interrompue échoue techniquement ; scores informatifs. Préserver isolation, données et absence d’API distante implicite.

Tester sélection, fichier non couvert, fichier non mesurable, test indirect, erreur et interruption ; vérifier une exécution représentative en environnement isolé. Consigner coûts et limites observés ici.

## Réalisation et preuves

Mesure Vitest Node/V8 par cible et sources sélectionnées ; rapports unitaires et intégration réunis, fichiers non mesurables et exclusions explicites. Bun, composants Nuxt et navigateur ne sont pas instrumentés et sont signalés non exécutés ; les fichiers sans mesure exploitable ne sont pas réputés non couverts. Le raccordement public est prévu dans OPS-041.

Vérifications : 3 tests ciblés de rapport et lint ciblé réussis ; pilote isolé `shared/saas/links.vitest.ts` : 30 tests réussis. Dans `/tmp/dem013-coverage-OzTLl5`, copie isolée Showcase : 129 tests unitaires et 254 d’intégration réussis sous V8 ; rapport : 47 fichiers mesurés, 87 non couverts, 163 non mesurables. Le lancement intégration a duré environ 61 secondes. Les suites Bun, Nuxt et navigateur n’ont pas été mesurées. Audit des deux lockfiles : aucun avis high/critical non exempté ; avis connus et exceptions restent ceux du rapport de sécurité. Aucune validation humaine.

## Verdict humain

Aucun verdict humain.

## Commits

À créer lors de l’implémentation.
