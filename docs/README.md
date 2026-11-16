# Documentation

## Rôle et responsabilités

- Conserver les **explications durables** du projet.
- Définir les **conventions de rédaction** et leur périmètre.
- Expliquer les sujets avec **pédagogie et concision**.

## Conventions techniques

### Source unique

Chaque information possède une **source de référence unique**.

- Les règles locales sont définies dans le **README du dossier de premier niveau responsable** ; les règles frontend partagées sont réparties par responsabilité dans les README du **socle commun**.
- La **documentation du projet** les explique sans les recopier.

### Contenu des README

Un README formalise exclusivement le **rôle et les responsabilités** du dossier et ses **conventions techniques**.

- Les README sont placés à la **racine du dépôt ou dans ses dossiers de premier niveau**. Les règles des sous-dossiers de niveau deux ou plus sont regroupées dans le README du dossier de premier niveau concerné.
- Les emplacements webapp explicitement retenus restent autorisés : Dashboard, services, code partagé, schémas, serveur et sites clients ; les sous-dossiers techniques supplémentaires restent interdits hors du socle commun.
- **Exception du socle frontend** : ses README spécialisés sont autorisés dans les sous-dossiers pour définir les règles communes aux projets. Ils respectent les règles de contenu et de forme.
- **Exception du README racine** : sa structure et son contenu sont conservés ; ses liens restent contrôlés.
- Un **titre H1 unique** nomme le dossier ou son rôle.
- Exactement **deux rubriques H2** se succèdent : « Rôle et responsabilités », puis « Conventions techniques ».
- La première rubrique contient une **liste de responsabilités**.
- Chaque convention possède un **titre H3** suivi d’une **description en prose**, avant ses éventuelles listes, exemples ou sous-rubriques.
- Aucune citation introductive n’est exigée.

### Lisibilité

Les README présentent les règles avec **pédagogie et concision**, dans une mise en forme qui facilite leur lecture.

- Mettre les **termes essentiels en gras**, avec parcimonie.
- Utiliser des **listes** pour les énumérations et les règles distinctes lorsqu’elles facilitent la lecture.
- Conserver des **paragraphes courts** pour les descriptions et explications liées.

### Absence de références et de chemins

Les README décrivent les responsabilités et règles **sans dépendre de l’emplacement d’un autre fichier**.

- Aucun **lien**, **adresse web** ou **renvoi documentaire** n’est autorisé.
- Aucun **chemin relatif ou propre à une machine** n’est autorisé.
- Ces interdictions s’appliquent aussi aux **exemples et blocs de code**.
- La **documentation du projet** porte la navigation, les procédures et les commandes nécessitant des chemins.

### Informations durables

Les README décrivent les **règles applicables**, sans historique, journal des changements ni suivi de versions.

- Aucun **état temporaire** : résultat ou décompte de tests, inventaire chiffré de fichiers, empreinte Git, date de copie, session, avancement de demande ou verdict de livraison.
- **Git** conserve l’historique ; les **cartes et rapports** conservent les décisions et preuves.
- Les **paramètres techniques définis par une convention** ne sont pas des résultats observés.
- Une formulation décrivant un état provisoire doit devenir une **règle durable** ou être déplacée dans une trace.

### Vérification et relecture

Le **contrôle déterministe** vérifie la forme des README ; la **relecture humaine** vérifie leur sens.

- **Périmètre** : tous les README Markdown suivis ou non ignorés du dépôt courant, sans distinction de casse.
- **Exclusions** : dépendances ignorées et copies de worktrees. Le README décrivant les worktrees reste contrôlé.
- **Refus** : liens symboliques et écarts aux règles, sans exemption des écarts existants.
- **Détection** : structure et formes reconnaissables de liens, chemins et informations temporaires, y compris dans les exemples.
- **Relecture humaine** : pertinence du texte, inventaires exprimés en langage naturel et formes non reconnues par le script.
- **Limites** : aucune correction automatique ; un succès technique ne prouve pas l’absence de tout contenu volatil.

### Autres documents

La **documentation du projet** explique les standards et leur mise en œuvre.

- Le contrôle des **liens et de la structure** des autres documents porte sur la gouvernance, les modèles, les demandes et les cartes.
- Toute évolution des **règles ou du périmètre de contrôle** passe par une consolidation explicite.
