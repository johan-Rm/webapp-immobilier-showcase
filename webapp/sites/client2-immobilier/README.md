# Client 2 Immobilier

## Rôle et responsabilités

- Fournir une cible SSR indépendante avec accueil et articles multilingues.
- Servir seulement les traductions publiées, sans appel Symfony côté visiteur.
- Garder les parcours et initialisations des autres sites hors de cette cible.

## Conventions techniques

### Composition éditoriale

L’accueil conserve sa présentation minimale ; les articles utilisent leur layout éditorial explicite et leur composition plein écran. Les particularités de présentation restent locales au site.

### Lecture publiée

Le lecteur capture une release par requête et vérifie son empreinte. Les pages et réponses éditoriales ne sont pas mises en cache ; les médias nommés par empreinte ont un cache immuable. Une dépublication retire fiche, liste et SEO courants sans repli de langue ; les requêtes engagées peuvent finir de charger les images déjà publiques.

### Configuration privée

L’identité du projet et le secret d’aperçu sont privés. Un projet absent provoque une indisponibilité explicite ; aucun identifiant Symfony ni secret n’entre dans la configuration publique.

### Aperçu sécurisé

L’aperçu valide projet, langue, blocs et médias. Le rendu commun échappe les textes et refuse les liens exécutables, sans HTML éditorial brut. Les réponses d’aperçu interdisent cache et indexation, appliquent une politique de contenu restrictive et ne sérialisent ni session ni brouillon. Les médias passent par les contrôles de droits du BFF.

### Vérifications indépendantes

Les parcours et contrats sont vérifiés avec des fixtures isolées, sans pile utilisateur ni API réelle. Les fixtures ne démontrent pas le raccordement d’un backend distant.
