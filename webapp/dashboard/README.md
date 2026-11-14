# Dashboard SaaS

## Rôle et responsabilités

Layer d’administration indépendante, sélectionnée par `GD_TARGET=dashboard`.
Composition et sorties : [scripts](../scripts/README.md). Les conventions frontend
restent celles de [l’application](../sites/showcase-immobilier/app/README.md).

L’interface consomme le contrat BFF préparé par OPS-010 ; ses modèles de vue sont définis
dans `app/composables/useDashboardAccess.ts`. Les endpoints absents sont signalés comme
indisponibles : aucune session ou autorisation fictive en fonctionnement normal.
Les tests navigateur simulent les réponses BFF pour vérifier les interactions indépendamment
de Symfony. La sécurité réelle reste une responsabilité du BFF et de l’API.

## Conventions techniques

Textes dans `i18n/locales/fr.json`, état et appels dans les composables ; les composants
présentent les données. Les rubriques non réalisées restent affichées et indisponibles.
Les preuves de raccordement réel aux accès attendent BFF-002 et OPS-013.

Le thème local (`app/assets/css/main.css`, `app/app.config.ts`) applique la
[charte Graines Digitales](<../../resources/design/Brand Guidelines - Graines Digitales (standalone).html>)
sans modifier les thèmes clients. `DashboardBrand` importe directement le pictogramme
source, sans copie du SVG. Rationale pour les titres et Inter pour les textes sont
hébergées dans `app/assets/fonts/`, avec leurs licences OFL ; elles proviennent de
[Google Fonts](https://github.com/google/fonts/tree/main/ofl).
Le sélecteur de l’en-tête connecté propose Clair, Sombre et Automatique (par défaut).
Le choix est mémorisé dans ce navigateur par le color mode Nuxt UI existant ;
Automatique suit le système, avec repli clair. Il s’applique à tout l’espace connecté.
Les tokens sémantiques couvrent aussi le mode sombre et les états des composants Nuxt UI.
Les couleurs de statut restent distinctes, avec des messages textuels ; les actions
principales emploient un olive foncé sur clair pour préserver le contraste.

Les contrôles frontend découvrent cette application via Git, même quand une autre
cible est active. Les alias de types restent locaux à `dashboard/app/`.
L'exception temporaire DEM-007 ne couvre que les sections manquantes (règle 1)
des 18 contenus référencés dans les `temporaryExceptions` des
[règles](../../codebase-integrity/domaines/qualite-code/regles.yaml).
Chemin, SHA-256 et liste des sections doivent correspondre exactement ; chaque
usage est affiché. Un contenu modifié ou un nouveau fichier reste contrôlé, et
l'ordre des sections comme toutes les autres règles restent actifs. Un fichier
corrigé ne consomme plus l'exception ; aucune extension automatique n'est autorisée.
Le [guide](../../docs/2.architecture/6.script-setup-standard.md) permet l'omission
de blocs inutiles tandis que le contrôle exige douze sections : cette divergence
reste à arbitrer globalement ; cette tolérance locale ne la tranche pas.
