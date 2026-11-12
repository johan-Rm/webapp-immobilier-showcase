# Utiliser et exploiter le dashboard SaaS

## Rôle et responsabilités

Guide du dashboard commun et du premier parcours article. Les capacités disponibles
et leurs limites sont définies par le [contrat SaaS](../3.application/dashboard-saas-contrats.md).
Les résultats de recette et l’environnement utilisé restent dans la carte OPS-013.

## Préparer l’environnement

Utiliser un assemblage des commits validés et la couche affectée, avec ses ports et
données isolés ; voir [les worktrees](../../worktree/README.md). Aucun secret d’une
pile existante ne doit être copié automatiquement. Ne pas lancer de parcours d’écriture
contre Symfony sans organisations, projets et comptes de test explicitement affectés.

Configurer côté serveur l’origine publique du dashboard et l’origine Symfony.
`SAAS_PLATFORM_ADMIN_EMAILS` désigne les opérateurs, sans remplacer les droits natifs.
`SAAS_PUBLICATION_PROJECTS` associe explicitement le seul UUID pilote à Client 2.
Le worker et Client 2 doivent recevoir ce même projet. Les paramètres et commandes
restent dans le [guide du projecteur](../../webapp/scripts/README.md#projection-publiée-saas--client-2)
et le [README Client 2](../../webapp/sites/client2-immobilier/README.md).

Préparer le volume avec `make dev-saas-project-prepare`, puis construire/lancer
explicitement la [pile dashboard](../../infra/nginx/README.md). Les commandes
historiques à deux sites restent disponibles. Le worker est optionnel : le lancer
séparément après configuration, sinon les publications peuvent rester en attente.
Le dry-run valide sans écrire de projection, télécharger d’image ou accuser la file.
Aucun abonnement, paiement ou déploiement de production n’est compris.

## Se connecter et choisir un projet

Se connecter avec le compte natif existant, puis choisir l’organisation et le projet.
La sélection ne donne aucun droit supplémentaire. Un projet refusé par Symfony
reste inaccessible, même si son organisation est visible. Le dashboard existant
Showcase conserve son accès et ses données distincts.

Les invitations, la récupération de mot de passe et le retrait de membre sont
indisponibles dans cet adaptateur. Ne pas les présenter comme des actions réussies.
La préparation de comptes réels relève de l’administration native existante.

## Éditer un article

1. Ouvrir **Contenus → Articles**, créer ou sélectionner une fiche et une langue.
2. Renseigner les champs et composer les blocs texte, image et galerie. Leur ordre
   est conservé ; les composants du site ne sont pas insérables dans cette version.
3. Rechercher une catégorie ou la créer depuis le sélecteur. Elle est sélectionnée
   sans réinitialiser le texte en cours. Avant modification d’un libellé partagé,
   consulter l’avertissement sur les contenus concernés.
4. Sélectionner une image du projet ou importer un fichier depuis la fiche. Un média
   encore en traitement ne peut pas être publié.
5. Enregistrer, rouvrir et vérifier chaque traduction. Les traductions manquantes
   retournées par le backend restent des brouillons à relire.
6. Après enregistrement, ouvrir l’aperçu privé. Les visiteurs voient toujours la
   dernière version publiée, indépendamment du contenu de cet aperçu.
7. Publier la langue voulue et attendre l’état de projection appliquée. Vérifier sa
   liste et sa fiche sur Client 2. Dépublier une langue conserve son brouillon et
   n’affecte pas les autres traductions.

En cas de conflit de révision, conserver la saisie et rapprocher les modifications ;
ne pas forcer un écrasement. Quitter une fiche ou changer de projet avec une saisie
non enregistrée déclenche un avertissement. Les entrées du menu non réalisées restent
signalées indisponibles ; les catégories s’administrent depuis les fiches.

## Exploiter et diagnostiquer

Un succès natif ne vaut pas succès public. En cas d’état en attente ou d’échec,
consulter le résultat JSON du worker, vérifier configuration du projet, accès à la
file et disponibilité des médias, puis reprendre avec la même commande autorisée.
Le [guide du projecteur](../../webapp/scripts/README.md#projection-publiée-saas--client-2)
décrit la reprise, les erreurs et l’inspection d’un verrou après arrêt brutal.
Ne pas supprimer automatiquement les données ou changer les empreintes pour débloquer.

Conserver les fichiers privés de session et de publication hors du volume public.
Une installation perdant son journal n’a pas démontré la capacité à reconstituer la
file depuis les seuls articles natifs. Le modèle courant ne garantit pas les écritures
concurrentes entre plusieurs instances Nitro ; ne pas annoncer cette garantie.

## Vérifier sans données réelles

Les tests BFF utilisent une API native simulée ; les tests UI simulent les réponses
BFF. Ces niveaux prouvent des comportements complémentaires, sans prouver la sécurité
d’une instance Symfony déployée. Les parcours navigateur isolés sont décrits dans
le README de chaque cible. Vérifier types/build des trois cibles et leurs domaines
SSR avant livraison ; conserver les résultats inconnus ou non exécutés comme tels.
