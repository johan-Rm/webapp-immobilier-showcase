# Ressources graphiques communes

## Rôle et responsabilités

- Regrouper les **styles, polices et ressources graphiques** nécessitant un traitement lors de la compilation.
- Définir les **thèmes, la typographie et les transitions partagés**.
- Distinguer ces ressources des **fichiers publics servis sans transformation**.

## Conventions techniques

### Chargement des ressources

Le chargement des ressources graphiques reste **maîtrisé sans dépendance à un CDN tiers**.

- Utiliser un **point d’entrée CSS unique** dont dérivent les styles de l’application.
- Réserver le traitement de build aux ressources qui nécessitent transformation, optimisation ou empreinte de compilation.
