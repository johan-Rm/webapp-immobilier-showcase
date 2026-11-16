# Worktrees de couche

## Rôle et responsabilités

- Isoler les fichiers et la branche de chaque mission affectée.
- Préserver le travail existant et rendre l’affectation **claire et concise**.

## Conventions techniques

### Affectation et base

Un worktree est créé pour une mission affectée, depuis une base Git explicite. Une branche déjà utilisée est réutilisée ; un chemin occupé ou étranger est refusé. Un arbre propre ne prouve pas la disponibilité de la couche.

### Isolation des environnements

Les ports, noms de projets, volumes, caches et données sont propres à chaque couche. Git seul n’isole pas une API externe. Aucun service ni secret n’est copié ou démarré implicitement ; une relance préserve les fichiers locaux.

### Préservation des missions

Un seul écrivain utilise chaque couche. Une reprise conserve seulement ses changements identifiés, sans nettoyer le travail étranger. Les dépendances entre missions sont échangées par commits identifiés.
