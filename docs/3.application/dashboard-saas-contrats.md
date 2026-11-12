# Contrat d’intégration du dashboard SaaS

## Rôle et responsabilités

Contrat du nouveau dashboard DEM-005, distinct du [dashboard Showcase](bff-dashboard-symfony.md).
Le besoin reste dans le brouillon DEM-005 du dépôt principal avant reconstitution.
Cette page décrit les adaptateurs Nuxt réalisés sur l’API Symfony existante ; aucune
évolution backend ni consolidation préalable n’est requise ou autorisée par ces travaux.
Usage opérateur : [guide SaaS](../1.getting-started/dashboard-saas.md).

Les validations des cartes portent sur leurs preuves techniques. La recette externe
et la couverture complète du besoin produit ne se déduisent pas des fixtures.
Les résultats datés et leurs limites appartiennent à OPS-013.

## Existant vérifié

L’analyse statique de Symfony porte sur
`/home/johan/www/graines-digitales/api/symfony-8-api-platform`, commit
`9fed427658d9c0983b5982a6e6922d179a6bf4eb` ; elle ne prouve pas une instance déployée.

| Source native                     | Utilisation effective ou limite                                                                                                                        |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Article et ArticleTranslation     | CRUD projet, traductions exactes, `headline`, `slug`, `body`, `schemaData` ; le statut global natif ne décide pas de la visibilité SaaS                |
| CategoryCode et traductions       | Périmètre projet et `inCodeSet=article-category` ; code/label source conservés, texte de traduction `text` modifiable utilisé comme libellé            |
| MediaObject                       | Liste/import d’images, état de traitement et URL native ; ne prouve pas une médiathèque vidéo/document                                                 |
| ProjectAccessGuard                | Membership projet ou super-admin requis ; une appartenance organisation seule ne donne pas accès à tous ses sites                                      |
| Authentification et organisations | JWT/refresh privés, listes d’organisations et projets filtrées avec le compte connecté                                                                 |
| Membres et invitations            | La création native de membre avec mot de passe ne constitue pas une invitation par jeton ; ces capacités ne sont pas simulées en fonctionnement normal |

La résolution exacte des routes, DTO et refus repose sur les adaptateurs committés
BFF-002/003/004, pas sur une transposition des URLs navigateur vers Symfony.

## Modèle cible et validation

Les formes runtime sont définies dans `webapp/shared/schemas.ts` ; les types partagés
dans `webapp/shared/types/saas/`. Cette page ne recopie pas leurs propriétés ou règles.
Le BFF utilise les UUID, contrôle projet/références et refuse les langues hors du projet.

| Donnée                                                         | Stockage réalisé                                                                                                                    |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Titre et slug                                                  | Traduction native ArticleTranslation, relue après écriture                                                                          |
| Corps natif                                                    | Texte dérivé des blocs édités pour compatibilité ; un corps natif sans métadonnées est rendu comme texte, jamais exécuté comme HTML |
| Blocs, résumé, image, SEO, catégories, origine des traductions | Enveloppe versionnée `schemaData.gdSaas` ; propriétés JSON étrangères conservées                                                    |
| Version publiée par langue                                     | Snapshot dans cette même enveloppe, indépendant du brouillon ; références catégories figées, libellés partagés vivants              |
| Révision d’édition                                             | Empreinte opaque de l’agrégat natif relu ; `If-Match` exigé sur les modifications                                                   |
| État de projection                                             | Journal privé BFF et accusés du worker ; un simple succès d’écriture native ne signifie pas visibilité publique                     |

`webapp/server/utils/saas/articles/model.ts` fait référence pour ce mapping.
Les associations communes sont cohérentes entre traductions. Les langues retournées
par l’auto-traduction native sont relues et restent des brouillons ; aucune traduction
générée n’est publiée automatiquement. La traduction effective des blocs enrichis
par l’instance externe n’est pas démontrée par la seule génération native de texte.

Le verrou d’édition et le contrôle de révision protègent une instance Nitro. L’API
existante ne fournit pas de comparaison atomique de cet agrégat entre plusieurs
instances ou avec des écritures externes : aucune garantie distribuée n’est annoncée.

## Interfaces BFF cibles

Base navigateur `/api/saas`. Les routes métier nécessitent une session. Les mutations
contrôlent Origin ; les IDs de projet viennent des chemins, jamais d’un rôle déclaré
par le navigateur. Source exécutable : `webapp/server/api/saas/` dans l’assemblage.

| Groupe                | Contrat réalisé                                                                                                                   |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Authentification      | Login e-mail/mot de passe, session sans jeton Symfony, logout local                                                               |
| Organisations/projets | Listes autorisées ; créations réservées aux e-mails opérateurs explicitement configurés, avec contrôles natifs toujours appliqués |
| Membres               | Liste si autorisée ; invitations, acceptation, récupération de mot de passe et retrait de membre répondent `501 unsupported_api`  |
| Articles              | Liste paginée, création, lecture exacte, écriture complète d’une traduction avec révision ; aucun fallback publié                 |
| Catégories            | Liste/recherche, création, modification conditionnelle, usages pour l’avertissement ; aucune entrée dédiée dans le menu           |
| Médias                | Liste/import multipart d’images du projet ; état de traitement contrôlé à la publication                                          |
| Publication           | POST/DELETE par traduction, `If-Match` et `Idempotency-Key`, résultat durable et état de projection                               |
| Aperçu                | GET d’une traduction enregistrée, rendu Client 2 privé ; les médias repassent par les contrôles BFF                               |
| Worker                | GET `projects/{projectId}/publication/queue` et POST `.../ack`, avec Bearer dédié et Origin sur l’accusé, sans cookie utilisateur |

Collections : `{items,page,pageSize,total,hasNext}`. L’adaptation actuelle parcourt les
pages natives puis filtre/pagine localement ; son coût n’est pas une recherche native
indexée. Ne pas la présenter comme une garantie de performance à grande échelle.
Erreurs : `{error:{code,message}}`, sans données saisies ni secret. Les familles
400/401/403/404, conflit de révision 412/428, conflit d’idempotence 409 et indisponibilité
amont restent distinctes. Les formulaires conservent la saisie sur erreur.

## Accès, sessions et médias

La session retourne explicitement `invitations:false`, `passwordReset:false` et
`memberRemoval:false`. Les parcours correspondants restent indisponibles ; aucun
compte n’est créé ou retiré pour simuler leur réussite. Les comptes et memberships
réels doivent être préparés par l’administration existante, hors de ces parcours.
La cible produit d’accès à tous les projets d’une organisation n’est pas démontrée
quand le compte ne possède pas les memberships natifs nécessaires.

Cookie opaque `gd_saas`, HttpOnly, SameSite=Lax, Secure en HTTPS, limité à `/api/saas`.
JWT/refresh restent dans des fichiers privés du serveur ; aucun jeton ou mot de passe
ne doit rejoindre les réponses métier, le payload SSR ou le stockage navigateur.
La session réévalue les autorisations natives ; une révocation n’est pas contournée
par les sélections d’organisation/projet conservées côté interface.

La première médiathèque gère les images natives prises en charge, avec plafond et
MIME contrôlés. Documents, vidéos, icônes et autres contenus non réalisés sont
signalés indisponibles. Le worker ne reçoit pas de jeton utilisateur pour les images
publiées ; les médias de brouillon passent exclusivement par le proxy privé BFF.

## Publication, projection et prévisualisation

Enregistrer modifie le brouillon. Publier capture uniquement une traduction enregistrée
et validée. Dépublier retire son snapshot actif en conservant le brouillon. Les autres
langues restent indépendantes. Le journal prépare l’intention avant l’appel natif,
puis confirme sa persistance par relecture ; une écriture incertaine exige une reprise
avec la même clé d’idempotence. Les fichiers du journal doivent survivre au redémarrage.

Le résultat contient `articleId`, `locale`, `revision`, `publishedSnapshotId` et
`projection:{generation,state,errorCode}`. `pending`/HTTP 202 n’est pas une publication
visible ; `applied` exige l’accusé de la génération, `failed` conserve une erreur
observable. La file est produite par Nuxt, pas par un nouvel endpoint Symfony.

La modification d’une catégorie relit les libellés autorisés et réémet les publications
actives concernées dans le projet. Elle actualise aussi les commandes incertaines sans
les confirmer. Aucun brouillon ou article dépublié n’est activé. Si l’écriture native
réussit mais pas la journalisation, la réponse échoue ; une reprise identique réconcilie
la file sans nouvelle écriture native. Le texte publié reste figé.

Le [contrat et l’exploitation du projecteur](../../webapp/scripts/README.md#projection-publiée-saas--client-2)
font référence pour les variables, formats disque, empreintes, bascule atomique,
reprises et verrou. Le [lecteur Client 2](../../webapp/sites/client2-immobilier/README.md)
fait référence pour les URLs et le cache. Les visiteurs lisent uniquement la release
locale courante. Une langue ou un slug absent répond 404 ; un échec de synchronisation
peut laisser la dernière version publiée visible et ne doit jamais être masqué.

L’aperçu lit le brouillon enregistré, contrôle les droits actuels et appelle le renderer
Client 2 avec un secret serveur. Aucun lien public permanent n’accorde de droit.
Le rendu Vue commun échappe les textes et refuse les liens exécutables. `no-store`,
`noindex` et CSP restrictive excluent aperçu et état de session du cache public.
Une modification locale non enregistrée doit être enregistrée avant cet aperçu.

## Réception des dépendances

Les adaptateurs sont reçus par les commits locaux validés des cartes ; la matrice
et les SHA d’assemblage sont consignés dans OPS-013. Aucun mock ne prouve un backend
réel. L’utilisateur a demandé une recette sur fixtures tant qu’aucun environnement
externe isolé n’est affecté : aucune écriture API réelle n’est exécutée pour cette recette.

Restent hors preuve réelle : provisioning des organisations/comptes/memberships,
permissions et révocations directes dans Symfony, traduction externe, envoi d’e-mails,
invitation/récupération/retrait non supportés. La consolidation des chemins/contrôles
est explicitement différée après le développement ; elle ne bloque pas cette réalisation.
