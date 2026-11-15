# Dashboard SaaS

## Rôle et responsabilités

- Présenter l’administration des organisations, projets et contenus.
- Rendre les états et les actions accessibles, avec des explications **pédagogiques et concises**.
- Consommer le contrat du BFF sans remplacer ses autorisations ni celles de l’API.
- Signaler les fonctions indisponibles sans simuler de session en fonctionnement normal.

## Conventions techniques

### Présentation et état

Les composants présentent les données ; les composables portent l’état et les appels. Les textes utilisateur sont traduits. Les rubriques indisponibles restent explicitement désactivées.

### Structure sémantique

Les racines HTML stables portent leur marqueur de composant, page ou layout. Les racines de composants Vue restent exemptées sans ajout de conteneur. Les régions sémantiques stables portent un marqueur de section. Le layout porte **un unique repère principal**, autour du contenu de la route, en conservant les replis de chargement et le défilement.

### Identité visuelle

Le thème local applique la charte **Graines Digitales**, sans modifier les thèmes clients. Le pictogramme source est utilisé sans copie. Les polices **Rationale** pour les titres et **Inter** pour les textes sont hébergées localement avec leurs licences. Les icônes Lucide sont embarquées sans chargement externe.

### Thème et contraste

Le sélecteur propose **Clair**, **Sombre** et **Automatique**. Le choix est mémorisé dans le navigateur ; Automatique suit le système avec un repli clair. Les couleurs sémantiques couvrent les deux modes et les états des composants. Les statuts comportent des messages textuels et le focus clavier reste visible.

### Panneaux et actions

Les panneaux présentent un fond neutre sans bordure, un pictogramme sur fond teinté et des accents locaux. Le survol modifie légèrement la teinte sans déplacement. Hors des blocs colorés, les actions principales emploient un olive foncé sur clair. L’espace connecté utilise les fonds pour distinguer champs et panneaux ; ses fenêtres et menus suivent le même traitement sans bordures. L’authentification conserve son thème distinct.

### Vérifications isolées

Les tests simulent le contrat BFF pour vérifier les interactions indépendamment de l’API réelle ; ils ne prouvent pas sa sécurité. Les saisies sont conservées lors d’un refus et aucune publication n’est déclenchée implicitement. Les contrôles clavier sont bloquants ; les mesures automatiques d’accessibilité restent informatives. Une référence visuelle exige une **validation humaine explicite** avant de devenir bloquante et ne doit jamais être actualisée automatiquement.

### Contrôles transverses

La découverte des sources couvre également les applications inactives. Les alias de types restent locaux à l’application. Une exception de convention est limitée à des chemins, empreintes et sections explicitement déclarés ; chaque usage est signalé et aucune extension automatique n’est autorisée. Les autres règles restent actives.
