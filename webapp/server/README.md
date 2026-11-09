# server/

Couche serveur de l'application (Nitro).

## Rôle et responsabilités

**Rôle Nitro :** le dossier `server/` enregistre les routes et handlers exécutés par le
moteur Nitro — routes API (`api/`), routes sans préfixe (`routes/`), middlewares et
utilitaires serveur. Chaque handler est un `defineEventHandler` ; l'arborescence des
fichiers reflète les URLs exposées. Réf. : [doc Nuxt — `server/`](https://nuxt.com/docs/4.x/directory-structure/server).

**Rôle attendu :** `server/` est le BFF (Backend for Frontend) qui s'interpose entre le
frontend et les backends externes. Il possède les secrets et les accès privilégiés,
valide les entrées, orchestre les appels vers l'API métier et normalise les réponses
consommées par l'app. Il garde côté serveur ce qui ne doit jamais atteindre le client
(jetons, identifiants, clés), et expose au frontend un contrat stable, indépendant de la
forme des services amont.

## Conventions techniques

Aucune règle CI spécifique à ce dossier à ce jour.

Le contrat d'intégration des routes BFF du dashboard avec l'API Symfony (écritures,
projection de lecture `content/`, cache, sécurité des `SYMFONY_*`) est documenté dans
[docs/3.application/bff-dashboard-symfony.md](../../docs/3.application/bff-dashboard-symfony.md).
