# OPS-042 — Classer les contrôles runtime

- Demande : DEM-014 ; type : consolidation.
- Session de création : 01a1ee70-2dc4-7331-992b-b24155dfd09a
- Couche : devops ; branche : `layers/devops` ; worktree : `worktree/devops`.
- État : validée humainement.
- Chemins autorisés : `Makefile`, `infra/make/Makefile.dev`, `codebase-integrity/README.md`, `codebase-integrity/conventions.json`, `codebase-integrity/commun/`, `codebase-integrity/domaines/fiabilite-verifications/`, `docs/executer-controles.md`, `webapp/scripts/quality/ci-plan.vitest.ts`, `dev-book/reports/controles-runtime-analyse.md`, cette carte et le brouillon DEM-014 du principal.
- Dépendances : aucune de réalisation ; les workflows sont traités séparément par DEM-016, les lectures BFF → API par DEM-015.

## Résultat et critères

Appliquer les décisions et limites de l’[analyse](../reports/controles-runtime-analyse.md). Exposer les trois commandes runtime ; supprimer les six noms obsolètes sans alias, adapter aide, présentation, prérequis, documentation et tests d’interface. Préserver les références historiques et les familles internes utilisées par la CI. Maintenir l’échec technique Lighthouse visible et son code fidèle ; ne pas modifier les workflows ni implémenter de nouveaux scénarios API.

Ajouter un contrôle déterministe bloquant des noms dans les interfaces et références actives, avec cas conforme, nom obsolète réintroduit, commande manquante et trace historique tolérée. Documenter la convention dans le README responsable et le contrôle dans le registre selon les règles existantes, sans modifier la structure du README. Compléter la déclaration de contribution dans le brouillon.

## Vérifications et preuves

Les commandes publiques sont renommées, les six anciens noms retirés et les références actives adaptées. Le contrôle des noms est intégré au contrôle documentaire ; il vérifie les quatre fichiers actifs identifiés dans l’analyse, sans examiner les usages externes ni les traces historiques. L’exécution Lighthouse conserve son code de sortie ; son statut en PR relève de DEM-016.

Vérifications : 34 cas Vitest ciblés de routage et refus des anciens noms réussis ; 12 tests Python de présentation, 5 tests du lanceur documentaire et un test des noms réussi avec cas conforme, nom ancien, commande manquante, fichier manquant et trace historique. Registre et `make conventions-tests-docs` réussis ; `git diff --check` conforme. Aucun test avec serveur ni suite complète lancé ; résultats inconnus.

Vérification humaine : dans `worktree/devops`, reconstruire l’image avec `make checks-rebuild`, puis démarrer un serveur de fixtures avec `make lane-up devops MODE=test GD_TARGET=showcase-immobilier` et attendre son URL. Depuis un second terminal du même worktree, exécuter `make runtime-tests-browser GD_TARGET=showcase-immobilier PLAYWRIGHT_BASE_URL=http://127.0.0.1:19854`, `make runtime-tests-load GD_TARGET=showcase-immobilier QUALITY_BASE_URL=http://127.0.0.1:19854` et `make runtime-tests-lighthouse GD_TARGET=showcase-immobilier QUALITY_BASE_URL=http://127.0.0.1:19854 PROFILE=desktop` puis `PROFILE=mobile`. Attendus : commande reconnue, contrôle exécuté, bilan et code fidèles. Arrêter le serveur par `make lane-down devops MODE=test GD_TARGET=showcase-immobilier` ; adapter le port à l’URL affichée.

## Verdict humain

L’humain indique que les tests sont passés et valide l’implémentation. Les journaux et le détail des commandes exécutées n’ont pas été vérifiés par l’agent.

```verdict-json
{
  "decision": "validé",
  "portee": "OPS-042 et la demande DEM-014 présentées, avec leurs limites.",
  "contenu": {
    "type": "git",
    "valeur": "2d80b6a832d312409981e3dc3aafc16b2b3f583d"
  }
}
```

## Commits

À créer lors de l’implémentation.
