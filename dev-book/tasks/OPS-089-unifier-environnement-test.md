# OPS-089 — Unifier le démarrage de l’environnement de test

- Demande : DEM-024
- Brouillon au principal : `tmp/demande-consolidation-environnement-test.md`. Lien vers la demande définitive à la reconstitution.
- Session de création : 01a20c4d-bb03-77c1-a236-d39379aa3c1a
- Couche : devops
- Branche : layers/devops
- Worktree : worktree/devops
- État : validée humainement
- Dépendances : aucune dépendance de réalisation. Comparer le guide à la version de DEM-023 intégrée dans `9a254d9` avant de préparer le brouillon documentaire.
- Chemins autorisés : `infra/docker/docker-compose.test.yml`, `infra/docker/docker-compose.quality.yml`, `infra/docker/docker-compose.fixtures.yml`, `infra/make/Makefile.dev`, `infra/scripts/lanes.py`, `infra/tests/test_lanes.py`, `infra/README.md`, `webapp/scripts/quality/fixture-server.ts`, `docs/executer-controles.md`, `docs/worktrees.md` et cette carte.

## Résultat et critères

- Le Compose unique définit `app-test`, `verify`, k6 et Lighthouse. `app-test` et `verify` partagent la même image par projet. `verify` garde son montage temporaire de `.output`. Nitro peut recréer sa sortie dans le conteneur jetable de `app-test`. Retirer les deux anciens fichiers après migration des références actives.
- `make test-up` depuis le principal vérifie Docker, prépare l’image si nécessaire, décrit le contenu de l’environnement, lance le SSR de test et affiche son URL sur 19856 après la sonde HTTP réussie. `checks-rebuild` conserve son rôle de reconstruction explicite.
- Les commandes de couche en `MODE=test` conservent la cible, les ports, les noms isolés, la protection des conteneurs actifs ou étrangers et l’arrêt ciblé. Les alias existants restent utilisables. Un ancien conteneur étiqueté `verify` est reconnu uniquement s’il satisfait les autres critères d’appartenance et de cycle de vie.
- Les environnements dev, préproduction et production, le workflow qui démarre directement les fixtures en CI et les règles des contrôles applicatifs restent hors périmètre.

## Réalisation et preuves

- Depuis le worktree DevOps, exécuter `timeout 55s python3 -B -m unittest discover -s infra/tests -p test_lanes.py` avec Docker simulé. Couvrir image présente ou absente, Docker indisponible, port occupé, routage vers `app-test`, relance active, conteneur historique appartenant à la couche et refus d’un conteneur étranger.
- Vérifier sans démarrage la configuration résolue avec `docker compose config`, en utilisant les variables et options de la recette Make. Comparer l’image et les montages des deux services et rechercher les anciennes références actives. Préparer dans cette carte le brouillon des modifications sous `docs/` pour la reconstitution.
- Essais humains et résultats attendus dans le brouillon de demande. Le contrôle d’ensemble de la recette documentée attend OPS-090.

### Brouillon documentaire pour la reconstitution

Dans `docs/executer-controles.md`, section « Exécuter dans un conteneur jetable »,
remplacer les trois références à `docker-compose.quality.yml` par
`docker-compose.test.yml`. Le service `verify` reste utilisé dans les exemples de
contrôle. Dans « Préparer le serveur pour les parcours navigateur », remplacer
la phrase sur la surcharge Compose par le texte suivant.

> Le service `app-test` de la configuration de test commune utilise la même image que `verify`. La sortie Nitro est recréée dans sa couche jetable.

Dans ce même paragraphe, remplacer « Fixture locale prête » par « Environnement
de test prêt ». Le parcours principal reste référencé via `TEST.md` et le parcours
de couche conserve ses commandes et son port.

Dans `docs/worktrees.md`, sous la description du mode test des couches, préciser
que celui-ci démarre `app-test` à partir du Compose commun, avec une image
préparée depuis la couche et un port propre à celle-ci.

### Contrôles observés

- `timeout 55s python3 -B -m unittest discover -s infra/tests -p test_lanes.py` : 26 tests réussis, Docker simulé. Ce test nécessite le droit de lier un socket local temporaire pour le cas de port occupé. L’exécution avec cette permission a réussi.
- `docker compose config --format json` avec le Compose de test et les projets `devops` et `showcase-immobilier` : quatre services, image commune par projet, même liste de volumes et différence de montage `.output` confirmées. Le script shell du conteneur passe `sh -n`.
- Aucun service n’a été démarré. La disponibilité HTTP et le cycle de vie réel restent à vérifier manuellement. Les références historiques et le guide à intégrer restent hors de la migration active à cette étape.

## Verdict humain

Verdict explicite : « validé ».

```verdict-json
{
  "decision": "validé",
  "portee": "DEM-024, OPS-089 — Compose commun, démarrage et compatibilité des couches. Démarrages réels et intégration des guides à la reconstitution.",
  "contenu": {
    "type": "git",
    "valeur": "f8c2f7bc9ad7cc898440f0ee8e1a58889c454bd7"
  }
}
```

## Commits

- Implémentation examinée : `f8c2f7bc9ad7cc898440f0ee8e1a58889c454bd7`.
