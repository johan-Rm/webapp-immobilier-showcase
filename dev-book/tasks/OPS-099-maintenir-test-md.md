# OPS-099 — Rendre obligatoire la mise à jour de TEST.md

- Demande : DEM-027
- Type : consolidation
- Brouillon d’analyse au principal : `tmp/demande-consolidation-maintenir-test-md.md`
- Journal de demande : `dev-book/demand/DEM-027-maintenir-test-md.md` sur `demands/DEM-027`
- Session de création : 01a211b5-0ab6-7733-9516-b83103d91b22
- Couche : devops
- Branche : `layers/devops`
- Worktree : `worktree/devops`
- État : validée humainement, à reconstituer
- Chemins autorisés : `AGENTS.md`, `TEST.md` et cette carte.
- Dépendances : aucune dépendance de réalisation.

## Résultat et critères

- [AGENTS.md](../../AGENTS.md#contrôles-et-fin-du-travail) porte la règle de mise à jour de `TEST.md` dans le même changement que les tests CI/CD et les critères de revue de PR.
- [TEST.md](../../TEST.md#analyse-sonarqube-cloud-facultative) présente `make third-party-tests-sonar` hors du bloc de reconstitution, avec un lien vers le guide des prérequis et du traitement distant.
- Les 29 commandes de la suite complète sont conservées. Le périmètre porte sur la documentation et la revue de PR.

## Contrôles et preuves

Contrôles exécutés depuis le worktree DevOps sur la base intégrée `af673dae1a23267b33918a732fab505c1a5c917f`.

- `git diff --check` réussit.
- `make conventions-tests-docs` réussit ses quatre étapes, dont le contrôle des liens locaux de la recette.
- `python3 -B -m unittest discover -s codebase-integrity/domaines/fiabilite-verifications/tests -p test_docs.py` réussit les 30 tests du vérificateur existant.
- La comparaison des lignes Make avec `git show HEAD:TEST.md`, avant le commit, confirme les mêmes 29 commandes et le même `make test-up`, dans le même ordre. `infra/make/Makefile.dev` déclare la cible SonarQube et la recette la cite hors du bloc actif.

La revue humaine vérifie la concordance de la règle et de la recette avec le cadrage. La suite complète relève de l’exécution manuelle à la reconstitution. L’analyse Cloud reste facultative.

## Verdict humain

```verdict-json
{
  "decision": "validé",
  "portee": "DEM-027, carte OPS-099 et contenu présenté à la vérification du 26 novembre 2026.",
  "contenu": {
    "type": "git",
    "valeur": "2d9f85a6009640ad361dcbfb78e0f9032ce19306"
  }
}
```

Verdict formulé dans le chat le 26 novembre 2026 dans la session `01a211b5-0ab6-7733-9516-b83103d91b22`. La suite manuelle reste à exécuter après reconstitution.
