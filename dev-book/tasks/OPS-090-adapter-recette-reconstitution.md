# OPS-090 — Adapter la recette de reconstitution au point d’entrée test

- Demande : DEM-024
- Brouillon au principal : `tmp/demande-consolidation-environnement-test.md`. Lien vers la demande définitive à la reconstitution.
- Session de création : 01a20c4d-bb03-77c1-a236-d39379aa3c1a
- Couche : devops
- Branche : layers/devops
- Worktree : worktree/devops
- État : validée humainement
- Dépendances : commit d’OPS-089 `f8c2f7bc9ad7cc898440f0ee8e1a58889c454bd7`. La base fonctionnelle de DEM-023 (`eae991a`) a pour équivalent patch sur DevOps `7b76a95`. Vérifier la présence et la concordance de `TEST.md` et de son contrôle avant modification.
- Chemins autorisés : `TEST.md`, `codebase-integrity/domaines/fiabilite-verifications/scripts/check_docs.py`, `codebase-integrity/domaines/fiabilite-verifications/tests/test_docs.py` et cette carte. Le chemin racine `TEST.md` est autorisé ponctuellement pour DEM-024.

## Résultat et critères

- `TEST.md` indique `make test-up` dans le premier terminal, l’annonce de disponibilité et la suite Showcase dans le second. La reconstruction reste explicite et les contrôles applicatifs conservent leur périmètre.
- Le contrôle documentaire lit le port par défaut dans sa déclaration Make, vérifie les quatre origines runtime et conserve les contrôles de syntaxe, de cibles et de liens. Un port introuvable ou divergent, une cible inconnue ou une URL incorrecte fait échouer le contrôle. Les commandes commentées restent ignorées.

## Réalisation et preuves

Depuis le worktree DevOps, exécuter `timeout 55s python3 -B -m unittest discover -s codebase-integrity/domaines/fiabilite-verifications/tests -p test_docs.py` et `timeout 55s make conventions-tests-docs`. Tester la recette conforme, chacun des écarts et les commandes commentées. À la reconstitution, vérifier manuellement les deux terminaux et la suite complète selon `TEST.md`.

### Contrôles observés

- `timeout 55s python3 -B -m unittest discover -s codebase-integrity/domaines/fiabilite-verifications/tests -p test_docs.py` : 29 tests réussis, y compris le changement du port Make qui invalide les quatre origines.
- `timeout 55s make conventions-tests-docs` : 3 étapes sur 4 réussies. Quatre liens hors dépôt sont signalés dans les cartes préexistantes OPS-045, OPS-046, OPS-085 et OPS-086. La comparaison à la base retrouve les mêmes écarts. Le contrôle ciblé des guides racine et de cette carte ne signale aucun écart.
- Les deux terminaux et la suite complète restent à vérifier manuellement à la reconstitution.

## Verdict humain

Verdict explicite : « validé ».

```verdict-json
{
  "decision": "validé",
  "portee": "DEM-024, OPS-090 — Recette et contrôle documentaire. Suite complète à exécuter et quatre liens historiques hors dépôt sur la couche.",
  "contenu": {
    "type": "git",
    "valeur": "57831174e85cd218d98c304149390c3d2cd95105"
  }
}
```

## Commits

- Implémentation examinée : `57831174e85cd218d98c304149390c3d2cd95105`.
