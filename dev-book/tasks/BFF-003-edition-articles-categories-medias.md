# BFF-003 — Exposer l’édition des articles et ressources par projet

- Demande : DEM-005 ; type : développement
- Document de référence : [DEM-005](../demand/DEM-005-dashboard-saas.md).
- Session de création : 01a1ca56-891a-7700-97c6-a576d3d9a615
- Couche : bff
- Branche : layers/bff
- Worktree : worktree/bff
- Base locale vérifiée : `d0ca9571b98e66ef6fc6218c51710696cd82ed78` ; aucun fetch.
- État : validée et commitée localement ; reste à livrer ; complément validé et commité localement, à livrer
- Chemins autorisés : `webapp/server/api/saas/projects/`, `webapp/server/utils/saas/articles/`, `webapp/server/utils/saas/media/`, `webapp/server/utils/saas/categories/`, `webapp/server/tests/saas-editor.vitest.ts`, cette carte
- Dépendances de réalisation : DOM-001, BFF-002 ; API Symfony existante inchangée
- Commits vérifiés : DOM-001 `8c1000ecc9996cd3632a323fd1ed49604ad4e929` ; BFF-002 `e9b922ac3be8d1106b812e665264e5988194f6c7`, trace `d0ca9571b98e66ef6fc6218c51710696cd82ed78`.
- Dépendances de vérification globale : OPS-013

## Résultat et critères

Lister, créer, lire et enregistrer articles/traductions en brouillon avec révision conditionnelle.
Exposer recherche/création/modification catégories, usages impactés, liste/import des médias et
relations persistées. Vérifier projet et propriété de chaque ressource liée côté Symfony et BFF.
Conserver les états d’erreur distinguables (validation, conflit, autorisation, upload) pour préserver
la saisie UI ; ne pas transformer un échec de projection ou API en succès global.
Ne pas publier les traductions générées automatiquement ni appliquer un fallback comme contenu édité.
Partage de préfixe projects/ avec BFF-002 : fichiers articles/, categories/, media/ uniquement ici ;
BFF-002 conserve les fichiers d’accès et de gestion des projets/membres. Un seul écrivain BFF.
Exclusions : suppression définitive métier, API historique, publication.

Les critères de besoin et exclusions communs restent dans le brouillon ; aucune modification
de Codebase Integrity, de règle ou de gouvernance hors consolidation déclarée.
Les métadonnées de cette carte relèvent de la trace obligatoire, même hors périmètre applicatif.
Documentation : Contrat central OPS-010 ; pas de duplication dans server/README.md, seulement lien ultérieur via OPS-013.

## Réalisation et preuves

Implémentation du 2026-11-12, même session `01a1ca56-891a-7700-97c6-a576d3d9a615`.
Les seules préparations BFF-003/004 présentes à la reprise appartiennent à DEM-005 ;
BFF-004 est préservée. API Symfony consultée en lecture seule à
`9fed427658d9c0983b5982a6e6922d179a6bf4eb` ; aucune modification ni requête métier réelle.

### Résultat

Dix handlers sous `server/api/saas/projects/[projectId]/` : liste/création/lecture/sauvegarde
article, liste/création/modification/usages catégories, liste/import médias. Huit utilitaires
sous les trois chemins autorisés, et `server/tests/saas-editor.vitest.ts`.
Les sessions et protections Origin de BFF-002 sont réutilisées sans modification.
Chaque requête vérifie le projet dans la collection autorisée puis son accès éditorial natif ;
chaque ressource liée est relue sous le projet et sa propriété est contrôlée.
Pagination et recherche BFF après parcours des pages natives, sans suivre un lien Hydra
changeant d’origine ou de chemin de collection. Aucun compte de service n’est utilisé.

### Matrice native effectivement utilisée

| Champ SaaS | Stockage ou opération existante |
| --- | --- |
| Titre, slug, texte à traduire | `ArticleTranslation.headline`, `slug`, `body` |
| Blocs, résumé, image principale, SEO | `ArticleTranslation.schemaData.gdSaas`, version 1 |
| Catégories partagées de l’article | `categoryIds` dans chaque copie de ce namespace |
| Langues rédigées, snapshot déjà publié | `authoredLocales`, `published` dans ce namespace |
| Création et sauvegarde atomique native des traductions | `POST /articles/translations`, puis mode documenté `resourceId` pour appliquer une mise à jour |
| Identité catégorie | `CategoryCode`, ensemble `article-category`, identité native conservée |
| Libellé affiché de catégorie | `CategoryCodeTranslation.text`, repli exact sur `label` s’il est vide |
| Import image | Multipart `POST /media-objects/translations`, légende optionnelle |

Les autres clés de `schemaData` et les snapshots publiés sont conservés. La réponse de
sauvegarde est vérifiée contre la traduction demandée ; une divergence est signalée par
`persistence_mismatch`, sans faux succès. Les traductions sont lues dans leur entrée exacte,
jamais depuis les champs racine avec fallback. Les langues ajoutées par le pipeline natif
restent des brouillons marqués générés. Ce pipeline traduit titre/texte, pas les métadonnées
JSON ni les blocs structurés : leurs champs générés sont initialisés depuis le texte natif
ou laissés à compléter. Sa qualité linguistique réelle n’est pas démontrée localement.

La modification d’un libellé affiché écrit uniquement `text` via le PUT natif ; aucun
contournement de l’immutabilité de `label`/`codeValue`. La création exige le libellé dans
la langue source, comme Symfony. Les usages comprennent les brouillons et les snapshots
SaaS qui référencent la catégorie, sans doublonner un même article.

Révision agrégée calculée par hash stable des traductions et métadonnées persistées ;
`If-Match` obligatoire à la modification (428), version périmée refusée (409).
Les écritures d’une même ressource sont sérialisées dans le processus Nitro.
Ce contrôle protège les utilisateurs de cette instance ; Symfony ne fournit pas de
comparaison atomique contre un écrivain API direct ou une autre instance indépendante.
Aucune garantie de verrou distribué n’est annoncée.

Imports limités aux images supportées par Symfony : contrôle MIME/signature, fichier au
plus 12 MiB, corps multipart borné à cette taille plus 64 Kio, champs/locale validés.
Le plafond natif reste également applicable. La légende est limitée à 255 caractères et
omise lorsqu’elle est vide, pour préserver la génération native. L’état `pending_*` est
retourné comme non prêt ; aucun média n’est déclaré prêt avant le statut natif `ready`.
JSON d’édition borné à 2 MiB ; les corps trop grands sont drainés sans conserver leurs octets.

### Preuves

Assemblage jetable `/tmp/dem005-bff003-review` : HEAD BFF indiqué plus haut, sources de
cette carte, DOM-001 et configuration OPS-011 `f3664dd5a92a2202a285f3e04de9ba13ebf72863`
commités. Dépendances installées utilisées en lecture seule ; aucun `.env` copié.
Depuis son `webapp/` :

- `GD_TARGET=showcase-immobilier nuxt prepare` : réussi.
- `GD_TARGET=showcase-immobilier node node_modules/vitest/vitest.mjs run --reporter=dot` :
  19 fichiers, 145 tests réussis avant l’ajustement final de légende optionnelle.
- Même commande limitée à `server/tests/saas-editor.vitest.ts server/tests/saas-auth.vitest.ts` :
  29 tests réussis sur l’état final, dont 15 tests éditoriaux et 14 tests de sessions.
- ESLint et Prettier sur les 19 nouvelles sources : réussis, aucune règle modifiée.
- `python3 codebase-integrity/domaines/fiabilite-verifications/scripts/check_docs.py` depuis
  le worktree BFF : structure et liens conformes ; limites habituelles de `docs/README.md`.
- `vue-tsc --noEmit -p .tmp-bff003-tsconfig.json` : configuration temporaire étendant
  `tsconfig.json`, incluant routes/utilitaires SaaS et tests éditoriaux ; réussi.
- Vérificateur de placement des types existant, avec `AIDE_GIT_ROOT` dirigé sur le worktree
  pour inclure les fichiers non suivis : réussi dans cet assemblage.

Les tests utilisent les vrais handlers H3 sur HTTP local et une API simulée, avec données
fictives. Couverture : réouverture sans perte, ordre des blocs, slug, JSON externe, snapshot
préservé, langues générées non publiées, conflits simultanés/périmés, contextes étrangers,
références et liens invalides, refus natifs, pannes, création/modification/usages catégories,
import/légende native/traitement/refus d’upload, CSRF et liens Hydra hors projet.

### Limites et suite

Le parcours dans le navigateur, l’isolation par API directe et les écritures sur Symfony
réel ne sont pas vérifiés. Le raccordement des handlers au serveur dashboard reste à
réaliser après réunion des commits validés ; aucune page ou configuration n’est modifiée ici.
Les projections publiques et la propagation des modifications partagées au site relèvent
de BFF-004/OPS-012, pas de cette preuve locale. Le parcours UI de sélection automatique et
préservation des saisies reste porté par WEB-004 ; aucun verdict global n’est déduit.
BFF-004 attend le commit validé de ces adaptateurs avant consommation.

### État présenté

Base `d0ca9571b98e66ef6fc6218c51710696cd82ed78`, branche `layers/bff`, index vide.
19 nouvelles sources non suivies dans les chemins ci-dessus et cette carte ; aucune
modification des sources BFF-002 ni du backend. Les sorties et dépendances temporaires
restent hors des fichiers à livrer. Les tests ne valent pas validation humaine.

## Verdict humain

Le 2026-11-12, l’humain répond « validé » à la présentation technique de BFF-003,
avec les limites annoncées : API simulée, raccordement dashboard à réaliser et protection
concurrente limitée à une instance BFF. Ce verdict ne valide pas l’intégration globale
ni les cartes suivantes.

Avant consignation du verdict, les 20 fichiers soumis correspondent au manifeste de
présentation : SHA256 `c407e5a5cdbea971e2ac2404b8d227aafaa7ec3c609e6277f046c68d98cb28eb`.
Les 19 sources applicatives sont inchangées ; seules les traces documentaires du verdict
s’ajoutent. Branche `layers/bff`, HEAD de base indiqué ci-dessus, index vide avant préparation.
La carte BFF-004 reste exclue du commit.

## Commits

Implémentation et verdict : `88ce086914fd34efe006535a5c5f68f1c0a3d6fa`.
Le présent complément documentaire relève ce SHA, sans changement fonctionnel.
Les limites indiquées plus haut restent ouvertes. Aucun push, PR ou merge effectué.
La réunion globale est prévue dans le principal libre et propre, branche `demands/DEM-005`
créée seulement à la reconstitution depuis develop local vérifié.

## Complément fonctionnel du 2026-11-12

Même session réelle de création ; reprise de DEM-005, sans consolidation.
Base `ad729e86184c3a782e36545d02dc269b8defebd6`, `layers/bff`, index vide avant écriture.
Les changements de cette reprise sont identifiés ; aucun travail étranger consommé.

Après relecture native autorisée d’une catégorie modifiée, ses libellés sont mis à
jour dans les seules publications actives et commandes incertaines du même projet.
Les publications actives reçoivent une nouvelle génération de projection ; aucun
texte de brouillon ni traduction dépubliée n’est activé. Le verrou projet sérialise
la modification avec publier/dépublier. Le changement de catégorie garde la même
réponse API ; la projection reste asynchrone via le worker existant.

Une reprise portant exactement les libellés déjà persistés réconcilie la file sans
nouvelle écriture native, même avec l’ancienne révision, mais exige toujours If-Match.
Une demande différente conserve le refus de conflit. En cas d’échec après écriture
native et avant journalisation, la réponse échoue ; la reprise autorisée identique
répare la projection. Pas de promesse de transaction atomique entre les deux stockages.
Dépendance du complément : journal BFF-004 déjà commité `1e52c1034578636c2a340d936b377d8d83132ef5`.

Snapshot indépendant `/tmp/dem005-categories` : seuls amonts committés et ces trois
fichiers BFF. `GD_TARGET=dashboard node node_modules/vitest/vitest.mjs run
server/tests/saas-auth.vitest.ts server/tests/saas-editor.vitest.ts
server/tests/saas-publication.vitest.ts` : 48 tests réussis, dont 17 édition.
Couvre propagation, conservation du texte publié, dépublication, commandes incertaines,
reprise sans écriture native après échec de journalisation et idempotence du replay.
Types dashboard, ESLint/Prettier ciblés et conventions : sortie 0 ; avertissements
historiques conservés. Logs `/tmp/dem005-categories-{tests,types,conventions}.log`.
API native simulée uniquement ; aucun appel Symfony réel, aucune donnée utilisateur.

État présenté : 3 fichiers de réalisation, plus cette carte ;
manifestes de chemins et SHA-256 : `/tmp/dem005-bff-003-raccordement-manifest.json`.
Empreinte triée chemin UTF-8, octet nul puis contenu, carte exclue :
`624c5b23d11cd27852670a904c9405a926b89facb77ce69c54bd8261267c2aaf`.
Aucun commit ni verdict humain créé à cette étape. Les verdicts et commits antérieurs
restent inchangés et ne valident pas ce complément.

Contrôle documentaire et cadre final : `make aide-check` depuis cette couche,
111 tests réussis, structure et liens conformes ; `git diff --check` conforme.
Log `/tmp/dem005-bff-raccordement-aide.log`.

## Verdict humain — complément fonctionnel

Validation explicite du 2026-11-12 : « validé », couvrant les seuls compléments
WEB-003, OPS-012 et BFF-003 présentés et leurs limites sur fixtures. Les fichiers
correspondent aux empreintes présentées avant indexation ; aucune correction
fonctionnelle depuis la restitution. OPS-011 et OPS-013 sont hors de ce verdict.

Commit local du complément validé : `f453e142889223a1a3d8dd4815cce17f8c11a039`.
Cette trace ne modifie aucune fonctionnalité ; les autres compléments restent
hors de ce commit. Aucun push, PR, fusion ou passage automatique à l’étape suivante.
