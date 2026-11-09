# AGENTS — Contexte projet : showcase-immobilier-webapp

Fichier de gouvernance local Codex. Complète le socle global `~/.agents/AGENTS.md` sans le
répéter. Les profils, principes d'ingénierie et mode d'exécution sont dans le global.

## Organisation du dépôt

La racine applicative Nuxt est `webapp/`. Les chemins des couches ci-dessous
sont relatifs à `webapp/`. Exécuter les commandes Bun depuis ce dossier.
La documentation `docs/`, le suivi `dev-book/` et Docker/Make restent à la racine.

## Mission produit

Webapp immobilière éditoriale pour Essaouira et sa région. Interface calme, crédible,
orientée exploration puis contact. SEO-first, SSR, mobile-first, Core Web Vitals prioritaires.

## Priorités produit

1. clarté pour l'utilisateur final — parcours simple, navigation explicite
2. lisibilité du contenu — interfaces sobres, éditoriales, non agressives commercialement
3. performance et Core Web Vitals stables
4. SEO by design — structure sémantique, indexabilité, sitemap

## Contraintes spécifiques

- SSR-safe par défaut — tout code client-only doit être justifié
- `services/` est framework-agnostic — jamais d'import Vue, Nuxt ou Pinia dans ce dossier
- Nuxt UI couvre la majorité des composants UI — toujours vérifier avant d'écrire du HTML brut
- les images passent obligatoirement par `@nuxt/image`
- i18n actif — tout texte visible passe par les clés de traduction
- jamais de `any` TypeScript sans justification explicite

## Stack

- Framework : Nuxt 4, Vue 3, TypeScript strict
- UI : Nuxt UI v4, Tailwind CSS
- Contenu : Nuxt Content (Markdown + YAML)
- État : Pinia
- Runtime : Bun

## Architecture — sources à lire avant d'agir

`docs/2.architecture/` contient 13 standards qui font autorité. Lire en priorité selon le
périmètre :

- architecture générale → `1.application-architecture.md`
- pages et navigation → `3.page-layout-screen-model.md`
- SSR et hydratation → `4.ssr-safety.md`
- frontières entre couches → `5.responsibility-boundaries.md`
- composables → `8.composables-standard.md`
- stores Pinia → `11.stores-standard.md`
- contenu Markdown/YAML → `12.content-model.md`

## Frontières de responsabilité

```
app/pages/        orchestre la route et les meta
app/components/   affichage uniquement
app/composables/  logique reactive exposée à l'UI
app/stores/       état global partagé
services/         logique métier pure (framework-agnostic, zéro import Vue/Nuxt/Pinia)
server/           BFF Nitro entre le frontend et l'API Symfony (auth, dashboard, sitemap)
shared/           utilitaires et contrats partageables
```

## Détail services/ (framework-agnostic)

- `services/api/` — appels vers l'API Symfony
- `services/mapper/` — mapping API → types UI (accommodation, webPage)
- `services/seo/` — données structurées Schema.org
- `services/content/` — utilitaires MDC / Nuxt Content
- `services/converter/schema/` — génération d'artefacts TypeScript depuis les schémas YAML
- `services/infra/resolver/` — résolution de chemins
- `services/utils/` — utilitaires CLI et système de fichiers

## Détail server/ (BFF Nitro)

- `server/api/dashboard/` — proxy vers l'API Symfony (biens, médias, catégories, statut)
- `server/api/content/` — proxy Nuxt Content
- `server/api/__sitemap__/` — sitemap dynamique
- `server/routes/auth/` — OAuth Google (login backoffice)
- `server/utils/dashboard/` — auth Symfony, cache, mapper, export Markdown

## Modèle de navigation

Navigation par screens plein viewport (`data-screen`, ancres, transitions x/y).
Lire `docs/2.architecture/3.page-layout-screen-model.md` avant toute modification de page.

## Commandes courantes

```bash
bun run dev               # développement local
bun run quality:check     # lint + format + type-check
bun run lint:check        # ESLint
bun run format:check      # Prettier
bun run type-check        # vue-tsc
```

## Workflow de développement

1. spec dans `dev-book/` si feature structurante
2. tâche dans `dev-book/tasks/`
3. branche dédiée depuis `develop`
4. PR vers `develop`, merge vers `master` en production
