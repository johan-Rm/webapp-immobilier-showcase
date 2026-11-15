# Plugins communs

## Rôle et responsabilités

- Initialiser les **fonctionnalités transverses** nécessaires au rendu et à la navigation.
- Mettre à disposition les **services injectés**, les **directives** et les **réactions aux événements du cycle de vie** nécessaires à l’application.
- Limiter l’initialisation au **contexte serveur ou navigateur concerné**, en préservant l’isolation des utilisateurs.

## Conventions techniques

### Portée d’exécution

Le plugin définit explicitement son exécution **sur le serveur, dans le navigateur ou dans les deux contextes**.

- Réserver les accès au DOM et aux API du navigateur au contexte client.
- Créer les états et services liés à un utilisateur dans le contexte de son instance d’application.
- Déclarer les dépendances d’initialisation entre plugins lorsqu’un ordre est nécessaire.
- Prévoir le nettoyage des ressources et abonnements lorsque leur cycle de vie le nécessite.
