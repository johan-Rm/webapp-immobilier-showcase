# DEM-024 — Simplifier le démarrage de l’environnement de test

- Type : consolidation
- Étape : reconstituée, essai de couche en attente.
- Session de création : 01a20c4d-bb03-77c1-a236-d39379aa3c1a
- Source : échange avec l’humain sur le parcours de test de Showcase Immobilier après la reconstitution de DEM-023.

## Constat

Le premier terminal de `TEST.md` enchaîne une vérification Docker, la préparation de l’image des contrôles et le démarrage du serveur de fixtures. La recette charge `infra/docker/docker-compose.quality.yml` et lui applique `infra/docker/docker-compose.fixtures.yml` pour adapter le montage de la sortie Nitro. Les couches AIDE disposent déjà de `make lane-up <couche> MODE=test`.

## Cadrage confirmé

- Réunir les deux fichiers dans `infra/docker/docker-compose.test.yml`. Retirer les anciens fichiers après migration de leurs références. Le fichier commun définit des services distincts pour l’application de test, `verify`, k6 et Lighthouse. L’application et `verify` partagent la même image. Préserver les montages propres à chaque service, notamment la possibilité pour Nitro de recréer sa sortie dans le conteneur de l’application.
- Depuis la racine du dépôt principal, `make test-up` vérifie l’accès à Docker, prépare l’image si elle manque, puis démarre l’application SSR avec les données de démonstration et l’API simulée. Afficher « Démarrage de l’environnement de test », puis l’image, le conteneur SSR, les données et l’API simulée. Afficher « Environnement de test prêt » et `http://127.0.0.1:19856` quand l’application répond.
- Conserver `make lane-up <couche> MODE=test` et le raccorder au fichier Compose commun, avec les ports et l’isolation existants des couches.
- Mettre à jour `TEST.md` avec `make test-up` dans le premier terminal et les contrôles dans le second. Adapter la vérification documentaire pour détecter une divergence entre les URL des contrôles runtime et le port des fixtures. La reconstruction de l’image reste explicite via `make checks-rebuild`.

Les autres environnements et les règles de fond des contrôles restent hors périmètre.

## Cartes et verdict

- [OPS-089 — Unifier le démarrage de l’environnement de test](../tasks/OPS-089-unifier-environnement-test.md).
- [OPS-090 — Adapter la recette de reconstitution](../tasks/OPS-090-adapter-recette-reconstitution.md), après OPS-089. La modification de `TEST.md` est autorisée ponctuellement pour cette demande.

L’humain a confirmé les choix et contrôles à l’analyse, puis validé les deux commits d’implémentation avec les limites détaillées dans les cartes.

## Reconstitution

Branche `demands/DEM-024` depuis `develop` local à `935b4c6cc284c3a823653001e6c3d8a5a7770b18`. Les trois patchs repris sont identiques aux patchs sources.

| Portée | SHA source | SHA obtenu |
| --- | --- | --- |
| OPS-089 | `f8c2f7bc9ad7cc898440f0ee8e1a58889c454bd7` | `1d9280582420d08af4b4ecc530f1f1ea5598b4e5` |
| OPS-090 | `57831174e85cd218d98c304149390c3d2cd95105` | `1185e44997a03ee2f6ec5d961ac450f640c18e37` |
| Verdicts | `faf55c4e69192e4cc3d613f15c79f7880530db37` | `16614cb3abb12268c3e030304e9c4f1fc5b7dd6d` |

Le brouillon documentaire validé d’OPS-089 est intégré dans les deux guides. Les contrôles `make conventions-tests-docs`, `make conventions-tests-devbook` et `git diff --check develop` réussissent. Les suites ciblées `test_docs.py` (29 tests) et `test_lanes.py` (26 tests, Docker simulé) passent. Le Compose résolu confirme l’image commune et les montages Nitro distincts. Les documents et les liens des cartes restent préparés pour le commit documentaire de livraison. Le journal transmis par l’humain le 25 novembre 2026 confirme la réussite des 29 contrôles actifs de [TEST.md](../../TEST.md), dont Playwright, k6 et Lighthouse desktop et mobile sur les fixtures du principal. Les deux bilans Lighthouse affichent les scores médians de `/fr`. Le conteneur du principal porte le label de service `app-test`. Ses logs affichent « Environnement de test prêt : http://127.0.0.1:19856 » et une requête GET sur `/fr` renvoie 200. La preuve de démarrage réel et d’arrêt ciblé en mode test sur la couche DevOps reste attendue.

## Déclaration de contribution

```contribution-json
{
  "version": 1,
  "corrections": [
    {
      "chemins": [
        "infra/README.md",
        "infra/docker/docker-compose.fixtures.yml",
        "infra/docker/docker-compose.quality.yml",
        "infra/docker/docker-compose.test.yml",
        "infra/make/Makefile.dev",
        "infra/scripts/lanes.py",
        "infra/tests/test_lanes.py",
        "webapp/scripts/quality/fixture-server.ts"
      ],
      "convention": "infra/README.md#mode-test-des-couches",
      "controles": [
        "infra/tests/test_lanes.py"
      ]
    },
    {
      "chemins": [
        "codebase-integrity/domaines/fiabilite-verifications/scripts/check_docs.py",
        "codebase-integrity/domaines/fiabilite-verifications/tests/test_docs.py"
      ],
      "convention": "docs/README.md#autres-documents",
      "controles": [
        "codebase-integrity/domaines/fiabilite-verifications/tests/test_docs.py"
      ]
    }
  ],
  "accompagnements": [
    {
      "chemins": [
        "TEST.md",
        "docs/executer-controles.md",
        "docs/worktrees.md"
      ],
      "motif": "Documenter le démarrage et la recette de reconstitution."
    }
  ],
  "sans_correction": ""
}
```
