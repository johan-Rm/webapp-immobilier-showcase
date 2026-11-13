# OPS-019 — Servir Dashboard en développement direct et par vhost

- Demande : DEM-007 ; type : consolidation
- Brouillon : `tmp/demande-couche-dashboard.md`, relatif au principal, hors des worktrees ; ne pas copier.
- Demande définitive prévue : `dev-book/demand/DEM-007-couche-dashboard.md`, créée seulement à la reconstitution ; actuellement absente.
- Session de création : 01a1ce6e-0fd8-7b72-9e6b-c6926289c5fa
- Date : 2026-11-13
- Couche : devops
- Branche : layers/devops
- Worktree : worktree/devops
- Base locale vérifiée : `669db107aaf2eb9728a8faf68c018b4b238887a1` ; aucun fetch.
- État : validée et commitée localement, à livrer
- Chemins autorisés : `infra/docker/docker-compose.dashboard-dev.yml`, `infra/nginx/dashboard-dev.conf.template`, `infra/nginx/README.md`, `infra/scripts/lanes.py`, `infra/tests/test_lanes.py`, `infra/tests/test_dashboard_lane.py`, `codebase-integrity/domaines/construction-livraison/scripts/environment.py`, `codebase-integrity/domaines/construction-livraison/tests/test_environment.py`, `codebase-integrity/conventions.json`, `worktree/README.md`, `docs/2.architecture/14.site-layers.md`, cette carte.
- Dépendance consommée : OPS-018 `28b798f3e1b94d3940fd5b623261778e388d100d`, trace `669db10` ; présents dans HEAD.
- Vérification globale : OPS-020 pour les preuves runtime ; OPS-021 pour la couverture frontend finale.

## Résultat et critères

Ajouter une composition de développement dédiée, indépendante des piles SSR
Showcase/Client 2. Elle démarre seulement le serveur Nuxt ciblant GD_TARGET=dashboard
et Nginx, avec healthcheck /connexion. L'image de développement peut rester commune,
mais les sources dashboard, caches .nuxt/.output, données et rapports sont propres
au worktree ; schémas source en lecture seule. Ne pas copier les secrets du principal.
Conserver la préparation idempotente et le refus des chemins/symlinks dangereux,
y compris caches et données spécifiques Dashboard ; un environnement existant
reste préservé, jamais réécrit pour résoudre une divergence.
Adapter lane-up/down/logs/rebuild à la sélection de composition/services déclarée
par OPS-018 ; valeurs historiques par défaut inchangées. lane-status conserve
l'identité Compose attendue. Ne pas dupliquer la liste de couches dans Make.
Exposer localhost:19305 et dashboard.wt-dashboard.localhost:19405 avec HMR sur les
deux accès, sans port client HMR figé cassant l'autre accès. Proxy WebSocket,
absence de cache immutable et refus HTTP 421 des autres hôtes. Préserver les vhosts
SSR existants et leurs règles ; ne pas activer Showcase/Client 2 dans cette lane.
Actualiser le guide worktree sans ajouter de rubrique, conformément aux consignes
README actuelles ; les URL complètes restent dans le guide des sites.
Aucune modification du frontend, des routes BFF ou des contrats métier.

## Réalisation et preuves

Réalisation depuis HEAD `669db10`, sur layers/devops. Composition dédiée à deux
services, cible Dashboard imposée, proxy WebSocket et hôtes bornés ; chemins de
sessions/publications imposés dans le conteneur. Les sources, sorties et caches
sont locaux au worktree. Les commandes choisissent la composition configurée ;
les quatre couches historiques conservent leurs valeurs par défaut.
Validation/préparation refusent les symlinks Dashboard avant création du .env,
conservent les environnements existants et ne copient aucun secret.

Preuves du 2026-11-13 : `make aide-check`, 119 tests réussis ;
`python3 -m unittest discover -s infra/tests`, 37 tests réussis avant ajout du
smoke explicite reproductible ci-dessous ; ses deux tests passent également. Compose résolu avec environnement fictif,
tests de commandes, cas invalides, idempotence, ports et refus de symlinks inclus.
`python3 infra/nginx/test-local-vhosts.py` : cinq configurations Compose et
syntaxes Nginx historiques conformes ; couche inconnue et activation invalide refusées.
Le smoke isolé (sans application ni .env utilisateur) vérifie Nginx -t,
Host avec port conservé, hôte inconnu 421, passage Upgrade 101 et absence de cache
immutable. Commande reproductible :
`AIDE_NGINX_SMOKE=1 python3 -m unittest discover -s infra/tests -p test_dashboard_lane.py`.
Les conteneurs et le réseau jetables sont nettoyés par le test.

Limites : aucune application réelle démarrée, aucun worktree Dashboard créé.
Le rechargement et la conservation d'état navigateur relèvent toujours d'OPS-020,
qui attend le commit validé de cette carte. OPS-021 reste en dernier.
Aucun fichier frontend, .env ou donnée utilisateur modifié ; aucun commit créé.

Les corrections et accompagnements sont déclarés dans le brouillon, sans recopier
la déclaration dans chaque carte. Réconcilier ses chemins exacts avec le diff final ;
aucune exemption implicite de couverture de contribution. Un seul écrivain DevOps.

## Verdict humain

Validation explicite le 2026-11-13 : « validé », limitée à OPS-019.
Les 12 fichiers correspondent au relevé SHA-256 présenté
`8d8f4f860cb9ef4096cb6f313a8c5e725b0f48d0dbc7f78b990a7e2a168ca88f` ;
identité revérifiée avant cette trace, sans changement fonctionnel supplémentaire.
Le contrôle du diff indexé a ensuite fait retirer une unique ligne vide finale
de `infra/tests/test_dashboard_lane.py` ; aucune instruction de test modifiée.

## Commits

Commit d’implémentation validée : `0fa9f63244386ee2a39ac13a69037fba30770477`.
Cette trace documentaire est consignée séparément. Reconstitution prévue
dans le principal libre et propre, `demands/DEM-007` depuis develop vérifié, sans
copie de réunion ; retour sur develop après intégration distante.
