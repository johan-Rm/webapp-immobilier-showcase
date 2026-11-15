# Middlewares communs

## Rôle et responsabilités

- Vérifier les **conditions nécessaires à l’accès à une route**.
- **Autoriser, rediriger ou interrompre** la navigation selon ces conditions.
- Appliquer les **règles d’accès côté navigation** et la **normalisation des URL**, sans remplacer les contrôles d’autorisation du serveur.

## Conventions techniques

### Garde de navigation

Le middleware reste centré sur la **décision de navigation** et délègue les règles métier aux services dédiés.

- Privilégier les données déjà disponibles ; limiter les chargements aux informations indispensables à cette décision.
- Distinguer les middlewares **globaux** de ceux associés explicitement à une route.
- Préserver le fonctionnement au **premier rendu serveur** et lors des **navigations dans le navigateur**.
- Éviter les boucles de redirection et les effets répétés lors d’exécutions successives.
