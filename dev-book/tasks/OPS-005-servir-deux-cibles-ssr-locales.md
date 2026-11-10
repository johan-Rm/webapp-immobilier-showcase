# OPS-005 — Servir simultanément les deux sites SSR locaux

- Demande : DEM-003 ; brouillon principal `tmp/demande-extraire-screens-immobiliers.md`
- Type : consolidation
- Session de création : 01a1c16c-2085-7141-83fa-3460f6bd4463
- Couche : devops
- Branche : layers/devops
- Worktree : worktree/devops
- État : validée humainement le 2026-11-10 ; commit local autorisé
- Chemins autorisés : `infra/docker/Dockerfile`, `infra/docker/Dockerfile.dev`, `infra/docker/docker-compose.dev.yml`, `infra/nginx/vhost.conf`, `infra/make/Makefile.dev`, `infra/tests/test_local_ssr.py`, `infra/scripts/check-local-ssr.py`, `webapp/.env.example`.
- Dépendances : Base 6f4ebb114a9e856e762690b46425e11f5df65796 ; contrats GD_TARGET et chemins connus. Pas de dépendance de réalisation aux cartes UI/config ; leurs commits sont requis pour construire et tester les deux vraies images.

## Résultat et critères

Conserver `webapp-ssr` pour Showcase et ajouter `client2-ssr`, chacune avec sa
propre image construite avec un GD_TARGET fixe. Nginx sert sur le port public
existant (8080 par défaut) : showcase-immobilier.localhost et webapp.localhost vers
Showcase ; client2-immobilier.localhost vers Client 2. Pas de sélection par Host
à l’intérieur de Nuxt et pas d’exigence de modification de /etc/hosts.

Adapter montages du développement après retrait de l’ancien app. Garder les
contenus/médias/données et l’environnement actuels de Showcase. Client 2 ne lit pas
son env_file, ne reçoit pas ses secrets et ne monte pas ses données. Les builders
et sorties des deux images restent distincts. Adapter les commandes Make locales
pour construire et lancer les deux SSR, et les healthchecks à la page réelle.

Critères : deux réponses SSR simultanées, identités correctes et alias historique ;
ressource témoin absente du voisin ; pas de partage de volumes d’écriture ni de
configuration privée. Les worktrees gardent leurs ports publics isolés ; 8080 reste
la valeur du principal. Ne pas arrêter la pile utilisateur pour libérer un port.

Tests : `docker compose config --quiet` avec environnement de test, tests de routage
et volumes sur fixtures, `nginx -t` et sondes Host via le script prévu. Les images
réelles attendent WEB-001/002 et OPS-004. Prévoir captures HTTP et smoke navigateur
sur les deux vhosts après réunion des commits. Documentation finale dans OPS-006.
Exclure les vhosts et déploiements de production ; préserver les `.env` existants.

## Réalisation et preuves

Implémentée le 2026-11-10, non commitée, à vérifier. Base :
`6f4ebb114a9e856e762690b46425e11f5df65796`, worktree Devops / `layers/devops`.
Deux images/cibles SSR fixes ; Client 2 sans env_file, secrets ni volumes Showcase.
Nginx route les trois hôtes ; les commandes SSR construisent/lancent les deux
services. `make dev-check-ssr` découvre le port réellement publié par Compose.
L’ancien montage app est retiré ; les données Showcase et les .env sont préservés.

Preuves exécutées depuis ce worktree :

- `python3 -m unittest discover -s infra/tests -v` : 2 tests réussis.
  Compose config JSON sur environnement jetable, deux cibles/images distinctes,
  secret sentinelle absent de Client 2, absence de volumes partagés ; sondes HTTP
  acceptant l’isolation et refusant une fuite de route. La CI lance ces tests.
- `nginx -t` dans l’image locale `nginx:1.27-alpine`, configuration montée en
  lecture seule : réussi (`/tmp/dem003-nginx-test.log`).
- Vrai proxy Nginx et deux serveurs témoins sur réseau/port Docker temporaires :
  hôtes Showcase et alias HTTP 200, Client 2 HTTP 200 et absence de routes/ressources
  Showcase HTTP 404 (`/tmp/dem003-nginx-routing.log`). Conteneurs et réseau de test
  supprimés ; aucune pile utilisateur arrêtée.
- `make -n dev-check-ssr`, `git diff --check` : réussis.

Les vrais builds et vhosts SSR attendent les commits Web et OPS-004 réunis.
Ces témoins ne valident pas encore les parcours SSR réels ni les navigateurs.
Diff présenté : chemins OPS-005 de l’inventaire ; nouveaux fichiers
`infra/scripts/check-local-ssr.py` et `infra/tests/test_local_ssr.py`. Index vide.

## Verdict humain

Validée le 2026-11-10 : « parfait, validé », après présentation des trois cartes
OPS-003/004/005, de leurs preuves et des vérifications globales différées.
Cette validation couvre le périmètre préparatoire présenté ; elle ne prouve pas
les builds et parcours des vrais clients, encore dépendants des cartes Web.

## Commits

Commit de réalisation de cette carte ; SHA consigné après création dans la trace
locale de validation DEM-003.
