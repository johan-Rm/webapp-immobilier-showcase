# Dev-book

## Rôle et responsabilités

- **Formaliser les besoins et décisions** dans les demandes.
- **Décrire l’affectation des cartes** et conserver leurs preuves de vérification et verdicts humains.
- Fournir les **structures de rédaction** des demandes et des cartes.
- **Conserver les ressources de suivi** et les traces des opérations exceptionnelles.

## Conventions techniques

### Boucles de travail

Les demandes et les cartes suivent la **boucle de travail applicable** et les règles du projet.

- Appliquer le **skill correspondant à l’étape demandée**.
- Distinguer les demandes de **développement** et de **consolidation**.

### Préservation des traces

Le dev-book conserve l’**historique des décisions**, les **preuves** et les **verdicts humains** dans les demandes, cartes et rapports ; ses README définissent uniquement les responsabilités et conventions durables.

- Conserver les tâches et leurs preuves **sans renommage rétroactif**.
- Identifier les **révisions et versions examinées** dans les traces pour rattacher chaque verdict au contenu concerné.
- Consigner les décisions dans un **verdict structuré** indiquant sa portée et une référence Git complète ou une empreinte du fichier de preuve ; un verdict absent reste explicitement en attente.
- Préserver les décisions successives et leur contexte sans les présenter comme simultanément applicables.
- Utiliser **Git pour conserver les versions des fichiers**, sans recopier leur contenu à chaque révision dans le dev-book.

### Usage des modèles

Un **modèle** sert à préparer une demande ou une carte ; il ne constitue **ni une demande réelle ni un verdict**.

- Remplacer les **champs à renseigner** par des valeurs vérifiées.
- Prévoir la **déclaration structurée de contribution** pour une demande de consolidation.

### Identification des missions

Chaque mission porte les informations nécessaires pour identifier son **contexte réel**, son **affectation** et son **périmètre**.

- Indiquer la **session réelle**, le **worktree** et la **branche**.
- Préciser le **périmètre autorisé** et les **dépendances**.
- Pour une nouvelle carte, rattacher la **demande**, la **couche technique**, la branche descriptive et le worktree de cette demande. Les cartes historiques conservent leur contexte.

### Procédures opérationnelles exceptionnelles

Une **procédure opérationnelle exceptionnelle**, ou **runbook**, décrit une opération ponctuelle de maintenance, migration manuelle ou récupération, à exécuter de façon **contrôlée, traçable et reproductible**.

- Nommer chaque procédure selon le format **AAAA-MM-JJ-action-cible.md** : date, verbe d’action explicite et système ou donnée concernée.
- Associer la procédure aux **commits qui rendent l’opération nécessaire** ; ces changements référencent à leur tour la procédure.
- Conserver les procédures dans le dev-book **sans les substituer aux cartes de travail**.
