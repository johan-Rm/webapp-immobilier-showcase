# DEM-027 — Tenir TEST.md à jour lors des changements de tests CI/CD

- Type : consolidation
- État : reconstituée, suite manuelle en attente
- Session de création : 01a211b5-0ab6-7733-9516-b83103d91b22
- Branche : `demands/DEM-027`
- Espace documentaire : `worktree/DEM-027`

## Constat

La suite de reconstitution de Showcase Immobilier est décrite dans [TEST.md](../../TEST.md). Avant cette consolidation, le fichier demandait de répercuter les changements de commandes, de paramètres et de prérequis. [DEM-017](DEM-017-cadrer-analyse-sonarqube.md) a livré `make third-party-tests-sonar` et `TEST.md` avait gardé l’exemple commenté `make sonarqube-tests`, dont la cible n’existait pas.

## Décisions confirmées

Le 26 novembre 2026, l’humain a choisi la revue de PR comme mode de vérification, puis a confirmé le cadrage dans le chat par « validé ».

- Inscrire dans la section « Contrôles et fin du travail » de l’[AGENTS.md du projet](../../AGENTS.md) que toute modification des tests CI/CD de Showcase Immobilier doit mettre à jour `TEST.md` dans le même changement.
- Documenter les commandes, leurs paramètres, leurs prérequis et leurs résultats attendus dans `TEST.md`. Le [guide des contrôles](../../docs/controles/executer-controles.md#commandes-manuelles) renvoie vers la procédure de reconstitution.
- Remplacer l’ancienne cible dans `TEST.md` par `make third-party-tests-sonar` en tant qu’analyse manuelle facultative, à lancer séparément de la suite complète. Renvoyer au [guide SonarQube Cloud](../../docs/3.application/sonarqube-cloud.md#analyse-réelle) pour les prérequis et la vérification du traitement distant.

Le périmètre est documentaire. Les workflows et les contrôles automatisés sont hors périmètre.

## Critères observables à l’analyse

- La règle figure dans `AGENTS.md` et renvoie vers `TEST.md`.
- La revue de PR constate une mise à jour de `TEST.md` dans le même diff que les changements de tests CI/CD. Elle vérifie la concordance des commandes, paramètres, prérequis et résultats attendus avec les tests modifiés.
- `TEST.md` présente la cible Make existante de SonarQube hors du bloc de la suite complète et renvoie au guide en vigueur.

## Analyse

Le vérificateur a refusé l’ancienne cible rendue active dans un bloc Bash. Il a accepté la recette avec cette cible commentée et une variante dont une commande valide avait été retirée. La comparaison du diff et de la recette en revue de PR couvre ces écarts de contenu.

## Verdict humain

Le 26 novembre 2026, l’humain a répondu « validé » pour [OPS-099](../tasks/OPS-099-maintenir-test-md.md#verdict-humain), unique carte de la demande, sur le contenu du commit `2d9f85a6009640ad361dcbfb78e0f9032ce19306`.

## Reconstitution

Branche `demands/DEM-027` reconstituée dans son espace documentaire depuis `develop` vérifié à `af673dae1a23267b33918a732fab505c1a5c917f`. Les deux commits du journal sont repris sur la base intégrant DEM-026. Le lien vers le guide des contrôles suit son déplacement.

| Portée | SHA source | SHA obtenu |
| --- | --- | --- |
| Cadrage | `3c9573d1a8076892b49b440b57d7c75a1f9ea79b` | `39c968f52765ecd0d7c5c65b886bc49206d1f94c` |
| Journal du verdict | `a586c62aee5ac9960d0031a807a26168acfd129a` | `a5278d96266d12dfeabe5e567516f54e36e37ad6` |
| OPS-099 | `2d9f85a6009640ad361dcbfb78e0f9032ce19306` | `3f835f02e9ed540076996cae47d4cd806473dc12` |
| Verdict dans la carte | `715c3a56fd0684babe0a15d8de6b94737078e363` | `2fe6adb86d695a25b6ba45bcdc53796d67b86951` |

Le diff confirme que `AGENTS.md`, `TEST.md` et la carte reconstituée correspondent au résultat validé sur DevOps. Les 29 commandes de la suite manuelle de `TEST.md` attendent le résultat humain sur le HEAD reconstitué. SonarQube reste une analyse manuelle facultative.

`git diff --check`, `make conventions-tests-docs` et `make conventions-tests-devbook` avec la base de reconstitution réussissent.

## Déclaration de contribution

```contribution-json
{
  "version": 1,
  "corrections": [],
  "accompagnements": [
    {
      "chemins": ["AGENTS.md", "TEST.md"],
      "motif": "Inscrire la règle de mise à jour de la recette et corriger l’entrée SonarQube."
    }
  ],
  "sans_correction": "sans correction de code : mise à jour documentaire de la règle et de la recette"
}
```
