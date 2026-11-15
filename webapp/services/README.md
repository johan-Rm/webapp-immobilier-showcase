# Services métier

## Rôle et responsabilités

- Porter la logique métier réutilisable, les transformations et les échanges avec les backends.
- Recevoir les entrées explicitement et produire les données consommées par les autres couches.
- Rendre les contrats **pédagogiques et concis**, testables hors du runtime de rendu.

## Conventions techniques

### Zéro dépendance framework

Les services n’importent aucune primitive Vue, Nuxt, Pinia ou d’auto-import du framework. La réactivité et les stores appartiennent aux composables et aux pages.

### Frontière de la couche

Un service ne lit pas d’état global et ne déclenche aucun effet de rendu. L’appelant injecte les dépendances à un contexte d’exécution.

### Placement des types

Un type partagé entre plusieurs fichiers appartient à l’espace des types partagés. Un type local non exporté reste auprès de son utilisateur.

### Contrats consommés

Les entrées sont validées strictement, avec séparation des projets et des états brouillon et publié. Les fixtures vérifient le contrat consommateur local ; elles ne démontrent pas la compatibilité d’une instance d’API distante.
