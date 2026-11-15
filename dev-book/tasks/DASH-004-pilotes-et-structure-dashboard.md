# DASH-004 — Migrer la structure Dashboard et réaliser les trois pilotes

- Demande : DEM-011 ; type : consolidation.
- Session de création : 01a1d56d-446b-7931-bf53-7687a7d10912
- Date : 2026-11-14
- Couche : dashboard
- Branche : layers/dashboard
- Worktree : `/home/johan/www/graines-digitales/modern-web-apps/showcase-immobilier/worktree/dashboard`
- État : implémentée et commitée, à vérifier ; références visuelles proposées, non approuvées.
- Base de reprise : `7344a3b48ce344aa943e646ede31051e02fc630b`, obtenue par avance rapide locale explicitement autorisée ; aucun nouveau commit ni fetch.
- Dépendance : OPS-023 disponible par `7344a3b48ce344aa943e646ede31051e02fc630b`. Session de reprise : `01a1d56d-446b-7931-bf53-7687a7d10912`.
- Référence de cadrage : `tmp/demande-consolidation-tests-conventions-nuxt.md`, relatif au principal, hors worktrees ; ne pas copier. Analyse et décisions : `tmp/analyse-tests-conventions-nuxt.md`.
- Chemins autorisés (en plus de cette carte) :

- `webapp/dashboard/app/components/dashboard/AccessForm.vue`
- `webapp/dashboard/app/components/dashboard/Administration.vue`
- `webapp/dashboard/app/components/dashboard/ArticleActions.vue`
- `webapp/dashboard/app/components/dashboard/ArticleBlocks.vue`
- `webapp/dashboard/app/components/dashboard/ArticleFields.vue`
- `webapp/dashboard/app/components/dashboard/ArticleList.vue`
- `webapp/dashboard/app/components/dashboard/ArticleResources.vue`
- `webapp/dashboard/app/components/dashboard/Articles.vue`
- `webapp/dashboard/app/components/dashboard/Brand.vue`
- `webapp/dashboard/app/components/dashboard/ContextPicker.vue`
- `webapp/dashboard/app/components/dashboard/Navigation.vue`
- `webapp/dashboard/app/components/dashboard/Overview.vue`
- `webapp/dashboard/app/components/dashboard/Panel.vue`
- `webapp/dashboard/app/components/dashboard/RichText.vue`
- `webapp/dashboard/app/layouts/auth.vue`
- `webapp/dashboard/app/layouts/default.vue`
- `webapp/dashboard/app/pages/[access].vue`
- `webapp/dashboard/app/pages/administration.vue`
- `webapp/dashboard/app/pages/articles.vue`
- `webapp/dashboard/app/pages/index.vue`
- `webapp/dashboard/README.md`
- `webapp/dashboard/tests/AccessForm.nuxt.vitest.ts`
- `webapp/tests/layers/dashboard.vitest.ts`
- `webapp/tests/e2e/saas-access.spec.ts`
- `webapp/tests/e2e/saas-editor.spec.ts`

- `webapp/dashboard/tests/visual-references/connexion-light-chromium-desktop.png`
- `webapp/dashboard/tests/visual-references/connexion-light-chromium-mobile.png`
- `webapp/dashboard/tests/visual-references/connexion-dark-chromium-desktop.png`
- `webapp/dashboard/tests/visual-references/connexion-dark-chromium-mobile.png`
- `webapp/dashboard/tests/visual-references/edition-light-chromium-desktop.png`
- `webapp/dashboard/tests/visual-references/edition-light-chromium-mobile.png`
- `webapp/dashboard/tests/visual-references/edition-dark-chromium-desktop.png`
- `webapp/dashboard/tests/visual-references/edition-dark-chromium-mobile.png`

## Résultat et critères

Arbitrage de reprise confirmé le 2026-11-15 : voir l’analyse, autorisation limitée aux seules empreintes des six fichiers après preuve des sections manquantes identiques. Aucun élargissement ; traitement coordonné entre DASH-004 et OPS-024, sans transfert de code non commité.

Marqueurs confirmés et exemptions sur les Vue listés, sans wrapper ni renommage général. Le layout default porte le main autour du slot ; préserver fallback ClientOnly, navigation, hauteur et scroll. Réaliser un pilote Nuxt sur AccessForm : saisie conservée en cas de refus, soumission déclenchée par l’utilisateur, erreurs accessibles, absence de publication implicite. Scanner axe informatif ; clavier bloquant. Comparaison visuelle connexion/édition, bureau/mobile et clair/sombre sur fixtures stables ; références présentées à l’humain, jamais approuvées ou mises à jour automatiquement. Aucun déplacement de marqueur des classes/styles métier existants.

Exclusions communes : secrets et .env, données utilisateur, code Cap Nour/Kazen en écriture, production, DEM-010, nouvelles conventions non arbitrées. Préserver les rubriques et l’ordre des README. Un résultat inconnu ne vaut pas réussite.

## Réalisation et preuves

Marqueurs ajoutés aux racines HTML éligibles et aux régions stables ; les racines de composants Vue restent exemptées, sans conteneur ajouté. Le layout connecté remplace uniquement le conteneur du slot par un `main` ; classes, fallback et navigation conservés. Les scripts, styles et listes de classes des 20 fichiers Vue sont strictement identiques à la base de reprise. AccessForm, exempté du marqueur de racine, reste inchangé. Parmi les six fichiers sous exception de sections, cinq empreintes changent ; aucune empreinte ni exception YAML actualisée ici. OPS-024 attend les commits sources avant cette actualisation limitée déjà autorisée.

Le pilote Nuxt monte le vrai formulaire et utilise le vrai composable d’authentification et les traductions Nuxt. Seuls transport, contexte d’accès, route et navigation sont simulés. Il vérifie l’absence d’appel avant soumission, la requête exacte sans publication, la conservation des champs et l’alerte après refus. Les tests navigateur existants de clavier restent bloquants. Deux pilotes supplémentaires mesurent axe et proposent des captures pour connexion/édition, dans les deux thèmes et les deux formats.

Résultats du 2026-11-15 : **2 tests Nuxt et 82 tests Chromium réussis**, build Nuxt, ESLint ciblé, Prettier et structure du contenu README réussis. Axe : huit scans, aucune violation ni vérification incomplète remontée ; mesure informative, sans preuve d’accessibilité exhaustive. Contre-exemples injectés dans le DOM isolé : doublon de main et saut de focus refusés par les assertions ; changement visuel volontaire capturé. La comparaison avec une référence approuvée n’a pas été exécutée.

Analyse AST DevOps en lecture seule sur ces sources : Dashboard **0 erreur, 1 avertissement, 8 exemptions** ; l’ensemble du worktree garde **113 erreurs** dans les autres sources non migrées. Aucun transfert de source non commitée. Le contenu du README est conforme au contrôle structurel, mais sa profondeur reste incompatible avec la règle globale existante d’OPS-032 ; aucune exception ajoutée pour la masquer.

Les **huit captures proposées** restent dans les résultats Playwright ignorés, sans création dans le dossier de références. Après validation humaine explicite seulement, les captures retenues pourront devenir références aux huit chemins autorisés. Les tests refusent les modes d’actualisation automatique des références existantes. Le rapport HTML contient les huit mesures axe et les annotations « référence à valider ». Serveur local de test sur 19851 arrêté après les essais ; aucune pile utilisateur démarrée.

Identité du contenu présenté, empreintes des 16 fichiers modifiés/nouveaux, preuves de préservation et chemins des captures : `tmp/verification-dashboard-pilotes.json` dans le principal. Rapport navigateur : `webapp/.tmp/playwright/report/index.html` dans le worktree Dashboard. Ces résultats portent sur les réponses BFF simulées, sans validation de Symfony ni des autorisations réelles.

### Commandes pour la vérification humaine

Depuis `/home/johan/www/graines-digitales/modern-web-apps/showcase-immobilier/worktree/dashboard/webapp` :

```bash
# Vérifier le formulaire dans le véritable environnement Nuxt.
bun --no-env-file run verify -- components --target dashboard

# Consulter la sélection des parcours, sans démarrer de serveur.
bun --no-env-file run verify -- browser --target dashboard --list

# Ouvrir le rapport déjà produit, avec mesures axe et captures proposées.
node node_modules/@playwright/test/cli.js show-report .tmp/playwright/report
```

Pour rejouer les parcours : construire avec `GD_TARGET=dashboard NUXT_TELEMETRY_DISABLED=1 node node_modules/nuxt/bin/nuxt.mjs build --dotenv /tmp/dash004-empty.env`, puis démarrer explicitement le build dans un terminal de test avec `HOST=127.0.0.1 PORT=19851 node dashboard/.output/server/index.mjs`. Dans un autre terminal, avec Chromium et ses bibliothèques installés : `PLAYWRIGHT_BASE_URL=http://127.0.0.1:19851 bun --no-env-file run verify -- browser --target dashboard`. Aucun serveur n’est démarré implicitement ; arrêter celui de test après les essais. L’exécution vérifiée ici utilise l’image officielle Playwright `v1.62.1-noble` sur le réseau hôte, sans injection de secrets, avec le même endpoint local et `--update-snapshots=none`.

## Verdict humain

Aucun verdict d’implémentation. Le cadrage confirmé n’est pas une validation du code.

## Commits

Commit local de cette tâche créé à l’implémentation selon l’autorisation du 2026-11-15 ; SHA réel dans le récapitulatif du brouillon. Aucun verdict humain déduit de ce commit. Aucun push, PR ni fusion.

Reprise du workflow le 2026-11-15 : commits techniques autorisés avant vérification humaine globale ; cette carte préparée est rattachée à sa couche, sans duplication ni transfert de code applicatif non commité. Les états et consignes antérieurs décrivent l’ancien workflow.
