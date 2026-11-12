# Nginx local

## Rôle et responsabilités

Servir les builds SSR de la pile locale ; les domaines distants sont hors de ce dossier.
Les accès utilisateur sont décrits dans le [guide des sites](../../docs/2.architecture/14.site-layers.md).

## Conventions techniques

`vhost.conf` est un gabarit rendu au démarrage par `19-local-vhosts.sh`.
AIDE_LAYER vide désigne le principal ; web, bff, domaine et devops désignent les
couches existantes. Une valeur inconnue empêche le démarrage. Aucun .env n’est réécrit.
Seules les variables des hôtes et de la correspondance dashboard sont substituées ; les variables Nginx sont conservées.
Les autres noms d’hôte reçoivent HTTP 421, sans redirection.

Compose calcule les URL SSR depuis AIDE_LAYER et PUBLIC_PORT, indépendamment des
anciennes valeurs SITE_URL/PUBLIC_HOST du .env. Les commandes Make et Compose directes
utilisent la même configuration. Les sondes Nuxt internes et le développement direct
conservent leur accès sans passer par Nginx.

Depuis la racine : `python3 infra/nginx/test-local-vhosts.py` vérifie les cinq
configurations Compose sans lire les .env, les syntaxes Nginx et le refus d’une
couche inconnue. Docker et l’image nginx:1.27-alpine sont nécessaires.
Ce contrôle ne prouve pas les réponses HTTP des cinq piles SSR.

Ajouter `--showcase-image <image-locale> --client2-image <image-locale>` pour un
smoke HTTP de la pile DevOps sur un port temporaire : identités SSR, noms avec
port et refus des hôtes non autorisés. Le test crée puis supprime ses seuls
conteneurs et réseau, sans volume utilisateur ni accès à l’API externe. Il ne
reconstruit pas les images fournies.

L’extension `infra/docker/docker-compose.dashboard.yml` active le service et le domaine
`dashboard.<suffixe>.localhost` sur le même port public, avec ses données séparées.
Depuis la racine : `make dev-dashboard-ssr BUILD=1`, puis
`make dev-check-dashboard-ssr`. Dans une couche, utiliser son `.env` et son port isolés.
Les commandes historiques gardent leurs deux sites ; aucun `.env` n’est réécrit par l’extension.
`make dev-build-dashboard-ssr` construit le seul dashboard ; sa sortie dédiée est normalisée
vers `/app/.output` uniquement dans le stage Docker, sans modifier les sources de la layer.

`python3 infra/nginx/test-local-vhosts.py --dashboard` vérifie l’extension dans les cinq piles.
Ajouter les trois options `--showcase-image`, `--client2-image`, `--dashboard-image` pour
le smoke HTTP isolé avec images locales. L’activation invalide est refusée avant démarrage.
Ce service expose l’interface disponible ; les endpoints SaaS et la synchronisation des
articles restent des dépendances distinctes, sans succès de connexion simulé.
