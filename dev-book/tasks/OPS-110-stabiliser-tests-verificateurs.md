# OPS-110 — Stabiliser et rendre lisibles les tests des vérificateurs

- Demande : DEM-025
- Type : consolidation
- Session de création : 01a21d01-fa3f-7e51-8fca-8a4c2d4e0307
- Couche : devops
- Branche : `demands/DEM-025-lisibilite-tests-verificateurs`
- Worktree : `worktree/DEM-025-lisibilite-tests-verificateurs`
- État : validée humainement avant commit ; suite complète à vérifier
- Chemins autorisés : `codebase-integrity/commun/check_presentation.py`, `codebase-integrity/commun/run_check_output.py`, `codebase-integrity/commun/test_domains.py`, `codebase-integrity/package.json`, `codebase-integrity/domaines/fiabilite-verifications/tests/test_check_output.py`, `codebase-integrity/domaines/fiabilite-verifications/tests/test_check_presentation.py`, `codebase-integrity/domaines/fiabilite-verifications/tests/test_aide_runner.py`, `codebase-integrity/domaines/fiabilite-verifications/tests/test_frontend_paths.py`, `infra/make/Makefile.dev`, `infra/docker/docker-compose.test.yml`, `docs/controles/executer-controles.md`, `TEST.md`, la demande et cette carte.
- Dépendances : aucune dépendance de réalisation ; base d’analyse `53ef9d662fa0bce1a9b7a604721b3956036678a0`.

## Résultat et critères

- Vérifier les chemins CI et conteneur, puis isoler explicitement les modes dans les tests de présentation ; ne pas masquer une dépendance d’environnement de toute la suite.
- À SHA et prérequis identiques, les deux modes sélectionnent les mêmes tests, conservent les journaux complets et donnent le même verdict et code de sortie pour réussite et échec maîtrisé ; préciser le contrat des interruptions.
- En mode détaillé, afficher les noms existants des scénarios avec les reporters adaptés, sans les renommer ni changer les filtres. Vérifier la disponibilité et l’effet des reporters Python, Vitest et Bun. Dans les deux pilotes seulement, documenter brièvement les scénarios et les simulations ou données difficiles à comprendre, sans changer leur logique ni leurs assertions.
- Ajouter des tests ciblés bloquants des modes, de la propagation de l’environnement et de la fidélité des journaux et codes, avec cas conformes et échec maîtrisé. La qualité sémantique des descriptions relève de la revue humaine.
- Actualiser `TEST.md` si les tests CI/CD changent et le guide si nécessaire. Déclarer dans la demande les chemins effectivement modifiés, la convention et les contrôles correspondants.
- Présenter à l’humain les commandes complètes des deux exécutions manuelles, depuis ce worktree, avec SHA, prérequis, rapports et résultats attendus. Ne pas lancer la suite complète ni de test avec service.

## Réalisation et preuves

Implémentation préparée sur la base `53ef9d662fa0bce1a9b7a604721b3956036678a0` : isolation du mode synthétique dans les tests concernés, sélection des sorties détaillées Python et Vitest, transmission ciblée des variables au conteneur et normalisation du code de signal. Les deux pilotes ont reçu des descriptions sans modification de leurs assertions.

Contrôles exécutés depuis ce worktree : les tests Python ciblés `test_check_output.py` (8, y compris sous `VERBOSE=1` et `CHECK_PRESENTATION_ACTIVE=1`), `test_check_presentation.py` (16), `test_aide_runner.py` (5) et `test_frontend_paths.py` (2) réussissent. Le contrôle documentaire `python3 -B codebase-integrity/domaines/fiabilite-verifications/scripts/check_docs.py` et `git diff --check` réussissent. Ces tests ne prouvent pas l’exécution réelle de Docker, Vitest ou Bun ni l’équivalence de la suite complète. Le guide documentaire du skill, masqué dans le bac à sable, a été lu avec accès élargi.

Après commit et reconstruction de l’image, l’humain exécutera les deux commandes ci-dessous depuis ce worktree, sur le même SHA, avec Docker et Compose disponibles. Relever `git rev-parse HEAD`, les codes et les chemins des rapports. Résultat attendu : mêmes moteurs et tests sélectionnés, réussite et code 0 dans les deux modes, noms visibles en mode détaillé ; en cas d’échec, conserver les journaux et comparer les verdicts sans annoncer de réussite.

```bash
cd /home/johan/www/graines-digitales/modern-web-apps/showcase-immobilier/worktree/DEM-025-lisibilite-tests-verificateurs
git rev-parse HEAD
make checks-rebuild
make internal-tests-verifiers
make internal-tests-verifiers VERBOSE=1
```

## Verdict humain

Le 28 novembre 2026, l’humain répond « c’est validé » au changement présenté pour OPS-110, avec les limites de vérification indiquées ci-dessus. Le diff des fichiers suivis présenté a pour empreinte SHA-256 `19fb528f4ac59f67f7d5b3bf6c250f702ad81211301804538ed156871543cda8` ; les versions présentées de la demande et de cette carte ont respectivement pour empreintes `e3c63685a90d825193e3b1a7ab614fead97d259a0f98d385a07ad3b3f4b770ce` et `c0edf95b1ece412088b1b89595ccc123471bcbd2d49626e5857c0c70dcef443f`. La vérification globale de la demande et les exécutions manuelles restent distinctes.

```verdict-json
{
  "decision": "validé",
  "portee": "DEM-025, changement OPS-110 présenté avant commit ; la vérification globale et les tests manuels restent distincts.",
  "contenu": {
    "type": "git",
    "valeur": "025a2698de632f9af99fc5223034cafc3a9f9791"
  }
}
```

## Commits

Le SHA du commit de tâche est établi par l’historique Git de la branche.
