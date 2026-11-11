# Contrat d’intégration du dashboard SaaS

## Rôle et responsabilités

Contrat cible préparé par [OPS-010](../../dev-book/tasks/OPS-010-fixer-contrats-et-prerequis-symfony.md)
pour DEM-005. Il définit les échanges du nouveau dashboard, leur modèle et les écarts
backend. Les décisions produit et le menu restent dans `tmp/demande-dashboard-saas.md`
du dépôt principal jusqu’à la reconstitution. Le [contrat historique](bff-dashboard-symfony.md)
reste applicable au dashboard Showcase.

**État : proposé, non implémenté et à vérifier humainement.** Les routes SaaS ci-dessous
sont des interfaces à réaliser, pas des capacités disponibles. Aucune modification Symfony,
migration ou écriture API n’est effectuée par OPS-010. Un consommateur attend le commit
validé du contrat ; une intégration réelle attend aussi les livrables backend correspondants.

## Existant vérifié

Inspection statique du dépôt `/home/johan/www/graines-digitales/api/symfony-8-api-platform`,
HEAD `9fed427658d9c0983b5982a6e6922d179a6bf4eb`. Les chemins suivants y sont relatifs.
Cette lecture ne prouve pas l’état d’une instance déployée.

| Source                                                                      | Capacité et limite observées                                                                                                                            |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/Entity/Article.php`                                                    | CRUD sous `/api/projects/{projectId}/articles`, lecture/écriture `/translations` ; un seul `status` à la racine, aucun snapshot publié                  |
| `src/Entity/ArticleTranslation.php`                                         | `locale`, `headline` (220 caractères), `slug` (180), `body`, `schemaData` JSON ; unicité slug/projet/langue ; slug exposé en lecture dans la traduction |
| `src/State/ProjectScopedBulkTranslationProcessor.php`                       | Dénormalisation des traductions, auto-traduction puis auto-remplissage ; modification de `CategoryCode.label` explicitement refusée                     |
| `src/State/ProjectScopedBulkTranslationCreateProcessor.php`                 | Création avec traductions ; ne démontre pas la persistance du futur modèle de blocs/relations                                                           |
| `src/Entity/CategoryCode.php`, `src/State/CategoryCodePersistProcessor.php` | Catégories par projet et `inCodeSet`, code généré depuis le libellé source, unicité du code dans projet/code set                                        |
| `src/Entity/MediaObject.php`                                                | Collection/import projet ; fichiers image JPEG, PNG, WebP, GIF, AVIF, plafond déclaré `12M` ; pas d’import document ou vidéo démontré                   |
| `src/State/ProjectScopedCollectionProvider.php`                             | Projet autorisé, pagination API Platform, ordre création décroissante puis ID croissant ; pas de recherche article/catégorie démontrée                  |
| `src/Security/ProjectAccessGuard.php`                                       | Accès super-admin ou membership projet ; appartenance à une organisation seule insuffisante pour lire/écrire tous ses projets                           |
| `src/Controller/CreateOrganizationMemberController.php`                     | Ajout de membre et création possible avec mot de passe ; ne constitue pas un parcours d’invitation par e-mail                                           |
| `config/routes.yaml`, `docs/04-domain-model/translations.md`                | Login `/api/auth/login`, traductions automatiques et fallback de lecture ; aucune publication indépendante par langue démontrée                         |

Le [DTO article local](../../webapp/schemas/source/dtos/symfony_api/article.yaml)
ne reflète pas ce modèle traduit. Ne pas prendre ses champs pour un contrat API existant.

## Modèle cible et validation

Le BFF utilise des UUID de ressources, jamais le slug comme identifiant d’écriture.
`projectId` vient du chemin ; le serveur vérifie organisation, projet et références liées.
La langue éditée est explicite (`fr`, `en`, `es`, activées sur le projet), sans fallback.
Le JSON contient uniquement les propriétés déclarées ; les inconnues sont refusées.

| Champ du contrat               | Portée et stockage cible Symfony                           | Validation et relation                                                                                                 | Preuve attendue                                        |
| ------------------------------ | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `id`, `projectId`              | Racine Article ; propriété serveur                         | UUID, projet immuable ; pas d’override depuis le body                                                                  | Référence d’un autre projet refusée                    |
| `revision`                     | Révision optimiste de l’agrégat Article, générée serveur   | Jeton opaque couvrant champs communs et traductions ; contrôle atomique                                                | Deux écritures de la même révision : une seule réussit |
| `categoryIds`                  | Relation Article → CategoryCode, commune aux traductions   | 0..n UUID distincts du même projet, `inCodeSet=article-category` ; ordre conservé                                      | Aller-retour et refus de référence étrangère           |
| `locale`, `headline`           | ArticleTranslation                                         | Locale activée ; titre non vide, ≤220 caractères                                                                       | Deux langues indépendantes                             |
| `slug`                         | ArticleTranslation, writable à rendre explicite            | Non vide, ≤180 caractères, forme normalisée kebab-case, unique projet/langue ; dérivé du titre si absent à la création | Collision refusée, slug saisi conservé                 |
| `summary`                      | Champ localisé typé à ajouter                              | Chaîne, vide autorisé                                                                                                  | Résumé rouvert dans sa langue                          |
| `primaryImage`                 | Référence localisée à ajouter : `{mediaId, alt}` ou `null` | Média image du projet, `alt` chaîne (vide si décoratif)                                                                | Image/texte alternatif persistés                       |
| `metaTitle`, `metaDescription` | Champs localisés typés à ajouter                           | Chaînes ; si vides, projection dérivée de headline/summary, sans écraser le brouillon                                  | SEO du snapshot publié uniquement                      |
| `content`                      | Document localisé typé et versionné à ajouter              | Schéma ci-dessous ; aucune exécution de HTML/code arbitraire                                                           | Ordre et contenu des blocs après réouverture           |
| `generated`                    | Origine de traduction localisée, gérée serveur             | Signale génération automatique ; aucune transition de publication                                                      | Traduction générée uniquement en brouillon             |
| `published`                    | Snapshot immuable par article/langue, séparé du brouillon  | `snapshotId`, `publishedAt`, révision et champs éditoriaux figés ; nullable                                            | Modifier le brouillon ne change pas le public          |

Les colonnes/relations manquantes sont des évolutions futures à valider dans le dépôt Symfony.
`schemaData` actuel et `body` ne deviennent pas silencieusement un stockage libre du nouveau
contrat. DOM-001 sépare les types cibles des DTO existants jusqu’à réception du backend.
La cardinalité plurielle des catégories ci-dessus précise le sélecteur multiple du besoin.

`content = {schemaVersion: 1, blocks: Block[]}`. Un ID de bloc est unique dans le document ;
le tableau définit l’ordre. Une version inconnue est refusée, jamais ignorée.

| Bloc    | Propriétés admises                                 | Validation                                                                                                                                                                                    |
| ------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Texte   | `id`, `type: "text"`, `document`                   | Arbre JSON : document, paragraphes, titres niveau 2..6, listes ordonnées/non ordonnées, éléments de liste, texte et sauts de ligne ; marques gras/italique/lien ; aucun nœud/attribut inconnu |
| Image   | `id`, `type: "image"`, `mediaId`, `alt`, `caption` | UUID image du projet ; textes localisés, aucune URL de fichier imposée par le client                                                                                                          |
| Galerie | `id`, `type: "gallery"`, `items`                   | Au moins une entrée `{mediaId, alt, caption}`, même validation image ; ordre conservé                                                                                                         |

Un ID de bloc est une chaîne stable non vide. Le document texte utilise `type`, `content`,
`text`, `marks`, `attrs` selon le nœud : `attrs.level` pour heading ; marques `bold`, `italic`,
`link` avec `attrs.href`. Les autres nœuds cités correspondent à `doc`, `paragraph`,
`bulletList`, `orderedList`, `listItem`, `text` et `hardBreak`. Seuls les titres et liens
acceptent ces attributs ; seuls les nœuds texte portent `text` et `marks`.
Le texte enrichi ne transporte pas de HTML brut. Les liens n’acceptent que `https`, `http`,
`mailto`, `tel`, ancres et chemins relatifs internes ; refuser scripts, chemins `//` et protocoles
inconnus. DOM-001 valide l’arbre ; le rendu échappe les textes et valide les attributs de liens.
Le même rendu est utilisé pour aperçu et public. L’auto-traduction parcourt seulement les textes
localisés, jamais les IDs, URLs, marques ou structure ; une traduction manquante reste un brouillon,
y compris après un échec du service de traduction. Aucun fallback n’est une publication.

## Interfaces BFF cibles

Base navigateur : `/api/saas`. Les réponses métier sont JSON. Toute route exige une session,
sauf login et acceptation/récupération par jeton. Les IDs de projet restent explicites dans les URLs.

| Méthode et suffixe                                                                                                                                                                                                                  | Entrée / résultat                                                                                                            |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `POST /auth/login`, `POST /auth/logout`, `GET /auth/session`                                                                                                                                                                        | E-mail/mot de passe ; session utilisateur sans jeton Symfony, puis révocation locale au logout                               |
| `POST /auth/invitations/accept`                                                                                                                                                                                                     | Jeton d’invitation à usage unique, mot de passe pour nouveau compte ; utilisateur existant authentifié avec le compte invité |
| `POST /auth/password/forgot`, `POST /auth/password/reset`                                                                                                                                                                           | Demande e-mail à réponse générique, puis jeton à usage unique et nouveau mot de passe                                        |
| `GET/POST /organizations`, `GET /organizations/{organizationId}/projects`, `POST /projects`                                                                                                                                         | Collections autorisées ; créations réservées à l’équipe SaaS ; organisation du nouveau projet vérifiée                       |
| `GET /organizations/{organizationId}/members`, `POST /organizations/{organizationId}/invitations`, `DELETE /organizations/{organizationId}/invitations/{invitationId}`, `DELETE /organizations/{organizationId}/members/{memberId}` | Consultation/gestion par équipe SaaS ou administrateur de cette organisation ; retrait réévalué aux accès suivants           |
| `GET /projects/{projectId}/articles`, `POST /projects/{projectId}/articles`                                                                                                                                                         | Liste paginée ou création du brouillon avec catégories et traduction initiale                                                |
| `GET /projects/{projectId}/articles/{articleId}`                                                                                                                                                                                    | Article, révision, traductions exactes et états publiés ; pas de contenu remplacé par fallback                               |
| `PUT /projects/{projectId}/articles/{articleId}/translations/{locale}`                                                                                                                                                              | `If-Match` révision ; `categoryIds` et `translation` complète ; retour de l’article et nouvelle révision                     |
| `GET/POST /projects/{projectId}/categories`, `PUT /projects/{projectId}/categories/{categoryId}`, `GET /projects/{projectId}/categories/{categoryId}/usages`                                                                        | Recherche/sélection, création, modification conditionnelle et usages pour avertissement                                      |
| `GET /projects/{projectId}/media`, `POST /projects/{projectId}/media`                                                                                                                                                               | Liste projet ; import multipart `file`, `locale`, `caption` ; retourne média, état de traitement et disponibilité            |
| `GET /projects/{projectId}/articles/{articleId}/translations/{locale}/preview`                                                                                                                                                      | Brouillon enregistré et rendu privé associé ; session et droits revérifiés                                                   |
| `POST/DELETE /projects/{projectId}/articles/{articleId}/translations/{locale}/publication`                                                                                                                                          | Publication/dépublication avec révision et clé d’idempotence ; retourne version durable et état de projection                |

Les chemins Symfony actuels restent ceux du tableau d’existant ; ne pas préfixer simplement
ces routes BFF par `/api` pour les supposer présentes en amont. Les nouveaux endpoints Symfony
d’invitation, publication, export et recherche devront être documentés/testés dans le dépôt API,
puis mappés par le BFF. Aucun contournement des guards par un compte technique omnipotent.

Exemple de sauvegarde cible, sans appel réel (`If-Match: "r7"`) :

```json
{
  "categoryIds": [],
  "translation": {
    "locale": "fr",
    "headline": "Découvrir Essaouira",
    "slug": "decouvrir-essaouira",
    "summary": "Carnet de voyage.",
    "primaryImage": null,
    "metaTitle": "",
    "metaDescription": "",
    "content": {
      "schemaVersion": 1,
      "blocks": [
        {
          "id": "intro",
          "type": "text",
          "document": {
            "type": "doc",
            "content": [
              {
                "type": "paragraph",
                "content": [{ "type": "text", "text": "Bienvenue." }]
              }
            ]
          }
        }
      ]
    }
  }
}
```

Résultat d’écriture : article avec `revision: "r8"`, `ETag: "r8"` ; `published` inchangé.
Les révisions sont opaques : l’exemple n’impose pas de compteur prévisible. L’enregistrement
peut générer les langues manquantes en brouillon, sans écraser les textes déjà renseignés.
Une révision d’agrégat peut signaler un conflit entre deux langues : recharger/rapprocher
explicitement, jamais réécrire automatiquement la saisie concurrente.

Collections : `?page=1&pageSize=20&q=...`, pageSize 1..100 ; réponse
`{items, page, pageSize, total, hasNext}`. Adapter l’enveloppe/pagination API Platform,
sans charger tout le catalogue pour simuler une recherche. Ordre stable création décroissante
puis ID croissant ; catégories recherchables par libellé/code. Les filtres projet sont serveur.

Erreurs JSON : `{error: {code, message, fields?, currentRevision?}}` ; `fields` contient
des chemins de champs et leurs erreurs, jamais les données saisies ni un secret.

| HTTP            | Code / traitement client                                                                            |
| --------------- | --------------------------------------------------------------------------------------------------- |
| 400             | `invalid_request` : JSON, locale, bloc ou version inconnus                                          |
| 401 / 403       | `authentication_required` / `forbidden` ; un projet/objet hors accès peut répondre 404              |
| 404             | `not_found` : ressource ou traduction exacte absente                                                |
| 409             | `slug_conflict`, `category_conflict` ou `idempotency_conflict` ; conserver toute la saisie          |
| 412 / 428       | `revision_conflict` / `revision_required` : `If-Match` périmé/absent ; aucun remplacement implicite |
| 413 / 415 / 422 | `file_too_large`, `unsupported_media_type`, `validation_failed`                                     |
| 429 / 502 / 503 | `rate_limited`, `upstream_failed`, `upstream_unavailable` ; reprise explicite sans faux succès      |

Le BFF traduit les erreurs amont dans cette enveloppe. La sélection/création de catégorie
ne soumet pas le formulaire article. Les annulations et erreurs imbriquées ne réinitialisent
pas son état ; une création réussie renvoie l’ID immédiatement sélectionnable.
Une catégorie modifiée garde son code stable ; son libellé doit devenir modifiable via évolution
backend, contrairement au processor actuel. L’API d’usages renvoie nombre et liste paginée
des articles concernés, brouillons et publiés, sans divulgation hors projet.

## Accès, sessions et médias

Trois capacités : équipe SaaS tous clients ; administrateur client gère les membres de son
organisation ; collaborateur client édite/publie sur tous les projets de son organisation.
Ces capacités sont mappées aux rôles Symfony par le lot accès ; aucun rôle du navigateur ne fait foi.
Un administrateur client ne peut inviter que dans son organisation, comme collaborateur client ;
il ne peut pas attribuer la capacité équipe SaaS. L’administrateur client est désigné par l’équipe SaaS.
Retirer un membre invalide ses accès à cette organisation, sans supprimer ses autres appartenances.

Cookie de session sécurisé, HttpOnly, SameSite ; protection CSRF/origin sur les mutations.
Jetons Symfony et renouvellement restent dans le stockage de session serveur ; pas de JWT,
refresh token ou mot de passe dans les réponses, journaux, payload SSR ou stockage navigateur.
Invitations liées à organisation/e-mail/capacité, expirables, révocables et à usage unique ;
le destinataire choisit son mot de passe. Un compte existant ne change pas son mot de passe
par simple invitation. Les jetons d’invitation et récupération sont hachés côté backend ;
durées configurées par le backend et expirations exposées dans le contrat de réception.

Le premier parcours utilise les images prises en charge actuellement. Documents, vidéos et
icônes restent des entrées de menu indisponibles jusqu’à leur réalisation. Le BFF relaie
les validations MIME/taille du backend, sans augmenter le plafond déclaré. Un média en traitement
est visible comme tel ; publication bloquée tant que ses variantes publiques ne sont pas prêtes.
Chaque relation média est recontrôlée par projet à l’écriture et à la publication.

## Publication, projection et prévisualisation

Enregistrer modifie seulement le brouillon. Publier capture une traduction enregistrée et
validée ; dépublier retire son snapshot actif, sans effacer le brouillon. Chaque commande
contrôle atomiquement la révision ; sa clé d’idempotence est liée à utilisateur/projet/article/
langue/action et contenu. Rejouer la même clé retourne le même résultat ; une autre commande
avec la même clé échoue. Les autres langues ne changent pas de publication.

Réponse cible : `{articleId, locale, revision, publishedSnapshotId, projection: {generation,
state, errorCode}}`, où state vaut `pending`, `applied` ou `failed` et snapshotId est nullable
après dépublication. Un 202 signifie commande durable, projection en attente ; annoncer la visibilité
publique uniquement après accusé `applied` pour la génération concernée. Un échec garde son état
visible et une reprise idempotente ; jamais de succès global déduit du seul 2xx Symfony.

Symfony fournit un export authentifié des seules versions publiées, avec génération monotone,
références médias et catégories. Le worker OPS-012, réveillé par une file serveur durable, exporte
le projet associé à une cible par une configuration serveur fermée. Il prépare/valide les fichiers
et médias, puis remplace atomiquement la projection et son index. Une génération ancienne ne peut
pas remplacer une plus récente ; le cache public est invalidé avec la même génération. Dépublication
retire liste, fiche et métadonnées SEO lors de l’application ; un échec conserve la dernière projection
valide, peut donc laisser l’article visible et doit être signalé avec reprise, jamais caché à l’utilisateur.

Les catégories restent des relations vivantes : après modification acceptée, un export/recalcul des
projections concernées est déclenché immédiatement, sans republication manuelle de chaque article.
Le résultat visible attend également l’accusé de projection ; aucun changement de brouillon article
n’est publié à cette occasion. Le snapshot fige les références catégories, pas leurs libellés partagés.

Le site public lit uniquement sa projection locale ; ni appel Symfony ni session dashboard pendant
une requête visiteur. Une langue non publiée ou un ancien slug remplacé répond 404, sans fallback.
Une publication changeant le slug retire l’ancienne route dans la même génération.

L’aperçu utilise le brouillon enregistré via un chemin serveur authentifié du rendu Client 2.
Pas de lien public porteur d’un droit permanent ; session utilisateur et accès courant sont revérifiés,
y compris lors du chargement des médias privés. Réponses `Cache-Control: private, no-store` et
`noindex, nofollow`, hors sitemap et caches publics. Si le brouillon local est modifié, proposer
son enregistrement avant aperçu ; ne pas perdre ces modifications sur erreur.

## Réception des dépendances

Les lots suivants sont uniquement spécifiés. Pour chacun, exiger avant consommation : branche
de contribution, SHA validé, contrat/OpenAPI observé, migrations éventuelles et preuves ciblées.
Aucune branche backend ni organisation/projet de test n’est affectée ; aucune évolution API n’est
autorisée pour le moment par l’utilisateur. Les commandes futures passent par les Makefiles du
backend ; sa suite complète est réservée au pré-merge selon ses instructions.

| Lot         | Livraison attendue                                                                              | Preuves de réception                                                                                                                             |
| ----------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Accès       | Organisation → tous ses projets, capacités ci-dessus et révocation                              | Deux organisations, plusieurs projets, appel direct hors accès, relations croisées, multi-appartenances et création réservée SaaS                |
| Invitations | Invitation/acceptation/révocation, gestion membres et récupération mot de passe                 | Expiration, rejeu, mauvais compte, compte existant, e-mail générique et retrait effectif                                                         |
| Articles    | Matrice typée, médias/catégories/usages, slug writable, révision atomique, traductions de blocs | Sauvegarde/réouverture, code catégorie stable, libellé modifiable, conflit, références étrangères et aucun écrasement par traduction automatique |
| Publication | Snapshots par langue, aperçu privé, export publié et événements durables                        | Brouillon invisible, ancienne version préservée, dépublication, retry/ordre des générations, catégories partagées, cache et médias privés        |

La consolidation chemins/contrôles est une autre dépendance, distincte des lots Symfony.
Le routage Web du dashboard est une divergence validée dans le brouillon ; cette page ne modifie
aucune convention ni aucun contrôle. Les scénarios d’ensemble sont portés par OPS-013 ; les cartes
consommatrices conservent leurs tests ciblés. Aucun mock ne vaut réception d’un backend réel.
