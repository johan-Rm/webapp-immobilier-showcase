# Codebase Integrity

## Rôle et responsabilités

- **Contrôler les conventions techniques**, les contributions et leurs traces.
- **Sécuriser la préparation des worktrees et des environnements isolés**.
- **Vérifier la fiabilité des contrôles** avec des cas conformes et non conformes, sans altérer le dépôt utilisateur.

## Conventions techniques

### Contributions

Les contributions respectent leur **boucle de travail**, leur **périmètre** et la **traçabilité des validations**.

- **Branches** : l’intégration utilise `develop` et la production `master`. Toute contribution utilise une branche dédiée.
- **Journal des demandes** : vérifier les collisions d’identifiant et le rattachement des nouvelles cartes avant publication. Préserver les cartes historiques. Vérifier le changement effectivement intégré et conserver une archive locale avant de libérer un espace de demande.
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
- **Qualité applicative par cible** : examiner le code de la cible, le catalogue immobilier, le BFF, les services et le code partagé, même si la cible ne les utilise pas. Les scripts d’outillage sont exclus.
- **Fonctions** : signaler pour revue les fonctions de plus de 50 lignes ou de complexité supérieure à 10 ; les fonctions imbriquées comptent dans la longueur mais pas dans la complexité de leur parent.
- **Débogage** : bloquer les instructions `debugger` et signaler les journaux susceptibles de contenir des données de requête ou de réponse. Une exception est limitée à un fichier, une ligne et une empreinte ; elle indique justification, référence d’approbation humaine et date d’expiration. Une exception invalide, absente ou expirée est refusée.
- **Duplication** : signaler les fragments d’au moins 10 lignes non vides et 200 caractères, espaces normalisés, dans la cible et par comparaison aux autres. Une ressemblance demande une revue, sans imposer une mutualisation.

### Exceptions temporaires des composables

Une exception au contrôle de **taille de l’API** exige un **arbitrage humain explicite** et une demande de correction identifiée, sans modifier le seuil général.

- Borner chaque exception à un **fichier**, une **fonction**, une **empreinte SHA-256** et un **nombre exact de propriétés comptées avec certitude**.
- Indiquer une **justification** et une **date d’expiration**, valable jusqu’à la fin du jour indiqué en UTC.
- Refuser les déclarations invalides ou dupliquées, les fichiers modifiés ou absents, les écarts absents ou ambigus et les exceptions expirées.
- Afficher séparément les **exceptions**, les **avertissements** et les **erreurs** ; conserver les autres dépassements bloquants.
- Supprimer l’exception lorsque la correction est réalisée ; son existence ne prouve pas la conformité du composable.

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

- **Commandes publiques** : employer des noms anglais avec les préfixes `third-party-tests-` pour les tests et analyses des outils tiers, `conventions-tests-` pour appliquer les règles des README, `internal-tests-` pour les scénarios écrits pour le projet, dont les tests des vérificateurs, et `runtime-tests-` pour les contrôles nécessitant une application démarrée.
- **CI** : organiser les contrôles automatiques par famille visible, couvrir les cibles pertinentes avec des environnements isolés et conserver les rapports même en cas d’échec. Les mesures informatives ne masquent pas une erreur technique ; les contrôles locaux exclus de la CI restent explicites.
- **Séparation** : chaque contrôle préfixé `conventions-tests-` correspond à une convention écrite dans un README ; il ne lance pas les tests de fonctionnement des vérificateurs. Les commandes de préparation restent distinctes.
- **Présentation** : annoncer catégorie, type, objet, commande, outils et niveau dans un bandeau ; rattacher progression et résultat à la commande et à la cible. Ajouter une **description pédagogique** de ce qui est vérifié, avec une formulation positive et un périmètre précis. Afficher les sorties des outils en direct uniquement sur activation explicite, en conservant leur contexte. Conserver les journaux détaillés sur l’hôte, sans couleur, avec code de sortie fidèle.
- **Bilan** : distinguer réussites, échecs, prérequis manquants et interruptions. Ne pas inventer un total d’avertissements depuis les journaux des scénarios de test ; signaler tout décompte non consolidé.
- **Prévisualisation Sonar** : sélectionner les seuls fichiers applicatifs suivis de la cible, du catalogue immobilier, du serveur, des services et du code partagé. Exclure tests, contenus, médias, secrets et fichiers générés ; refuser les liens symboliques et une sélection vide. La copie préparée ne constitue pas à elle seule une preuve de confinement du scanner.
- **Sortie Sonar** : isoler l'accès réseau du scanner et limiter sa sortie aux destinations approuvées. Refuser les adresses locales et privées ; ne pas transmettre de secret aux contributions non fiables.

- Sélectionner explicitement la **famille de contrôle** et la **cible applicative** lorsque le contrôle les distingue.
- Séparer les tests selon leur **moteur** et leur **environnement**, notamment les tests Bun, Vitest Node et Nuxt.
- Ne jamais annoncer une réussite pour une suite **absente, vide, interrompue ou échouée**.
- Permettre de consulter la sélection de tests et les commandes **sans les exécuter ni divulguer l’environnement privé**.
- Exiger une **adresse de test explicite** et un serveur de test préparé pour les vérifications navigateur ; ne démarrer aucune pile utilisateur ni API distante implicitement.
- Utiliser `WEBAPP_BASE_URL` pour l’origine commune des contrôles navigateur, charge et Lighthouse, en tenant compte du réseau d’exécution. Configurer le port des fixtures avec `WEBAPP_TEST_PORT` et réserver le préfixe `CHECKS_` aux paramètres internes des contrôles.
- Limiter les mesures de charge SaaS aux lectures métier explicitement sélectionnées et à une origine BFF locale ; exécuter manuellement, protéger la session et exclure secrets et contenus privés des rapports. Les temps sont indicatifs et ne distinguent pas Symfony du réseau et du BFF.
- Utiliser des **environnements de contrôle jetables**, sans injection implicite de secrets, et reconstruire les images après modification des sources.

### Audit des dépendances

Les dépendances du **produit et de l’outillage**, y compris celles de développement, font l’objet d’un audit des avis de sécurité connus.

- Bloquer les avis **high et critical** non exemptés ; les niveaux inférieurs restent informatifs.
- Borner toute exception à un **paquet et un avis précis**, avec justification et échéance valide ; refuser les exceptions expirées.
- Signaler les **paquets non analysés** et refuser une analyse incomplète, un inventaire absent ou une réponse inexploitable.
- Conserver les empreintes des inventaires et les résultats sans secrets ; ne pas corriger les dépendances automatiquement.

### Graphe des dépendances des services

Le graphe contrôle l’**indépendance des services vis-à-vis des frameworks**, selon la règle déjà déclarée, sans ajouter d’interdiction générale de cycles ou de dépendances entre couches.

- Inclure les **imports explicites et les imports de types**, avec résolution des alias partagés connus.
- Afficher les **modules, dépendances et imports non résolus** ; refuser un graphe vide ou une analyse interrompue.
- Conserver le vérificateur historique tant que sa migration n’est pas éprouvée sur le périmètre déclaré.
- Distinguer les imports explicites des **auto-imports et des templates**, que ce graphe ne couvre pas.

### Mutation ciblée

La mesure pilote porte sur une **fonction pure et ses tests directs** ; la mesure étendue vise les sources compatibles de la cible et du partagé. Les deux utilisent une copie temporaire isolée. Les tests et contrats générés ne sont pas mutés.

- Refuser des tests initiaux échoués, une mesure vide, incomplète ou interrompue.
- Présenter les mutants détectés, survivants et non couverts, ainsi que les erreurs et la durée.
- Conserver le **score informatif** tant qu’aucun budget n’a été choisi après revue humaine.
- Arrêter les seuls processus possédés et préserver les sources.
- Signaler les fichiers non mesurables et les environnements non instrumentés ; ne pas les compter comme couverts. La couverture Vitest Node est informative et distingue les fichiers mesurés, non couverts et non mesurables.

### Charge locale bornée

Les mesures de charge utilisent une **origine de boucle locale explicite** et des fixtures isolées, sans écriture sur un backend réel.

- Refuser les redirections, origines étrangères et contenus inattendus.
- Borner utilisateurs, itérations, durée et processus ; arrêter les seuls conteneurs possédés.
- Bloquer les erreurs fonctionnelles et d’exécution ; présenter les latences et le matériel sans engagement de capacité de production.
- Choisir les budgets de latence seulement après examen humain des mesures.

### Mesures Lighthouse

Les audits portent sur les **vraies pages SSR de test**, avec contrôle de l’URL finale et du contenu réellement rendu. Les pages privées utilisent des sessions fictives isolées.

- Verrouiller les versions du navigateur et de Lighthouse ; refuser toute erreur d’exécution, catégorie ou mesure absente.
- Réaliser trois observations par route et profil, conserver les rapports bruts et présenter les médianes avec les conditions de mesure.
- Conserver les **scores informatifs** jusqu’au choix explicite de budgets par l’humain.
- Préserver les rapports et arrêter uniquement les processus possédés.
