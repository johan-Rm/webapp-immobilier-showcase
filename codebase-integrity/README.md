# Codebase Integrity

## Rôle et responsabilités

- **Contrôler les conventions techniques**, les contributions et leurs traces.
- **Sécuriser la préparation des worktrees et des environnements isolés**.
- **Vérifier la fiabilité des contrôles** avec des cas conformes et non conformes, sans altérer le dépôt utilisateur.

## Conventions techniques

### Contributions

Les contributions respectent leur **boucle de travail**, leur **périmètre** et la **traçabilité des validations**.

- **Branches** : l’intégration utilise `develop` et la production `master`. Toute contribution utilise une branche dédiée.
- **Type de demande** : chaque demande déclare un seul type, `développement` ou `consolidation`.
- **Traçabilité des commits** : une carte validée produit un commit `type(CARTE-NNN): résultat`, avec `Demande : DEM-NNN` dans le corps. Le scope `DEM-NNN` est réservé aux traces documentaires de type `docs`.
- **Protection des contrôles** : une contribution de développement ne modifie pas l’outillage Codebase Integrity. Les modifications des conventions et des contrôles passent par une consolidation.
- **Déclaration de consolidation** : chaque chemin modifié est associé à sa convention et à un contrôle ajouté ou modifié. Les accompagnements sont justifiés séparément ; seules les demandes et cartes référencées sont exemptées de cette déclaration.
- **Plage vérifiée** : la plage de commits est explicite. Les commits antérieurs hors plage ne sont pas contrôlés rétroactivement ; les commits de fusion sont refusés dans la contribution.
- **Indépendance du vérificateur** : le contrôle local de contribution utilise le vérificateur extrait de la base d’intégration, jamais celui proposé par la contribution candidate.
- **Intégrité des résultats** : ne pas modifier un contrôle pour contourner un échec. Une réussite technique ne vaut pas validation humaine.

### Worktrees et environnements

Chaque mission utilise une **couche disponible** et un **environnement isolé**, sans altérer le travail existant.

- **Affectation** : les couches et leurs préfixes de cartes sont déclarés dans la configuration du projet ; leurs identifiants restent stables. Le routage retient le chemin correspondant le plus long : un test dédié à une couche prime sur le dossier général d’une autre couche.
- **Disponibilité** : un seul intervenant écrit dans une couche à la fois. Vérifier les affectations dans les cartes ; un état Git propre ne suffit pas à établir la disponibilité.
- **Création** : créer un worktree uniquement sur affectation, depuis une base explicite, sans récupération distante Git, démarrage de service ni copie de secrets.
- **Destination** : réutiliser la branche déjà extraite dans son worktree ; refuser les destinations étrangères, les liens symboliques et les chemins non enregistrés avant toute écriture.
- **Isolation** : chaque environnement possède ses ports, noms Compose, caches, contenus, médias et données. Une relance préserve les fichiers locaux.
- **Protection des données** : refuser les destinations de données situées hors du worktree ainsi que les liens symboliques dans ces destinations.
- **API externe** : Git n’isole pas une API Symfony externe. Son accès en écriture exige une affectation explicite et un projet de test dédié.
- **Fiabilité des tests** : tester l’outillage dans des dépôts temporaires ; ne jamais réinitialiser le dépôt utilisateur pour un test.

### Contrôles existants

Les contrôles appliquent les **conventions techniques des README applicatifs** sur un périmètre explicite, indépendamment de la cible exécutée.

- **Organisation** : regrouper les vérificateurs et leurs tests par domaine, sans duplication.
- **Couverture** : découvrir les fichiers Git des applications publiques, du Dashboard et du catalogue partagé, y compris les clients inactifs.
- **Périmètres distincts** : distinguer les composants, pages, layouts et composables pour appliquer les règles à leur contexte.
- **Exceptions bornées** : limiter l’exception du composant image à sa position autorisée à la racine d’une application. Un composant homonyme ailleurs reste contrôlé.
- **Résolution des types** : résoudre les alias dans l’application du fichier ; utiliser l’application consommatrice désignée pour le catalogue partagé.
- **Base de création** : refuser la création d’un worktree si la base ne contient pas les fichiers requis par la configuration des couches.

### Classement des conventions

Le **registre central** classe les conventions et décrit leurs contrôles, sans recopier les règles définies dans les README.

- **Domaine unique** : chaque convention recensée appartient à un seul domaine.
- **Source de référence** : chaque entrée du registre identifie le chapitre « Conventions techniques » du README qui définit la règle.
- **Description des contrôles** : le registre indique leurs points de contrôle, leur état (`implémenté` ou `à implémenter`), leur mode et leurs limites.
- **Résultats observés** : la présence d’un contrôle ne prouve pas que la convention est respectée. Les cartes conservent les résultats des vérifications exécutées.
- **Relecture humaine** : une détection nécessitant un jugement humain est explicitement signalée comme telle ; une réussite technique ne vaut pas validation humaine.
- **Limite de couverture** : l’absence d’entrée pour un domaine ne prouve pas sa conformité. Le registre ne garantit pas un inventaire exhaustif des conventions.
- **Évolution** : toute modification des règles, de leur classement ou de leurs contrôles passe par une consolidation.

### Organisation

Les **vérificateurs**, leurs **tests** et leurs **paramètres** sont regroupés par domaine pour conserver une responsabilité claire.

- Créer un dossier de domaine uniquement lorsqu’il porte des contrôles ; ne pas ajouter de README dans les sous-dossiers techniques de ces domaines.
- Regrouper les **utilitaires partagés** séparément des règles propres à un domaine.
- Conserver les **tests des fonctionnalités applicatives** dans la couche applicative, distinctement des tests des vérificateurs.

### Exécution des contrôles

Chaque contrôle indique son **périmètre**, ses **prérequis** et ses **limites**, et produit un résultat fidèle à son exécution.

- Sélectionner explicitement la **famille de contrôle** et la **cible applicative** lorsque le contrôle les distingue.
- Séparer les tests selon leur **moteur** et leur **environnement**, notamment les tests Bun, Vitest Node et Nuxt.
- Ne jamais annoncer une réussite pour une suite **absente, vide, interrompue ou échouée**.
- Permettre de consulter la sélection de tests et les commandes **sans les exécuter ni divulguer l’environnement privé**.
- Exiger une **adresse de test explicite** et un serveur de test préparé pour les vérifications navigateur ; ne démarrer aucune pile utilisateur ni API distante implicitement.
- Utiliser des **environnements de contrôle jetables**, sans injection implicite de secrets, et reconstruire les images après modification des sources.
