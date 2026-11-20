# OPS-044 — Réorganiser les workflows par famille

- Demande : DEM-016 ; type : consolidation.
- Session de création : 01a1ee70-2dc4-7331-992b-b24155dfd09a
- Couche : devops ; branche : `layers/devops` ; worktree : `worktree/devops`.
- État : validée par l’humain, à reconstituer.
- Chemins autorisés : `.github/workflows/`, `webapp/scripts/quality/ci-plan.vitest.ts`, les seuls scripts qualité nécessaires au raccordement, `codebase-integrity/README.md`, `codebase-integrity/conventions.json`, les contrôles et tests de fiabilité nécessaires sous `codebase-integrity/`, `docs/executer-controles.md`, `docs/3.application/sonarqube-cloud.md`, `dev-book/reports/organisation-ci-cd-analyse.md`, cette carte et le brouillon DEM-016 du principal.
- Dépendances : intégrer le commit identifié de OPS-042 (DEM-014) avant toute modification de ses fichiers partagés ; aucune dépendance de réalisation à OPS-043, dont les scénarios réels restent manuels. Vérifier à nouveau les affectations avant intervention.

## Résultat et critères

Appliquer les décisions et limites de l’[analyse](../reports/organisation-ci-cd-analyse.md) : six workflows visibles par famille ; PR et push `develop` / `master` ; trois cibles selon leur pertinence ; SonarQube distinct. Raccorder les contrôles DEM-013 et la couverture selon les niveaux confirmés ; garder `conventions-tests-devbook` et la mutation pilote manuels, la mutation étendue inactive, et Lighthouse uniquement local. Runtime CI sur fixtures locales ; charge sur l’API réelle exclue des PR et manuelle au départ.

Préserver les contrôles et échecs bloquants existants, la politique indépendante extraite de la base PR, les rapports en échec et l’isolation des secrets. Ne modifier ni contourner les protections GitHub ; identifier les changements de noms des statuts à coordonner. Éviter les duplications de cadre sans faire disparaître de contrôle. Mettre à jour documentation, registre, convention et déclaration de contribution lorsque nécessaire.

## Vérifications et preuves

Base : `4ae8acbe985d512b42e73c7001e6d5af5b6f9007` dans `layers/devops`, contenant le commit OPS-042. Les brouillons non suivis de cette carte et de son analyse sont ceux de DEM-016 ; les changements antérieurs de DEM-015 sont déjà commités. Aucun autre fichier étranger n’a été modifié.

Les deux fichiers de tests ciblés `ci-plan.vitest.ts` et `coverage.vitest.ts` ont réussi : 68 tests avec Docker simulé ; après derniers changements du contrat, 9 tests ciblés ont réussi. Cas conformes et absences de famille, cible, couverture, erreurs masquées ou appels runtime externes sont contrôlés. ESLint ciblé, registre et vérifications documentaires ont réussi ; `git diff --check` est conforme. Le contrôle statique ne prouve pas l’exécution GitHub, les coûts ou les protections futures.

Aucun workflow, suite complète ou service n’a été lancé par l’agent. Pour la vérification humaine, depuis `worktree/devops`, exécuter les contrôles du [catalogue](../../docs/executer-controles.md) sur les trois cibles, notamment fonctions, duplications et couverture ; pour les parcours et la charge, préparer les fixtures locales comme indiqué dans ce guide. Les suites complètes, navigateurs et exécution GitHub restent à effectuer par l’humain ; elles sont inconnues. Aucun appel au VPS ni audit Lighthouse n’est prévu en CI.

Les nouveaux statuts et la lecture non modifiante des protections figurent dans l’analyse. Ne pas modifier les protections GitHub ; faire coordonner leurs éventuels statuts requis avant livraison.

## Verdict humain

L’humain valide DEM-016 le 2026-11-20 après avoir exécuté sur Showcase la reconstruction de l’image, les contrôles fonctions, duplications, couverture, vérificateurs et documentation : bilans réussis, code 0. Les autres cibles et l’exécution des workflows GitHub restent non vérifiées à cette étape.

```verdict-json
{
  "decision": "validé",
  "portee": "DEM-016 et OPS-044 présentées, avec exécution GitHub et autres cibles non vérifiées.",
  "contenu": {
    "type": "git",
    "valeur": "4c012dfc111c478662741ee02ab93d5278d31980"
  }
}
```

## Commits

Commit local de cette carte ; SHA consigné dans le brouillon de la demande après création.
