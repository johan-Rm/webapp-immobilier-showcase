# OPS-008 — Router les deux sites selon la pile locale

- Demande : DEM-004 ; type : développement
- Brouillon de référence : `tmp/demande-vhosts-locaux.md`, relatif au dépôt principal (hors du worktree)
- Demande définitive : [DEM-004](../demand/DEM-004-vhosts-locaux.md)
- Session de création : 01a1ca55-428a-73c2-8ba4-240528dc1169
- Couche : devops
- Branche : layers/devops
- Worktree : worktree/devops
- Base locale vérifiée : `35d4a0636914b103b84afdf6efb01ffc0b25fea2` ; aucun fetch
- État : validée et commitée localement ; à livrer
- Chemins autorisés : `infra/docker/docker-compose.dev.yml`, `infra/nginx/`, `infra/make/Makefile.dev`, `infra/make/Makefile.ai-development-engineering`, `infra/scripts/` (configuration locale des hôtes uniquement), cette carte
- Dépendances de réalisation : aucune au-delà de la base vérifiée
- Dépendances de vérification globale : OPS-009

## Résultat et critères

Appliquer les critères 1, 2, 3 et 6 du brouillon, sans recopier sa table des hôtes.
Conserver deux builds SSR distinctes, choisies par GD_TARGET ; seul Nginx résout Host.

Choix technique : rendre le vhost paramétrable par pile, avec génération à partir
d’un gabarit Nginx plutôt que cinq configurations copiées. Utiliser AIDE_LAYER pour
les couches et preprod pour le principal ; refuser une couche inconnue. Aligner les
URL de build et l’identité publique SSR sur les hôtes retenus. Le refus par défaut
ne doit pas casser les sondes internes des serveurs Nuxt.

Préserver les .env existants : les valeurs historiques PUBLIC_HOST et SITE_URL de
l’outillage ne doivent pas réintroduire un ancien alias dans le routage local SSR.
Résoudre cette adaptation dans infra, sans modifier Codebase Integrity, ses règles
ou ses tests. Vérifier les appels Compose directs documentés autant que Make.

Exclusions : préproduction/production distantes, code applicatif, nouveaux worktrees,
modification de couches/ports, création du dossier design (OPS-009).

## Réalisation et preuves

Implémentation du 2026-11-11, session de création inchangée, base HEAD
`35d4a0636914b103b84afdf6efb01ffc0b25fea2`.

- `infra/docker/docker-compose.dev.yml` : noms et URL SSR calculés par pile, sans reprendre SITE_URL/PUBLIC_HOST historiques ; montage du gabarit et de son entrée Nginx.
- `infra/nginx/vhost.conf` : deux hôtes explicites, refus HTTP 421 par défaut.
- Nouveaux fichiers : `infra/nginx/19-local-vhosts.sh` (exécutable), `infra/nginx/test-local-vhosts.py`, `infra/nginx/README.md`.
- Documentation technique et commande reproductible : [README Nginx](../../infra/nginx/README.md).

Vérifications depuis le worktree DevOps :

```sh
python3 infra/nginx/test-local-vhosts.py --showcase-image showcase-immobilier-a68aebb4-web-showcase-ssr:latest --client2-image showcase-immobilier-a68aebb4-web-client2-ssr:latest
make aide-check
git diff --check
```

Résultats : cinq configurations Compose conformes (ports publics et directs,
URL de build/runtime, anciens SITE_URL/PUBLIC_HOST sans effet) ; cinq syntaxes
Nginx valides ; couche inconnue refusée. Smoke HTTP réel DevOps : deux identités
SSR en 200 avec et sans port dans Host ; localhost, trois anciens alias, nom
inconnu et deux hôtes d’autres piles refusés en 421. Conteneurs et réseau temporaires
supprimés après sondes. `make aide-check` : registre/types/liens conformes,
111 tests Python réussis. Diff sans erreur d’espacement.

Limites : images SSR locales existantes, sans reconstruction des URL compilées ;
pas de preuve du développement direct en fonctionnement ni de coexistence des
cinq piles. Ces contrôles, les sondes usuelles et la documentation utilisateur
restent affectés à OPS-009. Aucun .env, donnée, service utilisateur ou environnement
distant modifié. Aucun code applicatif ni Codebase Integrity modifié.

État soumis : deux fichiers suivis modifiés et les trois nouveaux fichiers Nginx
ci-dessus ; les deux cartes DEM-004 restent non suivies depuis le découpage.

## Verdict humain

Validation explicite le 2026-11-11 dans la session de création : « ok c’est validé »,
après présentation d’OPS-008 et des commandes Make de test. Le verdict couvre
OPS-008 uniquement ; OPS-009 reste sans verdict. Aucun changement fonctionnel
depuis la présentation ; index initial vide, base `35d4a06`.

## Commits

Commit local après validation : `dce5e9e16c5be9d851a97e8da46da6eb01a25690`.
Aucun push, PR ni fusion.
