# CI Conventions Validation

- Role: definir le lien entre les conventions locales, la documentation detaillee, les
  regles YAML et les scripts de verification CI.
- Related: [../../webapp/sites/showcase-immobilier/app/README.md](../../webapp/sites/showcase-immobilier/app/README.md), [../2.architecture/index.md](../2.architecture/index.md)

## Intent

`app/README.md` est la documentation operationnelle locale de la couche frontend Nuxt.
Il decrit les conventions techniques de facon courte, directement actionnable au quotidien.

Quand une convention demande plus de contexte, des exemples ou des exceptions, le README
renvoie vers `docs/`. La documentation detaillee reste la source explicative ; le README
reste le point d entree local.

Les conventions techniques automatisables doivent etre protegees par le CI/CD. Les scripts
dans `codebase-integrity/domaines/` executent ces controles.

## README Contract

Tout dossier de code (`app/`, `app/*`, `services/`, `server/`, `shared/`) porte un
`README.md` au modele strict a deux chapitres, dans cet ordre :

1. `## Role et responsabilites` — ce que la couche fait et ne fait pas.
2. `## Conventions techniques` — les regles locales courtes et actionnables.

Aucun autre chapitre de premier niveau n'est autorise. Une convention qui demande du contexte,
des exemples ou des exceptions reste courte dans le README et renvoie vers `docs/`. Le README
est le point d'entree local ; il n'est pas la documentation explicative.

Chaque convention technique automatisable du second chapitre doit pouvoir etre reliee a une
regle YAML et a un script CI (voir sections suivantes). Une couche n'est consideree comme
couverte que lorsque ses conventions automatisables sont protegees par la CI.

## Rule Declaration

Les regles de validation projet ne doivent pas etre codees en dur dans les scripts quand
elles decrivent une convention metier ou technique.

Une convention technique peut etre couverte par plusieurs regles YAML. Exemple : la
convention images peut contenir une regle sur les tags autorises, une regle sur les props
inline et une regle sur une prop interdite comme `height`.

Les scripts doivent lire des fichiers YAML qui declarent les regles concretes a appliquer :

- nom stable de la regle
- indicateur de revue manuelle
- severite
- chemins concernes
- patterns, blocs, tags, fonctions ou bonnes pratiques verifiables
- exceptions autorisees
- message de sortie lorsque la regle echoue

## Required Rule Fields

Chaque regle YAML doit definir au minimum :

```yaml
name: app-images-use-app-image
requiresManualReview: false
```

`name` identifie la regle de maniere stable.

`requiresManualReview` indique si une detection doit etre confirmee par un humain avant
d etre consideree comme une erreur certaine.

Quand plusieurs regles couvrent la meme convention technique, chaque regle garde son propre
`name` et son propre `requiresManualReview`.

## Deterministic And Heuristic Rules

Une regle deterministe peut bloquer directement le CI. Exemple : une balise `<img>` brute
dans `app/` hors `AppImage.vue`.

Une regle heuristique signale un risque ou un pattern suspect. Elle doit porter
`requiresManualReview: true`, car le contexte peut rendre la detection acceptable.

## Operating Model

Le modele attendu est :

1. `app/README.md` decrit la convention courte.
2. `docs/` explique le contexte, les exemples et les exceptions.
3. Le YAML formalise la regle et son niveau d ambiguite.
4. Le script CI lit le YAML et execute le controle.
5. Le workflow CI/CD lance les scripts applicables avant merge.

## Guardrail

Ajouter ou modifier une convention automatisable implique de mettre a jour dans le meme
scope :

- le README local concerne
- la documentation detaillee si necessaire
- la regle YAML
- le script de verification seulement si le moteur ne couvre pas encore ce type de regle
