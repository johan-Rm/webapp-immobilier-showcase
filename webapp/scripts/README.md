---
blueprint_source: /app/docs/blueprints/modern-webapp-nuxt/directory-structure/scripts/README.md
blueprint_copied_at: 2026-01-22T13:03:48+00:00
---

`setup-local.ts` prépare les données fictives et `.env` sans API ni secret hérité.
Il refuse d’écraser des données non fictives. `run-schema-hook.mjs` génère les
contrats YAML locaux. Lancer `bun run setup:local` après installation.

Le contrôle `check:app:types` applique la règle de placement aux types manuels.
Les dossiers de contrats générés sont déclarés dans
`codebase-integrity/domaines/architecture-dependances/regles.yaml` (`generatedTypesDirs`) et restent dans leur couche
`schemas/`. Les doublons et imports de types manuels continuent d'être contrôlés.

`content-sync.ts` synchronise aussi le bloc `i18n` de `content/fr/ui/app.yaml`
depuis les langues du projet Symfony. Les champs éditoriaux existants sont
conservés. Publication après réussite ; aucune écriture en `--dry-run`.
Le filtre `--locale=` porte sur les contenus, pas sur la liste complète des langues.

Les scripts de contenu et de médias suivent `GD_TARGET`, comme Nuxt. Les chemins
et surcharges sont décrits dans [le guide des layers](../../docs/2.architecture/14.site-layers.md).

La composition accepte aussi `GD_TARGET=dashboard` : la layer `dashboard/` doit fournir
`site.ts`, `nuxt.config.ts` et son application. Ses sorties `dashboard/.nuxt` et
`dashboard/.output` restent distinctes des sites. `GD_TARGET=dashboard bun run type-check`
sélectionne les types préparés de cette cible ; `bun run build` utilise la même variable.
La cible se fixe à la construction, jamais selon Host. Le hook génère également le DTO Article.
Les routes serveur historiques de Showcase ne sont pas activées pour le dashboard ; les seules
routes SaaS à activer explicitement relèvent des cartes BFF et de la configuration de sa layer.
