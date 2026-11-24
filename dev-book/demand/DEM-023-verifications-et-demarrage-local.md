# DEM-023 — Vérifications et démarrage local de Showcase Immobilier

- Type : consolidation
- Étape : reconstituée, contrôles manuels en attente.
- Session de création : 01a20c4d-bb03-77c1-a236-d39379aa3c1a
- Source : constat et essais de l’humain dans cette session, dépôt Showcase Immobilier.

## Constat

La liste manuelle des contrôles utilisait l’origine de préproduction sur le port 8080 alors que les fixtures de test étaient prêtes sur `http://127.0.0.1:19856`. Playwright, k6 et les deux profils Lighthouse ont échoué avec l’ancienne adresse. Le journal transmis après correction indique 30 contrôles réussis, dont les quatre contrôles runtime. L’installation après le clone mérite une procédure dédiée au premier démarrage. Les quatre scores médians de Lighthouse sont disponibles dans `summary.json` et leur lecture dans le terminal a été expérimentée sur la commande Make habituelle.

## Cadrage confirmé

- `TEST.md` à la racine fournit la suite complète de Showcase Immobilier à lancer lors de la reconstitution, après réunion des commits validés sur la branche de demande. Les deux terminaux utilisent la racine du dépôt. Le premier prépare l’image et les fixtures. Le second contient la liste prête à coller. Les deux autres applications restent hors périmètre.
- `SETUP.md` à la racine guide l’installation après le clone jusqu’au démarrage local avec les données de démonstration.
- Pour Lighthouse mobile et desktop, la commande Make habituelle affiche après réussite les quatre scores médians sur 100 par page : performance, accessibilité, bonnes pratiques et SEO. Le bloc est espacé et coloré, lisible sans couleur. Les scores restent informatifs. Les rapports et les codes de sortie sont conservés.

Le périmètre de présentation se limite à Lighthouse. La révision des seuils de conformité et une convention commune aux autres contrôles restent hors périmètre.


## Cartes et verdict

- [OPS-087 — Documenter les vérifications et le premier démarrage](../tasks/OPS-087-documenter-verifications-et-demarrage.md). L’autorisation des deux documents racine est propre à cette demande.
- [OPS-088 — Afficher les scores médians Lighthouse](../tasks/OPS-088-afficher-scores-lighthouse.md).

Les deux cartes sont indépendantes. L’humain a confirmé leur périmètre et leurs contrôles à l’analyse, puis a validé les deux commits d’implémentation avec les limites figurant dans les cartes.

## Reconstitution

Branche `demands/DEM-023`, depuis `develop` local à `1899f8372d4a16a38b6356e727caeae115ac43eb`.

| Portée | SHA source | SHA obtenu |
| --- | --- | --- |
| OPS-087 | `7b76a952c831a9735b0927b2724a05ea436a9b2e` | `8152c61ef283ff701e54e9646b09965515f7bbcb` |
| OPS-088 | `ca3444153b073c309f3c7341ddb3e532d2c92adb` | `cd9c1f45326d66ba1b107f1563910224296d3a9c` |
| Verdicts | `9947060647d8624d835f5c53b1e8ce619f6c04b7` | `d8d5adcb83af96fbf6de1f3f19737907459d7817` |

Les deux guides de `docs/` intègrent le brouillon documentaire validé d’OPS-087. Les trois reprises correspondent aux patchs sources (`git patch-id --stable`). `git diff --check develop`, `make conventions-tests-docs` et `make conventions-tests-devbook` réussissent. Les tests Python ciblés `test_docs.py` et `test_check_presentation.py` réussissent (29 et 13 tests).

Le journal transmis par l’humain le 24 novembre 2026 depuis le dépôt principal confirme la réussite des 29 contrôles actifs de [TEST.md](../../TEST.md), tous avec le code 0. Les deux blocs Lighthouse affichent les médianes de `/fr`, vérifiées dans les rapports `summary.json` pointés par les journaux de ces exécutions.

| Profil | Performance | Accessibilité | Bonnes pratiques | SEO | Journal sous `webapp/.tmp/quality/console/` |
| --- | ---: | ---: | ---: | ---: | --- |
| Desktop | 90 | 100 | 100 | 69 | `runtime-tests-lighthouse-4yhigzys/output.log` |
| Mobile | 99 | 96 | 100 | 69 | `runtime-tests-lighthouse-3kkyw3io/output.log` |

Le premier démarrage sur clone neuf reste à vérifier. Le document définitif, les liens de cartes et les intégrations sous `docs/` sont préparés pour le commit documentaire de livraison.

## Déclaration de contribution

```contribution-json
{
  "version": 1,
  "corrections": [
    {
      "chemins": [
        "codebase-integrity/domaines/fiabilite-verifications/scripts/check_docs.py",
        "codebase-integrity/domaines/fiabilite-verifications/tests/test_docs.py"
      ],
      "convention": "docs/README.md#autres-documents",
      "controles": [
        "codebase-integrity/domaines/fiabilite-verifications/tests/test_docs.py"
      ]
    },
    {
      "chemins": [
        "codebase-integrity/commun/check_presentation.py",
        "codebase-integrity/domaines/fiabilite-verifications/tests/test_check_presentation.py"
      ],
      "convention": "codebase-integrity/README.md#exécution-des-contrôles",
      "controles": [
        "codebase-integrity/domaines/fiabilite-verifications/tests/test_check_presentation.py"
      ]
    }
  ],
  "accompagnements": [
    {
      "chemins": [
        "TEST.md",
        "SETUP.md",
        "docs/executer-controles.md",
        "docs/1.getting-started/setup-local.md"
      ],
      "motif": "Documenter la suite de reconstitution et le premier démarrage de Showcase Immobilier."
    }
  ],
  "sans_correction": ""
}
```
