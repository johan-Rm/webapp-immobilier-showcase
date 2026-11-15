# DOM-002 — Vérifier les contrats locaux et préparer une cible de mutation pure

- Demande : DEM-011 ; type : consolidation.
- Session de création : 01a1d56d-446b-7931-bf53-7687a7d10912
- Date : 2026-11-14
- Couche : domaine
- Branche : layers/domaine
- Worktree : `/home/johan/www/graines-digitales/modern-web-apps/showcase-immobilier/worktree/domaine`
- État : implémentée et commitée, à vérifier.
- Base locale vérifiée : `ca571d60c39b8b5932d74cd43dcbe4131c47c578` ; aucun fetch.
- Dépendances : aucune dépendance de code nouvelle ; base ci-dessus.
- Référence de cadrage : `tmp/demande-consolidation-tests-conventions-nuxt.md`, relatif au principal, hors worktrees ; ne pas copier. Analyse et décisions : `tmp/analyse-tests-conventions-nuxt.md`.
- Chemins autorisés (en plus de cette carte) :

- `webapp/schemas/README.md`
- `webapp/shared/README.md`
- `webapp/services/README.md`
- `webapp/shared/saas/links.vitest.ts`
- `webapp/services/saas/articles.vitest.ts`
- `webapp/shared/schemas.ts`

## Résultat et critères

Ajouter des tests de validation des contrats SaaS existants et un test direct de isEditorialLink, avec URLs valides, protocoles interdits, contrôles, traversées réseau et identifiants URL. Ne pas modifier arbitrairement la logique pure pour augmenter un score. Documenter la différence entre contrats YAML générés, fixtures consommateur et contrat Symfony réel ; conserver les artefacts générés ignorés et sources YAML comme référence. Le contrôle de reproductibilité de génération est porté par OPS-031 et ne doit pas être simulé par git diff sur des sorties ignorées.

Exclusions communes : secrets et .env, données utilisateur, code Cap Nour/Kazen en écriture, production, DEM-010, nouvelles conventions non arbitrées. Préserver les rubriques et l’ordre des README. Un résultat inconnu ne vaut pas réussite.

## Réalisation et preuves

Reprise du 2026-11-15, session de création conservée.

Cas de contrats locaux et liens éditoriaux sûrs enrichis ; test de normalisation sans mutation ni champs privilégiés. Documentation distingue fixtures, schémas locaux et contrat externe ; aucun code métier modifié.

Vérifié : 68 tests sur les deux fichiers `shared/saas/links.vitest.ts` et `services/saas/articles.vitest.ts`, tous réussis ; lint et formatage réussis. Aucun contrat Symfony réel vérifié ; mutation réservée à OPS-027.

Recette depuis `worktree/domaine/webapp/` : `node node_modules/vitest/vitest.mjs run shared/saas/links.vitest.ts services/saas/articles.vitest.ts`.

Contenu présenté : inventaire des fichiers et empreintes dans `tmp/etat-implementation-tests-conventions-nuxt.json` du principal ; base inchangée indiquée ci-dessus. Sorties détaillées locales `/tmp/dem011-*`, non durables.

## Verdict humain

Aucun verdict d’implémentation. Le cadrage confirmé n’est pas une validation du code.

## Commits

Commit local de cette tâche créé à l’implémentation selon l’autorisation du 2026-11-15 ; SHA réel dans le récapitulatif du brouillon. Aucun verdict humain déduit de ce commit. Aucun push, PR ni fusion.

Reprise du workflow le 2026-11-15 : commits techniques autorisés avant vérification humaine globale ; cette carte préparée est rattachée à sa couche, sans duplication ni transfert de code applicatif non commité. Les états et consignes antérieurs décrivent l’ancien workflow.
