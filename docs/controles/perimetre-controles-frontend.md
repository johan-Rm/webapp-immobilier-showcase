# Périmètre des contrôles frontend

> Comprendre la découverte des fichiers et la résolution des alias sans confondre cible exécutée et périmètre contrôlé.

## Découverte des fichiers

Les [conventions de périmètre](../../codebase-integrity/README.md#contrôles-existants) sont définies dans le README Codebase Integrity. Les vérificateurs et leurs tests sont regroupés dans `codebase-integrity/domaines/`.

L’inventaire Git utilisé par les contrôles frontend couvre `webapp/app/`, `webapp/sites/<client>/app/`, `webapp/dashboard/app/` et `webapp/base/real-estate/`. Sélectionner un client pour un build ne limite donc pas la vérification à ce client. Les composants, pages, layouts et composables ont chacun leur sélection de fichiers.

## Localisation de l’exception image

Le fichier exempté est `components/AppImage.vue` à la racine de l’application concernée. Un fichier homonyme dans un sous-dossier ou dans le catalogue partagé ne bénéficie pas de cette exemption. La distinction porte sur sa localisation complète, pas seulement sur son nom.

## Résolution des alias de types

Pour un fichier applicatif, les alias frontend sont interprétés dans son application. Pour le catalogue partagé, l’application consommatrice désignée est Showcase : les imports du catalogue sont donc résolus dans cette application. Ce raccordement est une limite à réexaminer avant de partager le catalogue avec une autre application ; il ne prouve pas une compatibilité multiclient.

## Prérequis de création d’un worktree

La liste `requireBasePaths` de `infra/config/layers.json` indique les fichiers que le créateur exige dans la base choisie. Elle inclut notamment le regroupement `webapp/` et la configuration des couches. Une base incomplète est refusée avant création.
