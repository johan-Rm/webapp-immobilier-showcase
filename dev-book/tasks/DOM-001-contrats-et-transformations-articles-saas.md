# DOM-001 — Typer les articles SaaS et leurs transformations pures

- Demande : DEM-005 ; type : développement
- Brouillon de référence : `tmp/demande-dashboard-saas.md`, relatif au dépôt principal, hors du worktree ; ne pas le copier.
- Demande définitive prévue : `dev-book/demand/DEM-005-dashboard-saas.md`, créée seulement à la reconstitution ; fichier actuellement absent, lien à ajouter alors.
- Session de création : 01a1ca56-891a-7700-97c6-a576d3d9a615
- Couche : domaine
- Branche : layers/domaine
- Worktree : worktree/domaine
- Base locale vérifiée : `5dc9fe796cb24a4bc5d604835c4092e8a309e6dd` ; aucun fetch.
- État : validée humainement ; commit local en préparation, à livrer
- Chemins autorisés : `webapp/shared/types/saas/`, `webapp/shared/schemas.ts`, `webapp/shared/saas/`, `webapp/shared/site/`, `webapp/services/saas/`, `webapp/schemas/source/dtos/symfony_api/article.yaml`, `webapp/schemas/source/webapp/article.yaml`, cette carte
- Dépendances de réalisation : OPS-010, commit validé `5eee4c05ad298775d509a1469b5642a1517699df`, lu directement depuis Git sans copie de travail non commité
- Commits nécessaires : OPS-010 identifié ci-dessus ; aucun commit backend consommé, types cibles isolés des DTO actuels.
- Dépendances de vérification globale : OPS-013

## Résultat et critères

Implémenter les contrats confirmés par OPS-010 et les validations runtime des blocs texte/image/galerie,
références, locales et états éditoriaux. Séparer brouillon, snapshot publié et projection publique.
Réaligner le DTO article local sur le backend réellement observé ; types SaaS cibles séparés, puisque les évolutions API restent différées. Régénérer les artefacts, sans édition manuelle.
Fournir les transformations pures et validations partagées par BFF, synchronisation et rendu.
Les identifiants d’organisation, projet, article, traduction et média restent distincts.
Étendre le registre partagé des cibles pour distinguer site et dashboard sans résoudre Host ;
conserver les identifiants historiques et refuser les chemins hors racine prévue.
Exclusions : réseau implicite, Vue/Nitro, accès fichiers, adaptation des contrôles.

Les critères de besoin et exclusions communs restent dans le brouillon ; aucune modification
de Codebase Integrity, de règle ou de gouvernance hors consolidation déclarée.
Les métadonnées de cette carte relèvent de la trace obligatoire, même hors périmètre applicatif.
Ajustement de chemins : shared/schemas.ts est nécessaire pour respecter le README shared existant ; il reste dans la couche Domaine configurée.
Documentation : Docstrings et contrats source ; transmettre à OPS-013 les limites à documenter sans recopier le contrat API.

## Réalisation et preuves

Implémentation du 2026-11-11, session `01a1ca56-891a-7700-97c6-a576d3d9a615`.
Reprise de la même mission : seule cette carte non suivie était présente au démarrage.
Contrat OPS-010 consommé depuis son commit validé, sans cherry-pick ni création de commit.

Résultat : schémas Zod stricts des blocs, traductions, agrégats et snapshots ; types SaaS
séparés du DTO Symfony actuel ; contrôle pur des références par projet ; projection publique
sans brouillon/fallback, avec SEO et libellés partagés actuels ; résolution cible site/dashboard.
Les fonctions pures exigent un contexte déjà autorisé : elles ne remplacent pas le guard API.
Aucun appel réseau métier, mécanisme de session, stockage, rendu UI ou transition backend ajouté.

Le DTO source article est réaligné sur les champs observés à `9fed427` (relations JSON-LD,
traductions, status global et audit), sans prétendre rendre disponibles les futures capacités SaaS.
`webapp/schemas/source/webapp/article.yaml` reste inchangé : son contrat historique est conservé.
Les artefacts générés sont ignorés et n’ont pas été édités manuellement.
Le hook Nuxt actuel ne génère par défaut que les DTO Accommodation/WebPage : Article a été
régénéré explicitement avec le générateur existant ; son ajout au hook appartient à OPS-011.

Contrôles exécutés dans ce worktree :
- Installation verrouillée hors ligne des dépendances webapp et Codebase Integrity ; aucun lock changé.
- Depuis webapp, `bun run test -- services/saas scripts/build/site-targets.vitest.ts tests/layers` : 41 tests réussis, dont 37 du nouveau parcours pur.
- `bun run test` : 17 fichiers, 117 tests réussis.
- `bun run type-check` : réussi ; après régénération explicite Article, `vue-tsc --noEmit` : réussi.
- Régénération : `generateArtifacts('./schemas/source/dtos/symfony_api', ['Accommodation', 'WebPage', 'Article'], ['Accommodation', 'WebPage', 'Article'], { outputDir: 'schemas/dtos', typeNameSuffix: 'Dto' })`, import depuis `services/converter/schema/generateArtifacts` via Bun.
- ESLint et Prettier `--check` sur les neuf fichiers de réalisation : réussis (YAML vérifié par Prettier).
- `bun run check:app:types` et `bun run --cwd ../codebase-integrity check:services:no-framework-imports` : réussis.
- Depuis la racine du worktree, `make aide-check` : réussi, dont 111 tests Python.
- `git diff --check` : réussi. Le test Nuxt exigeant un sous-processus Node a été relancé hors bac à sable après un refus EPERM ; résultat final réussi sans modifier le test.
- API Symfony : arbre propre et HEAD inchangé `9fed427658d9c0983b5982a6e6922d179a6bf4eb`.

Cas couverts : aller-retour et ordre des blocs ; texte structuré/listes imbriquées ; attributs
et protocoles de liens interdits ; catégories/médias étrangers ou invalides ; disponibilité média
avant projection ; version de document, IDs et langues dupliqués ; langue explicite ; snapshot
publié distinct du brouillon généré ; dépublication ; libellé partagé actualisé sans republier
le brouillon ; isolation des cibles et refus des traversées de chemin.

État soumis : base `5dc9fe796cb24a4bc5d604835c4092e8a309e6dd`, branche `layers/domaine`,
index vide ; trois fichiers suivis modifiés et six fichiers de réalisation non suivis, plus cette carte.
Empreintes SHA-256 de la réalisation (hors trace de cette carte) :

- `webapp/schemas/source/dtos/symfony_api/article.yaml` : `9fd7c29a5349ded55c32549a12edff562cfd0cf251b827453b67225d5a3c2571`.
- `webapp/shared/schemas.ts` : `926c88afef674a3e163a8d1ac877fc309666d71aaa245ca1018fa22b2bc02e0a`.
- `webapp/shared/site/registry.ts` : `03555296d7ef7aed0245405ee496b4b36f48502852da0ba72d3ddc9c6c1f2ab2`.
- `webapp/services/saas/articles.ts` : `55e139ce3dc6c5715feaa81450ede4a7313e406cce53495cc8b533bd67cb301c`.
- `webapp/services/saas/articles.vitest.ts` : `886aa8d637458364c77646b93c10124cc6071d4c4a6b2e610e55c50c5a34e1ad`.
- `webapp/shared/saas/links.ts` : `49dd21b9e1b9371186246d752d9662d67f41298ea81c6b48910b908fe517550a`.
- `webapp/shared/types/saas/article.ts` : `03efbb8a4061e53c4ee3e92219d58df190f6a4c1aab6ecec1e52a617e0fddcc0`.
- `webapp/shared/types/saas/richText.ts` : `518b83c9eb6f043622526db08c233638013af38e1fb918db67b7eeef63556af0`.
- `webapp/shared/types/saas/target.ts` : `71831455e6008ea75b925859b585cb5f7606da4933e4e60737871e9d9b3cf847`.

Limites : aucune preuve API réelle ni UI ; capacités Symfony différées et projets de test non affectés.
Aucun commit créé ; les consommateurs restent bloqués jusqu’à validation/commit de DOM-001.
Les chemins dashboard et contrôles restent soumis à la consolidation déclarée séparément.

## Verdict humain

Validation humaine explicite du 2026-11-11 : « validé », après présentation de DOM-001.
Périmètre accepté : les neuf fichiers de réalisation identifiés par leurs empreintes ci-dessus et cette carte.
Les empreintes ont été revérifiées avant indexation ; aucune modification fonctionnelle depuis la présentation.
La validation ne couvre ni une autre carte ni une évolution Symfony.

## Commits

Commit local autorisé par le verdict ci-dessus ; SHA réel à relever après réussite.
Indexation limitée aux neuf fichiers validés et à cette carte.
La réunion globale est prévue dans le principal libre et propre, branche `demands/DEM-005`
créée seulement à la reconstitution depuis develop local vérifié.
