# Vérifier les traces du dev-book

> Contrôler les cartes modifiées et les références de verdict sans transformer une vérification syntaxique en validation humaine.

## Couverture et commande

Les [conventions du dev-book](../dev-book/README.md#préservation-des-traces) définissent la règle. Le contrôle des demandes existant vérifie déjà leur type ; le contrôle des contributions vérifie les commits et leur déclaration. Le script complémentaire `check_devbook.py` examine les cartes nouvelles ou modifiées du worktree par rapport à une base Git explicite, y compris les modifications indexées et les fichiers non suivis non ignorés. Les cartes inchangées ne sont pas réinterprétées.

Depuis la racine du worktree, lancer `make devbook-check BASE=<sha-complet>`, après avoir vérifié le SHA de comparaison. Une base absente, inconnue ou abrégée est refusée. Le script ne fait aucun fetch et ne modifie ni carte ni historique Git.

`make aide-check` exécute les tests Python de ce vérificateur. Le contrôle réel des traces reste une commande distincte, car il exige un choix explicite de base ; son absence d’exécution n’établit aucune conformité des traces.

## Utiliser les modèles

Les structures de départ sont le [modèle de demande](../dev-book/templates/demande.md) et le [modèle de carte](../dev-book/templates/carte.md). Les [conventions d’usage](../dev-book/README.md#usage-des-modèles) sont définies dans le README parent. Pour une demande de consolidation, ajouter un bloc `contribution-json` selon les [conventions de contribution](../codebase-integrity/README.md#contributions).

## Identification des missions

Le script recherche hors des exemples les métadonnées de la carte : session de création au format UUID, branche de couche ou de demande, worktree, périmètre autorisé et dépendances. Une valeur absente ou un placeholder non conforme est refusé. La présence de ces champs ne prouve ni la disponibilité de la couche ni la véracité des valeurs déclarées ; cette vérification reste humaine.

## Verdicts structurés

La rubrique `Verdict humain` est unique. Une carte sans décision porte une mention explicite d’attente ou d’absence de verdict. Lorsqu’une décision est consignée, utiliser un bloc `verdict-json` dans cette rubrique :

```json
{
  "decision": "validé",
  "portee": "Description précise des changements examinés",
  "contenu": {
    "type": "git",
    "valeur": "SHA complet du commit examiné"
  }
}
```

Les décisions reconnues sont `validé`, `ajusté`, `différé` et `rejeté`. La portée est obligatoire. Une référence Git doit désigner un commit existant avec son SHA complet.

Pour un contenu non commité, utiliser une référence de type `sha256` : `valeur` contient les 64 caractères hexadécimaux de l’empreinte et `fichier` désigne le fichier de preuve, relatif au dépôt. Le script recalcule l’empreinte du fichier ; les sorties du dépôt et liens symboliques sont refusés. Un manifeste peut identifier les fichiers examinés, mais ce contrôle ne compare pas automatiquement les empreintes internes de chaque fichier listé dans ce manifeste.

Le bloc ne doit être renseigné qu’après un **verdict réellement exprimé**. Sa présence et la validité de sa référence ne prouvent ni l’accord de l’humain ni l’adéquation du contenu à la portée déclarée. Aucune décision n’est déduite d’un texte libre ambigu.

## Suppressions et renommages

La comparaison avec la base signale une carte supprimée ou renommée comme un écart nécessitant un arbitrage explicite. Elle ne permet aucune suppression automatique et ne possède pas d’option de contournement. Une évolution légitime de cette politique doit suivre une consolidation ; le script ne sait pas reconnaître un accord humain dans du texte libre.

La conservation de toutes les formulations successives, la pertinence des preuves et l’absence de copies inutiles demandent une relecture humaine. Le script ne prétend pas vérifier ces propriétés sémantiques.

## Procédures opérationnelles exceptionnelles

Le dossier `dev-book/runbooks/` conserve les procédures ponctuelles. Leurs [conventions](../dev-book/README.md#procédures-opérationnelles-exceptionnelles) définissent leur rôle et leur nommage.

Le format `YYYY-MM-DD-action-cible.md` permet un tri chronologique et identifie l’action et sa cible. Les verbes `migrate`, `backfill`, `purge` ou `reindex` précisent la nature de l’opération. Une migration de table et une reconstruction d’index doivent donc être identifiées par des actions et cibles explicites.

Dans le message du commit concerné, une mention `[runbook: <nom-sans-extension>]` identifie la procédure. Dans celle-ci, un champ `Commit : <SHA vérifié>` permet de retrouver le changement associé. Ces indications sont des formats à renseigner avec des références réelles, pas des traces d’opération exécutée.
