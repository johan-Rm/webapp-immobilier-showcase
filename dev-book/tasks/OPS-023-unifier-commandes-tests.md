# OPS-023 — Unifier les commandes et environnements de test

- Demande : DEM-011 ; type : consolidation.
- Session de création : 01a1d56d-446b-7931-bf53-7687a7d10912
- Date : 2026-11-14
- Couche : devops
- Branche : layers/devops
- Worktree : `/home/johan/www/graines-digitales/modern-web-apps/showcase-immobilier/worktree/devops`
- État : validée le 2026-11-15 ; commit local de cette carte autorisé.
- Base locale vérifiée : `ca571d60c39b8b5932d74cd43dcbe4131c47c578` ; aucun fetch.
- Dépendances : aucune dépendance de code nouvelle ; base ci-dessus.
- Référence de cadrage : `tmp/demande-consolidation-tests-conventions-nuxt.md`, relatif au principal, hors worktrees ; ne pas copier. Analyse et décisions : `tmp/analyse-tests-conventions-nuxt.md`.
- Chemins autorisés (en plus de cette carte) :

- `webapp/package.json`
- `webapp/bun.lock`
- `webapp/vitest.config.ts`
- `webapp/playwright.config.ts`
- `webapp/scripts/quality/run.ts`
- `webapp/scripts/quality/run.vitest.ts`
- `infra/make/Makefile.dev`
- `infra/docker/docker-compose.quality.yml`
- `codebase-integrity/README.md`

## Résultat et critères

Créer une entrée stable bun run verify -- <famille> avec --target et --list. Familles : unit, integration, browser, conventions, components, security, architecture, mutation, load, lighthouse, contracts. Les familles non installées doivent échouer explicitement, jamais réussir à vide. Conserver les commandes existantes comme délégations. Pour Dashboard, la configuration de snapshots référence les huit PNG autorisés de DASH-004 sous dashboard/tests/visual-references ; aucun nouvel emplacement de références visuelles hors de cette couche. Séparer les projets Vitest Node et Nuxt ; préparer les trois cibles sans réutiliser leurs artefacts. Installer et verrouiller les outils des trois pilotes, Stryker/Vitest et dependency-cruiser dans ce seul lot de dépendances ; les versions compatibles doivent être éprouvées, sans mise à jour implicite de Nuxt/Vitest. Le scanner utilise Bun existant si sa preuve de comportement satisfait la politique ; aucune correction automatique de dépendances.

Exclusions communes : secrets et .env, données utilisateur, code Cap Nour/Kazen en écriture, production, DEM-010, nouvelles conventions non arbitrées. Préserver les rubriques et l’ordre des README. Un résultat inconnu ne vaut pas réussite.

## Réalisation et preuves

Reprise du 2026-11-15, session de création conservée.

Entrée `bun run verify -- <famille> --target <cible> [--list]`, séparation Bun/Node/Nuxt, dépendances verrouillées et exécution Compose ajoutées. Les suites absentes échouent explicitement.

Vérifié : 15 tests du lanceur ; intégration Dashboard 129 tests/16 fichiers ; unités Showcase 73 Vitest + 7 Bun, Client2 et Dashboard 63 + 7 chacun ; exécution Compose Dashboard 63 + 7 ; AIDE 119 tests. Types et conventions réussis. Chargement de la configuration Nuxt composants réussi, artefacts sous `.tmp/quality` ; aucun pilote composant encore exécuté. Les branches non installées ne constituent pas des contrôles opérationnels.

Recette depuis `worktree/devops/webapp/` : `bun run verify -- unit --target dashboard`, puis `bun run verify -- integration --target dashboard`. Inventaire sans exécution : `bun run verify -- browser --target client2-immobilier --list`. Tester également une cible inconnue et une famille absente : code de sortie non nul attendu.

Contenu présenté : inventaire des fichiers et empreintes dans `tmp/etat-implementation-tests-conventions-nuxt.json` du principal ; base inchangée indiquée ci-dessus. Sorties détaillées locales `/tmp/dem011-*`, non durables.

## Verdict humain

Validation explicite le 2026-11-15 : « tout est validé ». Portée : carte OPS-023 présentée, à l’exclusion des autres cartes encore incomplètes. L’index ne reprend que le lanceur, ses dépendances et configurations, la commande quality-verify et la convention d’exécution ; les changements ultérieurs des fichiers partagés restent hors de ce commit.

```verdict-json
{
  "decision": "validé",
  "portee": "OPS-023 : lanceur, configurations, dépendances et documentation associée ; sans validation globale de DEM-011.",
  "contenu": {
    "type": "sha256",
    "fichier": "dev-book/reports/ops023-verification.json",
    "valeur": "dfca0cb6b831711406ac03d59b4f2e9efdab4b014fe7853fb303e5cd3de724d3"
  }
}
```

## Commits

Commit local de la carte et de sa preuve ; SHA annoncé après création. Aucun push, PR ou fusion.

### Interface Make — précision du 2026-11-17

Les évolutions ultérieures de nommage, préparation et séparation des tests sont portées par OPS-030 ; le catalogue courant est la documentation d’exécution des contrôles. Les commandes et résultats plus haut constituent les traces de la version initialement examinée. Le verdict humain initial n’est pas étendu aux correctifs ultérieurs ; leur recette et leurs réserves sont suivies dans OPS-031.
