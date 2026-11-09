---
blueprint_source: /app/docs/blueprints/modern-webapp-nuxt/directory-structure/content/README.md
blueprint_copied_at: 2026-01-22T13:03:48+00:00
---

# Dossier `content/{lang}/`

## 1. Rôle et responsabilités

- Projection de lecture runtime par langue (`fr`, `en`, etc.) : métadonnées métier, contenus éditoriaux et messages.
- Sépare la structure (metadata, pages, components) des layouts/logic Vue (dans `app/`).
- Fournit une API de contenu stable via `index.ts` (metadata + pages + components + messages).
- Centralise les listes de valeurs métier localisées et les définitions UI (forms, tables, menus).
- Héberge les blocs éditoriaux réutilisables et les textes transverses (`messages.yml`).

---

## 2. Bonnes pratiques

- Conserver des clés stables entre langues (les libellés varient, pas les identifiants).
- Séparer le contenu des layouts/logic Vue ; ne pas dupliquer la logique métier ici.
- Grouper les règles/contrats dans `metadata/constraints.ts` et réexporter via `metadata/index.ts`.
- Préférer des formats lisibles (`.yml`, `.md`) pour l’éditorial, `.ts` pour l’agrégation/validation.
- Garder des dossiers `{lang}` homogènes (même arborescence, mêmes clés).

## 3. Conventions de nommage

- Fichiers enums : `kebab-case` (`project-statuses.yml`, `document-statuses.yml`).
- Fichiers de contenu éditorial : `kebab-case` cohérent avec la route ou le bloc.
- Points d’entrée : `metadata/index.ts`, `index.ts` à la racine de la langue, `messages.yml`.
- Dossiers libres (`{any}/`) : conserver la même structure entre langues (blog, docs, faq, etc.).

### 3.1. Identifiants des accommodations

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

### 3.2. Slugs des accommodations

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

## 4. Performance

- Éviter les fichiers volumineux uniques : segmenter par domaine (forms, tables, menus).
- Mutualiser les valeurs partagées via enums et messages pour limiter la duplication.
- Vérifier les chemins scannés par Nuxt Content/chargement custom pour ne pas inclure d’artefacts inutiles.

## 5. Structure et organisation

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

## 6. Détails par sous-dossier

### 6.1. `metadata/`

- Données métier structurées et localisées (statuts, rôles, types, catégories, etc.).
- Décrit la structure UI (content-driven) : forms, tables, menus.
- `metadata/index.ts` agrège enums + definitions dans un export stable.

#### `metadata/enums/`

- Listes de valeurs métier (clés stables entre langues, libellés localisés).
- Exemples : `project-statuses.yml`, `document-statuses.yml`, `subscription-statuses.yml`.

#### `metadata/definitions/`

- Structure de l’interface métier (forms/tables/menus).
- `forms/` : champs, labels, aides ; `tables/` : colonnes/entêtes ; `menus/` : navigation.
- `constraints.ts` : contraintes/validation centralisées (types, min/max, dépendances) pouvant référencer des clés de messages.

### 6.2. `components/`

- Blocs éditoriaux réutilisables (teasers, encarts, introductions, blocs d’aide).
- Chargés via Nuxt Content ou une couche de services.

### 6.3. `pages/`

- Contenu éditorial des pages liées aux routes.
- Sépare le contenu (`content/{lang}/pages/`) du layout/logic (`app/pages/`).

### 6.4. `{any}/`

- Domaine extensible (blog, documentation, FAQ, guides, etc.).
- Doit rester cohérent entre langues.

### 6.5. `messages.yml`

- Traductions libres / micro-textes (labels, messages d’info, états vides, textes d’UI).
- Complète l’i18n côté contenu (pas de config technique).

### 6.6. `index.ts` (racine de `content/{lang}/`)

- Point d’agrégation global pour une langue.
- Regroupe `metadata`, `components`, `pages`, `{any}` et les `messages` chargés depuis `messages.yml`.

# Dossier `content/{lang}/`

## 1. Rôle et responsabilités

- Projection de lecture runtime par langue (`fr`, `en`, etc.) : métadonnées métier, contenus éditoriaux et messages.
- Sépare la structure (metadata, pages, components) des layouts/logic Vue (dans `app/`).
- Fournit une API de contenu stable via `index.ts` (metadata + pages + components + messages).
- Centralise les listes de valeurs métier localisées et les définitions UI (forms, tables, menus).
- Héberge les blocs éditoriaux réutilisables et les textes transverses (`messages.yml`).

---

## 2. Bonnes pratiques

- Conserver des clés stables entre langues (les libellés varient, pas les identifiants).
- Séparer le contenu des layouts/logic Vue ; ne pas dupliquer la logique métier ici.
- Grouper les règles/contrats dans `metadata/constraints.ts` et réexporter via `metadata/index.ts`.
- Préférer des formats lisibles (`.yml`, `.md`) pour l’éditorial, `.ts` pour l’agrégation/validation.
- Garder des dossiers `{lang}` homogènes (même arborescence, mêmes clés).

## 3. Conventions de nommage

- Fichiers enums : `kebab-case` (`project-statuses.yml`, `document-statuses.yml`).
- Fichiers de contenu éditorial : `kebab-case` cohérent avec la route ou le bloc.
- Points d’entrée : `metadata/index.ts`, `index.ts` à la racine de la langue, `messages.yml`.
- Dossiers libres (`{any}/`) : conserver la même structure entre langues (blog, docs, faq, etc.).

## 4. Performance

- Éviter les fichiers volumineux uniques : segmenter par domaine (forms, tables, menus).
- Mutualiser les valeurs partagées via enums et messages pour limiter la duplication.
- Vérifier les chemins scannés par Nuxt Content/chargement custom pour ne pas inclure d’artefacts inutiles.

## 5. Structure et organisation

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

## 6. Détails par sous-dossier

### 6.1. `metadata/`

- Données métier structurées et localisées (statuts, rôles, types, catégories, etc.).
- Décrit la structure UI (content-driven) : forms, tables, menus.
- `metadata/index.ts` agrège enums + definitions dans un export stable.

#### `metadata/enums/`

- Listes de valeurs métier (clés stables entre langues, libellés localisés).
- Exemples : `project-statuses.yml`, `document-statuses.yml`, `subscription-statuses.yml`.

#### `metadata/definitions/`

- Structure de l’interface métier (forms/tables/menus).
- `forms/` : champs, labels, aides ; `tables/` : colonnes/entêtes ; `menus/` : navigation.
- `constraints.ts` : contraintes/validation centralisées (types, min/max, dépendances) pouvant référencer des clés de messages.

### 6.2. `components/`

- Blocs éditoriaux réutilisables (teasers, encarts, introductions, blocs d’aide).
- Chargés via Nuxt Content ou une couche de services.

### 6.3. `pages/`

- Contenu éditorial des pages liées aux routes.
- Sépare le contenu (`content/{lang}/pages/`) du layout/logic (`app/pages/`).

### 6.4. `{any}/`

- Domaine extensible (blog, documentation, FAQ, guides, etc.).
- Doit rester cohérent entre langues.

### 6.5. `messages.yml`

- Traductions libres / micro-textes (labels, messages d’info, états vides, textes d’UI).
- Complète l’i18n côté contenu (pas de config technique).

### 6.6. `index.ts` (racine de `content/{lang}/`)

- Point d’agrégation global pour une langue.
- Regroupe `metadata`, `components`, `pages`, `{any}` et les `messages` chargés depuis `messages.yml`.
