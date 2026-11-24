# OPS-087 — Documenter les vérifications et le premier démarrage

- Demande : DEM-023 · consolidation.
- Brouillon au principal : `tmp/demande-consolidation-parcours-local.md`. Lien vers la demande définitive à la reconstitution.
- Session de création : 01a20c4d-bb03-77c1-a236-d39379aa3c1a
- Couche : devops
- Branche : layers/devops
- Worktree : worktree/devops
- État : validée humainement
- Dépendances : aucune dépendance de réalisation.
- Chemins autorisés : `TEST.md`, `SETUP.md`, `docs/executer-controles.md`, `docs/1.getting-started/setup-local.md`, `codebase-integrity/domaines/fiabilite-verifications/scripts/check_docs.py`, `codebase-integrity/domaines/fiabilite-verifications/tests/test_docs.py` et cette carte. Les deux chemins racine sont autorisés ponctuellement pour cette demande.

## Résultat et critères

- `TEST.md` fournit la suite complète de reconstitution de Showcase, depuis la racine, avec les deux terminaux et les fixtures sur `http://127.0.0.1:19856`. Les autres applications restent hors périmètre. Les cibles suspendues et la commande illustrative SonarQube peuvent être commentées.
- `SETUP.md` fournit le parcours de premier démarrage après le clone, avec les données de démonstration. Le guide existant renvoie vers les étapes communes et conserve les étapes propres à la remise à zéro. La documentation des contrôles individuels reste dans le guide existant, avec un lien vers le parcours de reconstitution.
- Le contrôle documentaire bloque sur un lien local rompu, un bloc Bash invalide, une cible Make inexistante ou une origine runtime qui diverge du port des fixtures. Il ignore les commandes commentées. La complétude du parcours est relue contre le catalogue lors de son évolution.

## Réalisation et preuves

Exécuter les tests documentaires Python ciblés depuis le worktree DevOps, sans Docker. Couvrir un parcours conforme et chaque écart ci-dessus. Conserver la commande et son résultat dans cette carte. L’essai humain suit `SETUP.md` depuis la racine d’un clone neuf avec Docker et Compose disponibles, puis vérifie un GET sur `http://localhost:3000/fr` avec statut 200. La suite complète est vérifiée à la reconstitution.

### Brouillon documentaire pour la reconstitution

Dans `docs/executer-controles.md`, sous « Commandes manuelles », insérer le paragraphe suivant avant la préparation de l’image :

```markdown
> Pour exécuter la suite complète de Showcase Immobilier lors de la reconstitution, suivre [la procédure en deux terminaux](../TEST.md).
```

Dans `docs/1.getting-started/setup-local.md`, remplacer le contenu entre le titre « 3. Reconstruire et préparer le frontend » et le titre de l’étape 4 par :

```markdown
> Suivre [la préparation du frontend et le démarrage](../../SETUP.md) depuis la racine du dépôt. Conserver le `webapp/.env` existant. Le conteneur monte ce fichier et les fixtures versionnées en lecture seule. Utiliser `make dev-build-localhost-no-cache` à la place de la construction standard pour la remise à zéro décrite ici.
```

Dans le même guide, remplacer « Après préparation de Showcase » par `Après [le premier démarrage de Showcase](../../SETUP.md)` dans la section « Deux sites SSR locaux ».

### Contrôles observés

- `timeout 55s python3 -B -m unittest discover -s codebase-integrity/domaines/fiabilite-verifications/tests -p test_docs.py` : 29 tests réussis.
- Le contrôle global signale quatre liens hors dépôt dans les cartes préexistantes OPS-045, OPS-046, OPS-085 et OPS-086. Les nouveaux guides et la carte passent le contrôle ciblé.
- Premier démarrage sur clone neuf et suite complète réservés à l’essai humain.

## Verdict humain

Verdict explicite de l’humain : « ok les 2 commits validé ».

```verdict-json
{
  "decision": "validé",
  "portee": "DEM-023, OPS-087 — guides et contrôle documentaire. Premier démarrage sur clone neuf et suite complète à vérifier. Quatre liens hors dépôt préexistants.",
  "contenu": {
    "type": "git",
    "valeur": "7b76a952c831a9735b0927b2724a05ea436a9b2e"
  }
}
```

## Commits

- Implémentation examinée : `7b76a952c831a9735b0927b2724a05ea436a9b2e`.
