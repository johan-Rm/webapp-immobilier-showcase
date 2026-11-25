# OPS-091 — Renommer les variables des contrôles d’exécution

- Demande : DEM-018 · consolidation.
- Brouillon au principal : `tmp/demande-consolidation-noms-variables-tests.md`. [Demande définitive](../demand/DEM-018-clarifier-noms-variables-controle.md).
- Session de création : 01a211b5-0ab6-7733-9516-b83103d91b22
- Couche : devops
- Branche : layers/devops
- Worktree : worktree/devops
- État : validée humainement

- Dépendances : les commits de base DEM-024 `f8c2f7bc9ad7cc898440f0ee8e1a58889c454bd7` et `57831174e85cd218d98c304149390c3d2cd95105` sont déjà présents sur DevOps.

- Périmètre autorisé : limité aux fichiers énumérés ci-dessous.

## Chemins autorisés

- `.github/workflows/runtime-tests.yml`
- `codebase-integrity/domaines/fiabilite-verifications/tests/test_saas_api_load.py`
- `infra/docker/Dockerfile.playwright`
- `infra/docker/docker-compose.dev.yml`
- `infra/docker/docker-compose.test.yml`
- `infra/make/Makefile.dev`
- `infra/scripts/lanes.py`
- `infra/tests/test_lanes.py`
- `webapp/playwright.config.ts`
- `webapp/scripts/quality/fixture-server.ts`
- `webapp/scripts/quality/lighthouse.ts`
- `webapp/scripts/quality/load.ts`
- `webapp/scripts/quality/load/scenarios.js`
- `webapp/scripts/quality/mutation-extended.ts`
- `webapp/scripts/quality/run.ts`
- `webapp/scripts/quality/run.vitest.ts`
- `webapp/scripts/quality/saas_api_load.py`
- `codebase-integrity/README.md`
- `codebase-integrity/commun/check_presentation.py`
- `codebase-integrity/domaines/fiabilite-verifications/tests/test_check_presentation.py`
- `webapp/scripts/quality/ci-plan.vitest.ts`
- `dev-book/tasks/OPS-091-renommer-variables-execution.md`

## Résultat et critères

Migrer producteurs et consommateurs selon la table du brouillon, y compris SaaS et mutation inactifs. Préserver leurs états, les protections et les défauts. Exclure règles métier, réglages distants et fichiers privés.

- CI et l’environnement Docker de développement conservent respectivement `http://127.0.0.1:3000` et `http://webapp-localhost:3000`. La recette test DevOps conserve `http://127.0.0.1:19856`. Conserver la résolution par réseau, les défauts des serveurs directs et l’origine explicite du lanceur navigateur hors mode liste.
- Une origine distante reste refusée pour la charge et Lighthouse. Une surcharge de port atteint le serveur. Un port invalide ou occupé échoue avant lancement. Les variables internes `CHECKS_*` gardent les mêmes rôles et l’isolation dotenv est préservée.

## Contrôles et preuves attendus

Depuis le worktree DevOps, résoudre les configurations sans démarrer de service. Vérifier les scénarios positifs et négatifs dans `infra/tests/test_lanes.py`, `test_saas_api_load.py` et `webapp/scripts/quality/run.vitest.ts` par exécutions ciblées plafonnées à 55 secondes. Pour Vitest, lancer depuis `webapp` avec les dépendances locales. Consigner commandes, résultats et limites dans cette carte. Les parcours runtime réels relèvent de la validation d’ensemble du brouillon.

### Contrôles observés

- `timeout 55s python3 -B -m unittest discover -s infra/tests -p test_lanes.py` : 26 réussites, avec Docker simulé et sondes de port sur la boucle locale. Port invalide ou occupé refusé et surcharge transmise au conteneur simulé.
- Même commande depuis la racine avec `-s codebase-integrity/domaines/fiabilite-verifications/tests` et les filtres `test_saas_api_load.py` et `test_check_presentation.py` : 4 et 14 réussites.
- Depuis `webapp`, `timeout 55s ./node_modules/.bin/vitest run scripts/quality/run.vitest.ts scripts/quality/ci-plan.vitest.ts` : 85 réussites. Le lanceur refuse l’origine absente et vérifie l’isolation dotenv. Le plan Make utilise Docker simulé.
- Depuis `webapp`, `timeout 55s ./node_modules/.bin/vitest run scripts/quality/load.vitest.ts -t 'refuse une origine'` : 6 réussites et 7 hors filtre. Ce validateur est partagé par Lighthouse.
- Résolution `docker compose --project-directory . --env-file /dev/null -f infra/docker/docker-compose.<pile>.yml --profile <profil> config --no-env-resolution --format json` depuis la racine, avec le profil `quality` de `test` et le profil `e2e` de `dev`. Les trois services de test résolvent l’origine de boucle locale fournie et le réseau hôte, Playwright en développement conserve le nom de service Docker, et les arguments UID/GID suivent les valeurs fournies. Aucun serveur ou conteneur démarré.
- Le vérificateur de structure accepte le README Codebase Integrity. Les audits runtime et les requêtes réelles restent à vérifier selon la recette.

## Verdict humain

Verdict explicite « valider » dans la session `01a211b5-0ab6-7733-9516-b83103d91b22`.

```verdict-json
{
  "decision": "validé",
  "portee": "DEM-018, OPS-091 — Migration des variables, origines et garde-fous. Les parcours Playwright, k6 et Lighthouse restent à vérifier.",
  "contenu": {
    "type": "git",
    "valeur": "d09b4841487ab154d8483889eb99026171133987"
  }
}
```

## Correctif de format

ESLint et Prettier ont signalé la mise en forme de l’appel à `runExtendedMutation` après le renommage de `MUTATION_PILOT`. Le correctif applique uniquement le format attendu à cet appel. Le verdict ci-dessus reste rattaché au SHA initial.

Depuis `webapp`, `./node_modules/.bin/prettier --check scripts/quality/mutation-extended.ts` et `./node_modules/.bin/eslint --max-warnings 0 scripts/quality/mutation-extended.ts` réussissent. Verdict humain « validé » dans la session `01a211b5-0ab6-7733-9516-b83103d91b22`, pour le correctif `0e1175f49758f93a68995333c5854230ed0e0e8b`.
