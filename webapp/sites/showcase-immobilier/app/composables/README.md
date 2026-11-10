# app/composables/

Passerelle réactive entre l'UI et la logique applicative.

## Rôle et responsabilités

**Rôle Nuxt :** un composable est une fonction de composition auto-importée qui encapsule
une logique réactive réutilisable — état, valeurs dérivées (`computed`), watchers, cycle de
vie — exposée via une API nommée explicite. Nuxt auto-importe les exports du premier niveau
du dossier. Réf. : [doc Nuxt — `composables/`](https://nuxt.com/docs/4.x/directory-structure/app/composables).

**Rôle attendu :** la couche composable est la passerelle réactive entre les couches
d'affichage (pages, composants) et les couches de données (stores, services). Elle
orchestre la réactivité — état, valeurs dérivées, synchronisation UI / URL / cycle de vie —
et expose à l'affichage des données déjà prêtes à être rendues, afin que les composants
restent passifs. La logique métier pure ne lui appartient pas : elle est déléguée aux
services. Elle distingue explicitement l'état local qu'elle crée de l'état global qu'elle
partage.

La place de cette couche dans l'architecture et la structure interne recommandée sont
définies dans
[docs/2.architecture/8.composables-standard.md](../../../../../docs/2.architecture/8.composables-standard.md).

## Conventions techniques

### Responsabilité unique

Un composable a une responsabilité claire et identifiable (`useSearch`, `useUserProfile`,
`useInfiniteScroll`) — pas de fourre-tout (`useGlobalStuff`, `useHelpers`).

### API explicite

Les noms exposés dans le `return {}` reflètent le métier (`users`, `isLoading`,
`refreshUsers`), pas la mécanique (`data`, `loading`, `execute`).

### Side effects explicites

Aucun appel API ni comportement critique déclenché implicitement à l'invocation du
composable. L'appelant déclenche l'effet lui-même :

```ts
const { loadUser } = useUser()
await loadUser()
```

### Watchers limités

Les `watch()` restent rares et justifiés : synchronisation URL, déclenchement API,
interaction externe. Préférer `computed` et une architecture déclarative.

### Pas de composable « magique »

Un composable ne modifie pas silencieusement des stores, ne déclenche pas d'analytics
cachés ni d'appels réseau invisibles. Les effets sont lisibles et prévisibles.

### Séparer orchestration et logique métier

Le composable orchestre la réactivité Vue. La transformation métier est externalisée dans
`services/`, `utils/` ou des fonctions pures.

### Taille et nombre de retours

Un composable volumineux cache plusieurs responsabilités : découper en composables
spécialisés. Un composable (`use*.ts`) ne doit pas exposer plus de 8 valeurs dans son
`return {}`.

Règle YAML : `app-composable-many-returns`

### État local vs état partagé

Le composable exprime clairement s'il crée un état local (`ref`) ou partage un état
global (`useState('key', ...)`).

### Composables orientés feature

Préférer des composables métier cohérents (`usePropertyFilters`, `useBookingCalendar`)
à une accumulation de micro-composables techniques.

### Documentation des effets

Les comportements importants (synchronisation URL, refresh automatique…) sont documentés
en tête de composable.

Les règles transverses de la couche `app/` s'appliquent également
(voir [../README.md](../README.md)).
