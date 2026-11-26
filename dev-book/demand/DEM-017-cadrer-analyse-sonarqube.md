# DEM-017 — Cadrer l’analyse SonarQube

- Type : consolidation
- État : reconstituée, suite complète à vérifier.
- Session de création : 01a1ee70-2dc4-7331-992b-b24155dfd09a
- Sessions intervenantes : 01a1fed8-cd9a-7561-9aa0-6c26f1125293, 01a211b5-0ab6-7733-9516-b83103d91b22

## Besoin et décisions

Circonscrire SonarQube Cloud à Showcase Immobilier, au catalogue immobilier, au BFF, aux services, au code partagé et aux configurations applicatives retenues. Le périmètre comprend les fichiers sources suivis TypeScript, Vue et CSS, y compris le code applicatif SaaS du BFF et des services. Les autres cibles, tests, contenus, médias, schémas YAML, scripts, fichiers générés et données locales sont exclus.

Préparer une copie temporaire et bloquer l’envoi si la sélection est vide, comporte un lien dans le périmètre ou ne peut pas être vérifiée. Prévoir une analyse locale et des analyses CI informatives avec état explicite pour les exécutions non réalisées. Les conditions de confiance des PR, le périmètre des métadonnées Git accessibles et les limites sont détaillés dans le [guide SonarQube Cloud](../../docs/3.application/sonarqube-cloud.md).

## Cartes et verdict

- [OPS-045 — Préparer le périmètre SonarQube vérifiable](../tasks/OPS-045-preparer-perimetre-sonarqube.md).
- [OPS-046 — Raccorder l’analyse SonarQube et présenter ses limites](../tasks/OPS-046-integrer-analyse-sonarqube.md), après OPS-045.

Verdict humain « validé » pour les deux commits sources. Les essais avec le scanner officiel, l’exécution GitHub et les réglages du service restent à vérifier. Le verdict conserve ces limites. Les correctifs locaux ont aussi été validés. La configuration est regroupée dans `webapp/.env` et le lancement se fait avec `make third-party-tests-sonar`.

## Reconstitution

Branche `demands/DEM-017-analyse-sonarqube` depuis le develop local vérifié à `1c1b562334afb366950dd97e2fd0a2cf91ad83dd`.

| Portée | SHA source | SHA obtenu |
| --- | --- | --- |
| OPS-045 | `aee94c98a7c7a8da62d6f3e52a4f9b9561e5f060` | `07a8f6d3f8517d68159cbdfd0f8012cb2d43e9bd` |
| OPS-046 | `f2408017336398fb53fe42accb84597186a96912` | `027edd3d0bca3dce19c0e70f06a78647e06e2311` |
| Verdict humain | `a712758bbc68004670e03f23fae636ac3579b78b` | `9df3b848e4fbece96d2bf078b02b180fdfc7f490` |
| Correctif VS Code | `7879cc627d092edd1f2c103cbc48e18c102b105a` | `6adc018cdde5d3347d1772d6ba10d5eb9868567c` |
| Verdict du correctif | `ffd3a851808fbfbbdc6c821d1aac229774c053f9` | `c40f4cee22d927395e63f49b09b0cee536d13dcb` |
| Correctif Make | `b513e232b3a0106fa1266955241e1830a8261324` | `b065026300287f2748934a83ee0ddd50df5cdcac` |
| Verdict du correctif Make | `11aa5d62cffe1f6959e4aa14fe8bd08e1f3196aa` | `c5042f8a5cb26ea03a666132afc1096c5ca94822` |
| Correctif d’affichage | `f8986efc682f4dd20ba341dd1429f78b0647fee0` | `fe7402eb1daa14cb1fdc4444961c87e0e70784ca` |
| Verdict du correctif d’affichage | `bf8bbf141d5b64501109b6f0b22d026931575ab1` | `b48e691334813bce6a7cf04ae4c422ab03057bb6` |

Le brouillon documentaire validé d’OPS-046 est intégré au guide, avec un renvoi depuis le catalogue des contrôles. Les liens des cartes et la demande sont préparés pour le commit documentaire de livraison.

### Contrôles observés

Les neuf identifiants de patch correspondent aux commits sources. `git diff --check develop`, `make conventions-tests-docs` (4 étapes sur 4) et `make conventions-tests-devbook BASE=1c1b562334afb366950dd97e2fd0a2cf91ad83dd` réussissent. Les liens du guide et des cartes et la couverture de la déclaration sur le périmètre préparé sont vérifiés. Le contrôle ciblé du guide signale son dossier de premier niveau numéroté, déjà présent sur `develop`. Le contrôle complet de contribution sur objets Git reste à lancer après les commits documentaires.

Les suites Python ciblées de sélection et de politique de sortie réussissent leurs 11 tests sans service. `make third-party-tests-sonar-preview` recense 305 fichiers et indique « analyse non réalisée ». La syntaxe du script manuel est vérifiée par `bash -n webapp/scripts/quality/manual_sonar_cloud.sh`.

Après reprise du correctif Make, les 23 tests ciblés passent sur le principal, avec scanner factice. Le parcours Make, le modèle de configuration, la déclaration de contribution et les traces des cartes sont vérifiés. L’analyse réelle reste attendue.

### Suite complète manuelle

La suite complète attend le retour humain sur le HEAD final de `demands/DEM-017-analyse-sonarqube`, après les commits documentaires. Suivre [TEST.md](../../TEST.md) depuis la racine du dépôt principal. Les 29 commandes actives doivent réussir.

### Essai réel SonarQube du 26 novembre 2026

Le journal humain du lanceur Bash indique 305 fichiers prétraités, 302 indexés et un rapport envoyé. SonarQube Cloud confirme le traitement `SUCCESS` à 09 h 58 (heure de Paris) pour la tâche `AaIXFAX2exg5vVuaAIvm`, sur la branche `demands/DEM-017-analyse-sonarqube`. Le SHA exact de cet essai ne figure pas dans le journal. Le 20 novembre affiché sur la page des projets correspond à `develop`. L’API renvoie 403 pour la consultation des résultats de la branche secondaire avec le token local.

Le correctif `f8986efc682f4dd20ba341dd1429f78b0647fee0` rend la cible et les liens de suivi visibles dans la sortie locale. Les 24 tests ciblés avec scanner factice réussissent. Correctif validé humainement et repris dans le principal. Le nouvel affichage est vérifié par l’essai Make ci-dessous.

Le second essai humain via `make third-party-tests-sonar` affiche le projet, la branche, 305 fichiers préparés et les deux liens de suivi. Le journal confirme 302 fichiers indexés et le dépôt du rapport. L’heure de l’essai et le reflog correspondent au HEAD `b48e691334813bce6a7cf04ae4c422ab03057bb6` du principal. SonarQube Cloud confirme `SUCCESS` pour la tâche `AaIXIN1-exg5vVuaAKzm` le 26 novembre 2026 à 10 h 12 (heure de Paris). Les envois du rapport d’architecture et du cache des analyseurs ont émis des avertissements. L’API de consultation des résultats de la branche secondaire renvoie toujours 403.

## Déclaration de contribution

```contribution-json
{
  "version": 1,
  "corrections": [
    {
      "chemins": [
        "codebase-integrity/domaines/fiabilite-verifications/tests/test_sonar_scope.py",
        "webapp/scripts/quality/sonar_scope.py"
      ],
      "convention": "codebase-integrity/README.md#exécution-des-contrôles",
      "controles": [
        "codebase-integrity/domaines/fiabilite-verifications/tests/test_sonar_scope.py"
      ]
    },
    {
      "chemins": [
        ".github/workflows/sonarqube.yml",
        ".vscode/tasks.json",
        "codebase-integrity/README.md",
        "codebase-integrity/conventions.json",
        "codebase-integrity/domaines/fiabilite-verifications/tests/manual_sonar_relay.py",
        "codebase-integrity/domaines/fiabilite-verifications/tests/test_sonar_egress.py",
        "codebase-integrity/domaines/fiabilite-verifications/tests/test_sonar_egress_policy.py",
        "codebase-integrity/domaines/fiabilite-verifications/tests/test_sonar_git_metadata.py",
        "codebase-integrity/domaines/fiabilite-verifications/tests/test_sonar_run.py",
        "infra/make/Makefile.dev",
        "webapp/.env.example",
        "webapp/scripts/quality/manual_sonar_cloud.sh",
        "webapp/scripts/quality/sonar_egress.py",
        "webapp/scripts/quality/sonar_egress_policy.py",
        "webapp/scripts/quality/sonar_git_preview.py",
        "webapp/scripts/quality/sonar_run.py"
      ],
      "convention": "codebase-integrity/README.md#exécution-des-contrôles",
      "controles": [
        "codebase-integrity/domaines/fiabilite-verifications/tests/test_sonar_egress.py",
        "codebase-integrity/domaines/fiabilite-verifications/tests/test_sonar_egress_policy.py",
        "codebase-integrity/domaines/fiabilite-verifications/tests/test_sonar_git_metadata.py",
        "codebase-integrity/domaines/fiabilite-verifications/tests/test_sonar_run.py"
      ]
    }
  ],
  "accompagnements": [
    {
      "chemins": [
        "dev-book/reports/sonarqube-documentation.md",
        "docs/3.application/sonarqube-cloud.md",
        "docs/executer-controles.md"
      ],
      "motif": "Préparer et intégrer les instructions approuvées pour la prévisualisation et l’analyse SonarQube."
    }
  ],
  "sans_correction": ""
}
```
