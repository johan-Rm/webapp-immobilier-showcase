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
