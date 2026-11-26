# Nginx local

> Préparer les piles serveur locales et distinguer les vérifications de configuration des tests HTTP isolés.

Les [conventions d’infrastructure](../../infra/README.md#conventions-techniques) définissent les exigences de routage et de vérification.

## Configuration des hôtes

Le gabarit `infra/nginx/vhost.conf` est rendu au démarrage par `19-local-vhosts.sh`. Une valeur vide de `AIDE_LAYER` sélectionne le principal ; les valeurs `web`, `bff`, `domaine` et `devops` sélectionnent leurs piles. La lane Dashboard possède sa composition de développement séparée.

Le rendu utilise les variables des hôtes et de la correspondance Dashboard ; les expressions Nginx sont conservées. Compose calcule les URL SSR depuis `AIDE_LAYER` et `PUBLIC_PORT`, indépendamment des valeurs `SITE_URL` et `PUBLIC_HOST` d’un fichier `.env`. Les [accès par pile](../2.architecture/14.site-layers.md#construire-et-déployer) permettent de choisir les URL et ports adaptés.

## Vérifications de configuration et tests HTTP

Depuis la racine, lancer `python3 infra/nginx/test-local-vhosts.py`. Docker et l’image `nginx:1.27-alpine` sont nécessaires. Le script examine les cinq configurations Compose, les syntaxes Nginx et le refus d’une couche inconnue, sans lire les fichiers `.env`. Ce résultat ne prouve pas les réponses HTTP des cinq piles SSR actives.

Ajouter `--showcase-image <image-locale> --client2-image <image-locale>` pour tester les réponses HTTP de la pile DevOps sur un port temporaire : identités SSR, noms avec port et refus des hôtes non autorisés. Les images sont fournies par l’appelant, sans reconstruction implicite. Le test crée puis supprime ses seuls conteneurs et réseau ; aucun volume utilisateur ni API externe n’est utilisé.

## Activer le Dashboard serveur

L’extension `infra/docker/docker-compose.dashboard.yml` active le service et le domaine `dashboard.<suffixe>.localhost` sur le port public de la pile, avec ses données privées séparées. Préparer le volume publié selon la [procédure de projection](../3.application/scripts-application.md#projection-publiée-saas--client-2).

Depuis la racine, lancer `make dev-dashboard-ssr BUILD=1`, puis `make dev-check-dashboard-ssr`. Dans une couche, utiliser son environnement et son port isolés. Les commandes à deux sites restent disponibles sans réécriture des fichiers `.env` par l’extension.

`make dev-build-dashboard-ssr` construit uniquement le Dashboard. Sa sortie dédiée est normalisée vers `/app/.output` dans le stage Docker, sans modifier les sources de la layer.

Pour vérifier l’extension dans les cinq piles, lancer `python3 infra/nginx/test-local-vhosts.py --dashboard`. Fournir les trois options `--showcase-image`, `--client2-image` et `--dashboard-image` pour les tests HTTP isolés avec images locales. Une activation invalide est refusée avant démarrage.

Les endpoints SaaS et la synchronisation des articles sont des dépendances distinctes ; l’accès à l’interface ne simule pas leur réussite. Le [document d’utilisation SaaS](dashboard-saas.md) précise les parcours et leurs limites.

## Développement du Dashboard

La composition de développement utilise `infra/nginx/dashboard-dev.conf.template`, rendu par l’entrée standard de l’image Nginx. Le filtre de substitution retient uniquement `DASHBOARD_HOST`, pour préserver les variables proxy et WebSocket. Les ressources Nuxt ne reçoivent pas de cache immutable et les hôtes étrangers sont refusés en HTTP 421.

Les [commandes des worktrees](worktrees.md) décrivent le démarrage et les services isolés de cette lane.
