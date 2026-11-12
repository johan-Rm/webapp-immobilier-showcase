# BFF Dashboard Symfony

- Role: documenter l'integration BFF entre le dashboard et l'API Symfony (routes, modele d'ecriture, projection de lecture).
- Related: [../../server/README.md](../../webapp/server/README.md), [../2.architecture/2.data-flow.md](../2.architecture/2.data-flow.md)

## Intent

`server/api/dashboard/` expose les routes BFF protegees par session dashboard. Ce document
est le proprietaire de leur contrat d'integration avec Symfony ; `server/README.md` y renvoie.

Le présent contrat reste celui du dashboard immobilier Showcase. Le nouveau
dashboard multi-projet suit le [contrat SaaS](dashboard-saas-contrats.md), avec ses
propres sessions, snapshots et projection ; ne pas confondre les deux stockages.

## Modele d'ecriture et de lecture

- Symfony est le **modele d'ecriture durable**.
- `content/` est la **projection de lecture runtime** (fichiers YAML localises).
- Pinia est le **cache reactif cote client**.

Les lectures metier du dashboard utilisent la projection locale `content/`, comme le site
public. `GET /api/dashboard/media` et `GET /api/dashboard/category-codes` restent des routes
protegees de compatibilite, mais lisent les fichiers YAML sans appeler Symfony.

## Ecritures

- `PUT /api/dashboard/accommodations/[identifier]` sauvegarde un bien par `identifier` metier
  et relaie vers Symfony :
  - `POST /api/projects/{projectId}/accommodations/translations`
  - `PUT /api/projects/{projectId}/accommodations/{identifier}/translations`
- Le payload Accommodation garde les champs globaux a la racine et les champs localises dans
  `translations[]`.
- `POST /api/dashboard/media/upload` relaie les uploads vers
  `POST /api/projects/{projectId}/media-objects/translations` avec un multipart `file` et
  `translations`. Le relais fixe `Accept-Language` a la locale d'upload pour ne pas transmettre
  le wildcard implicite du client HTTP serveur, refuse par le resolver Symfony.
- `POST /api/dashboard/category-codes` relaie la creation de metadonnees vers
  `POST /api/projects/{projectId}/category-codes/translations` avec `inCodeSet` et
  `translations[]`.
- Les commandes media et CategoryCode ecrivent d'abord Symfony, puis mettent a jour les
  fichiers YAML localises. Les URL media y sont normalisees en chemins relatifs.

## Rafraichissement du cache

`GET /api/content-version` expose une signature legere du dossier
`content/{locale}/accommodations` pour permettre au site public de rafraichir son cache Pinia
apres une projection dashboard, sans rebuild.

## Securite

Le JWT Symfony et les variables `SYMFONY_*` restent strictement cote serveur : ils ne sont
jamais exposes au client.
