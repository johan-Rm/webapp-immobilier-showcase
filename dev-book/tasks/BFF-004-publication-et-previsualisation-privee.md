# BFF-004 — Orchestrer publication et prévisualisation privées

- Demande : DEM-005 ; type : développement
- Brouillon de référence : `tmp/demande-dashboard-saas.md`, relatif au dépôt principal, hors du worktree ; ne pas le copier.
- Demande définitive prévue : `dev-book/demand/DEM-005-dashboard-saas.md`, créée seulement à la reconstitution ; fichier actuellement absent, lien à ajouter alors.
- Session de création : 01a1ca56-891a-7700-97c6-a576d3d9a615
- Couche : bff
- Branche : layers/bff
- Worktree : worktree/bff
- Base locale vérifiée : `44fd37be45cce98aedff7311d539adebbf36bac2` ; aucun fetch.
- État : adaptateurs validés techniquement ; commit local en attente ; intégration réelle différée
- Chemins autorisés : `webapp/server/api/saas/projects/`, `webapp/server/utils/saas/publication/`, `webapp/server/utils/saas/preview/`, `webapp/server/tests/saas-publication.vitest.ts`, cette carte
- Dépendances de réalisation : BFF-003, DOM-001 ; snapshots et projection orchestrés côté Nuxt
- Commits vérifiés : BFF-003 `88ce086914fd34efe006535a5c5f68f1c0a3d6fa`, trace `44fd37be45cce98aedff7311d539adebbf36bac2` ; DOM-001 `8c1000ecc9996cd3632a323fd1ed49604ad4e929`.
- Dépendances de vérification globale : OPS-013

## Résultat et critères

Exposer publier/dépublier par traduction et prévisualiser un brouillon avec contrôle d’accès actuel.
Ne pas rendre le brouillon public par token permanent ni cache partagé ; réponses aperçu privées/no-store.
Publier un snapshot validé et signaler l’état de synchronisation publique de façon exacte.
Dépublication et révocation d’accès invalident l’accès concerné ; aucune version d’une autre langue
ou d’un autre projet ne doit être utilisée comme remplacement implicite.
Déclenchement de synchronisation via mécanisme serveur authentifié et idempotent défini OPS-010,
sans chemin arbitraire vers les fichiers clients et sans API métier sur le chemin visiteur public.
Fichiers projects/ limités ici aux sous-routes publication et preview ; coordination séquentielle BFF.
Exclusions : workers PHP, scripts de projection OPS-012, UI et modèle de stockage Symfony.

Les critères de besoin et exclusions communs restent dans le brouillon ; aucune modification
de Codebase Integrity, de règle ou de gouvernance hors consolidation déclarée.
Les métadonnées de cette carte relèvent de la trace obligatoire, même hors périmètre applicatif.
Documentation : Fournir à OPS-013 flux publication/aperçu, cache et reprise ; contrat d’erreurs dans OPS-010.

## Réalisation et preuves

Implémentation du 2026-11-12, session de création conservée. Seule cette carte de DEM-005
était non suivie à la reprise ; aucune mission étrangère dans la couche. API Symfony utilisée
telle quelle, sans modification ni requête métier réelle ; les seules écritures sont locales
au worktree et aux assemblages temporaires de test.

### Résultat présenté

Six handlers et cinq utilitaires, plus `server/tests/saas-publication.vitest.ts` :

- POST/DELETE `articles/{articleId}/translations/{locale}/publication` : capture ou retrait
  du snapshot exact, sans changer le brouillon, les autres langues ou le `status` natif global.
  Les snapshots utilisent `schemaData.gdSaas.published` de BFF-003 ; seul le namespace de
  la traduction concernée est écrit par le PUT natif `/translations`.
- GET `publication/queue` et POST `publication/ack` : export privé pour le projecteur et
  accusés authentifiés, sous le préfixe `/api/saas/projects/{projectId}/`.
- GET `articles/{articleId}/translations/{locale}/preview` et sa sous-route
  `preview/media/{mediaId}` : proxy serveur du rendu Client 2 et médias contrôlés.

Chaque commande/aperçu revérifie session, projet et ressources. Publication : révision
agrégée `If-Match`, UUID `Idempotency-Key`, associations du bon projet, catégories traduites
sans fallback, images prêtes. Une publication est explicite, même pour un brouillon généré ;
aucune autre langue n’est publiée par le pipeline automatique.

Une clé est liée à l’utilisateur (identité hachée), au projet, à l’article, à la langue,
à l’action et à la révision demandée. Rejeu identique : résultat conservé sans seconde
publication ; autre commande sous cette clé : 409. Les verrous d’article de BFF-003 et
un verrou de publication par projet sont réutilisés dans le processus Nitro.
La protection atomique contre d’autres instances ou écrivains API directs reste hors garantie.

### Durabilité et réception par OPS-012

Un journal privé par projet conserve intention, snapshots, références nécessaires au
projecteur et résultats. L’intention est écrite avant Symfony ; le résultat n’est mis en
file qu’après relecture confirmant le snapshot. Écriture temporaire 0600, fsync, renommage
atomique et fsync du répertoire. Répertoire 0700 à la création, refus des liens symboliques
et d’un emplacement hors du répertoire serveur courant. Aucun JWT ou mot de passe dans ce journal.

Une coupure après écriture native peut être réconciliée par une reprise autorisée avec
la même clé. Si l’écriture n’avait pas eu lieu, elle est retentée seulement sur la révision
attendue. Une confirmation tardive reçoit une nouvelle génération si des commandes plus
récentes sont intervenues. Un refus natif reste un refus ; une divergence de persistance
n’est pas annoncée comme succès. Les intentions ambiguës ne sont pas exportées et nécessitent
cette reprise utilisateur ; aucun worker n’utilise un JWT utilisateur sauvegardé dans les jobs.

L’export privé contient `{schemaVersion, projectId, target, sourceOrigin, generation,
appliedGeneration, entries, commands}`. `entries` représente l’état complet désiré issu des
commandes confirmées : dernier snapshot par article/langue, dépublications retirées, DTO public
DOM-001 et références médias `{id, sourcePath, mimeType}`. Aucun brouillon, marqueur de génération
automatique, identité utilisateur ou jeton. Les sources médias sont bornées à `/images/` sur
l’origine API configurée ; le projecteur doit calculer l’empreinte des variantes réellement
copiées. Le checksum API porte sur l’original et peut différer de la version watermarkée.

L’accusé accepte `{generation, state: applied|failed, errorCode?}` ; erreurs fermées
`projection_failed`, `asset_unavailable`, `invalid_projection`. Seule la dernière génération
confirmée est recevable. Un accusé régressif est refusé ; l’échec d’une nouvelle génération
conserve l’accusé de la précédente. Le résultat utilisateur est
`{articleId, locale, revision, publishedSnapshotId, projection:{generation,state,errorCode}}` :
202/pending avant accusé, applied uniquement sur accusé, échec visible et reprise sans
réécriture native. Les tests simulent les accusés ; aucun site réel n’est déclaré synchronisé.

### Aperçu et contrat de réception par WEB-005

Le BFF appelle uniquement POST `/api/saas-preview` sur l’origine Client 2 configurée,
avec secret serveur et payload versionné contenant traduction exacte, catégories affichées,
révision et liens d’images vers le proxy privé du dashboard. Aucun droit permanent dans
une URL, ni JWT utilisateur transmis au renderer. Réponse HTML bornée à 2 MiB, images
à 12 MiB, redirections refusées. Renderer absent : 503 explicite, sans remplacement par
une page publique. Le renderer réel et sa validation d’entrée restent à réaliser dans WEB-005.

HTML et images : accès courant recontrôlé, `private, no-store`, `noindex, nofollow` ; HTML
avec CSP sans scripts/formulaires, origine conservée pour les images protégées, nosniff et
politique de referrer restrictive. Les images sont relues parmi les références du brouillon
courant ; un média étranger ou non référencé est refusé, y compris en accès direct.

### Configuration serveur

- `SAAS_PUBLICATION_PROJECTS` : objet JSON UUID projet → `client2-immobilier`, cible fermée
  de ce premier parcours ; aucun chemin client fourni par une requête.
- `SAAS_PUBLICATION_DIR` : par défaut `.data/saas-publication` sous le répertoire serveur,
  emplacement privé et propre à l’instance. Conserver et sauvegarder avec les données Symfony.
- `SAAS_PROJECTION_SECRET`, `SAAS_PREVIEW_SECRET` : secrets privés distincts d’au moins
  32 caractères. Le projecteur utilise `Authorization: Bearer …` ; ses POST envoient aussi
  l’Origin dashboard configurée, comme l’exige la protection des mutations de BFF-002.
- `SAAS_CLIENT2_PREVIEW_ORIGIN` : origine HTTP(S) du renderer, sans chemin ni identifiants.
  Les autres paramètres de session/origine/API restent définis dans BFF-002.

Aucun `.env` modifié ou secret automatiquement partagé. Le journal est la source de la
file de ce flux ; restauration initiale depuis des snapshots préexistants, rétention et
coordination distribuée ne sont pas implémentées.

### Preuves

Assemblage jetable `/tmp/dem005-bff004-review` : HEAD BFF indiqué plus haut, code courant,
DOM-001 commité et configuration OPS-011 `f3664dd5a92a2202a285f3e04de9ba13ebf72863`.
Aucun `.env` copié ni changement non commité d’une autre couche consommé.
Depuis son `webapp/` :

- `GD_TARGET=showcase-immobilier nuxt prepare` : réussi.
- `GD_TARGET=showcase-immobilier node node_modules/vitest/vitest.mjs run --reporter=dot` :
  20 fichiers, 163 tests réussis, dont 17 scénarios publication/aperçu.
- ESLint et Prettier sur les nouvelles sources : réussis ; aucune règle modifiée.
- `python3 codebase-integrity/domaines/fiabilite-verifications/scripts/check_docs.py` depuis
  le worktree : structure et liens conformes, limites habituelles de `docs/README.md`.
- `vue-tsc --noEmit -p .tmp-bff004-tsconfig.json`, configuration temporaire étendant celle
  du projet et ciblant les routes/utilitaires SaaS et ces tests : réussi.
- Vérificateur existant de placement des types dans l’assemblage, `AIDE_GIT_ROOT` sur le
  worktree pour découvrir les sources non suivies : réussi.

Tests H3 sur HTTP local, API et renderer simulés, données fictives : langues indépendantes,
brouillon/version publiée, dépublication, idempotence et conflits simultanés, journal avant
API, pannes avant/après écriture, générations tardives et accusés régressifs, échec/reprise,
export sans brouillon, secrets, médias watermarkés, aperçu/médias anonymes ou hors accès,
locale absente sans fallback, renderer absent, chemin média arbitraire et CSRF.

### Limites et suite

Le projecteur OPS-012, son branchement aux volumes/caches publics, le renderer WEB-005,
le raccordement des handlers au dashboard et l’intégration Symfony réelle restent à réaliser.
Le déclenchement de recalcul après modification d’une catégorie n’est pas branché : les
libellés d’un export sont encore ceux capturés à la publication. Il faudra raccorder ce
flux de métadonnées partagées avant de valider leur propagation immédiate au site.
Aucune réussite de parcours public, de révocation API directe ou d’aperçu visuel réel
n’est déduite de ces tests. Les consommateurs attendent le commit validé de cette interface.

### État présenté

Base `44fd37be45cce98aedff7311d539adebbf36bac2`, branche `layers/bff`, index vide.
Douze nouvelles sources non suivies dans les chemins autorisés et cette carte ; sources
BFF-002/003 inchangées. Assemblage et journaux de test hors du périmètre à livrer.

## Verdict humain

Le 2026-11-12, l’humain répond « validé » à la restitution technique de BFF-004.
Acceptés : snapshots par langue, commandes durables et accusés, passerelle d’aperçu privé,
avec les limites annoncées : services simulés, protection concurrente dans une instance BFF,
projecteur/rendu Client 2/raccordement dashboard et recalcul des catégories restant à réaliser.
Ce verdict ne valide ni la visibilité publique réelle ni l’intégration globale de DEM-005.

Avant consignation du verdict, les 13 fichiers soumis correspondent au manifeste présenté :
SHA256 `9941f03e1b6476d0248afb0a59af3dbbccbf5be20c836089875a54473b4cb571`.
Les 12 sources sont inchangées ; seules les traces documentaires du verdict s’ajoutent.
Branche `layers/bff`, HEAD de base indiqué plus haut, index vide avant préparation.

## Commits

Commit local autorisé par le verdict technique ci-dessus ; SHA à relever après création.
La réunion globale est prévue dans le principal libre et propre, branche `demands/DEM-005`
créée seulement à la reconstitution depuis develop local vérifié.
