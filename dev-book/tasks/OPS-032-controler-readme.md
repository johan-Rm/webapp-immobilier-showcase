# OPS-032 — Contrôler la structure de tous les README

- Demande : DEM-011 ; type : consolidation.
- Session de création : 01a1d56d-446b-7931-bf53-7687a7d10912
- Date : 2026-11-15
- Couche : devops ; branche : layers/devops.
- Worktree : `/home/johan/www/graines-digitales/modern-web-apps/showcase-immobilier/worktree/devops`.
- Base : `ca571d60c39b8b5932d74cd43dcbe4131c47c578`.
- État : garde-fou implémenté, non commité ; migration globale des README non réalisée, contrôle global en échec.
- Périmètre autorisé : fichiers détaillés dans « Résultat et critères » et « Relecture accompagnée des README », y compris la reprise des critères documentaires.
- Dépendances : aucune dépendance de code nouvelle ; reprise des seuls changements DEM-011 identifiés dans DevOps.

## Résultat et critères

Extension explicitement demandée par l’humain le 2026-11-15 pendant la vérification : chaque convention technique comporte un H3 et une description ; contrôle déterministe de tous les README. La règle locale de référence est `docs/README.md#contenu-des-readme`. Aucune modification du cadre AIDE externe, aucune copie de source entre couches. La vérification précédente des quatre cartes ne vaut pas validation de cette extension.

Chemins de cette extension : `docs/README.md`, `codebase-integrity/README.md` (trois descriptions de conventions), `codebase-integrity/conventions.json`, `codebase-integrity/domaines/fiabilite-verifications/scripts/check_readmes.py`, `codebase-integrity/domaines/fiabilite-verifications/scripts/check_docs.py`, `codebase-integrity/domaines/fiabilite-verifications/tests/test_readmes.py`, `codebase-integrity/domaines/fiabilite-verifications/tests/test_docs.py` et cette carte. Le README Codebase Integrity porte aussi les changements préexistants OPS-023, conservés séparément dans le diff de reprise ; aucun commit à indexer globalement.

## Réalisation et preuves

Le script découvre les README via Git, détecte H1/H2, ordre, H3 et descriptions, listes de responsabilités et renvois interdits. Les exemples et commentaires ne fournissent pas de fausse preuve. Pas de correction automatique, réseau ou dépendance supplémentaire. Le vérificateur documentaire appelle ce contrôle, déjà raccordé à `make aide-check` et à sa CI existante.

Commande depuis ce worktree : `python3 codebase-integrity/domaines/fiabilite-verifications/scripts/check_readmes.py`. Tests : `python3 -B codebase-integrity/domaines/fiabilite-verifications/tests/test_readmes.py` et `python3 -B codebase-integrity/domaines/fiabilite-verifications/tests/test_docs.py` : respectivement 11 et 28 réussis. Cas négatifs : description absente, liste/exemple/lien en guise de description, rubriques absentes/doublées/inversées, H4 au lieu de H3, lien symbolique, encodage invalide et inventaire impossible. Fixture Git : README non suivi/casse différente contrôlé, dépendance ignorée et copie worktree exclues.

Le contrôle réel reste bloquant sur les README existants ; relevé de reprise dans `tmp/rapport-controle-readme.txt` du principal. Ce rapport ne couvre pas les modifications non commitées des autres couches. Leur migration doit suivre leurs cartes et worktrees, sans copie de travail non commité. La pertinence d’une description et la détection sémantique d’un inventaire restent humaines.

## Verdict humain

Aucun verdict. Nouvelle règle explicitement demandée ; implémentation et migration complète non validées.

## Commits

Aucun ; aucun push, PR ou fusion.

## Reprise des critères documentaires

Décision explicite de l’humain le 2026-11-15 : les README sont limités à leurs deux rubriques, sans aucun lien, chemin ou élément volatil. Règle définie dans le README documentaire, sans modification des skills globaux. Le contrôle refuse les formes reconnaissables y compris dans les exemples ; l’absence de tout contenu volatil ne peut pas être prouvée syntaxiquement. AGENTS.md référence la règle locale sans la recopier. Ces changements ajoutent AGENTS.md au périmètre de la carte et actualisent l’ancre du registre.

Tests dédiés du contrôle README : 13 réussis. Les nouveaux cas couvrent les liens, chemins, traces temporaires et rubriques supplémentaires. Le rapport antérieur des 258 écarts précède cette extension ; les rapports complets courants sont produits par aide-check, dont la présentation appartient à OPS-033. La migration des README des couches reste à effectuer. Les empreintes de présentation antérieures sont historiques et ne valent pas identité du contenu repris.

## Relecture accompagnée des README

Le README documentaire a été clarifié avec pédagogie, concision, vocabulaire partagé, mots essentiels en gras et listes. Dans le README Codebase Integrity, les responsabilités et conventions ont été relues chapitre par chapitre. L’humain a explicitement validé le chapitre « Classement des conventions » ; ce verdict ne vaut pas validation globale de la carte ou de DEM-011.

Sur instruction explicite, les rubriques supplémentaires d’organisation et de commandes ont été remplacées par des conventions H3 durables ; les procédures sont déplacées dans la documentation du projet, sans duplication de leurs commandes de contribution. Le périmètre documentaire de cette reprise comprend aussi `docs/controle-contributions.md`, `docs/perimetre-controles-frontend.md`, `docs/executer-controles.md` et leurs entrées dans `docs/index.md`.

Vérification ciblée : README Codebase Integrity complet accepté par readme_errors ; 13 tests du contrôle README réussis ; structure et liens des trois documents déplacés vérifiés. Aucun verdict global, commit ou livraison. Les empreintes antérieures précèdent cette relecture et devront être renouvelées pour la présentation finale.

## Regroupement des README par premier niveau

Instruction explicite : aucun README dans les sous-dossiers de niveau deux ou plus, en comptant depuis la racine du dépôt. Le contrôle README signale ces fichiers ; il n’en supprime aucun automatiquement. Quatorze tests du vérificateur réussis, dont un cas de profondeur avec casse différente.

Le contenu de `dev-book/templates/README.md` a été transféré : conventions d’usage dans le README parent et navigation des modèles dans `docs/verifier-traces-devbook.md`, puis fichier retiré après comparaison à HEAD et recherche des références. La référence de chemin dans la déclaration historique DEM-001 est conservée comme preuve, sans lien documentaire cassé identifié. Les deux modèles eux-mêmes restent en place. Périmètre de reprise étendu à ce retrait et aux fichiers parents concernés ; aucune modification des README des autres couches.

Suite de la même instruction de regroupement : règles du README de runbooks transférées dans le README du dev-book et exemples dans `docs/verifier-traces-devbook.md`, puis retrait du README de second niveau après vérification du contenu et des références. Le renvoi à la constitution absente n’est pas reconduit. Aucun fichier de procédure opérationnelle supprimé ou exécuté.

Regroupement Infra : `infra/nginx/README.md` transféré vers le nouveau `infra/README.md` pour les conventions et `docs/nginx-local.md` pour les procédures ; liens actifs actualisés dans les deux guides applicatifs et les cartes OPS-008/OPS-012. Les chemins historiques en texte littéral sont conservés. Aucun service ni test Docker démarré. Contrôles ciblés de forme, structure et liens réussis.

Le contrôle de traçabilité détecte deux verdicts historiques non structurés dans OPS-008 et OPS-012, désormais sélectionnées parce que leurs liens ont changé : 18 cartes, 2 écarts. Aucun verdict historique inventé ou converti automatiquement, aucune exclusion du contrôle. Ce point reste à arbitrer avant clôture ; le succès documentaire ciblé ne vaut pas succès global des cartes.

Exception documentaire explicitement approuvée : README racine conservé sans contrôle de forme ou de contenu, avec liens contrôlés ; README spécialisés du socle frontend autorisés en profondeur, tout en contrôlant leur contenu. Le script et ses tests sont adaptés : 15 tests README et 28 tests documentaires réussis. La rédaction des sources communes appartient à WEB-007 ; aucune de ces sources non commitées n’est copiée dans DevOps. Les références de registre et des guides seront raccordées après disponibilité de la migration Web par commit validé.

Reprise du 2026-11-15 : l’implémentation crée désormais les commits techniques par tâche, avant vérification humaine globale. Le garde-fou et la migration documentaire locale sont commités ; les emplacements Web explicitement affectés restent en arbitrage, les documents des autres couches arrivent par leurs commits. Aucun succès global supposé.

Arbitrage explicite du 2026-11-15 : conserver les emplacements webapp déjà retenus (Dashboard, services, shared, schemas, server, sites et deux sites clients), sans autoriser leurs sous-dossiers techniques. Test positif de ces huit emplacements et cas négatif sous server ajoutés. Les autres écarts sont traités sans exemption implicite.

### Complément de vérification

Les procédures sont conservées dans la documentation ; les README profonds non retenus sont retirés par WEB-007. Les huit emplacements webapp explicitement confirmés restent autorisés. Les 16 tests du vérificateur README réussissent. La vérification globale suit l’intégration des suppressions commitées de WEB-007.
