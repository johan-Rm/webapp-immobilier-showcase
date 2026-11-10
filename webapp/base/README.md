# Catalogue de layers

## Rôle et responsabilités

Accueillir les layers explicitement étendues par les sites. La racine Nuxt choisit
l’application du client ; elle n’étend pas ce dossier globalement.

## Conventions techniques

Une layer métier déclare ses sources dans sa propre configuration ; elle ne doit
pas sélectionner implicitement l’application d’un client. Le catalogue immobilier
prévu dans `real-estate/` reste dépendant de Showcase pour ses composants de support.
Voir [la composition des layers](../../docs/2.architecture/14.site-layers.md).
