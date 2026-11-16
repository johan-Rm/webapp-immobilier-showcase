# Contenus, médias et fixtures

> Préparer et comprendre les contenus de démonstration sans modifier les données utilisateur.


## Dossier `content/{lang}/`

Le contenu effectif réside dans `sites/<client>/content/`. Voir
[les layers clients](../2.architecture/14.site-layers.md).

### 1. Rôle et responsabilités

- Projection de lecture runtime par langue (`fr`, `en`, etc.) : métadonnées métier, contenus éditoriaux et messages.
- Sépare la structure (metadata, pages, components) des layouts/logic Vue (dans `app/`).
- Fournit une API de contenu stable via `index.ts` (metadata + pages + components + messages).
- Centralise les listes de valeurs métier localisées et les définitions UI (forms, tables, menus).
- Héberge les blocs éditoriaux réutilisables et les textes transverses (`messages.yml`).

---

### 2. Bonnes pratiques

- Conserver des clés stables entre langues (les libellés varient, pas les identifiants).
- Séparer le contenu des layouts/logic Vue ; ne pas dupliquer la logique métier ici.
- Grouper les règles/contrats dans `metadata/constraints.ts` et réexporter via `metadata/index.ts`.
- Préférer des formats lisibles (`.yml`, `.md`) pour l’éditorial, `.ts` pour l’agrégation/validation.
- Garder des dossiers `{lang}` homogènes (même arborescence, mêmes clés).

### 3. Conventions de nommage

- Fichiers enums : `kebab-case` (`project-statuses.yml`, `document-statuses.yml`).
- Fichiers de contenu éditorial : `kebab-case` cohérent avec la route ou le bloc.
- Points d’entrée : `metadata/index.ts`, `index.ts` à la racine de la langue, `messages.yml`.
- Dossiers libres (`{any}/`) : conserver la même structure entre langues (blog, docs, faq, etc.).

#### 3.1. Identifiants des accommodations

- Le champ `identifier` des fiches `content/{lang}/accommodations/*.md` suit une convention dérivée de `realEstateListing` et `category`.
- Format : `INITIALS(realEstateListing) + INITIALS(category) + compteur sur 3 chiffres`.
- Les initiales sont calculées en prenant la première lettre de chaque mot séparé par `-`, puis en concaténant le tout en majuscules.
- Le compteur est incrémental par couple exact `realEstateListing + category`.
- Le compteur repart à `001` pour chaque nouveau couple.

Exemples :

- `bien-a-vendre` + `appartement` -> `BAVA001`
- `bien-a-vendre` + `maison-de-campagne` -> `BAVMDC001`
- `location-longue-duree` + `appartement` -> `LLDA001`
- `location-saisonniere` + `villa-golf` -> `LSVG001`

Pseudo-formule :

```text
identifier =
  ''.join(initiale(mot) pour mot dans realEstateListing.split('-')).upper()
  + ''.join(initiale(mot) pour mot dans category.split('-')).upper()
  + compteur_du_couple_sur_3_chiffres
```

#### 3.2. Slugs des accommodations

- Le champ `slug` des fiches `content/{lang}/accommodations/*.md` est dérivé mécaniquement de `identifier`, `name` et `place`.
- Si `name` est renseigné : `slug = slugify(identifier + " " + name + " " + place)`.
- Si `name` est absent : `slug = slugify(identifier + " " + category + " " + place)`.
- `identifier` est placé en préfixe pour garantir l'unicité et former une référence canonique lisible.

Règles de `slugify` :

- minuscules uniquement
- suppression des accents
- suppression des apostrophes
- remplacement des espaces et séparateurs par `-`
- suppression des caractères non alphanumériques
- réduction des tirets multiples
- suppression des tirets en début et fin

Exemples :

- `LLDA001` + `Appartement avec balcon au centre-ville` + `centre-ville` -> `llda001-appartement-avec-balcon-au-centre-ville-centre-ville`
- `LLDVG001` + `Villa golf résidentielle à Mogador` + `golf-mogador` -> `lldvg001-villa-golf-residentielle-a-mogador-golf-mogador`
- sans `name` : `LSVG001` + `villa-golf` + `golf-mogador` -> `lsvg001-villa-golf-golf-mogador`

Pseudo-formule :

```text
if name:
  slug = slugify(identifier + " " + name + " " + place)
else:
  slug = slugify(identifier + " " + category + " " + place)
```

### 4. Performance

- Éviter les fichiers volumineux uniques : segmenter par domaine (forms, tables, menus).
- Mutualiser les valeurs partagées via enums et messages pour limiter la duplication.
- Vérifier les chemins scannés par Nuxt Content/chargement custom pour ne pas inclure d’artefacts inutiles.

### 5. Structure et organisation

- Arborescence attendue par langue :

```text
content/{lang}/
│
├── metadata/
│   ├── ... fichiers .md / .yml / .json
│   │
│   ├── enums/
│   │   └── ... fichiers .md / .yml / .json
│   │
│   ├── definitions/
│   │   ├── forms/
│   │   │   └── ... fichiers .md / .yml / .json
│   │   ├── tables/
│   │   │   └── ... fichiers .md / .yml / .json
│   │   ├── menus/
│   │   │   └── ... fichiers .md / .yml / .json
│   │   └── constraints.ts
│   │
│   └── index.ts               ← export unifié des metadata
│
├── components/
│   └── ... fichiers .md / .yml / .json
│
├── pages/
│   └── ... fichiers .md / .yml / .json
│
├── {any}/
│   └── ... fichiers .md / .yml / .json
│
├── messages.yml               ← traductions libres / micro-textes
└── index.ts                   ← agrégation globale de la langue
```

---

### 6. Détails par sous-dossier

#### 6.1. `metadata/`

- Données métier structurées et localisées (statuts, rôles, types, catégories, etc.).
- Décrit la structure UI (content-driven) : forms, tables, menus.
- `metadata/index.ts` agrège enums + definitions dans un export stable.

##### `metadata/enums/`

- Listes de valeurs métier (clés stables entre langues, libellés localisés).
- Exemples : `project-statuses.yml`, `document-statuses.yml`, `subscription-statuses.yml`.

##### `metadata/definitions/`

- Structure de l’interface métier (forms/tables/menus).
- `forms/` : champs, labels, aides ; `tables/` : colonnes/entêtes ; `menus/` : navigation.
- `constraints.ts` : contraintes/validation centralisées (types, min/max, dépendances) pouvant référencer des clés de messages.

#### 6.2. `components/`

- Blocs éditoriaux réutilisables (teasers, encarts, introductions, blocs d’aide).
- Chargés via Nuxt Content ou une couche de services.

#### 6.3. `pages/`

- Contenu éditorial des pages liées aux routes.
- Sépare le contenu (`content/{lang}/pages/`) du layout/logic (`app/pages/`).

#### 6.4. `{any}/`

- Domaine extensible (blog, documentation, FAQ, guides, etc.).
- Doit rester cohérent entre langues.

#### 6.5. `messages.yml`

- Traductions libres / micro-textes (labels, messages d’info, états vides, textes d’UI).
- Complète l’i18n côté contenu (pas de config technique).

#### 6.6. `index.ts` (racine de `content/{lang}/`)

- Point d’agrégation global pour une langue.
- Regroupe `metadata`, `components`, `pages`, `{any}` et les `messages` chargés depuis `messages.yml`.

## Dossier `content/{lang}/`

### 1. Rôle et responsabilités

- Projection de lecture runtime par langue (`fr`, `en`, etc.) : métadonnées métier, contenus éditoriaux et messages.
- Sépare la structure (metadata, pages, components) des layouts/logic Vue (dans `app/`).
- Fournit une API de contenu stable via `index.ts` (metadata + pages + components + messages).
- Centralise les listes de valeurs métier localisées et les définitions UI (forms, tables, menus).
- Héberge les blocs éditoriaux réutilisables et les textes transverses (`messages.yml`).

---

### 2. Bonnes pratiques

- Conserver des clés stables entre langues (les libellés varient, pas les identifiants).
- Séparer le contenu des layouts/logic Vue ; ne pas dupliquer la logique métier ici.
- Grouper les règles/contrats dans `metadata/constraints.ts` et réexporter via `metadata/index.ts`.
- Préférer des formats lisibles (`.yml`, `.md`) pour l’éditorial, `.ts` pour l’agrégation/validation.
- Garder des dossiers `{lang}` homogènes (même arborescence, mêmes clés).

### 3. Conventions de nommage

- Fichiers enums : `kebab-case` (`project-statuses.yml`, `document-statuses.yml`).
- Fichiers de contenu éditorial : `kebab-case` cohérent avec la route ou le bloc.
- Points d’entrée : `metadata/index.ts`, `index.ts` à la racine de la langue, `messages.yml`.
- Dossiers libres (`{any}/`) : conserver la même structure entre langues (blog, docs, faq, etc.).

### 4. Performance

- Éviter les fichiers volumineux uniques : segmenter par domaine (forms, tables, menus).
- Mutualiser les valeurs partagées via enums et messages pour limiter la duplication.
- Vérifier les chemins scannés par Nuxt Content/chargement custom pour ne pas inclure d’artefacts inutiles.

### 5. Structure et organisation

- Arborescence attendue par langue :

```text
content/{lang}/
│
├── metadata/
│   ├── ... fichiers .md / .yml / .json
│   │
│   ├── enums/
│   │   └── ... fichiers .md / .yml / .json
│   │
│   ├── definitions/
│   │   ├── forms/
│   │   │   └── ... fichiers .md / .yml / .json
│   │   ├── tables/
│   │   │   └── ... fichiers .md / .yml / .json
│   │   ├── menus/
│   │   │   └── ... fichiers .md / .yml / .json
│   │   └── constraints.ts
│   │
│   └── index.ts               ← export unifié des metadata
│
├── components/
│   └── ... fichiers .md / .yml / .json
│
├── pages/
│   └── ... fichiers .md / .yml / .json
│
├── {any}/
│   └── ... fichiers .md / .yml / .json
│
├── messages.yml               ← traductions libres / micro-textes
└── index.ts                   ← agrégation globale de la langue
```

---

### 6. Détails par sous-dossier

#### 6.1. `metadata/`

- Données métier structurées et localisées (statuts, rôles, types, catégories, etc.).
- Décrit la structure UI (content-driven) : forms, tables, menus.
- `metadata/index.ts` agrège enums + definitions dans un export stable.

##### `metadata/enums/`

- Listes de valeurs métier (clés stables entre langues, libellés localisés).
- Exemples : `project-statuses.yml`, `document-statuses.yml`, `subscription-statuses.yml`.

##### `metadata/definitions/`

- Structure de l’interface métier (forms/tables/menus).
- `forms/` : champs, labels, aides ; `tables/` : colonnes/entêtes ; `menus/` : navigation.
- `constraints.ts` : contraintes/validation centralisées (types, min/max, dépendances) pouvant référencer des clés de messages.

#### 6.2. `components/`

- Blocs éditoriaux réutilisables (teasers, encarts, introductions, blocs d’aide).
- Chargés via Nuxt Content ou une couche de services.

#### 6.3. `pages/`

- Contenu éditorial des pages liées aux routes.
- Sépare le contenu (`content/{lang}/pages/`) du layout/logic (`app/pages/`).

#### 6.4. `{any}/`

- Domaine extensible (blog, documentation, FAQ, guides, etc.).
- Doit rester cohérent entre langues.

#### 6.5. `messages.yml`

- Traductions libres / micro-textes (labels, messages d’info, états vides, textes d’UI).
- Complète l’i18n côté contenu (pas de config technique).

#### 6.6. `index.ts` (racine de `content/{lang}/`)

- Point d’agrégation global pour une langue.
- Regroupe `metadata`, `components`, `pages`, `{any}` et les `messages` chargés depuis `messages.yml`.


## Fixtures de démo — biens d'exception (parcours immersif)

Source de vérité **versionnée** des biens d'exemple **fictifs** créés pour la tâche
[033](../../dev-book/tasks/033-villas-exemples-parcours-immersif.md).

### Pourquoi ce dossier

`content/*/accommodations/` est **gitignoré** et **purgé** par `make dev-content-sync`
(pull-only depuis l'API Symfony). Les fixtures de démo n'y survivraient pas. On les
versionne donc ici, et on les **repose** dans `content/fr/accommodations/` au besoin.

### Préparer les fixtures locales

```bash
bun run setup:local
```

Le script les prépare dans les trois langues avec le marqueur `dataSource: fixture`.
Les photos de démonstration originales sont conservées dans `public/poc/` et
`public/images/` ; les illustrations de `public/demo/` restent disponibles.
Le setup refuse de remplacer un bien ou un référentiel non fictif.

### Anonymisation

Données **fictives** : noms, références et textes réécrits, inspirés de listings réels
sans copie verbatim. Caractéristiques factuelles génériques uniquement (surfaces, nombre
de chambres, piscine, localisation régionale). Images : photos de démonstration conservées et illustrations SVG complémentaires.

### Fixtures

| Slug                       | `category` | Type                                     | Localisation (fictive) |
| -------------------------- | ---------- | ---------------------------------------- | ---------------------- |
| `villa-des-alizes`         | `villa`    | villa de plain-pied (POC d'origine)      | Essaouira              |
| `villa-lumiere-mogador`    | `villa`    | villa contemporaine de plain-pied        | Mogador                |
| `villa-najma-mogador`      | `villa`    | villa contemporaine                      | Mogador                |
| `villa-saadia-essaouira`   | `villa`    | demeure d'inspiration marocaine          | campagne (Ida Ougourd) |
| `villa-soleil-essaouira`   | `villa`    | propriété de prestige (tennis, golf)     | campagne d'Essaouira   |
| `villa-dunes-essaouira`    | `villa`    | villa de pierre épurée                   | campagne               |
| `domaine-tilila-essaouira` | `villa`    | domaine contemporain (10 ch.)            | campagne (zone rurale) |
| `maison-amani-essaouira`   | `villa`    | maison de campagne aux galeries d'arches | Ghazoua                |
| `riad-assala-essaouira`    | `villa`    | riad d'exception (zelliges, spa)         | Ounagha                |
| `kasbah-tigmi-essaouira`   | `villa`    | kasbah de terre berbère                  | Had Draa               |
| `dar-zahra-essaouira`      | `villa`    | demeure ocre aux patios fleuris          | campagne d'Essaouira   |

Tous en `category: villa` / `realEstateListing: bien-a-vendre`. Route
`/properties/bien-a-vendre/villa/<slug>` → activation de la fiche bien d'exception
(`isExceptionalProperty`, cf. `services/mapper/exceptional.ts`). La fiche se résout **par slug**,
indépendamment de la catégorie de route ; l'activation immersive ne dépend que du bloc `hasPart`.

> Le code `villa` est **prévu dans la taxonomie** `accommodation-type` (à ajouter côté Symfony,
> puis pull via `content-sync` ; `category-code.yaml` est gitignoré/synchronisé). Tant qu'il n'est
> pas enregistré, le libellé de catégorie résout un brut `villa` (le rendu de la fiche, lui, n'en
> dépend pas).

### Modèle média (aligné dashboard 032)

La galerie `associatedMedia` du bien est la **source unique** des images. Chaque item porte
un identifiant lisible, son url et sa légende :

```yaml
associatedMedia:
  - image: villa-lumiere-salon-01 # identifiant (clé de référence)
    url: /demo/property.svg
    caption: Salon ouvert sur le jardin
    representativeOfPage: true # 1er média = visuel représentatif
```

Les écrans (`hasPart`) ne dupliquent pas l'url : ils **référencent** un média de la galerie
par son seul identifiant (une légende optionnelle peut surcharger celle de la galerie) :

```yaml
hasPart:
  - additionalType: SCREEN_ACCOMMODATION_SPLIT
    associatedMedia:
      - image: villa-lumiere-salon-01
```

Résolution : `services/mapper/accommodation.ts` indexe la galerie du bien puis résout chaque
référence d'écran par ordre de priorité **galerie du bien → index média global → url directe**
(cette dernière pour la rétro-compat du contenu legacy). Le mapper du parcours
(`services/mapper/exceptional.ts`) reçoit ainsi des url prêtes à l'emploi. Couverture :
`services/mapper/accommodation.vitest.ts`.


## Catalogue de démonstration conservé

Les biens, traductions et référentiels Blueprint sont conservés comme données de
démonstration, conformément au cadrage du projet. Le setup les recopie sans
remplacer leurs localisations ou leurs galeries par des illustrations.

Les photos originales restent dans `public/poc/` et `public/images/`.
Les illustrations de `public/demo/` restent disponibles en complément.
Les médias déjà estampillés nécessitent une régénération depuis les originaux
côté backend ; superposer un nouveau stamp ne retire pas l'ancien.
Le nouveau visuel transparent est `public/branding/showcase-stamp.svg`, avec
son export PNG `public/branding/showcase-stamp.png`.


## Ressources publiques

Les fichiers publics résident dans `sites/<client>/public/`. Les URL existantes
restent identiques. Voir [les layers clients](../2.architecture/14.site-layers.md).
