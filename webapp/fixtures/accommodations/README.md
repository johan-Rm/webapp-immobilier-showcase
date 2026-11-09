# Fixtures de démo — biens d'exception (parcours immersif)

Source de vérité **versionnée** des biens d'exemple **fictifs** créés pour la tâche
[033](../../../dev-book/tasks/033-villas-exemples-parcours-immersif.md).

## Pourquoi ce dossier

`content/*/accommodations/` est **gitignoré** et **purgé** par `make dev-content-sync`
(pull-only depuis l'API Symfony). Les fixtures de démo n'y survivraient pas. On les
versionne donc ici, et on les **repose** dans `content/fr/accommodations/` au besoin.

## Préparer les fixtures locales

```bash
bun run setup:local
```

Le script les prépare dans les trois langues avec le marqueur `dataSource: fixture`.
Les photos de démonstration originales sont conservées dans `public/poc/` et
`public/images/` ; les illustrations de `public/demo/` restent disponibles.
Le setup refuse de remplacer un bien ou un référentiel non fictif.

## Anonymisation

Données **fictives** : noms, références et textes réécrits, inspirés de listings réels
sans copie verbatim. Caractéristiques factuelles génériques uniquement (surfaces, nombre
de chambres, piscine, localisation régionale). Images : photos de démonstration conservées et illustrations SVG complémentaires.

## Fixtures

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

## Modèle média (aligné dashboard 032)

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
