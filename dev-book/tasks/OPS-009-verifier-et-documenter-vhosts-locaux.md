# OPS-009 — Vérifier les cinq piles et documenter leurs accès

- Demande : DEM-004 ; type : développement
- Brouillon de référence : `tmp/demande-vhosts-locaux.md`, relatif au dépôt principal (hors du worktree)
- Demande définitive : [DEM-004](../demand/DEM-004-vhosts-locaux.md)
- Session de création : 01a1ca55-428a-73c2-8ba4-240528dc1169
- Couche : devops
- Branche : layers/devops
- Worktree : worktree/devops
- Base locale vérifiée : `35d4a0636914b103b84afdf6efb01ffc0b25fea2` ; aucun fetch
- État : validée et commitée localement ; à livrer
- Chemins autorisés : `infra/scripts/` (sondes SSR et test des piles locales), `infra/tests/test_local_ssr.py` (test fonctionnel existant à adapter), `infra/make/Makefile.dev` (commandes de contrôle), `docs/1.getting-started/setup-local.md`, `docs/2.architecture/14.site-layers.md`, cette carte
- Accompagnements autorisés : `README.md` et `worktree/README.md` pour leurs liens et accès locaux ; `worktree/design/` du principal pour le seul dossier vide explicitement demandé
- Dépendances de réalisation : commit OPS-008 validé `dce5e9e16c5be9d851a97e8da46da6eb01a25690` ; même branche, aucun échange de fichiers non commités
- Dépendances de vérification globale : résultat OPS-008 présent ; disponibilité Docker et ressources pour les builds locaux

## Résultat et critères

Couvrir les six critères du brouillon avec la configuration OPS-008.
Adapter `infra/scripts/check-local-ssr.py` et `make dev-check-ssr` à la pile courante,
aux deux identités et au refus des anciens noms, noms inconnus et hôtes d’autres piles.
Conserver les assertions d’isolation des routes Showcase et Client 2 existantes.

Documenter la convention dans le guide des sites, avec liens depuis les autres guides ;
retirer les anciens accès de la documentation active sans réécrire les demandes,
cartes ou preuves historiques. Ne pas recopier la table dans plusieurs guides.

Créer au principal le seul dossier vide worktree/design après contrôle du chemin,
de l’état Git et de l’absence de destination étrangère ; ne pas y ajouter .gitkeep,
README, branche ni services. Sa présence vide est une preuve locale non versionnable ;
le guide des worktrees consigne cette limite de reproduction depuis Git.

## Réalisation et preuves

Implémentation du 2026-11-11, session de création inchangée ; HEAD de base
`54333b9f556ce415935d245fd4c12450991399a3`, branche layers/devops.
Le seul fichier non suivi initial était cette carte, créé lors du découpage ;
aucun changement étranger ni index occupé.

- Sondes adaptées aux deux noms de la pile, aux Host avec port, aux routes Showcase et au refus HTTP 421 des anciens noms, d’un inconnu et des huit noms d’autres piles. Les redirections sont traitées comme échecs, sans suivre une URL externe.
- Make découvre port et AIDE_LAYER depuis le Nginx actif et s’arrête si aucune pile n’est active.
- Ajout de `infra/scripts/check-local-stacks.py` : sondes des cinq piles coexistantes ; option de vérification du développement direct depuis un snapshot du HEAD sans secrets ni données utilisateur.
- Test fonctionnel existant `infra/tests/test_local_ssr.py` adapté et enrichi ; ajout de ce chemin au périmètre pour accompagner la sonde, sans modification de Codebase Integrity.
- Guide des sites comme référence unique des accès ; README, setup et guide worktrees actualisés. Anciennes traces historiques conservées.
- Dossier principal `worktree/design` créé et vérifié vide, sans branche, couche configurée ni service. Présence locale non versionnable documentée.

Commandes depuis le worktree DevOps :

```sh
python3 infra/tests/test_local_ssr.py
python3 infra/scripts/check-local-stacks.py --dev-image showcase-immobilier-dev-webapp-localhost:latest
make aide-check
git diff --check
```

Résultats :

| Pile | Deux identités SSR, routes et refus des hôtes | Développement direct |
| --- | --- | --- |
| Principal | conforme sur 8080 | HTTP 200 sur 3000 |
| Web | conforme sur 19401 | HTTP 200 sur 19301 |
| BFF | conforme sur 19402 | HTTP 200 sur 19302 |
| Domaine | conforme sur 19403 | HTTP 200 sur 19303 |
| DevOps | conforme sur 19404 | HTTP 200 sur 19304 |

Les cinq piles SSR préexistantes dem004-preview-* coexistaient pendant les sondes,
sans être arrêtées ni modifiées. Les développements directs ont été testés
successivement avec des copies indépendantes, des données fictives et sans API
externe ; leurs conteneurs/réseaux et le snapshot ont été supprimés après succès.
Journal local de l’exécution : `/tmp/dem004-ops009-stacks.log` (temporaire).

Commande Make réelle vérifiée contre chacune des cinq piles, depuis un environnement
temporaire sans secrets : couche et port découverts, mêmes sondes réussies ;
absence de pile refusée. Le Makefile produit dans ce dossier non Git un avertissement
Git de découverte sans effet sur la cible, qui retourne bien zéro pour les piles actives.
Dix tests fonctionnels réussis, dont serveur HTTP réel sans suivi de redirection,
mauvaise identité, fuite de route, ancien alias et hôte d’autre pile.
`make aide-check` : registre/types/liens conformes et 111 tests Python réussis.
Compilation Python et diff sans erreur.

Limites : SSR testé avec les images locales existantes, sans reconstruction ni
validation des URL canoniques compilées. Le développement utilise le HEAD commité
(dont OPS-008), sans changement applicatif dans OPS-009. Aucun test d’envoi mail ou
d’écriture API ; aucun .env, donnée ni service utilisateur modifié. Le dossier vide
n’est pas transporté par Git. Qualité applicative générale non rejouée : aucun
changement Nuxt, uniquement sondes, Make, documentation et tests fonctionnels.

État soumis : les huit chemins ci-dessous plus cette carte non suivie ;
`infra/scripts/check-local-stacks.py` est également nouveau/non suivi.

- `README.md`
- `docs/1.getting-started/setup-local.md`
- `docs/2.architecture/14.site-layers.md`
- `infra/make/Makefile.dev`
- `infra/scripts/check-local-ssr.py`
- `infra/scripts/check-local-stacks.py`
- `infra/tests/test_local_ssr.py`
- `worktree/README.md`

Empreinte SHA-256 des huit fichiers triés (nom + NUL + contenu + NUL) :
`5edbf5445625c13e13a3c9b0cc94257f4cd8c3a769951b6798ead7a2c7996dcb`.

## Verdict humain

Validation explicite le 2026-11-11 : « validé », après présentation du résultat
OPS-009, des vérifications et de leurs limites. Même session de création.
Empreinte des huit fichiers conforme au résultat présenté ; index initial vide.

## Commits

Commit local après validation : `33872fe2879df87aa2dccc33dce0fbad3c43aacb`.
Aucun push, PR ni fusion.
