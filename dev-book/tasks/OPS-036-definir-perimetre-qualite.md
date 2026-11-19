# OPS-036 — Définir le périmètre des contrôles par cible

- Demande : DEM-013 ; type : consolidation
- Session de création : 01a1ee70-2dc4-7331-992b-b24155dfd09a
- Couche : devops ; branche : `layers/devops` ; worktree : `worktree/devops`
- État : validée humainement
- Chemins autorisés : `codebase-integrity/commun/`, `codebase-integrity/domaines/fiabilite-verifications/tests/`, `codebase-integrity/package.json`, `webapp/scripts/quality/run.ts`, `webapp/scripts/quality/run.vitest.ts`, cette carte.
- Dépendances : aucune.

## Résultat et critères

Fournir une sélection commune déterministe : code de la cible et dossiers partagés identifiés dans l’analyse ; inclure le code commun même inutilisé par la cible, exclure les autres cibles sauf comparaison de duplications. Prévoir les fichiers Git suivis et non suivis non ignorés, l’inventaire des exclusions et le refus de cible inconnue ; préserver les environnements et données. Distinguer code source, tests, types et générés sans attribuer silencieusement un statut mesuré. Aucun changement applicatif.

Tester les trois cibles, partages, fichiers non suivis, exclusions, chemins de comparaison et cible invalide. Consigner commandes, résultats et limites ici.

## Réalisation et preuves

Sélecteur commun dans `codebase-integrity/commun/application-scope.ts` : trois cibles, dossiers partagés, autres cibles pour comparaison, catégories et inventaire Git. Les fichiers Git supprimés sont ignorés ; les fichiers non suivis non ignorés sont inclus.

Vérification : `node node_modules/vitest/vitest.mjs run domaines/fiabilite-verifications/tests/application-scope.vitest.ts` depuis `codebase-integrity/` : 6 tests réussis hors sandbox. Dans le sandbox, le cas Git a échoué avec `spawnSync git EPERM` ; les cinq autres passaient. Formatage ciblé Prettier effectué. Aucune validation humaine.

Correctif : une fonction commune protège les caractères de chemins interprétés comme motifs, notamment les crochets des routes ; 7 tests ciblés réussis.

Second correctif : Stryker normalise les barres obliques ; les crochets sont représentés par des classes littérales compatibles avec les deux moteurs de motifs. Sept tests ciblés réussis.

## Verdict humain

Validation explicite de la demande et des six cartes avec leurs limites. La désactivation demandée est incluse dans la révision identifiée.

```verdict-json
{
  "decision": "validé",
  "portee": "OPS-036 ; validation globale DEM-013 avec limites présentées et mutation étendue inactive.",
  "contenu": {
    "type": "git",
    "valeur": "23af763a2ae329b3eb64e7e10368af3d93fcff47"
  }
}
```

## Commits

À créer lors de l’implémentation.
