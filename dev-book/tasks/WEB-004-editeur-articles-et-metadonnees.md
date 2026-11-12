# WEB-004 — Éditer les articles, blocs et métadonnées sans perdre la saisie

- Demande : DEM-005 ; type : développement
- Document de référence : [DEM-005](../demand/DEM-005-dashboard-saas.md).
- Session de création : 01a1ca56-891a-7700-97c6-a576d3d9a615
- Couche : web
- Branche : layers/web
- Worktree : worktree/web
- Base locale vérifiée : `8c505c07feba753df7aff7d394e0b8f9a6d93e32` ; aucun fetch.
- État : validée et commitée localement ; à livrer
- Chemins autorisés : `webapp/dashboard/app/`, `webapp/dashboard/i18n/`, `webapp/tests/e2e/saas-editor.spec.ts`, adaptation du menu dans `webapp/tests/e2e/saas-access.spec.ts`, cette carte
- Dépendances de réalisation : WEB-003 `f3398f8cc12474640737887b77e16d0ca7afe90d`, OPS-010 `5eee4c05ad298775d509a1469b5642a1517699df`, DOM-001 `8c1000ecc9996cd3632a323fd1ed49604ad4e929`, OPS-011 `f3664dd5a92a2202a285f3e04de9ba13ebf72863`
- Commits nécessaires : commits identifiés ci-dessus ; BFF-003/004 nécessaires aux preuves réelles, pas à la construction UI sur le contrat validé.
- Dépendances de vérification globale : BFF-003, BFF-004, OPS-013

## Résultat et critères

Liste articles et fiche localisée avec champs de la matrice OPS-010 et blocs texte/image/galerie.
Ajouter/supprimer/réordonner les blocs ; wrapper unique pour l’éditeur tiers si nécessaire, sans
nouvelle convention CI dans cette carte ; le verrou de convention sera traité lors de la consolidation
ultérieure. Son absence ne bloque pas le développement sur instruction humaine explicite.
Sélectionner/créer/modifier catégories dans panneau/modal ; nouvelle valeur sélectionnée, avertissement
sur usages avant modification partagée. Choisir/importer médias sans quitter la fiche.
Conserver la saisie lors des annulations/échecs ; conflit visible sans écrasement ; protection de départ
et changement de projet/langue lorsque des modifications ne sont pas enregistrées.
Prévisualisation privée et commandes de publication/dépublication par langue ; affichage distinct
brouillon, version publiée, traduction générée et synchronisation en échec/en attente.
Exclusions : composants du site dans l’éditeur, historique restaurable arbitraire, autres entités métier.

Les critères de besoin et exclusions communs restent dans le brouillon ; aucune modification
de Codebase Integrity, de règle ou de gouvernance hors consolidation déclarée.
Les métadonnées de cette carte relèvent de la trace obligatoire, même hors périmètre applicatif.
Documentation : Libellés/contrats UI au frontend ; transmettre procédures et limites au guide central OPS-013.

## Réalisation et preuves

Implémentation du 2026-11-12 ; session intervenante identique à la session de création.
Liste/recherche paginée et fiche article fr/en/es ; champs et JSON de blocs conformes aux
contrats committés. Wrapper Tiptap unique : texte mis en forme, titres, listes, liens contrôlés ;
adaptation au JSON strict DOM-001. Blocs image/galerie avec ajout, suppression et réorganisation.
Panneaux catégories et médias dans la fiche, création automatiquement sélectionnée,
modification partagée après consultation des usages et confirmation ; import multipart,
attente de disponibilité média et erreurs sans perte de saisie.

Enregistrement conditionnel `If-Match`, conflit signalé sans écrasement ; avertissements
avant départ ou changement de langue/organisation/projet. Les commandes d’aperçu et de
publication exigent un brouillon enregistré. Publication/dépublication par langue,
états de synchronisation explicites et reprise avec même clé d’idempotence/révision.
L’éditeur se monte côté client après récupération de la session pour éviter un état de
sélecteur incohérent lors d’un accès direct rendu initialement sans contexte privé.
Aucune session, donnée éditoriale ni réponse de succès simulée en fonctionnement normal.

État soumis : HEAD `8c505c07feba753df7aff7d394e0b8f9a6d93e32`, `layers/web`, index vide.
Quatre fichiers suivis modifiés : `useDashboardAccess.ts` (protection de contexte/déconnexion),
`useDashboardMenu.ts` (Articles disponible), `i18n/locales/fr.json` et `saas-access.spec.ts`
(adaptation du menu). Douze fichiers applicatifs/tests non suivis : sept composants
`ArticleActions`, `ArticleBlocks`, `ArticleFields`, `ArticleList`, `ArticleResources`, `Articles`,
`RichText` sous `webapp/dashboard/app/components/dashboard/`, trois composables
`useArticleBlocks`, `useArticleEditor`, `useArticleResources`, `app/pages/articles.vue`
et `webapp/tests/e2e/saas-editor.spec.ts`. Cette carte est également non suivie ;
WEB-005 est préservée hors périmètre.
Empreinte SHA-256 des 16 fichiers applicatifs/tests triés par chemin relatif :
`5b188a2a503939f11bc5fa24a9fcc7a10a7b50ce02c865f025996f694b22646e`.
Calcul : chemin UTF-8 puis octet nul puis octets du fichier, concaténés dans cet ordre ;
les cartes sont exclues. Manifeste détaillé local : `/tmp/dem005-web004-manifest.json`.

Contrôles réussis :

- Depuis Web : `make aide-check` — 111 tests et vérifications documentaires ;
  `git diff --check` conforme sur les fichiers suivis.
- Depuis son `webapp/` : ESLint et Prettier sur dashboard et les deux tests E2E — conformes.
  Composants ajoutés de moins de 200 lignes, logique et appels dans les composables.
- Assemblage de test `/tmp/dem005-web004-16b8vvjw` : base Web et dépendances commitées
  identifiées ci-dessus ; 16 fichiers présentés identiques octet pour octet aux sources testées.
  Aucun fichier non commité copié depuis une autre couche ; aucun `.env` ni secret copié.
- Depuis son `webapp/` : `GD_TARGET=dashboard bun run build` et
  `vue-tsc --noEmit --project dashboard/.nuxt/tsconfig.site.json` — réussis.
- `GD_TARGET=showcase-immobilier node node_modules/vitest/vitest.mjs run --reporter=verbose`
  — 119 tests, 18 fichiers, sortie 0 ; inclut le build de la vraie layer et l’isolation des cibles.
- `python3 /tmp/dem005-web004-browser.py` — 28 succès, sortie 0 : 12 scénarios éditeur
  et 16 scénarios accès, sur bureau/mobile. Le script démarre le SSR compilé sur un port
  loopback libre, lance les deux fichiers `saas-access.spec.ts` et `saas-editor.spec.ts`
  avec `GD_TARGET=dashboard`, puis arrête son serveur. Chromium local révision 1248,
  configuration `playwright.local.config.ts` et bibliothèques/cache navigateur temporaires,
  sans modification des réglages du projet.
- Scénarios éditeur : création/réouverture, champs SEO, texte et lien, ordre des blocs,
  catégories sélectionnées/créées/modifiées, avertissement des usages, erreurs et traitement
  d’import, conflit, départ/langue/projet annulés, aperçu, langue indépendante,
  ancien publié préservé après édition, dépublication, projection pending/failed/applied et retry.
  Captures `editor.png` bureau/mobile sous les résultats Playwright inspectées.

Limites : réponses BFF simulées uniquement dans les tests ; sauvegarde et réouverture y
vérifient les échanges et l’état UI, pas la persistance Symfony. Le test d’aperçu ouvre une
réponse HTML simulée du contrat BFF, pas le rendu privé Client 2 réel. Concurrence,
autorisations serveur, génération automatique des traductions, publication effective et
projection publique attendent BFF-003/004, WEB-005, OPS-012/013 et les lots Symfony.
Aucune modification de l’API Symfony, de Codebase Integrity ou des conventions.
Aucun commit ni verdict humain produit ; consolidation toujours reportée.

## Verdict humain

Validation humaine explicite du 2026-11-12 : « validé », limitée à WEB-004 présentée.
Empreinte des 16 fichiers applicatifs/tests revérifiée identique avant commit ; aucune correction fonctionnelle.

## Commits

Commit d’implémentation validée : `c276814c2a95fec82c9f9f586cbd7e7c7dd9a608`.
Complément documentaire limité à la trace du SHA et de l’état ; WEB-005 préservée hors index.
La réunion globale est prévue dans le principal libre et propre, branche `demands/DEM-005`
créée seulement à la reconstitution depuis develop local vérifié.
