# OPS-092 — Aligner les recettes et leurs contrôles

- Demande : DEM-018 · consolidation.
- Brouillon au principal : `tmp/demande-consolidation-noms-variables-tests.md`. Lien vers la demande définitive à la reconstitution.
- Session de création : 01a211b5-0ab6-7733-9516-b83103d91b22
- Couche : devops
- Branche : layers/devops
- Worktree : worktree/devops
- État : implémentée et commitée, à vérifier

- Dépendance : commit d’OPS-091 `d09b4841487ab154d8483889eb99026171133987`. Les assertions et recettes prennent pour référence le contrat d’exécution livré par ce commit.

## Chemins autorisés

- `TEST.md`
- `codebase-integrity/domaines/fiabilite-verifications/scripts/check_docs.py`
- `codebase-integrity/domaines/fiabilite-verifications/tests/test_docs.py`
- `docs/executer-controles.md`
- `dev-book/tasks/OPS-092-aligner-recettes-controles.md`

## Résultat et critères

Aligner les commandes publiées et les contrôles documentaires sur les noms cibles. Consigner la correspondance de migration pour les consommateurs externes. Exclure les traces historiques et conserver le statut inactif des commandes concernées.

- Le contrôle documentaire vérifie les quatre origines de la recette par rapport à `WEBAPP_TEST_PORT`. Il échoue pour une origine divergente, une variable attendue absente ou une déclaration de port absente. Le contrôle de clôture détecte toute occurrence restante d’un ancien nom. Les lignes commentées restent ignorées par ce contrôle de recette.
- Vérifier la cohérence entre le démarrage et les commandes publiées. OPS-091 couvre la présentation et le plan CI, qui consomment directement le contrat d’exécution.

## Contrôles et preuves attendus

Depuis le worktree DevOps, lancer `test_docs.py` avec `timeout 55s python3 -B -m unittest discover -s codebase-integrity/domaines/fiabilite-verifications/tests -p <fichier>`. Reporter commandes, résultats et limites dans cette carte. À la reconstitution, appliquer la recherche bloquante du brouillon et vérifier les parcours réels manuellement selon la recette publiée.

### Brouillon documentaire pour la reconstitution

Dans `docs/executer-controles.md`, appliquer la correspondance ci-dessous aux occurrences du guide. Dans « Nommage des commandes », ajouter après le paragraphe existant le texte suivant :

```markdown
Les variables d’environnement précédentes ont été retirées sans alias. Pour mettre à jour un script ou un appel Compose, consulter la [correspondance de migration](../dev-book/tasks/OPS-092-aligner-recettes-controles.md#correspondance-de-migration). Pour chaque exécution navigateur, charge ou Lighthouse, utiliser l’origine annoncée par le serveur de fixtures lorsqu’il est prêt.
```

### Correspondance de migration

| Anciens noms | Nom à utiliser |
| --- | --- |
| `QUALITY_BASE_URL` et `PLAYWRIGHT_BASE_URL` | `WEBAPP_BASE_URL` |
| `QUALITY_FIXTURE_PORT` | `WEBAPP_TEST_PORT` |
| `QUALITY_BROWSER_FIXTURES` | `BROWSER_FIXTURES` |
| `QUALITY_MEDIA_FIXTURES` | `MEDIA_FIXTURES` |
| `QUALITY_LOAD_PROFILE` | `LOAD_PROFILE` |
| `QUALITY_ROUTE` | `LOAD_ROUTE` |
| `QUALITY_PROJECT_ID` | `SAAS_PROJECT_ID` |
| `QUALITY_ARTICLE_ID` | `SAAS_ARTICLE_ID` |
| `QUALITY_SESSION_FILE` | `SAAS_SESSION_FILE` |
| `QUALITY_MUTATION_FILES` | `MUTATION_FILES` |
| `QUALITY_MUTATION_PILOT` | `MUTATION_PILOT` |
| `QUALITY_CONTAINER` | `CHECKS_CONTAINER` |
| `QUALITY_UID` | `CHECKS_UID` |
| `QUALITY_GID` | `CHECKS_GID` |
| `QUALITY_REPO_ROOT` | `CHECKS_REPO_ROOT` |
| `QUALITY_GIT_COMMON_DIR` | `CHECKS_GIT_COMMON_DIR` |
| `QUALITY_COMPOSE` | `CHECKS_COMPOSE` |
| `QUALITY_DOCKER` | `CHECKS_DOCKER` |
| `QUALITY_INFO` | `CHECKS_INFO` |
| `QUALITY_DOTENV_PROBE` | `DOTENV_TEST_PROBE` |

### Contrôles observés

- `timeout 55s python3 -B -m unittest discover -s codebase-integrity/domaines/fiabilite-verifications/tests -p test_docs.py` depuis le worktree DevOps : 29 réussites. La recette conforme passe. L’absence du nouveau nom, une origine incohérente ou l’absence du port font échouer le contrôle.
- Le vérificateur documentaire ciblé accepte `TEST.md` et la carte. Une projection du brouillon sur le guide de `develop` conserve ses titres, résout les liens et retire les anciens noms. L’intégration dans le guide est prévue à la reconstitution.
- `timeout 55s make conventions-tests-docs` : 3 étapes sur 4 réussies. Les quatre liens hors dépôt préexistants d’OPS-045, OPS-046, OPS-085 et OPS-086 restent signalés.
- Vérification d’ensemble des noms après intégration du brouillon et parcours runtime réels à la reconstitution.
