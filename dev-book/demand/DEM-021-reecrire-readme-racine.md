# DEM-021 — Réécrire le README racine

- Type : développement
- Date : 2026-11-22.
- État : validée humainement et reconstituée ; livraison en attente.
- Session de création : `01a20297-2846-7532-a284-d2b995cbbc41`.

## Besoin et contexte

Fournir aux personnes qui consultent le dépôt une présentation concise du projet, de son organisation et des références nécessaires à l’installation et aux vérifications. Le README actuel mentionne Essaouira et contient une section consacrée à un futur projet que l’humain souhaite retirer.

## Résultat attendu

Réécrire le README racine selon le contenu retenu ci-dessous. Remplacer les deux liens relatifs par des URL absolues GitHub vers les mêmes documents, et vérifier leur destination.

```markdown
# Showcase Immobilier

Application de démonstration immobilière permettant de présenter un catalogue
de biens et de faciliter la prise de contact. Elle utilise Nuxt, Vue, TypeScript
et Bun, avec rendu côté serveur et prise en charge du français, de l’anglais
et de l’espagnol.

## Organisation du dépôt

- `webapp/` : application, sites clients, tests et données de démonstration.
- `infra/` : infrastructure locale, configuration Docker, Nginx et Make.
- `codebase-integrity/` : conventions techniques et contrôles du projet.
- `docs/` : documentation du projet.
- `dev-book/` : demandes, cartes et suivi des travaux.
- `resources/` : ressources du projet, notamment les éléments de design.
- `worktree/` : espaces de travail associés aux couches.
- `.github/` : automatisations GitHub.
- `Makefile` : point d’entrée des commandes du projet.

## Installation locale

Les prérequis, la configuration de l’environnement et les étapes de démarrage
sont décrits dans le guide d’installation locale.

## Vérifications

Les conventions et les contrôles sont présentés dans Codebase Integrity.
```

Les deux références du dernier paragraphe de chaque section sont des liens absolus GitHub, conformément à la décision humaine ; leur libellé reste celui de la version retenue.

## Critères d’acceptation

- Le README reprend le contenu retenu, sans occurrence d’Essaouira ni chapitre « Configuration d’un futur projet ».
- Les liens vers le guide d’installation et Codebase Integrity utilisent des URL absolues GitHub et leurs destinations sont vérifiées.
- Le diff est relu ; aucun test applicatif lourd n’est requis pour ce changement documentaire.

## Périmètre et exclusions

La contribution concerne le README racine. Elle ne modifie ni l’application, ni les autres occurrences d’Essaouira, ni les conventions ou contrôles. La référence communautaire standard-readme a été consultée sans exigence de conformité stricte.

## Questions ouvertes

Aucune à l’issue du cadrage confirmé.

## Tâches

À renseigner lors du découpage.

## Analyse et découpage — 2026-11-22

Une tâche documentaire unique couvre la réécriture du README racine, les deux liens absolus et la vérification du diff. Elle relève de la couche par défaut DevOps (`layers/devops`, `worktree/devops`). Aucune dépendance de réalisation à une autre tâche de DEM-021. La reconstitution utilisera ultérieurement `demands/DEM-021` depuis `develop` vérifié.

| Tâche | Couche | Dépendance | État |
| --- | --- | --- | --- |
| Réécrire et vérifier le README racine | DevOps | Disponibilité de la couche | Carte non créée : couche occupée par DEM-017 |

La branche DevOps est propre au contrôle du 2026-11-22, mais comporte les commits OPS-045 et OPS-046 de DEM-017, non intégrés à `develop` local. Sa propreté ne vaut pas disponibilité ; aucune carte ni branche de demande n’est créée. Les contrôles attendus sont la relecture du texte et du diff, ainsi que la vérification des liens ; aucun test applicatif lourd. La destination GitHub doit être vérifiée au moment de l’implémentation.

## Correction du constat et matrice actualisée — 2026-11-22

Le constat précédent assimilait à tort des commits en attente de vérification à une occupation de la couche. Leur présence seule ne démontre pas une occupation ; la reconstitution sélectionnera les commits validés de DEM-021.

| Carte | Couche | Dépendance de réalisation | État |
| --- | --- | --- | --- |
| [OPS-085 — Réécrire le README racine](../tasks/OPS-085-reecrire-readme-racine.md) | DevOps | Aucune | Validée et reconstituée |

## Implémentation

OPS-085 : commit local `d6810c9` sur `layers/devops`, à vérifier humainement. Les deux destinations GitHub sur `develop` sont accessibles via le connecteur ; contrôle du contenu et `git diff --check` réussis. Aucun test applicatif lourd.

## Verdict humain — 2026-11-22

L’humain a répondu « validé » à la présentation de la demande complète et de la carte OPS-085, pour le commit `d6810c99e6cb8e74a74f7f60b8643dac86840fff`. Les limites présentées comprennent l’absence de tests applicatifs lourds. Verdict tracé dans la carte par le commit source `0de33fd5ba12029544e9bfee6ae4a29e385f11ac`.

## Reconstitution

Base locale : `3a146b39330c2e5c78e30f855ab5e1c955aeec6f` ; branche `demands/DEM-021`. Retour prévu du principal sur `develop` après intégration.

| Objet | Commit source | Commit reconstitué |
| --- | --- | --- |
| OPS-085 | `d6810c99e6cb8e74a74f7f60b8643dac86840fff` | `89692bf2b587554f4bc968d184dc33c64ad97ec0` |
| Verdict | `0de33fd5ba12029544e9bfee6ae4a29e385f11ac` | `75abe287956e2b041cc20942dbbd8f817fa36f56` |
