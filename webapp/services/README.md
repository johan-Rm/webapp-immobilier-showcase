# services/

Couche métier pure, framework-agnostic. Contient la logique applicative réutilisable,
indépendante de Vue, Nuxt et Pinia.

## Rôle et responsabilités

Cette couche porte la logique métier pure de l'application, indépendante du framework de
rendu : transformation et mapping de données, appels aux backends, génération d'artefacts
et de données dérivées. Elle reçoit ses entrées en paramètres et retourne des données —
elle ne connaît ni le cycle de vie des composants, ni l'état réactif, ni le store. Elle est
consommée par les composables, les pages et la couche serveur, et reste testable hors
runtime Nuxt.

Cette couche n'a pas de rôle framework : elle est agnostique par contrat (voir la règle
« Zéro dépendance framework » ci-dessous).

## Conventions techniques

> Les conventions automatisables de cette section sont protégées par la CI. Les règles
> concrètes sont déclarées en YAML dans `codebase-integrity/domaines/architecture-dependances/regles.yaml`.
> Pour le modèle complet, voir
> [docs/3.application/ci-conventions-validation.md](../../docs/3.application/ci-conventions-validation.md).

### Zéro dépendance framework

Aucun fichier de `services/` ne doit importer depuis `vue`, `nuxt`, `#app`, `#imports`,
`pinia` ou un module d'auto-import Nuxt. La couche reste pure et testable hors runtime Nuxt.

La logique réactive, l'accès au store et les primitives Nuxt appartiennent aux `composables/`
ou aux `pages/`, qui consomment les services.

@see [docs/2.architecture/10.services-standard.md](../../docs/2.architecture/10.services-standard.md)

Règle YAML : `services-no-framework-imports`

### Frontière de la couche

Un service ne lit pas l'état global et ne déclenche pas d'effet de rendu. Il reçoit ses
entrées en paramètres et retourne des données. Toute dépendance à un contexte d'exécution
(requête, store, runtime) est injectée par l'appelant.

@see [docs/2.architecture/5.responsibility-boundaries.md](../../docs/2.architecture/5.responsibility-boundaries.md)

### Placement des types

Un type partagé par plusieurs fichiers est défini dans `shared/types/`. Un type local non
exporté reste dans le fichier qui l'utilise.

@see [docs/2.architecture/9.types-placement.md](../../docs/2.architecture/9.types-placement.md)
