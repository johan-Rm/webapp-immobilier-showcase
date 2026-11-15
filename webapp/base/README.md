# Socle frontend commun

## Rôle et responsabilités

- Définir les **conventions frontend communes** aux projets, indépendamment du contenu de leurs applications.
- Accueillir les **layers réutilisables** explicitement étendues par les sites.
- Séparer les **règles communes** des identités, contenus et adaptations propres à chaque projet.

## Conventions techniques

### Portée du socle

Les conventions du socle s’appliquent aux **applications clientes et au catalogue partagé**, même lorsqu’un dossier applicatif ne contient pas encore de code.

- Une layer déclare ses propres sources ; elle ne sélectionne pas implicitement l’application d’un client.
- L’application cliente sélectionnée reste explicite ; ce catalogue de layers n’est pas étendu globalement par défaut.
- La présence des README communs ne crée **aucune configuration Nuxt ni héritage de code automatique**.

### Ordre des blocs Vue

Les fichiers Vue présentent leurs blocs dans l’ordre **template, script setup TypeScript, style**. L’attribut **scoped est facultatif** sur le bloc de style.

### Organisation du script setup

Le script setup suit un **ordre de sections explicite**, afin de distinguer préparation des données et rendu.

- Imports ; types et constantes ; props et emits ; composables et stores ; état local ; entrées de données.
- Fonctions pures ; valeurs calculées prêtes pour l’interface ; gestionnaires d’événements ; observateurs ; métadonnées de page ; cycle de vie.
- Le template consomme des valeurs préparées et ne porte pas de logique métier.

### Données prêtes pour le template

Le template consomme des **valeurs de présentation préparées**, sans transformation non triviale.

- Une transformation strictement locale et visuelle utilise une fonction pure ou une valeur calculée du composant.
- Une orchestration réactive réutilisable appartient à un composable ; un état global dérivé est exposé par un getter de store.
- Les règles métier, mappings et normalisations appartiennent aux services dédiés.
- Traiter les données hors de l’affichage lorsque leur portée le justifie, sans abstraction prématurée pour un cas isolé.

### Vérifications des valeurs

Une donnée **garantie par son contrat de type** n’exige pas de garde défensive supplémentaire dans le template ou le script d’affichage.

- Supprimer les gardes devenues inutiles après stabilisation du contrat.
- Conserver les validations légitimes aux frontières des données, des formulaires et des accès.

### Marqueurs structurels

Les éléments de structure portent des **marqueurs statiques de diagnostic**, sans effet de style ni conteneur ajouté pour les accueillir.

- Les racines des pages portent `data-page`, celles des layouts `data-layout`.
- La valeur est dérivée du chemin du fichier dans sa catégorie, sans extension, en kebab-case ; les segments dynamiques conservent leur nom sans crochets.
- Les composants à racine HTML native unique portent `data-component` selon la même convention.
- Les racines multiples, conditionnelles ou constituées d’un composant Vue sont dispensées de ce marqueur pour éviter une perte ou un écrasement d’identité.
- Les grandes régions stables des pages, layouts et Screens portent un `data-section` statique et unique dans leur modèle.

### Internationalisation

Les **textes d’interface**, y compris les libellés d’accessibilité, passent par les clés de traduction.

- Les contenus éditoriaux et textes reçus par propriétés sont admis lorsque leur traduction est assurée en amont.
- Les usages directs de `useI18n` et `useLocalePath` restent autorisés ; ne pas créer un wrapper de locale sans besoin démontré.

### Événements et commentaires

Les interactions et commentaires rendent explicites le **comportement utile** et la **raison du code**.

- Préférer les primitives VueUse avec nettoyage au démontage ; un appel DOM direct reste autorisé pour un besoin concret expliqué localement.
- Les commentaires expliquent le code applicable ; Git et le dev-book portent les références de tâches et la chronologie.
- Les signalements de dette nécessitant une appréciation humaine restent informatifs ; une correction conserve la contrainte utile qu’ils décrivent.

### Modules externes

Un module externe est encapsulé derrière un **contrat interne unique**, hors exception explicitement admise.

- Le composant, composable ou service d’encapsulation absorbe les défauts imposés et les comportements transverses du module.
- Une règle de contrôle dédiée empêche l’utilisation directe du module en dehors de son encapsulation.
- L’exception de consommation directe de l’internationalisation ne modifie pas le contrat du composant image.
- Vérifier les composants disponibles dans **Nuxt UI** avant de créer un élément d’interface spécifique.

### Types partagés

Un **type TypeScript manuel utilisé par plusieurs fichiers** appartient aux types partagés ; un type local non exporté reste dans son fichier.

- Les contrats générés sont distincts des types manuels et dérivent des schémas YAML.
- Leur compatibilité est vérifiée par TypeScript.
