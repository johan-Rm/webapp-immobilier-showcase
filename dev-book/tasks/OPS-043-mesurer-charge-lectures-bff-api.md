# OPS-043 — Mesurer la charge des lectures BFF → API

- Demande : DEM-015 ; type : consolidation.
- Session de création : 01a1ee70-2dc4-7331-992b-b24155dfd09a
- Couche : devops ; branche : `layers/devops` ; worktree : `worktree/devops`.
- État : validée par l’humain, à reconstituer.
- Chemins autorisés : `webapp/scripts/quality/`, `infra/docker/`, `infra/make/Makefile.dev`, `Makefile`, `codebase-integrity/`, `docs/executer-controles.md`, `dev-book/reports/charge-bff-api-analyse.md`, cette carte et le brouillon DEM-015 du principal ; restreindre aux fichiers nécessaires après examen des README.
- Dépendances : conception indépendante de DEM-014 ; si des fichiers partagés sont modifiés, intégrer préalablement le commit de la carte OPS-042 sur une couche libre et propre. Aucun changement de workflow : DEM-016 ; aucune modification BFF présumée.

## Résultat et critères

Appliquer les décisions de l’[analyse](../reports/charge-bff-api-analyse.md) : vraie API Symfony SaaS et projets TARGET réels ; liste et détail d’articles via le BFF, lecture métier uniquement, authentification explicite, sélection précise et aucune donnée privée ou secret dans les sorties. Profils bornés à 1 utilisateur / 3 requêtes et 3 utilisateurs / 30 requêtes par scénario. Exécution manuelle initiale, sans supposer d’accès VPS automatique ou de permissions GitHub.

Valider réponses et absence d’écritures ; signaler les échecs techniques. Rapporter les temps bout en bout et les repères convenus sans seuil bloquant, avec limites de réseau, caches et données. Ne pas prétendre mesurer séparément Symfony ou SQL sans preuve. Documenter prérequis, coûts, choix de cible et risques de charge sur le VPS ; aucune donnée n’est créée ou modifiée par le scénario métier.

## Vérifications et preuves

Base : `95000d59f12e77b1163f80a2f86330ad61344f89`, incluant le commit OPS-042 de DEM-014. Tests Python ciblés sans réseau ni Docker : configuration et métriques invalides, deux scénarios simulés, échec et rapport sans données privées ; tests du registre et de présentation. `git diff --check` exécuté. Les vérifications statiques des méthodes GET ne constituent pas une preuve d’exécution k6.

Arbitrage de vérification : l’humain demande la suspension du contrôle. La commande et le lancement direct affichent un statut inactif sans exécuter de test ; les scénarios sont conservés. Vérifié avec `make runtime-tests-saas-api-load GD_TARGET=dashboard` et le lancement direct du script : message INACTIF, code 0. Aucun serveur ni appel VPS ne fut lancé. La mesure réelle et sa connectivité restent inconnues ; depuis `worktree/devops`, après réactivation uniquement, suivre la commande et les prérequis de [l’exécution des contrôles](../../docs/executer-controles.md). Attendu : deux scénarios réussis et rapport des latences informatives. La configuration de l’API réelle doit être vérifiée par l’humain ; elle n’est pas attestée automatiquement.

Compléter la convention et la déclaration structurée de contribution selon les règles du projet. Préserver les `.env`, secrets, worktrees et changements étrangers ; aucun accès au VPS ou lancement de charge pendant l’analyse.

## Verdict humain

L’humain valide le 2026-11-19 la demande DEM-015 et la carte OPS-043 présentées, incluant le commit initial `7ab66e71748b288285db36d638e93b7bf7fbdb12` et le correctif de suspension ci-dessous. Le contrôle reste inactif ; sa mesure réelle n’a pas été exécutée.

```verdict-json
{
  "decision": "validé",
  "portee": "DEM-015 et OPS-043 présentées, contrôle SaaS inactif et mesure réelle non vérifiée.",
  "contenu": {
    "type": "git",
    "valeur": "b94d4b9f2905ea4499a7fd115200b34f4d00cab4"
  }
}
```

## Commits

Commit local de cette carte ; SHA consigné dans le brouillon de la demande après création.
