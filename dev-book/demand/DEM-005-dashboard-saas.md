# DEM-005 — Dashboard SaaS multi-client et multi-projet : socle et articles

- Type : développement
- Conventions : [dev-book](../../dev-book/README.md).
- Session de création : 01a1ca56-891a-7700-97c6-a576d3d9a615
- Date : 2026-11-11
- État : reconstituée localement sur `demands/DEM-005` ; périmètres validés seulement, recette Symfony réelle différée ; messages de six commits à régulariser avant livraison
- Confirmation humaine : « oui », après restitution du cadrage dans cette session.
- Identifiant réservé : DEM-005 ; aucun fetch effectué pour cette attribution.

## Besoin et décisions

Créer un dashboard commun dans `webapp/dashboard/`, au même niveau que `sites/`,
avec une adresse dédiée. Une organisation cliente possède plusieurs projets ;
un projet correspond à un site. Un compte peut appartenir à plusieurs organisations
et sélectionner l’organisation puis le projet actif.

### Utilisateurs et accès

- L’équipe du propriétaire du SaaS gère tous les clients, crée les organisations et projets.
- Connexion par e-mail et mot de passe, sur invitation ; pas d’inscription libre.
- Cette équipe et un administrateur désigné chez chaque client invitent ou retirent les collaborateurs.
- Les collaborateurs clients accèdent à tous les sites de leur organisation.
- Tous les utilisateurs ayant accès au projet peuvent rédiger, publier et créer ou modifier les catégories.
- Catégories, médias et contenus sont isolés par projet ; aucun partage de médias entre sites dans cette version.

### Interface et navigation

Interface française sobre avec Nuxt UI, adaptée au mobile, indépendante des identités clientes.
Conserver le menu complet ci-dessous et signaler clairement les fonctions indisponibles.

| Rubrique | Entrées |
| --- | --- |
| Contenus | Pages, Articles, Séjours, Landing Pages, Composants du site |
| Médiathèque | Images, Vidéos, Documents, Icônes |
| Formulaires | Contact, Product |
| CRM et commerce | Personnes, Commandes, Codes promo, Tarifs |
| Administration | Administrateurs, Organisation, Réseaux sociaux |

Composants du site est une entité principale : Logo, Footer, Newsletter, Séjours,
Avis clients, Intro, Traductions. Le composant Séjours et les fiches de séjours
restent deux entrées distinctes. Les catégories n’ont pas d’entrée latérale.
Les Tarifs restent dans CRM et commerce tant que leur relation aux séjours n’est pas confirmée.

### Premier parcours : article

Base de fiche confirmée : titre, slug, résumé, image principale, catégories,
blocs de contenu, titre SEO et méta-description. Vérifier la matrice exacte des champs,
relations et traductions dans les formulaires et le modèle Symfony avant implémentation.

Éditeur par blocs texte mis en forme, image et galerie : ajout, suppression, réorganisation.
Les composants du site seront insérables ultérieurement.

Depuis la fiche, sélectionner une catégorie existante ou la créer/modifier dans une fenêtre
ou un panneau latéral. Une catégorie créée est automatiquement sélectionnée.
Une modification partagée prend effet immédiatement sur les articles concernés du projet,
après avertissement explicite sur son impact. Sélectionner un média existant ou importer
un fichier depuis la fiche. Conserver les saisies lors des opérations imbriquées,
annulations et erreurs de validation.

Articles traduisibles en français, anglais et espagnol ; chaque traduction dispose de son
brouillon, d’une prévisualisation privée avec le rendu du site, et de ses actions Publier
et Dépublier. Une modification enregistrée reste en brouillon : la dernière version publiée
reste visible jusqu’à nouvelle publication. Dépublier conserve le contenu dans le dashboard.

Avant de quitter une fiche ou changer de projet sans enregistrer, avertir et proposer de
rester ou d’abandonner la saisie. Si une autre personne a enregistré entre-temps, bloquer
l’écrasement, conserver la saisie et signaler le conflit.

### Backend et site pilote

Symfony existant reste le stockage durable et doit être utilisé tel quel : aucune évolution
backend à prévoir pour DEM-005. Le dashboard et ses adaptateurs doivent consommer ses capacités réelles.
Les schémas locaux ne prouvent pas leur disponibilité dans l’API réelle.

Client 2 Immobilier est le site pilote : liste des articles publiés et page par article,
dans chaque langue publiée, avec métadonnées SEO. Les brouillons et prévisualisations
restent réservés aux utilisateurs autorisés.

### Exclusions

Remplacement du dashboard Showcase actuel et migration des biens ; autres parcours métier
complets ; insertion de composants du site dans les articles ; partage de médias entre sites ;
abonnements, facturation et paiement SaaS. Le dashboard existant reste disponible.

### Points à résoudre à l’analyse

- Localiser le dépôt Symfony ; vérifier articles, catégories, médias, comptes, invitations,
  organisations/projets, autorisations, traductions, versions publiées et conflits concurrents.
- Vérifier la matrice des champs et relations, notamment le modèle de catégories.
- Définir les contrats de publication et de prévisualisation vers Client 2 et ses langues.
- Affecter `webapp/dashboard/`, actuellement absent des chemins de
  [configuration des couches](../../infra/config/layers.json), et vérifier la composition Nuxt.
- Le dev-book actuel ne possède pas l’ancre `types-de-demandes` mentionnée par le skill :
  type explicite conservé ici, sans modification de gouvernance à cette étape.

Références existantes : [composition des sites](../../docs/2.architecture/14.site-layers.md),
[contrat dashboard/Symfony](../../docs/3.application/bff-dashboard-symfony.md),
[DTO article](../../webapp/schemas/source/dtos/symfony_api/article.yaml),
[modèle article](../../webapp/schemas/source/webapp/article.yaml),
[état initial de Client 2](../../webapp/sites/client2-immobilier/README.md).
Ces références décrivent l’existant et ne remplacent pas les vérifications backend.

## Critères et cartes

1. Connexion sur invitation, sélection organisation/projet, gestion des accès selon les droits ci-dessus.
2. Démonstration avec deux organisations et plusieurs projets : aucun accès en lecture ou écriture
   hors autorisations, y compris par appels directs à l’API ; médias et catégories isolés par projet.
3. Menu complet conforme ; fonctions indisponibles signalées ; catégories accessibles depuis les fiches.
4. Créer/modifier un article, ses blocs, catégories et médias ; enregistrer puis rouvrir sans perte
   de champs, d’associations ou d’ordre des blocs.
5. Créer une catégorie depuis le sélecteur la sélectionne automatiquement ; modification partagée
   avertie ; annulation et validation échouée conservent la saisie de l’article.
6. Vérifier la protection des saisies lors d’un départ, changement de projet ou conflit concurrent.
7. Pour chaque langue, prévisualiser de manière privée, publier et dépublier indépendamment ;
   les modifications en brouillon ne remplacent pas la version publique.
8. Sur Client 2, liste et pages publiques reflètent les traductions publiées et leurs métadonnées SEO.
9. Vérifier le parcours au mobile et la disponibilité du dashboard Showcase existant.

Cartes issues du découpage : voir la matrice en fin de document ; cartes dans les worktrees affectés.
Documentation à mettre à jour lors de la réalisation : administration des accès,
parcours éditorial, architecture et contrats backend/publication, avec référence unique par sujet.

## Vérification et livraison

Preuve de cadrage : restitution confirmée par l’humain dans la session de création.
Vérification de cette étape : dépôt principal propre sur `develop`, index vide,
`tmp/` ignoré ; identifiant suivant vérifié sur références Git locales, brouillons et worktrees.
Aucune implémentation, validation de résultat, carte, branche, réservation de couche,
commit, push, PR ou livraison réalisés à cette étape.

### Analyse du 2026-11-11 — historique, décisions révisées ci-dessous

- Session intervenante : 01a1ca56-891a-7700-97c6-a576d3d9a615.
- Base locale observée : `develop`, `layers/web`, `layers/devops` à
  `5dc9fe796cb24a4bc5d604835c4092e8a309e6dd`, arbres et index propres.
  Disponibilité confirmée par la clôture DEM-004 dans `tmp/demande-vhosts-locaux.md`
  et la livraison DEM-003 ; aucun fetch ni service lancé.
- Worktrees existants : `worktree/web` et `worktree/devops` ; BFF/Domaine absents.
- Backend local identifié : `/home/johan/www/graines-digitales/api/symfony-8-api-platform`,
  branche `master`, HEAD `9fed427658d9c0983b5982a6e6922d179a6bf4eb`, propre.
  Inspection en lecture seule ; aucune affectation ni contribution sur master autorisée.

#### Matrice de l’existant et des écarts

Les chemins PHP ci-dessous sont relatifs au backend identifié ; les preuves portent
sur ses sources locales, pas sur une API déployée ni sur des tests exécutés.

| Besoin | Source observée | Écart à traiter |
| --- | --- | --- |
| Articles par projet, CRUD et traductions | `src/Entity/Article.php`, `ArticleTranslation.php` | API existante ; DTO webapp obsolète à réaligner |
| Titre, slug, corps par langue | `ArticleTranslation.php` : `headline`, `slug`, `body` | Champs existants ; valider contraintes et sérialisation |
| Résumé, image principale, catégories, SEO, blocs | `ArticleTranslation.php` : `schemaData` JSON ; schéma webapp `article.yaml` plus large | Aucun contrat typé ni relation article explicite observés ; fixer stockage, validation et références de projet |
| Catégories traduites | `src/Entity/CategoryCode.php` : `codeValue`, `inCodeSet`, traductions | Définir le code set article et sa relation ; calculer les usages pour l’avertissement |
| Publication par langue et version publiée conservée | `Article.php` : un seul `ContentStatus` à la racine | Ajouter snapshots publiés et transitions par traduction |
| Conflits concurrents | Entités Article inspectées | Pas de version optimiste observée ; ajouter précondition d’écriture et conflit exploitable |
| Organisation et plusieurs projets | `src/Entity/Organization.php`, `Project.php`, memberships | Vérifier collections, création réservée à l’équipe et gestion des membres |
| Accès de tous les collaborateurs à tous les projets de leur organisation | `src/Security/ProjectAccessGuard.php` | Lecture/écriture basées sur ProjectMember ; appartenance organisation seule insuffisante |
| Invitations et mot de passe | Contrôleurs de création utilisateur/membres existants | Pas de parcours invitation trouvé dans src/config/tests ; prévoir acceptation, expiration, révocation et récupération du mot de passe |
| Langues éditées indépendamment | `docs/04-domain-model/translations.md` | Auto-traduction et fallback existants ; ne pas publier une langue de substitution comme traduction validée |

#### Architecture et prérequis

La référence imposée `nuxt-builder/CLAUDE.md` réserve `dashboard/` à une couche
`dashboard`, branche `layers/dashboard`, préfixe `DASH`. La configuration locale
ne possède pas cette couche ; ne pas l’inventer dans les cartes ni affecter silencieusement
ce dossier à Web. Le routage retenu ensuite par l’humain est tracé ci-dessous.

Les contrôles existants ne découvrent que les apps historiques, sites et base immobilière
(voir [Codebase Integrity](../../codebase-integrity/README.md)). Étendre leur couverture
à dashboard relève d’une consolidation déclarée préalable, distincte de DEM-005.
Aucun changement de contrôle ni de configuration de couche effectué ici.

Option technique à détailler après résolution des prérequis : une build dashboard distincte,
Symfony comme source durable, contrats partagés purs, BFF gardant les jetons utilisateurs
côté serveur ; sites publics servis depuis une projection publiée, sans API Symfony sur le
chemin visiteur, conformément à Nuxt Builder. Publication et dépublication doivent avoir
un résultat vérifiable côté site ; la prévisualisation privée reste séparée du contenu public.

Travaux à couvrir dans la matrice finale : contrats et modèle éditorial ; accès et invitations
backend ; snapshots/publication/concurrence backend ; session et administration BFF ;
articles/médias/catégories BFF ; socle cible et vhost ; interface d’accès ; éditeur article ;
publication et aperçu ; rendu Client 2 ; synchronisation publiée ; vérification globale.
Les missions backend exigent leur propre routage dans le dépôt Symfony : ne pas les présenter
comme des cartes BFF Nitro ni inventer une couche API dans ce dépôt.

Décisions humaines obtenues après analyse : conserver l’auto-traduction des champs manquants
en brouillon sans publication automatique ; confier le dashboard à Web, divergence explicitement
validée avec Nuxt Builder, avec consolidation préalable des chemins et contrôles.

### Découpage DEM-005 — décisions et état réel

Décisions humaines complémentaires dans la session de création :
- « Oui, générer les traductions manquantes comme brouillons, sans jamais les publier automatiquement. »
- « Confier le dashboard à la couche Web existante : valider et tracer cette divergence,
  puis prévoir une consolidation préalable pour ses chemins et contrôles. »

La seconde décision autorise la divergence de routage, pas une évolution de Codebase Integrity
au titre de DEM-005. Aucun ajout de couche dashboard ni préfixe DASH prévu dans ce dépôt.

#### Décision active : consolidation après développement

L’instruction humaine la plus récente remplace le prérequis de consolidation posé au découpage :
« la consolidation on l’a fera plus tard », après le développement du dashboard ; retirer
les travaux de consolidation des tâches DEM-005. Cette décision prévaut sur les constats
historiques de blocage et sur les références antérieures qui en faisaient un prérequis.

- Retirer la consolidation des dépendances OPS-011, WEB-003, WEB-004 et OPS-013.
- Développer dans les chemins de leurs cartes : dashboard sous Web ; composition et
  configurations applicatives sous DevOps. Affectation spécifique autorisée pour DEM-005,
  sans modifier maintenant layers.json ni les conventions.
- Reporter l’évolution durable du routage, de la couverture des contrôles et des verrous
  de wrappers à une session ultérieure ; aucune carte de consolidation dans cette demande.
- Conserver les tests fonctionnels et contrôles existants ; ne pas affaiblir leurs règles.
- La restriction de non-intervention sur l’API Symfony reste applicable.

#### Historique — missions externes Symfony envisagées, abandonnées par décision API inchangée

Aucune couche API n’est inventée dans layers.json. Ces lots sont des dépendances de réalisation
à faire affecter selon la gouvernance du dépôt Symfony, sur branche de contribution propre,
jamais sur master. Leurs cartes backend, branches/worktrees et SHA ne sont pas encore disponibles.
OPS-010 prépare leurs contrats et leur réception ; cette carte ne réalise pas de modifications PHP.

| Lot externe | Périmètre candidat, à confirmer dans le dépôt backend | Résultat et preuves requis |
| --- | --- | --- |
| Symfony accès | Entity Organization/Project/memberships, Security guards/resolver, State providers/processors, tests fonctionnels | Accès à tous les projets de ses organisations, multi-organisations, création organisations/projets réservée équipe ; isolation et révocation testées en API directe |
| Symfony invitations | User, contrôleurs/DTO membres, Security, entités d’invitation, messages e-mail, migrations et tests | Invitation à usage limité/expirable, acceptation et mot de passe, membre existant, révocation, récupération mot de passe ; aucun accès par inscription libre |
| Symfony articles | Article/Translation, CategoryCode, MediaObject, processors et serializers, migrations et schémas backend | Matrice OPS-010 persistée, blocs validés et références project-scoped, catégories/usages, médias, auto-traductions en brouillon et conflits optimistes ; tests CRUD/relations/cross-projet |
| Symfony publication | Article/Translation et snapshots, State publication/preview/export, migrations et tests | Publier/dépublier par langue, ancienne version préservée, export uniquement publié, preview protégée, concurrence/idempotence et révocation ; pas de publication auto |

Dépendances externes : articles consomme le contrat accès ; publication consomme articles ;
invitations consomme accès. Fournir SHA et contrat observé pour chacun avant consommation.
Vérifications ciblées via les commandes make du backend ; suite complète au pré-merge seulement.
Aucun projet API de test dédié ni environnement d’envoi d’invitations n’est affecté à ce stade.
L’analyse statique est réalisée ; aucun test backend ni appel API d’écriture n’a été effectué.

#### Matrice des cartes locales

Les liens pointent vers les fichiers actuels dans les worktrees, pas vers une demande définitive.
Les répertoires sont relatifs à la racine du dépôt principal.

| Carte | Couche | Résultat | Dépendances de réalisation sans SHA à ce stade |
| --- | --- | --- | --- |
| [OPS-010](../tasks/OPS-010-fixer-contrats-et-prerequis-symfony.md) | devops | Fixer les contrats SaaS et les missions backend externes | Aucune ; travail documentaire prêt |
| [DOM-001](../tasks/DOM-001-contrats-et-transformations-articles-saas.md) | domaine | Typer les articles SaaS et leurs transformations pures | OPS-010 |
| [OPS-011](../tasks/OPS-011-composer-cible-dashboard.md) | devops | Composer la cible dashboard indépendante | DOM-001 |
| [BFF-002](../tasks/BFF-002-sessions-et-administration-saas.md) | bff | Sécuriser les sessions et l’administration SaaS | DOM-001 ; API existante, sans livraison backend |
| [BFF-003](../tasks/BFF-003-edition-articles-categories-medias.md) | bff | Exposer l’édition des articles et ressources par projet | DOM-001, BFF-002 ; API existante |
| [BFF-004](../tasks/BFF-004-publication-et-previsualisation-privee.md) | bff | Orchestrer publication et prévisualisation privées | BFF-003, DOM-001 ; orchestration Nuxt |
| [WEB-003](../tasks/WEB-003-socle-et-acces-dashboard.md) | web | Créer le dashboard et ses parcours d’accès | OPS-010, OPS-011, DOM-001 ; BFF-002 pour vérification réelle |
| [WEB-004](../tasks/WEB-004-editeur-articles-et-metadonnees.md) | web | Éditer les articles, blocs et métadonnées sans perdre la saisie | WEB-003, OPS-010, OPS-011, DOM-001 ; BFF-003/004 pour vérification réelle |
| [WEB-005](../tasks/WEB-005-articles-publics-client2.md) | web | Afficher les articles publiés et leur aperçu sur Client 2 | DOM-001, OPS-012, BFF-004 |
| [OPS-012](../tasks/OPS-012-servir-dashboard-et-projeter-articles.md) | devops | Servir la cible dashboard et synchroniser les seuls articles publiés | OPS-011, DOM-001, WEB-003/004 pour le service ; BFF-004 pour snapshots/export/projection |
| [OPS-013](../tasks/OPS-013-verifier-ensemble-et-documenter-saas.md) | devops | Vérifier l’ensemble SaaS et documenter son usage | OPS-010, OPS-011, OPS-012, DOM-001, BFF-002, BFF-003, BFF-004, WEB-003, WEB-004, WEB-005 ; intégration avec l’API existante |

Couverture des critères du besoin : 1 → BFF-002/WEB-003 ; 2 → contrats Symfony,
BFF-002/003/004 et OPS-013 ; 3 → WEB-003 ; 4–6 → DOM-001/BFF-003/WEB-004 ;
7 → BFF-004/WEB-004/OPS-012 ; 8 → WEB-005/OPS-012 ; 9 → OPS-013.

Ordre courant : OPS-010 et DOM-001 sont validées et commitées ; OPS-011 est prête.
Les autres cartes suivent leurs dépendances fonctionnelles par commits. Les fonctions backend
ne sont pas présumées disponibles sur la foi de mocks. Une tâche amont sans commit ne libère
pas son consommateur.
Les cartes d’une couche restent séquentielles ; aucune délégation autorisée ni effectuée.

OPS-013 porte la vérification globale après réunion des commits ; elle ne bloque pas la réalisation
des cartes indépendantes. Aucun échange de modifications non commitées entre worktrees.
Les contrats documentaires et applicatifs sont consommés seulement après validation/commit.

Branches préparées : Web et DevOps réutilisées ; BFF/Domaine créées par les commandes locales
`make worktree-add LAYER=<couche> BASE=5dc9fe796cb24a4bc5d604835c4092e8a309e6dd`.
Pas de rebase, fetch, service, copie de secrets ni changement des .env.
Toutes les branches layers/* sont sur cette base ; leurs seules modifications sont les cartes DEM-005.
Le dossier principal reste sur develop, propre pour les fichiers suivis ; seul ce brouillon ignoré évolue.

Reconstitution prévue : worktree relatif `.`, branche `demands/DEM-005` depuis develop local
vérifié, uniquement après cartes validées et commits disponibles ; à cette étape créer la demande
définitive et remplacer les références futures. Pas de branche finale créée maintenant.
Après fusion distante réelle, retour du principal sur develop suivant le skill de livraison,
sans contribution de tâche sur develop. Aucun déploiement production implicite.

État de sortie : 11 cartes locales préparées ; une prête pour travail documentaire, dix non prêtes
faute de SHA amont. Les quatre missions externes sont spécifiées mais non affectées/non prêtes ;
le découpage backend doit être matérialisé dans son dépôt avant d’annoncer la demande entièrement prête.

Contrôles de sortie du découpage (2026-11-11) : `make aide-check` depuis DevOps réussi
(registre, types des demandes, documents et 111 tests Python). Types de demandes et documents
également conformes depuis Web, BFF et Domaine. Les 11 nouvelles cartes, y compris non suivies,
font partie du scan documentaire ; aucun artefact de demande définitive créé pour satisfaire un contrôle.
Contrôle direct des 11 cartes : session réelle, couche/branche, rubriques et absence de commit vérifiées.
Les indices des quatre worktrees restent vides ; seuls les fichiers de cartes attendus sont non suivis.
Tests applicatifs et backend non exécutés : aucun code implémenté. Ces contrôles ne valident
ni le comportement SaaS ni les capacités d’un backend déployé.

### Implémentation du 2026-11-11

Session intervenante : 01a1ca56-891a-7700-97c6-a576d3d9a615. Restriction humaine persistante : ne pas modifier l’API backend
pour le moment. Les quatre lots Symfony restent des dépendances futures, non engagées.

OPS-010 est implémentée en documentation, non commitée et à vérifier ; sa carte conserve
le livrable, les contrôles, l’empreinte et l’état exact soumis. Les capacités proposées ne sont
pas annoncées disponibles. Base DevOps : `5dc9fe796cb24a4bc5d604835c4092e8a309e6dd`.

DOM-001 reste bloquée par l’absence de commit validé OPS-010 ; OPS-011 et WEB-003 restent
aussi bloquées par la consolidation. Les autres cartes dépendent réellement de contrats,
cibles et/ou capacités backend amont ; aucune carte indépendante prête n’a été laissée de côté.
Les vérifications globales restent portées par OPS-013, sans bloquer artificiellement une
réalisation indépendante. Aucun changement non commité n’est copié entre worktrees.

La matrice ci-dessus conserve les dépendances de réalisation ; OPS-010 n’est plus « prête »
mais « implémentée, non commitée, à vérifier ». Les dix autres cartes restent non prêtes.
Aucun fichier applicatif, convention, .env ou fichier backend modifié ; aucun commit,
fetch, service, branche demands/*, demande définitive, push ou PR créé à l’étape 03.

### Verdict OPS-010 du 2026-11-11

Validation explicite : « validé ». Commit local : `5eee4c05ad298775d509a1469b5642a1517699df`,
sur `layers/devops`, limité au contrat et à la carte OPS-010 ; empreinte présentée conservée.
Le complément documentaire de commit ne trace que le SHA et l’état réel de cette carte.
DOM-001 dispose désormais de son commit amont identifié, à consommer lors de la reprise
d’implémentation ; aucune reprise automatique ni transfert non commité réalisé ici.
Les autres cartes n’ont reçu aucun verdict ; consolidation et dépendances backend inchangées.
Aucune modification Symfony, aucun push, PR, merge ou déploiement.

### Reprise d’implémentation DOM-001 du 2026-11-11

Session intervenante : 01a1ca56-891a-7700-97c6-a576d3d9a615. Contrat amont OPS-010 lu depuis son commit validé
`5eee4c05ad298775d509a1469b5642a1517699df`. Aucune copie de fichiers non commitées
ni cherry-pick créant un nouveau commit à l’étape 03.

DOM-001 est implémentée, non commitée, à vérifier ; sa carte porte les neuf chemins de réalisation,
les empreintes, les commandes et limites. Schémas runtime placés dans shared/schemas.ts pour respecter
le README shared, chemin ajouté à la carte dans le périmètre Domaine déjà configuré.
DTO article courant et contrats SaaS futurs restent distincts ; aucune évolution de l’API effectuée.
Le hook de génération actuel exclut Article des DTO par défaut : génération explicite vérifiée
ici ; prévoir son enregistrement pérenne dans OPS-011, dont le périmètre comprend ce hook.

Contrôles finaux : suite applicative 117 tests, AIDE 111 tests, TypeScript, ESLint/Prettier,
placement des types et absence de framework dans services réussis ; preuves détaillées dans la carte.

Neuf cartes restent bloquées : OPS-011/012/013, BFF-002/003/004 et WEB-003/004/005.
Le commit validé DOM-001 manque encore ; la consolidation et les quatre lots backend restent
non disponibles. Aucun travail indépendant prêt omis, aucun consommateur lancé sur le code
non commité ; aucune validation humaine de DOM-001 déduite des tests.
API Symfony propre, HEAD inchangé ; principal sur develop propre, aucun commit ni push/PR,
aucun service ni déploiement lancé pour cette reprise.

### Verdict DOM-001 du 2026-11-11

Validation explicite : « validé ». Commit local réalisé : `8c1000ecc9996cd3632a323fd1ed49604ad4e929`,
sur `layers/domaine`, limité aux neuf fichiers dont les empreintes ont été revérifiées et à sa carte.
Le complément documentaire ne trace que le SHA et l’état réel. Domaine propre après le commit
de réalisation ; aucune autre carte embarquée, aucune API backend modifiée.
OPS-011 dispose de son commit Domaine amont ; la consolidation de chemins/contrôles reste absente.
Les dépendances Symfony des cartes concernées restent non disponibles. Aucune étape suivante
lancée automatiquement ; aucun push, PR, merge ou déploiement.

### Tentative ciblée OPS-011 du 2026-11-11

Commit DOM-001 vérifié : `8c1000ecc9996cd3632a323fd1ed49604ad4e929`.
OPS-011 reste bloquée avant code par la consolidation explicitement prévue et toujours absente :
affectation des configurations racine à DevOps, chemin dashboard à Web, couverture des contrôles.
Preuves et état mis à jour dans sa carte ; aucun changement du cadre ni de code applicatif,
aucun commit créé et aucune autre étape lancée automatiquement.

### Révision de planification — consolidation différée

Instruction humaine du 2026-11-11 : développer d’abord le dashboard et effectuer la consolidation
à la fin ; supprimer les travaux de consolidation prévus dans les tâches. Décision active ci-dessus.
Aucune carte dédiée à la consolidation n’avait été créée : retrait de ses dépendances et conditions
dans OPS-011, WEB-003, WEB-004 et OPS-013, sans supprimer les travaux fonctionnels.
OPS-011 est désormais prête avec le commit DOM-001 identifié. Aucun commit ni code modifié ici.

### Implémentation OPS-011 du 2026-11-11

Session intervenante : 01a1ca56-891a-7700-97c6-a576d3d9a615. Composition dashboard, alias/types/outils et hook Article
réalisés dans le worktree DevOps, sans code UI et sans modification Symfony ou de contrôle.
La carte porte les neuf chemins, empreintes, commandes et limites. Dépendance DOM-001 consommée
par son commit validé dans un snapshot de test, sans copie dans la branche ni commit intermédiaire.

Preuves : suite assemblée 118 tests applicatifs, 111 tests AIDE ; type-check des vraies sources
Showcase et des trois layers minimales de composition ; builds Client 2 et dashboard à sorties
coexistantes ; lint/format conformes. Le dashboard réel reste à réaliser par WEB-003.
OPS-011 est implémentée, non commitée, à vérifier ; aucune validation déduite des contrôles.
Les consommateurs attendent son commit validé. La consolidation reste différée selon instruction
humaine ; aucun prérequis de consolidation réintroduit, aucune autre étape lancée.

### Verdict OPS-011 du 2026-11-12

Validation humaine explicite : « validé ». Commit local : `f3664dd5a92a2202a285f3e04de9ba13ebf72863`,
sur layers/devops, limité aux neuf fichiers de réalisation et à sa carte. Empreintes
identiques à la présentation ; complément documentaire limité à la trace du SHA et de l’état.
OPS-012/013 préservées hors index ; aucune autre carte validée par ce verdict.
Aucune reprise automatique d’implémentation, aucune modification Symfony, aucun push,
PR, merge ou déploiement. La consolidation reste reportée après le développement.

### Implémentation WEB-003 du 2026-11-12

Reprise via `implementer-demande DEM-005`, même session. Dépendance BFF-002 corrigée :
nécessaire à la vérification des accès réels, pas à l’implémentation du frontend selon le
contrat commité. Preuves, empreinte et limites dans la carte WEB-003 liée à la matrice.
WEB-003 est implémentée, non commitée, à vérifier ; aucun verdict humain présumé.
WEB-004 attend notamment son commit et les contrats BFF ; les fonctions BFF dépendantes
de capacités Symfony absentes et la vérification globale restent différées.
Aucune modification de l’API Symfony ; aucune consolidation, aucun commit ni livraison.

### Verdict WEB-003 du 2026-11-12

Validation humaine explicite : « validé », limitée à WEB-003 présentée.
Commit local : `f3398f8cc12474640737887b77e16d0ca7afe90d` sur `layers/web` ;
empreinte des 26 fichiers applicatifs/tests inchangée. Complément documentaire limité
à la trace du SHA et de l’état ; WEB-004/005 préservées hors index.
La carte reste à livrer, sans validation globale de DEM-005. Aucun push, aucune
modification Symfony ni reprise automatique d’implémentation ou consolidation.

### Reprise WEB-004 du 2026-11-12

WEB-003 est maintenant consommable par son commit validé. Les dépendances BFF-003/004
sont limitées à la vérification réelle : le frontend éditorial peut être réalisé sur le
contrat OPS-010 et les types DOM-001 committés, avec des réponses simulées dans les tests.
WEB-004 est en cours sur `layers/web`, sans modification Symfony ni consolidation.

### Présentation WEB-004 du 2026-11-12

WEB-004 est implémentée, non commitée, à vérifier. Sa carte liée à la matrice contient
le périmètre, les preuves, l’empreinte et les limites du frontend avec BFF simulé.
Aucune validation humaine présumée ; aucun changement Symfony ni consolidation.
Les trois cartes BFF restent dépendantes des capacités backend non livrées ; OPS-012
attend le contrat d’export réel, WEB-005 son interface de projection et d’aperçu, OPS-013
la réunion et les environnements d’intégration. Aucun blocage de consolidation réintroduit.

### Verdict WEB-004 du 2026-11-12

Validation humaine explicite : « validé », limitée à WEB-004 présentée.
Commit local : `c276814c2a95fec82c9f9f586cbd7e7c7dd9a608` sur `layers/web` ;
empreinte des 16 fichiers applicatifs/tests inchangée. Complément documentaire limité
à la trace du SHA et de l’état ; WEB-005 préservée hors index.
La carte reste à livrer ; aucune validation globale de DEM-005, aucun push,
aucune modification Symfony ni reprise automatique d’implémentation ou consolidation.

### Reprise partielle OPS-012 du 2026-11-12

Service/vhost dashboard réalisé indépendamment de Symfony publication ; la carte OPS-012
porte les preuves et l’empreinte de cette partie non commitée, à vérifier. Sa dépendance
backend reste réelle pour l’export, la projection et la synchronisation, non réalisés.
La carte entière n’est pas terminée. WEB-005 et OPS-013 attendent encore cette interface
et les intégrations BFF ; aucune consolidation réintroduite, aucune modification Symfony.

### Verdict partiel OPS-012 du 2026-11-12

Validation humaine explicite : « validé », limitée au service/vhost présenté.
Commit local : `6a0885beb5bcd275834d9c383c296161d57696d9` sur `layers/devops` ;
empreinte des huit fichiers de réalisation inchangée. Complément documentaire limité
à la trace du SHA et de l’état ; OPS-013 préservée hors index.
Cette partie reste à livrer ; OPS-012 reste incomplète pour l’export, la projection et
la synchronisation. Aucun autre verdict, aucun push ni modification Symfony ; aucune
reprise automatique d’implémentation ou consolidation.

### Réanalyse du dashboard existant — décision active du 2026-11-12

Instruction humaine : utiliser l’API telle quelle et analyser le dashboard existant en profondeur.
Cette décision remplace les prérequis de livraison de quatre lots Symfony figurant dans le
premier découpage. Ils ne constituent plus le chemin de réalisation. Aucune modification
PHP, migration, route backend ou consolidation n’est autorisée ni proposée ici.
Session intervenante : `01a1ca56-891a-7700-97c6-a576d3d9a615`.

**Correction du constat précédent :** l’absence d’endpoints correspondant exactement au contrat
SaaS imaginé ne signifie pas que l’API ne permet pas de raccorder le dashboard. Les interfaces
`/api/saas` et les modèles DOM-001 sont des contrats applicatifs cibles, pas le contrat Symfony.
Il faut les adapter ou les réviser au lieu d’exiger leur implémentation en PHP.
Les commits validés restent conservés ; cette analyse ne valide pas leur raccordement réel.

#### Chaîne existante effectivement examinée

1. Le formulaire historique appelle `POST /api/auth/login` du BFF. Celui-ci valide les
   identifiants auprès de Symfony, vérifie le membership du projet configuré puis crée
   la session Nuxt. Les écritures emploient ensuite un JWT de service privé en cache.
   Sources : [connexion](../../webapp/server/api/auth/login.post.ts),
   [membership](../../webapp/server/utils/auth/symfonyProjectMember.ts),
   [jeton serveur](../../webapp/server/utils/dashboard/symfonyAuth.ts).
   Ce modèle est mono-projet : ne pas reprendre un projet fixe et un jeton privilégié
   global comme preuve d’autorisation multi-client.
2. Les brouillons UI sont séparés par langue et les champs modifiés sont suivis.
   La sauvegarde envoie `translations[]` ; le BFF mappe les champs, appelle les routes
   existantes `POST/PUT .../accommodations/.../translations`, récupère les traductions
   puis réécrit la projection locale. Aucun export backend spécifique n’est nécessaire.
   Sources : [éditeur historique](../../webapp/sites/showcase-immobilier/app/components/dashboard/PropertyEditorSlideover.vue),
   [sauvegarde BFF](../../webapp/server/api/dashboard/accommodations/[identifier].put.ts),
   [export local atomique](../../webapp/server/utils/dashboard/markdownExporter.ts).
3. Le sélecteur crée déjà un CategoryCode, l’ajoute au cache puis le sélectionne sans
   remplacer le brouillon de la fiche. L’import transmet le fichier et les traductions
   à `POST .../media-objects/translations`, fixe la locale et actualise le YAML local.
   Sources : [sélecteur](../../webapp/sites/showcase-immobilier/app/components/dashboard/CategoryCodeSelect.vue),
   [création catégorie](../../webapp/server/api/dashboard/category-codes.post.ts),
   [upload](../../webapp/server/api/dashboard/media/upload.post.ts),
   [projection des ressources](../../webapp/server/utils/dashboard/contentProjection.ts).
4. La synchronisation parcourt déjà les collections paginées, conserve les limites d’origine
   des liens Hydra, mappe les données et écrit par langue. Le public lit ces fichiers.
   Source : [synchronisation existante](../../webapp/scripts/content-sync.ts).
   Son contenu actuel concerne les biens ; l’étendre aux articles reste du travail Nuxt.

#### Capacités natives et adaptation nécessaire

Backend examiné en lecture seule : `/home/johan/www/graines-digitales/api/symfony-8-api-platform`,
HEAD `9fed427658d9c0983b5982a6e6922d179a6bf4eb`, arbre propre avant/après.
Les chemins API ci-dessous sont relatifs à ce dépôt ; documentation propriétaire :
`docs/03-api-contracts/translations.md`, `docs/04-domain-model/translations.md`,
`docs/06-security/authentication.md` et `authorization.md`.

| Sujet | Existant vérifié | Conséquence pour DEM-005 |
| --- | --- | --- |
| Connexion et renouvellement | `/api/auth/login`, `/api/auth/refresh` | Réaliser les sessions BFF sur ces routes ; aucun nouvel endpoint Symfony requis |
| Organisations/projets | Collections et créations existantes ; providers filtrés par appartenance ; rôles plateforme/organisation/projet | Construire les sélecteurs et adapter les droits réels ; lister un projet n’accorde pas automatiquement l’accès à ses contenus |
| Membres | POST organisation crée/associe un utilisateur ; POST projet associe un utilisateur déjà membre de l’organisation | Provisionner les memberships avec ces routes et les droits de l’acteur, plutôt qu’attendre un nouveau modèle SaaS |
| Articles | `Article.php` expose CRUD, GET/PUT item `/translations`, POST collection `/translations` ; article = `headline`, `body`, `slug`, `schemaData`, statut racine | Raccorder liste, lecture et sauvegarde maintenant ; mapper le DTO SaaS vers le payload réel |
| Métadonnées et blocs | `ArticleTranslation.schemaData` est un JSON localisé lisible/inscriptible | Définir un namespace applicatif validé et préserver les clés existantes ; ce stockage natif peut porter SEO, références et structure, sans nouvelles colonnes |
| Traductions | Les routes bulk appliquent les saisies puis complètent les champs manquants ; Article auto-traduit `headline` et `body` uniquement | Consommer `translations[]` sans fallback et conserver les brouillons ; les textes dans `schemaData` ne sont pas automatiquement traduits |
| Catégories et médias | CRUD/catalogues projet, création multilingue et upload déjà présents | Réutiliser les relais et projections ; valider explicitement les références du JSON article dans le projet |
| Publication et rendu public | L’ancien BFF écrit déjà une projection locale après sauvegarde | Réaliser les snapshots par langue, la publication explicite et la projection dans Nuxt ; ne plus attendre un endpoint d’export Symfony inexistant |

Précisions de mapping à respecter : les champs localisés sont dans `translations[]` sur les
routes bulk ; le `PUT .../{id}/translations` traite ces traductions, pas arbitrairement tous
les champs racine du contrat SaaS. Le slug de traduction est en lecture dans les groupes du
PUT bulk ; la ressource Article possède toutefois un setter racine inscriptible, et le POST
bulk dispose du mode `resourceId`. Choisir le chemin documenté adapté, sans inventer un
`PUT /translations/{locale}` Symfony. La révision opaque du frontend n’est pas une révision
native de l’API. Les usages de catégories et les projections sont à calculer côté application.

#### Limites précises, sans blocage global artificiel

- Le `PUT` de CategoryCode refuse explicitement `label` ; `text` reste éditable. La
  documentation REST ancienne et le POST générique présentent des différences : ne pas
  contourner cette règle en exploitant un autre chemin. Le renommage promis dans l’UI
  doit être recadré sur le contrat réellement supporté.
- Les routes examinées n’exposent ni reset du mot de passe ni DELETE de membership.
  Une invitation applicative peut orchestrer les POST de provisioning ; elle ne crée pas
  pour autant une capacité native de reset/révocation. Ne pas annoncer ces actions comme
  disponibles sans solution réelle et sans distinguer accès dashboard et accès API direct.
- Aucun contrôle atomique `If-Match`/version optimiste n’a été trouvé. Un verrou et une
  révision dans le BFF peuvent sérialiser les écritures du dashboard ; une comparaison
  GET puis PUT ne garantit pas l’absence de conflit avec un autre écrivain API direct.
- L’auto-traduction existe dans le pipeline, mais le `GoogleTranslateClient.php` local
  renvoie actuellement le texte reçu tel quel. Cela ne prouve pas l’état d’un déploiement.
- La documentation OpenAPI locale configurée sur le port 18080 a été tentée en GET public :
  connexion refusée. Aucun service API n’a été démarré, aucune requête métier, connexion
  utilisateur, écriture API ou suite backend n’a été exécutée pendant cette analyse.

#### Suite corrigée

Le prochain travail est le raccordement au contrat existant : corriger les hypothèses d’OPS-010
et les cartes BFF, puis implémenter connexion/organisations/projets et CRUD article avec les
routes natives. BFF-004 et OPS-012 doivent porter l’orchestration de publication/projection
Nuxt ; WEB-005 consommera cette projection. Les fonctions non supportées doivent être
identifiées précisément dans les critères, sans modifier Symfony ni les déclarer réalisées.
Les anciennes dépendances de livraison backend des cartes restent des traces à remplacer
lors de ce recadrage ; elles ne justifient plus l’arrêt de tout développement.
Aucun code applicatif, carte ou commit n’est modifié par cette seule réanalyse.

### Implémentation partielle BFF-002 du 2026-11-12

Même session, couche `layers/bff`, base `5dc9fe796cb24a4bc5d604835c4092e8a309e6dd`.
Sessions et administration native implémentées sans commit ; détails, configuration, preuves
et limites dans [BFF-002](../tasks/BFF-002-sessions-et-administration-saas.md).
Les dépendances de livraison Symfony de BFF-002/003/004 sont retirées de la matrice et des
cartes BFF : API inchangée. BFF-003 attend le commit validé du socle BFF-002 ; les autres
consommateurs restent séquencés selon leurs dépendances effectives.

Invitations, récupération de mot de passe et retrait de membres ne sont pas réalisés :
réponses explicites d’indisponibilité. Le raccordement des handlers à la cible dashboard
reste à réaliser après leur commit, puis l’intégration réelle à vérifier ; aucun résultat
API directe ni parcours complet n’est annoncé. Les anciennes cartes OPS documentant
les hypothèses backend devront être alignées à leur reprise, sans mission PHP ni consolidation.

### Verdict partiel BFF-002 du 2026-11-12

L’humain confirme « oui » après clarification du périmètre partiel soumis : BFF-002
est validée et commitée pour ce seul périmètre, avec les limites de sa carte conservées.
Implémentation/verdict : `e9b922ac3be8d1106b812e665264e5988194f6c7` ;
trace du SHA : `d0ca9571b98e66ef6fc6218c51710696cd82ed78`, sur `layers/bff`.
Empreinte de présentation vérifiée avant commit ; index final vide, seules les préparations
BFF-003/004 restent non suivies et exclues. BFF-003 peut désormais consommer ce socle
commité ; aucune étape suivante démarrée. DEM-005 reste en cours, aucune livraison effectuée.

### Implémentation BFF-003 du 2026-11-12

Même session, reprise de DEM-005 sur `layers/bff`, base
`d0ca9571b98e66ef6fc6218c51710696cd82ed78`. Adaptateurs articles, catégories et médias
implémentés sans commit ; matrice native, preuves et limites dans
[BFF-003](../tasks/BFF-003-edition-articles-categories-medias.md).
API Symfony inchangée. Révision contrôlée dans le BFF, sans prétendre à un verrou
atomique sur les écritures API directes. La modification du libellé affiché d’une catégorie
utilise son `text` traduit et conserve son identité native immuable.
BFF-004 attend le commit validé de BFF-003 ; export/projection OPS-012 et parcours public
WEB-005 attendent ce flux. OPS-013 attend leur réunion. Le raccordement dashboard et
l’intégration réelle restent à effectuer ; aucun parcours navigateur complet annoncé.

### Verdict BFF-003 du 2026-11-12

L’humain répond « validé » à la restitution technique de BFF-003 avec ses limites.
Implémentation/verdict : `88ce086914fd34efe006535a5c5f68f1c0a3d6fa` ;
trace du SHA : `44fd37be45cce98aedff7311d539adebbf36bac2`, sur `layers/bff`.
L’empreinte des 20 fichiers a été vérifiée avant indexation ; les 19 sources restent
identiques à celles présentées. Index final vide, seule la préparation BFF-004 reste
non suivie et préservée. BFF-004 peut consommer les adaptateurs commités à sa reprise.
DEM-005 reste en cours ; aucune étape suivante ni livraison démarrée.

### Implémentation BFF-004 du 2026-11-12

Même session, `layers/bff`, base `44fd37be45cce98aedff7311d539adebbf36bac2`.
Adaptateurs publication/dépublication, file durable et aperçu privé implémentés sans commit.
Le protocole de réception pour OPS-012/WEB-005, les preuves et les limites sont dans
[BFF-004](../tasks/BFF-004-publication-et-previsualisation-privee.md).
163 tests locaux réussis ; aucune requête métier ni modification sur Symfony réel.

OPS-012 (projecteur), WEB-005 (rendu public et renderer privé) et leur intégration attendent
le commit validé de BFF-004. Le recalcul après changement de catégorie et le raccordement
des handlers au dashboard restent à brancher ; ce sont des travaux fonctionnels, sans
consolidation préalable. Aucune visibilité publique réelle ni réception du renderer réel
n’est annoncée. DEM-005 reste en cours.

### Verdict technique BFF-004 du 2026-11-12

L’humain répond « validé » à la restitution technique de BFF-004 avec ses limites.
Implémentation/verdict : `1e52c1034578636c2a340d936b377d8d83132ef5` ;
trace du SHA : `ad729e86184c3a782e36545d02dc269b8defebd6`, sur `layers/bff`.
L’empreinte des 13 fichiers a été vérifiée avant indexation ; seules les traces du verdict
se sont ajoutées aux sources présentées. Couche BFF propre, index vide après les commits.
OPS-012 et WEB-005 peuvent consommer cette interface commitée à leur reprise.
DEM-005 reste en cours : intégration réelle, propagation des catégories et raccordement
dashboard restent ouverts. Aucune étape suivante ni livraison démarrée.

### Reprise OPS-012 — projection du 2026-11-12

Même session ; couche DevOps, base `911dbf09d70e79f978ca7194f6f46f74b461d3b5`.
Le contrat BFF-004 validé permet maintenant le worker de projection sans modification
Symfony. La projection, ses tests et son contrat de lecture sont implémentés,
non commités, à vérifier. Preuves et limites :
[OPS-012](../tasks/OPS-012-servir-dashboard-et-projeter-articles.md#reprise-projection-du-2026-11-12).
WEB-005 attend son commit validé ; OPS-013 attend l’assemblage. Le raccordement des
handlers SaaS et la propagation des catégories restent ouverts, sans consolidation
préalable. Aucun parcours sur API réelle ni validation humaine déduit des tests.

### Verdict OPS-012 — projection du 2026-11-12

Validation humaine explicite : « validé », sur la projection et les limites présentées.
Commit local : `9e9be7517117eff97fbc7974e3e7a60fc13a921b`, branche `layers/devops`.
Empreinte des 14 fichiers revérifiée identique avant commit ; OPS-013 préservée hors index.
WEB-005 dispose désormais de son contrat de projection commité. DEM-005 reste en cours :
lecteur public, intégration réelle, raccordement SaaS et propagation des catégories ouverts.
Aucune livraison ni étape suivante démarrée.

### Implémentation WEB-005 du 2026-11-12

Même session réelle ; couche Web, base `ce1bc495a962f5eb7093a2c0bbd1a191c29871ab`.
Les dépendances DOM-001, OPS-012 et BFF-004 sont consommées depuis leurs commits validés.
Listes/fiches publiées, SEO et renderer privé réalisés, non commités, à vérifier.
Preuves, empreinte et limites :
[WEB-005](../tasks/WEB-005-articles-publics-client2.md#réalisation-et-preuves).
OPS-013 attend ce commit validé. Restent l’intégration réelle, la transmission de
l’UUID du pilote au SSR Client 2, l’activation des handlers SaaS du dashboard et la
propagation des catégories ; aucun besoin de consolidation préalable introduit.
Aucune modification Symfony, aucun commit ni verdict humain produit ici.

### Verdict WEB-005 du 2026-11-12

Validation humaine explicite : « validé », sur WEB-005 et ses limites présentées.
Commit local : `a8cf67e7e9b2612929ad372cce060662dacca922`, branche `layers/web`.
Empreinte des 15 fichiers revérifiée identique avant indexation ; aucun changement fonctionnel.
OPS-013 dispose désormais de cette dépendance commitée. DEM-005 reste en cours pour
l’intégration réelle, la configuration Compose du pilote, l’activation des handlers SaaS
et la propagation des catégories. Aucune étape suivante ou livraison démarrée.

### Compléments fonctionnels d’intégration du 2026-11-12

Même session. L’intégration nécessite des corrections dans les cartes existantes,
sans consolidation ni modification Symfony :
[WEB-003](../tasks/WEB-003-socle-et-acces-dashboard.md#complément-fonctionnel-du-2026-11-12),
[OPS-011](../tasks/OPS-011-composer-cible-dashboard.md#complément-fonctionnel-du-2026-11-12),
[OPS-012](../tasks/OPS-012-servir-dashboard-et-projeter-articles.md#complément-fonctionnel-du-2026-11-12),
[BFF-003](../tasks/BFF-003-edition-articles-categories-medias.md#complément-fonctionnel-du-2026-11-12).
Preuves et empreintes restent dans ces cartes. Les compléments WEB-003, OPS-012 et
BFF-003 sont implémentés, non commités, à vérifier. OPS-011 est implémenté, mais son
contrôle de types global attend le commit de la correction indépendante WEB-003.
La matrice se lit avec ces compléments : OPS-013 attend leurs commits validés,
sans dépendance envers une livraison Symfony. Aucune étape de vérification humaine
ni aucun commit lancé ici ; DEM-005 reste en cours.

### Verdict des compléments du 2026-11-12

Validation explicite : « validé », limitée à WEB-003, OPS-012 et BFF-003 et à leurs
preuves sur fixtures. Empreintes revérifiées identiques avant indexation.
- WEB-003 : `ba6db7dc4a73f7df780a947a80c626211482ba63`.
- OPS-012 : `dfef16a468116ae8b1dec27d38ec643f50d66fd2`.
- BFF-003 : `f453e142889223a1a3d8dd4815cce17f8c11a039`.

OPS-011 et OPS-013 sont préservés hors index. Le contrôle de types OPS-011 peut
reprendre avec le correctif Web désormais commité ; aucune implémentation ni étape
suivante démarrée pendant la vérification. DEM-005 reste en cours, sans push ou livraison.

### Fin des contrôles du complément OPS-011 le 2026-11-12

La dépendance corrective Web est commitée ; les types du dashboard et la suite
assemblée réussissent. Preuves et périmètre inchangé :
[OPS-011](../tasks/OPS-011-composer-cible-dashboard.md#vérification-du-raccordement-reprise-le-2026-11-12).
Ce complément est implémenté, non commité, à vérifier. Une phrase obsolète du README
Client 2 est corrigée dans [WEB-005](../tasks/WEB-005-articles-publics-client2.md#mise-à-jour-documentaire-du-2026-11-12),
sans changement fonctionnel, non commitée, à vérifier également.
OPS-013 attend toujours le commit validé d’OPS-011 ; aucune consolidation ou
modification Symfony, aucun commit ni verdict humain produit à cette étape.

### Verdict OPS-011 et documentation WEB-005 du 2026-11-12

Validation explicite : « validé », sur les deux seuls compléments présentés et leurs
limites sur fixtures. Empreintes revérifiées identiques avant indexation.

- OPS-011 : `6a9fbc626aa3149395a9b40e1b55a699907209a6`.
- WEB-005 : `284692102cc3af49cd0363309399c819629548ca`.

OPS-013 dispose désormais de ses raccordements commités ; sa vérification globale
reste à réaliser. Sa carte est préservée hors index. Aucun push, fusion ou démarrage
automatique d’une autre étape ; DEM-005 reste en cours.


## Reprise OPS-013 — 2026-11-12

Même session réelle. L’utilisateur confirme l’absence d’environnement Symfony isolé
et demande : « Pas encore : poursuivre sur fixtures ». Documentation et vérifications
globales réalisées sur un assemblage jetable des seuls commits validés ; aucune
reconstitution, écriture API réelle ou consolidation. État : implémentée sur fixtures,
non commitée, à vérifier. Résultats, essais initiaux, reprises et limites dans
[OPS-013](../tasks/OPS-013-verifier-ensemble-et-documenter-saas.md).
DEM-005 reste en cours ; recette native réelle et écarts fonctionnels du contrat
ne sont pas déclarés reçus. Aucun commit, push, PR ou fusion de cette étape.


## Verdict OPS-013 — 2026-11-12

Même session réelle. Verdict humain : « validé », pour la documentation et les
vérifications sur fixtures présentées. Empreintes inchangées avant verdict consigné.
Commit local : `a1beeacbe7454523012d177a61f9a4525bf49079`.
[OPS-013](../tasks/OPS-013-verifier-ensemble-et-documenter-saas.md)
est validée et commitée localement dans ce périmètre. La recette Symfony réelle reste
différée ; aucun changement de backend, push, PR, fusion ou reconstitution.
DEM-005 reste à reconstituer/livrer selon les étapes explicitement demandées ; les
limites fonctionnelles du contrat ne sont pas déclarées résolues par ce verdict.


## Reconstitution du 2026-11-12

Session intervenante identique : `01a1ca56-891a-7700-97c6-a576d3d9a615`.
Principal `/home/johan/www/graines-digitales/modern-web-apps/showcase-immobilier`,
libre et propre sur `develop`, base locale vérifiée
`5dc9fe796cb24a4bc5d604835c4092e8a309e6dd` ; aucun fetch.
Branche `demands/DEM-005` créée depuis cette base. Les 34 commits validés, traces
incluses, ont été appliqués avec `git cherry-pick -x`, sans conflit ni modification
fonctionnelle. Les branches de couche restent sur `layers/*`. Branche à retrouver
dans le principal après une éventuelle fusion distante : `develop`.

La reconstitution couvre les seuls périmètres acceptés : BFF-002 partiel et
OPS-013 sur fixtures. Elle ne résout ni les fonctions indisponibles du
[contrat SaaS](../../docs/3.application/dashboard-saas-contrats.md), ni la recette
Symfony réelle différée. Les résultats d’ensemble restent dans
[OPS-013](../tasks/OPS-013-verifier-ensemble-et-documenter-saas.md).
Le brouillon local est conservé. Ce document et les références des cartes
restent non commités pour la trace documentaire de livraison. Aucun push, PR ou merge.

### Provenance des commits

| Source validée | Commit obtenu | Carte ou trace |
| --- | --- | --- |
| `5eee4c05ad298775d509a1469b5642a1517699df` | `297e287e9978953be283fe293897276596b34bc9` | docs(OPS-010): definir le contrat du dashboard SaaS |
| `136146ec5a6e252cab51cd3ea8dcd377e936904e` | `b127beb60f1124034d2117ab54a311480e33d760` | docs(OPS-010): tracer le commit valide |
| `8c1000ecc9996cd3632a323fd1ed49604ad4e929` | `feb5bff0575f9b35263e1245ca35db2da671ef88` | feat(DOM-001): typer et valider les articles SaaS |
| `3af26ccc0bda0781928f3ef68f8682994549c637` | `ea5ccc7eeedc9393db7a83420d3951e27dd96fc8` | docs(DOM-001): tracer le commit valide |
| `f3664dd5a92a2202a285f3e04de9ba13ebf72863` | `7310a02fdf6610655ed761478637207edac2a8ff` | feat(OPS-011): composer la cible dashboard independante |
| `a2fc20b21a54531b0db014a6ca3d52e2a65a33dd` | `c868cba820d02adb23f936c45e1b7650f16e4b7b` | docs(OPS-011): tracer le commit valide |
| `f3398f8cc12474640737887b77e16d0ca7afe90d` | `e82c78bd8953b2060def38ff3546e29e01d72726` | feat(WEB-003): creer le socle et les acces du dashboard SaaS |
| `8c505c07feba753df7aff7d394e0b8f9a6d93e32` | `be24d8e9b8bdea32767e36da2712993b1a1a292a` | docs(WEB-003): tracer le commit valide |
| `c276814c2a95fec82c9f9f586cbd7e7c7dd9a608` | `5145d9d32fc9ba6e3f1ca6eb6fa704f10149e8c8` | feat(WEB-004): ajouter l editeur articles et metadonnees |
| `ce1bc495a962f5eb7093a2c0bbd1a191c29871ab` | `d5db1316defe3860c6e937cc7a113627460271bf` | docs(WEB-004): tracer le commit valide |
| `6a0885beb5bcd275834d9c383c296161d57696d9` | `619c474d37a6651f0ae75e4f7d96c4f494d2db49` | feat(OPS-012): servir le dashboard sur un domaine local dedie |
| `911dbf09d70e79f978ca7194f6f46f74b461d3b5` | `982b8a6d79834276754b7f278f9715ef31426033` | docs(OPS-012): tracer la validation partielle du service |
| `e9b922ac3be8d1106b812e665264e5988194f6c7` | `f621594f910ec0e8e6941ac7c79df0c8b3ea8b72` | feat(BFF-002): sécuriser les sessions et accès SaaS natifs |
| `d0ca9571b98e66ef6fc6218c51710696cd82ed78` | `8ec346e2998a1e96336cbeeeb6bb9530ca6cebcb` | docs(DEM-005): tracer le commit partiel validé de BFF-002 |
| `88ce086914fd34efe006535a5c5f68f1c0a3d6fa` | `528cb5c6745eaf8382b5ee943f925dfd7bd2128c` | feat(BFF-003): raccorder articles catégories et médias à Symfony |
| `44fd37be45cce98aedff7311d539adebbf36bac2` | `27d18c0f1798c2c73923d267bf4d402772d0650e` | docs(DEM-005): tracer le commit validé de BFF-003 |
| `1e52c1034578636c2a340d936b377d8d83132ef5` | `bdd85e78528cfe6aa92f33a2ed4a197d027d2b99` | feat(BFF-004): orchestrer publication durable et aperçu privé |
| `ad729e86184c3a782e36545d02dc269b8defebd6` | `97395fffcd6b3e42510f3bf25ef88a12d79324ca` | docs(DEM-005): tracer le commit validé de BFF-004 |
| `9e9be7517117eff97fbc7974e3e7a60fc13a921b` | `1899f0da4699cd83f0ea2726e1fccb714417b02e` | feat(OPS-012): projeter les articles publiés de Client 2 |
| `c58af06562e3f0288c99625f5862b2ed28bf4f4d` | `f330109396bf91069594a78c81703599150dfff0` | docs(DEM-005): tracer le commit de projection OPS-012 |
| `a8cf67e7e9b2612929ad372cce060662dacca922` | `1b97e7c464fad3f6664cd1e98221dcbee99418d6` | feat(WEB-005): afficher les articles et leur aperçu sur Client 2 |
| `2286109212a2f1dbf01323155f0f23ebb8a37789` | `2f3065d7529d2a89fea8777e045718c0e5b71067` | docs(DEM-005): tracer le commit validé WEB-005 |
| `dfef16a468116ae8b1dec27d38ec643f50d66fd2` | `b623c76788e8b81de66c89e29436cf1058b4f603` | fix(OPS-012): transmettre le projet au lecteur Client 2 |
| `ba6db7dc4a73f7df780a947a80c626211482ba63` | `ba2d4ede52c2a05bec7ad4d497f8a2d10212f364` | fix(WEB-003): typer le transport SaaS face aux routes Nitro |
| `f453e142889223a1a3d8dd4815cce17f8c11a039` | `62ced104dd000c50eeaf8b2ff9059a41c970f20e` | fix(BFF-003): propager les catégories aux versions publiées |
| `87702aaeb0fce48c7c03ec1155919a392c81886c` | `3a340114c39d64a4fa4a80dbaf39305fc03dd268` | docs(DEM-005): tracer le complément validé OPS-012 |
| `7c95cd612c81cac4f3ff2490dbd4963ab74f5470` | `97483cdb576ec5ef9ac637499d0a5fdc424df8b2` | docs(DEM-005): tracer le complément validé WEB-003 |
| `e07ff09a55ddd6cb7f28d7decedf40ba9198e414` | `7867c6e698ea70b48cbc7bf7eefa10df845957e1` | docs(DEM-005): tracer le complément validé BFF-003 |
| `6a9fbc626aa3149395a9b40e1b55a699907209a6` | `5ca5d79e612b5e1ed439bc16311abb959d53318d` | fix(OPS-011): activer les seuls handlers SaaS du dashboard |
| `284692102cc3af49cd0363309399c819629548ca` | `74bd61920d6b0d7464c7222ad1c1031b959b7610` | docs(WEB-005): actualiser le raccordement Compose du projet |
| `37f3bae6a09fcf98244173e4f5a2a26900b16a0c` | `87a95ab7542f6d2685220113c05ef79503630795` | docs(DEM-005): tracer le complément validé OPS-011 |
| `84675cda41964147f0a3422ea64c1725bad0ffc1` | `00fa0112e0379a868db4ef7b8ab6a0634f662592` | docs(DEM-005): tracer le complément validé WEB-005 |
| `a1beeacbe7454523012d177a61f9a4525bf49079` | `911810c58ac2a6ad61e44ea56a9de6b7c564fcf0` | docs(OPS-013): vérifier le SaaS sur fixtures et documenter son usage |
| `5ba9c1041e180fd7a7d6be52107b83b91c4f1546` | `4586d4269c3d918ebadb6a0f97db2b259d7d4a8c` | docs(DEM-005): tracer le commit validé OPS-013 |

### Contrôles de reconstitution

- Les 34 patches obtenus sont identiques aux patches sources, et leur provenance
  `cherry picked from commit` est présente. Les 154 fichiers ajoutés/modifiés dans
  la plage correspondent aux versions finales validées des couches.
- `make aide-check` : réussi, 111 tests Python ; structure, métadonnées et liens
  de la demande matérialisée conformes. `git diff --check` : réussi.
- Types/build et parcours applicatifs ne sont pas rejoués : l’équivalence des
  sources avec l’assemblage contrôlé est vérifiée ; preuves et limites dans OPS-013.
- `check_commits.py --base 5dc9fe796cb24a4bc5d604835c4092e8a309e6dd --head HEAD` :
  échec. La demande définitive est encore non commitée, ce qui explique les
  références documentaires absentes dans HEAD à cette étape. Six messages sources
  présentent aussi un écart indépendant : absence de `Demande : DEM-005`.

| Source concernée | Commit obtenu |
| --- | --- |
| `f3398f8cc12474640737887b77e16d0ca7afe90d` | `e82c78bd8953b2060def38ff3546e29e01d72726` |
| `8c505c07feba753df7aff7d394e0b8f9a6d93e32` | `be24d8e9b8bdea32767e36da2712993b1a1a292a` |
| `c276814c2a95fec82c9f9f586cbd7e7c7dd9a608` | `5145d9d32fc9ba6e3f1ca6eb6fa704f10149e8c8` |
| `ce1bc495a962f5eb7093a2c0bbd1a191c29871ab` | `d5db1316defe3860c6e937cc7a113627460271bf` |
| `6a0885beb5bcd275834d9c383c296161d57696d9` | `619c474d37a6651f0ae75e4f7d96c4f494d2db49` |
| `911dbf09d70e79f978ca7194f6f46f74b461d3b5` | `982b8a6d79834276754b7f278f9715ef31426033` |

Ces messages ont été conservés par les cherry-picks ; aucune réécriture des
branches de couche ni modification du vérificateur. Un commit documentaire
supplémentaire ne corrigerait pas ces six messages historiques. Leur régularisation
exige un arbitrage sur les commits reconstitués avant livraison ; elle n’est pas
réalisée par déduction. L’invocation de reconstitution n’est pas une autorisation
de livraison. Journaux locaux : `/tmp/dem005-reconstitution-{aide,commits}.log`.
État final des commits réunis : `4586d4269c3d918ebadb6a0f97db2b259d7d4a8c`.


## Préparation de livraison du 2026-11-12

Même session réelle. Invocation de `livrer-demande DEM-005` : livraison vers
`develop`, sans promotion master. Cible distante vérifiée par `git ls-remote` :
`5dc9fe796cb24a4bc5d604835c4092e8a309e6dd`, identique à la base de reconstitution ;
aucune branche distante `demands/DEM-005` observée. Les quatre couches sont propres,
sans nouvelle mission depuis leurs validations. Les seuls changements du principal
sont la matérialisation de cette demande et les liens de ses onze cartes.

Contrôle manuel complémentaire demandé par l’utilisateur : conteneurs Symfony
existants redémarrés, origine API SaaS locale renseignée et dashboard recréé.
Connexion, session et lecture des organisations/projets : HTTP 200, une organisation
et un projet accessibles ; session de test fermée. L’utilisateur confirme
« parfait ça tourne ». Aucun mot de passe consigné, aucune modification du code
backend, migration, seed ou écriture de contenu. Ce contrôle ne remplace pas la
recette native complète d’isolation/publication différée dans OPS-013.

Le présent commit documentaire doit rendre les références de demande contrôlables
dans HEAD. Les six messages historiques incomplets restent à traiter sans affaiblir
les contrôles ni modifier les branches de couche. Aucun push ou PR avant résultat
conforme du contrôle de contribution.
