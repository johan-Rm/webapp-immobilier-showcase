# OPS-006 — Finaliser les références, déclarations et preuves de DEM-003

- Demande : DEM-003 ; brouillon principal `tmp/demande-extraire-screens-immobiliers.md`
- Type : consolidation
- Session de création : 01a1c16c-2085-7141-83fa-3460f6bd4463
- Couche : devops
- Branche : layers/devops
- Worktree : worktree/devops
- État : validée humainement le 2026-11-10 ; vérifications réunies réussies
- Chemins autorisés : `infra/config/layers.json`, `codebase-integrity/conventions.json`, test documentaire prévu, README racine, guides docs et `worktree/README.md` : liste exacte OPS-006 dans l’inventaire principal, incluant l’adaptation du test de routage au retrait de l’ancien préfixe.
- Dépendances : Réalisation : OPS-003, car cette carte finalise son routage et ses références. Commit source `3043960c8f6752ddfdfeae6ce114244fe64633b1`, présent sur cette branche. Vérification globale : commits WEB-001/002 et OPS-004/005 réunis.

## Résultat et critères

Finaliser les références des conventions vers le README technique déplacé dans
Showcase, sans duplication de leurs définitions. Retirer le préfixe de routage
historique une fois le déplacement intégré. Ces deux fichiers sont coordonnés
séquentiellement avec OPS-003 sur la même branche Devops ; aucun écrivain parallèle.

Actualiser architecture, liens déplacés, alias et démarrage local dans les guides
existants. Expliquer le catalogue provisoirement dépendant de Showcase, le Client 2
minimal et les deux vhosts. Préserver rubriques/ordre des documents ; ne pas refaire
les standards. Les sources de règles restent uniques.

Mettre au point les déclarations exactes de consolidation depuis l’inventaire
principal : chaque chemin effectivement modifié, convention et contrôle renforcé ;
justifier séparément les accompagnements documentaires. Le `contribution-json`
définitif sera porté par la demande à la reconstitution, sans créer ce fichier ici.
Réconcilier les chemins prévisionnels avec le diff réel, sans ajouter d’exception.

Critères : références documentaires valides, plus de source de convention disparue,
couverture des trois racines frontend démontrée par fixtures ; protocole complet de
preuve avec commandes, ports et limites. Ne pas inventer de résultat, validation
humaine ou SHA d’une carte non commitée.

Tests : tests documentaires sur fixtures et `make aide-check` ; registre/liens sur
l’arbre complet après réunion. L’exécution finale qualité, conventions, tests,
builds, SSR et navigateurs se fait sur la réunion des six commits, à la reconstitution
ou par leurs dépendances commitées dans un worktree affecté, sans copie non commitée
ni dossier de réunion supplémentaire. Les échecs historiques restent nommés.
La livraison de DEM-002 dans develop précède la reconstitution DEM-003.

## Réalisation et preuves

Réalisée sur `layers/devops`, base `a25d929`. Références des conventions et
liens de guides rebasés vers Showcase ; règles maintenues dans une source unique.
Guide des layers actualisé pour applications clientes, catalogue provisoirement
couplé à Showcase, Client 2 vide et trois vhosts. Ancien préfixe app retiré du
routage, avec test adapté ; aucune exception ni seuil modifié.

Preuves depuis ce worktree :
- `python3 codebase-integrity/commun/test_domains.py` : 111 tests réussis,
  dont fixture de source renommée acceptée puis rejetée si elle manque, même si
  l’ancienne source existe. Tests Vitest des contrôles : 9 réussis.
- Contrôles des documents et demandes : réussis ; lint et diff whitespace réussis.
- Registre complet : différé, sortie connue « Fichier absent :
  webapp/sites/showcase-immobilier/app/README.md » dans ce worktree. Ce fichier
  appartient à WEB-001 non commitée ; ne pas copier son travail ni exclure l’erreur.
  `make aide-check` complet attend la réunion par commits.

Déclaration de consolidation réconciliée, sans copier de code entre couches :
`tmp/DEM-003-contribution.json` du principal, 439 chemins uniques au relevé final ;
état et répartition dans `tmp/DEM-003-contribution-state.json`. Les chemins non
modifiés sont retirés. `infra/config/layers.json` et son test ne figurent qu’une
fois, sous cette finalisation. Cette déclaration de travail sera revérifiée contre
les commits à la reconstitution ; aucune demande définitive créée ici.

Les résultats réels SSR/navigateurs restent dans les cartes Web. Le contrôle typé
Showcase standard attend la correction OPS-004 non commitée. La livraison DEM-002
reste nécessaire avant reconstitution depuis develop. Index vide, aucun commit de
réalisation, push, PR ou fusion. Diff : chemins OPS-006 de l’inventaire ; nouveau
contrôle `codebase-integrity/domaines/fiabilite-verifications/tests/test_frontend_paths.py`.

## Verdict humain

Validée le 2026-11-10 : « c’est validé », sur le lot présenté, après essais
humains de Showcase. Empreintes du contenu présenté confirmées avant indexation.

## Clôture des vérifications

Les commits Web validés ont été repris par cherry-pick -x : WEB-001 source
`ac57e313712614caa07d0780d847c6ab588dc67f` → `8f3cfdf7`, WEB-002 source
`669ab4cafe68b3ee92a34aa60b630b9574820156` → `bfd0085`.
Sur cet arbre réuni, `make aide-check` réussit : registre, demandes, liens et
111 tests Python (`/tmp/dem003-validated-aide.log`). Les deux tests SSR d’infrastructure
passent aussi. La limite de registre décrite à l’étape 03 est levée.
Les types ordinaires des deux cibles et la qualité Showcase passent dans Web après
reprise du correctif OPS-004 ; suites applicatives finales : 70 et 45 réussites.
Builds SSR et quatre smokes navigateur sont consignés dans les cartes Web.
Aucun seuil, exception ou mode de revue n’a été assoupli ; défauts historiques
bloquants de conventions et warnings restent recensés dans WEB-001.
La reconstitution et la livraison ne sont pas effectuées dans cette validation.

## Commits

Commit local de réalisation de cette carte ; SHA consigné dans la trace de clôture.
Aucun push, PR ou fusion.
