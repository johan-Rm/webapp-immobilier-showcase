# Infrastructure

## Rôle et responsabilités

- Définir les **environnements d’exécution locaux** et leurs configurations.
- Assurer le **routage HTTP local** vers les applications et leurs builds serveur.
- Fournir les **commandes et vérifications d’infrastructure** nécessaires au développement.

## Conventions techniques

### Hôtes locaux

Le routage Nginx accepte uniquement les **hôtes déclarés pour la pile sélectionnée** ; les domaines distants sont hors du périmètre des configurations locales.

- Refuser une **couche inconnue** avant le démarrage.
- Répondre **HTTP 421 sans redirection** aux hôtes non autorisés.
- Préserver les accès des **sondes internes Nuxt** et du **développement direct**, indépendamment du passage par Nginx.

### Rendu des configurations

Les gabarits Nginx sont rendus au démarrage avec une **substitution limitée aux variables autorisées**.

- Préserver les **variables propres à Nginx**, notamment celles du proxy et des WebSocket.
- Calculer les **URL des applications serveur** depuis la couche et le port public sélectionnés, sans dépendre d’anciennes valeurs d’hôte dans l’environnement local.
- Appliquer la **même configuration** aux commandes Make et aux appels directs à Compose.
- Ne pas réécrire les **fichiers d’environnement locaux**.

### Dashboard

Le Dashboard possède une **composition dédiée** ; son activation dans une pile serveur publique est explicite.

- Conserver ses **données privées séparées** des sites publics et sa projection publiée distincte de ses sessions.
- Normaliser la sortie de son build uniquement dans le **stage Docker concerné**, sans modifier les sources de son application.
- Pour le développement avec rechargement automatique, utiliser un **gabarit Nginx dédié** et ne substituer que la variable de son hôte.
- Ne pas appliquer de **cache immutable aux ressources Nuxt** de cet environnement de développement.
- Ne pas assimiler une interface accessible à une **connexion SaaS ou une synchronisation d’articles fonctionnelle**.

### Vérification des piles locales

Les vérifications distinguent la **configuration produite**, la **syntaxe Nginx** et les **réponses HTTP réellement observées**.

- Vérifier les configurations sans lire les **fichiers d’environnement privés**.
- Exécuter les tests HTTP dans des **conteneurs et réseaux temporaires**, sans volume utilisateur ni accès à l’API externe.
- Utiliser les **images locales fournies explicitement** sans les reconstruire implicitement.
- Nettoyer uniquement les ressources créées par le test et ne pas présenter un contrôle de syntaxe comme une preuve du comportement des piles actives.

### Mode test des couches

Les commandes de cycle de vie des couches distinguent les modes **développement** et **test**. Le mode test utilise des données simulées, sans lire les secrets du développement ni contacter l’API réelle.

- Isoler le conteneur par **dépôt, couche et cible**, avec un port distinct du développement.
- Réutiliser l’image disponible ; réserver sa reconstruction à une action explicite.
- Conserver les journaux des contrôles et supprimer automatiquement le conteneur de test à son arrêt.
- Préserver un serveur de test déjà actif lors d’une relance ; refuser sa reconstruction tant qu’il reste actif.
- Vérifier l’appartenance et le caractère jetable d’un ancien conteneur avant de libérer son nom ; ne jamais forcer sa suppression.
- Ne jamais arrêter ni supprimer les conteneurs des autres modes ou projets.
