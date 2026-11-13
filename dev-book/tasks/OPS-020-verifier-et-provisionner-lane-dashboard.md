# OPS-020 — Vérifier et provisionner la lane Dashboard isolée

- Demande : DEM-007 ; type : consolidation
- Brouillon : `tmp/demande-couche-dashboard.md`, relatif au principal, hors des worktrees ; ne pas copier.
- Demande définitive prévue : `dev-book/demand/DEM-007-couche-dashboard.md`, créée seulement à la reconstitution ; actuellement absente.
- Session de création : 01a1ce6e-0fd8-7b72-9e6b-c6926289c5fa
- Date : 2026-11-13
- Couche : devops
- Branche : layers/devops
- Worktree : worktree/devops
- Base locale vérifiée : `71efe4950c25246bacce5583e16f64063a6dfc77` ; aucun fetch.
- État : validée humainement ; commit local en cours, à livrer
- Chemins autorisés : `infra/scripts/check-dashboard-lane.py`, `infra/tests/test_dashboard_lane.py`, `infra/tests/test_lanes.py`, `worktree/README.md`, `docs/2.architecture/14.site-layers.md`, cette carte.
- Dépendances consommées : OPS-018 `28b798f`, OPS-019 `0fa9f63` et leurs traces, réunies dans HEAD `71efe4950c25246bacce5583e16f64063a6dfc77`.
- Vérification globale : Les preuves finales de cette carte ne valent pas validation humaine.

## Résultat et critères

Réunir les seuls commits validés nécessaires dans DevOps pour les contrôles,
sans copie de code non commité. Vérifier les quatre couches existantes et la lane
Dashboard avec les commandes DEM-006 : gestion des services, lane-status global/ciblé,
demands/tasks et ancienne syntaxe LAYER. Aucun nouveau registre documentaire.
Fournir une commande stable de smoke isolé check-dashboard-lane.py : fixture et
images locales explicites, ressources de test nettoyées uniquement ; aucun accès
API externe réel pour prouver l'interface de développement.
Prouver dans un navigateur la réception d'une modification Vue via HMR direct et
via le vhost, sans reconstruction, avec WebSocket fonctionnel ; ne pas confondre
une simple nouvelle réponse SSR ou un full reload avec cette preuve.
Après validation/commit des dépendances et vérification de disponibilité des
chemins/ports, créer effectivement layers/dashboard et worktree/dashboard depuis
le SHA local explicite réunissant les dépendances. Ce provisionnement est un résultat
de cette mission, pas une mission frontend supplémentaire ni une nouvelle copie de
réunion. Préparer un environnement neuf sans secrets hérités ; ne démarrer des
services durables que pour le contrôle, puis les arrêter en conservant les données.
Ne pas créer de cartes DASH historiques ni déplacer les anciennes cartes Web.
Consigner les SHA/ports/URL et limites. La couche reste libre après ce provisionnement.

## Réalisation et preuves

Provisionnement réel effectué le 2026-11-13 depuis la base validée ci-dessus :
`layers/dashboard`, `worktree/dashboard`, environnement neuf préparé et validé,
ports 19305/19405 libres avant création. Aucun secret du principal copié.
Les accès direct et vhost `/connexion` répondent HTTP 200 avec l'image dev locale.
Les services de contrôle ont été arrêtés ; .env et données sont conservés et
le worktree reste propre, sans mission frontend affectée.

Le script `infra/scripts/check-dashboard-lane.py` prépare un dépôt jetable depuis
un commit explicite, avec cinq worktrees, images locales et navigateur explicites.
Les API sont forcées au loopback et simulées dans le navigateur ; les ressources
Docker sont nettoyées après le test. Un réseau Docker interne a été écarté de la
fixture car il empêchait ici la publication des ports. Chromium exigeait cinq
bibliothèques manquantes, extraites dans /tmp sans installation système.
Smoke complet réussi : HMR direct et vhost, input conservé, aucune navigation
complète, WebSocket connecté et identifiants conteneurs inchangés pendant HMR.
Données/caches Web et Dashboard distincts ; hôte inconnu 421 ; suivi des logs,
recréation via lane-rebuild et arrêt via lane-down réussis, données conservées.
Dispatch courant et ancienne syntaxe vérifiés sur les cinq couches (dry-run),
consultations réellement exécutées dans la fixture. Les quatre autres piles ne
sont pas démarrées par ces tests de dispatch ; Web et Dashboard le sont.
Les images locales explicites ne sont pas reconstruites : la fixture retire la
recette de build avant d'exercer lane-rebuild et sa recréation.
Base du smoke : `71efe4950c25246bacce5583e16f64063a6dfc77` ; ports jetables 56181/44527.
Commande : `python3 infra/scripts/check-dashboard-lane.py --base <SHA-validé>
--image <image-dev-locale> --nginx-image <image-nginx-locale>
--playwright-module <module-Playwright-local> --chromium <exécutable-local>`.
Chromium et ses bibliothèques doivent être disponibles ; LD_LIBRARY_PATH peut
pointer vers les bibliothèques extraites dans /tmp. Aucun téléchargement automatique.
La saisie d'email est fictive et les réponses SaaS simulées : aucune preuve métier
ou de sécurité Symfony n'est revendiquée. Aucun verdict humain ni commit créé.
`make aide-check` : 119 tests réussis. Tests infra : 38 exécutés, succès avec
un smoke Docker explicitement ignoré hors de son mode dédié.

Les corrections et accompagnements sont déclarés dans le brouillon, sans recopier
la déclaration dans chaque carte. Réconcilier ses chemins exacts avec le diff final ;
aucune exemption implicite de couverture de contribution. Un seul écrivain DevOps.

## Verdict humain

Validation explicite le 2026-11-13 : « validé », couvrant OPS-020 et OPS-021
présentées ensemble, avec leurs limites et avertissements conservés.
Contenu revérifié identique au relevé présenté avant ajout de cette trace ;
aucun changement fonctionnel supplémentaire.

## Commits

Aucun commit. Après validation humaine, tracer les SHA réels. Reconstitution prévue
dans le principal libre et propre, `demands/DEM-007` depuis develop vérifié, sans
copie de réunion ; retour sur develop après intégration distante.
