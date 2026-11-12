# OPS-012 — Servir la cible dashboard et synchroniser les seuls articles publiés

- Demande : DEM-005 ; type : développement
- Brouillon de référence : `tmp/demande-dashboard-saas.md`, relatif au dépôt principal, hors du worktree ; ne pas le copier.
- Demande définitive prévue : `dev-book/demand/DEM-005-dashboard-saas.md`, créée seulement à la reconstitution ; fichier actuellement absent, lien à ajouter alors.
- Session de création : 01a1ca56-891a-7700-97c6-a576d3d9a615
- Couche : devops
- Branche : layers/devops
- Worktree : worktree/devops
- Base locale vérifiée : `a2fc20b21a54531b0db014a6ca3d52e2a65a33dd` ; aucun fetch.
- État : service/vhost validé et commité localement, à livrer ; carte incomplète, export/projection non réalisés
- Chemins autorisés : `infra/docker/`, `infra/nginx/`, `infra/make/Makefile.dev`, `infra/make/Makefile.ai-development-engineering`, `infra/scripts/`, `webapp/scripts/saas/`, `webapp/scripts/content-sync.ts`, `webapp/scripts/README.md`, cette carte
- Dépendances de réalisation : OPS-011 `f3664dd5a92a2202a285f3e04de9ba13ebf72863`, DOM-001 `8c1000ecc9996cd3632a323fd1ed49604ad4e929`, WEB-003 `f3398f8cc12474640737887b77e16d0ca7afe90d`, WEB-004 `c276814c2a95fec82c9f9f586cbd7e7c7dd9a608` pour le service ; Symfony publication pour export/projection
- Commits nécessaires : commits identifiés ci-dessus pour servir le dashboard ; aucun SHA backend disponible.
- Dépendances de vérification globale : OPS-013

## Résultat et critères

Ajouter build/service/vhost dashboard distincts dans les piles locales existantes, sans déploiement distant.
Étendre les données et volumes isolés pour projection publiée Client 2, aperçu et médias concernés.
Produire une projection validée et atomique des snapshots publiés, index par langue, suppressions de
projection sur dépublication, références médias et signature de version/cache.
Un échec conserve la dernière projection valide ; retry idempotent, état de synchronisation observable.
Fixer la correspondance projet Symfony → cible/chemins autorisés côté serveur, jamais depuis le payload.
Préserver les .env et volumes existants ; aucun secret automatiquement copié ; dry-run sans écriture.
Le projet API de test doit être explicitement affecté avant écriture ; ne pas utiliser le projet Showcase.
Exclusions : modifications contrôles Codebase Integrity, déploiement production, code UI.

Les critères de besoin et exclusions communs restent dans le brouillon ; aucune modification
de Codebase Integrity, de règle ou de gouvernance hors consolidation déclarée.
Les métadonnées de cette carte relèvent de la trace obligatoire, même hors périmètre applicatif.
Documentation : Scripts README pour usage du synchroniseur ; OPS-013 porte l’architecture et le guide d’ensemble.

## Réalisation et preuves

Reprise du 2026-11-12, session intervenante identique à la session de création.
La dépendance Symfony publication était trop large pour le service/vhost : cette partie
consomme les seuls commits frontend/Domaine identifiés ci-dessus. Elle est réalisée ;
la carte entière reste incomplète. Le protocole d’export backend, la file durable,
la projection atomique, les médias publiés et les accusés de synchronisation restent à réaliser.
Aucun faux export ni worker sans contrat amont n’est introduit pour contourner ce blocage.

Résultat disponible : extension Compose locale optionnelle, image dashboard distincte,
domaine `dashboard.<suffixe>.localhost` sur le port public de la pile et données sous
`webapp/.data/dashboard/`. Aucun `env_file` ou identifiant Symfony hérité par ce service.
Les commandes historiques conservent leurs deux sites. La sortie `dashboard/.output`
est normalisée vers `.output` uniquement dans le stage Docker. Activation Nginx limitée
à un booléen validé et à un hôte dérivé de la couche, sans substitution des variables Nginx.
Commandes et usage : [README Nginx](../../infra/nginx/README.md), source unique de cette partie.

État présenté : HEAD `a2fc20b21a54531b0db014a6ca3d52e2a65a33dd`, `layers/devops`, index vide.
Sept fichiers suivis modifiés : `infra/docker/Dockerfile`, `infra/make/Makefile.dev`,
`infra/nginx/{19-local-vhosts.sh,README.md,test-local-vhosts.py,vhost.conf}` et
`infra/scripts/check-local-ssr.py`. Nouveau fichier : `infra/docker/docker-compose.dashboard.yml`,
ainsi que cette carte non suivie. OPS-013 reste préservée hors périmètre.
Empreinte SHA-256 des huit fichiers de réalisation, triés par chemin relatif :
`da940d7532b608d19c1136df210a4ee37018b77b93a4b71f1afe41e5862d151c`.
Calcul : chemin UTF-8 puis octet nul puis octets de chaque fichier, concaténés ; cartes exclues.
Manifeste détaillé local : `/tmp/dem005-ops012-manifest.json`.

Contrôles terminés avec succès depuis DevOps :

- `make aide-check` — 111 tests ; structure et liens documentaires conformes.
- `python3 -B -m unittest discover -s infra/tests -p test_local_ssr.py` — 10 tests
  historiques, dont Compose, refus des redirections et routes/hôtes entre piles.
- `python3 infra/nginx/test-local-vhosts.py`, puis la même commande `--dashboard` —
  cinq configurations Compose et cinq syntaxes Nginx pour chaque mode ; couche inconnue
  et activation invalide refusées. Aucune lecture des `.env` utilisateur.
- Construction réelle Docker depuis `/tmp/dem005-ops012-01lvfkku` : snapshot sans secrets,
  sources DevOps et frontend/Domaine issus des commits validés ; Dockerfile présenté
  identique à celui construit. Commande : `docker buildx build --load --progress=plain
  --build-context schemas=./webapp/schemas/source --build-arg GD_TARGET=dashboard
  --build-arg SITE_NAME=Administration -f infra/docker/Dockerfile
  -t dem005-ops012-dashboard:local webapp` — sortie 0.
- `python3 infra/nginx/test-local-vhosts.py --dashboard
  --showcase-image showcase-immobilier-a68aebb4-web-showcase-ssr:latest
  --client2-image showcase-immobilier-a68aebb4-web-client2-ssr:latest
  --dashboard-image dem005-ops012-dashboard:local` — sortie 0 ; vraies identités des
  trois SSR derrière Nginx, autorités avec/sans port, refus HTTP 421 des hôtes étrangers,
  sondes `check-local-ssr.py --dashboard`, absence des routes Showcase sur le dashboard,
  en-têtes `no-store`/`noindex`. Conteneurs et réseau temporaires supprimés après test,
  sans montage des données utilisateur ni appel à Symfony. Log : `/tmp/dem005-ops012-http.log`.
- Syntaxe shell/Python, Prettier sur Compose/README, `git diff --check` et expansion
  `make -n` des trois nouvelles commandes — conformes. Le Dockerfile est vérifié par sa
  construction réelle ; aucun parser Prettier Dockerfile n’est installé.

Limites : aucune pile utilisateur lancée ou modifiée, aucun déploiement ; seul le snapshot
a réuni les commits nécessaires au build. Le frontend servi ne prouve pas l’authentification,
les CRUD, l’aperçu ni la publication réels. Aucune projection Client 2 ni synchronisation
publique réalisée. Le contrat d’export et son SHA backend restent absents et l’interdiction
humaine de modifier Symfony reste appliquée. WEB-005 attend encore cette interface et
BFF-004 ; OPS-013 attend les intégrations. Aucune consolidation ou modification de contrôles,
aucun commit ni verdict humain produit à cette étape.

## Verdict humain

Validation humaine explicite du 2026-11-12 : « validé », limitée à la partie service/vhost présentée.
Empreinte des huit fichiers revérifiée identique avant commit ; aucune correction fonctionnelle.
Ce verdict ne couvre ni l’export, ni la projection, ni la synchronisation ; la carte entière reste incomplète.

## Commits

Commit local de la partie service/vhost validée : `6a0885beb5bcd275834d9c383c296161d57696d9`.
Complément documentaire limité à la trace du SHA et de l’état ; OPS-013 préservée hors index.
Ce commit ne termine pas OPS-012 : export, projection et synchronisation restent non réalisés.
La réunion globale est prévue dans le principal libre et propre, branche `demands/DEM-005`
créée seulement à la reconstitution depuis develop local vérifié.
