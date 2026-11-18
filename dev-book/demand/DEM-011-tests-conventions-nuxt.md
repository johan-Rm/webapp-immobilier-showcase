# DEM-011 — Consolider les tests et conventions techniques Nuxt

- Type : consolidation
- Référence : [dev-book](../README.md).
- Identifiant réservé : DEM-011 ; aucune occurrence concurrente trouvée dans les
  références Git locales, demandes et brouillons des worktrees le 2026-11-14.
  DEM-010 est réservée dans le brouillon des sections Vue (brouillon réservé dans le principal).
- Session de création : 01a1d56d-446b-7931-bf53-7687a7d10912
- Date : 2026-11-14
- État : reconstituée localement et validée sous réserves ; contrôle de contribution en échec, livraison non réalisée.
- Confirmation humaine : « cadrage confirmé », après ajout de la reprise des
  conventions techniques disponibles dans les README de Cap Nour.
- Priorité humaine : traiter cette consolidation avant de commencer DEM-010.
- Choix humain après analyse : « le socle et les pilotes » ; inclure le socle de
  contrôles et les trois pilotes composants Nuxt, accessibilité et comparaison
  visuelle décrits dans l’analyse. Les conflits de conventions restent à arbitrer.
- Arbitrage i18n confirmé par « oui » : conserver l’usage direct d’i18n et
  `AppImage`, sans créer de wrapper `useLocale` faute de problème local démontré.
  Cette décision ciblée ne change pas la convention générale des wrappers.
- Arbitrage Screens confirmé par « oui » : conserver le modèle local et autoriser
  leurs balises `<section>` et `<aside>` ; ne pas reprendre l’interdiction générale
  de régions des composants de Cap Nour.
- Arbitrage `<main>` confirmé par « oui » : exactement un par page rendue, porté
  par le layout autour du contenu de la route ; ni page ni Screen n’en ajoute.
  Vérifier aussi le rendu navigateur pour détecter les doublons après assemblage.
- Brouillon conservé dans le principal ; implémentation dans les couches affectées, sans création de demande définitive ni livraison.

## Besoin et décisions

Définir une stratégie proportionnée de tests et de contrôles pour Showcase
Immobilier, en comparant son existant aux pratiques réutilisables de Cap Nour.
Reprendre également les conventions techniques pertinentes des README sources,
après comparaison et adaptation au projet destinataire.

Source désignée : `/home/johan/www/lab/cap-nour-mvp`. Les chemins
`/home/johan/www/cap-nour` cités dans l’inventaire humain ne constituent pas une
seconde source confirmée. Cap Nour reste en lecture seule ; ne pas copier son
travail non commité entre missions. La migration dependency-cruiser évoquée par
l’humain est une piste à examiner, pas un acquis livré ni un choix d’outil adopté.

Périmètre confirmé : logique frontend et composants Vue, BFF/Nitro, dépendances
et architecture, vérificateurs de conventions, types, lint, formatage, contrats API,
builds, parcours navigateur, accessibilité, régression visuelle, sécurité,
performance et mutation JavaScript. Étudier ces familles pour retenir les
contrôles utiles ; aucune installation systématique de tous les outils.

Écarter les outils et conventions propres à PHP/Symfony : PHPUnit, Deptrac,
PHPStan, PHP-CS-Fixer, validation du conteneur Symfony, Infection et Rector.
Conserver l’examen des contrats et échanges avec l’API externe, sans modification
implicite de cette API. Les règles métier spécifiques à Cap Nour ne sont pas à
transposer par simple copie.

Pour les conventions reprises : vérifier l’existant, adapter chaque règle à sa
responsabilité locale et la documenter dans le README responsable avant son
contrôle. Préserver les rubriques et leur ordre. Une information a une source
unique ; utiliser des liens pour les références communes. Toute contradiction
avec une règle existante doit être arbitrée explicitement avant le découpage.

Définir pour chaque contrôle retenu son exécution dans la boucle de développement,
en CI et, lorsque pertinent, après déploiement. Les contrôles locaux dépendent du
changement et doivent être déclarés dans le compte rendu. L’examen du CD ne vaut
pas autorisation de déploiement ni de modification d’une production.

## Critères et cartes

L’[analyse et ses limites](../reports/tests-conventions-nuxt-analyse.md) font référence pour
la comparaison et les options ; ne pas recopier son inventaire dans les cartes.
Instruction humaine : relecture du code et exécution manuelle des commandes de
tests pendant l’implémentation et la vérification ; prévoir commandes reproductibles,
prérequis, résultats attendus et cas de refus dans chaque future carte.

- Inventaire vérifié de l’existant ici et des éléments réutilisables de Cap Nour,
  distinguant fichiers lus, contrôles configurés, contrôles réellement exécutés,
  résultats, angles morts, exceptions et travaux locaux non livrés.
- Comparaison des conventions README : correspondances, absences, contradictions,
  adaptations et emplacement responsable, sans duplication d’inventaires existants.
- Analyse des familles de tests pertinentes pour les sites clients, le catalogue,
  le dashboard, le BFF et les outils ; tenir compte des cibles inactives.
- Proposition argumentée : bénéfice, coût, portée, déclencheurs, dépendances,
  prérequis, niveau bloquant ou informatif et exceptions de chaque contrôle retenu.
- Pour chaque règle automatisée proposée, préciser cas conformes, écarts détectés
  et limites ; un contrôle structurel ne prouve ni accessibilité ni conformité UX.
- Faire confirmer les choix et conflits de conventions avant de préparer toutes
  les cartes ; prévoir documentation et preuves sans assimiler configuration et réussite.

Les [cartes et dépendances](../reports/tests-conventions-nuxt-plan.md) portent les choix confirmés ;
les états distinguent base disponible, commits amont attendus et arbitrages restants.
La priorité sur DEM-010 est un ordre de travail humain, pas une dépendance de code
inventée. Ne pas modifier la règle des sections Vue dans cette interview ; signaler
les éventuels recouvrements avec son analyse avant découpage.

## Vérification et livraison

Lecture initiale : README racine et webapp, package frontend, noms des workflows
et fichiers des vérificateurs de Cap Nour ; package frontend et workflow qualité
de Showcase. Vitest, vérification des types et conventions, génération et contrôle
des contrats sont déclarés dans Cap Nour ; Vitest, Playwright, types, lint et
formatage sont déjà déclarés ici. Leur couverture complète reste à analyser.

L’inventaire détaillé fourni par l’humain sert de point de départ, sans reprendre
ses nombres et résultats comme des preuves actuelles. Aucune suite exécutée pour
cette interview. Aucun code, README, convention ou contrôle modifié ; aucun commit,
push, PR ou déploiement. Aucun passage automatique à l’étape 02.

## Note à examiner — présentation et lancement des contrôles

Demande humaine du 2026-11-17, consignée en brouillon uniquement :

- Harmoniser la présentation des sorties de chaque test et contrôle, avec des explications pédagogiques en langage courant, sur le modèle des commandes déjà mises en forme.
- Prévoir un bilan final regroupant les résultats, les échecs, les contrôles non exécutés et les rapports détaillés, sans masquer les erreurs.
- Fournir des commandes Make simples pour lancer les ensembles de contrôles, sans demander à l’humain d’écrire des boucles `for`.

Cette note reste à analyser et à découper ; elle ne vaut ni validation de l’implémentation actuelle ni autorisation de développer ces compléments maintenant.

Le 2026-11-17, l’humain a explicitement demandé la correction immédiate des constructions Docker répétées dans DEM-011. Cette partie est reprise dans OPS-030 ; la présentation unifiée et le reporting groupé restent à analyser.

Correction OPS-030 du 2026-11-17 : commandes explicites sans FAMILY, conventions automatisées préfixées conventions-. Catalogue : docs/executer-controles.md dans DevOps. Commit local 39deb09 ; 57 tests ciblés, 154 Python et exécutions contrats/architecture réussis, sans reconstruction implicite. Vérification humaine à effectuer.

Préfixes anglais confirmés le 2026-11-17 : third-party-tests- / conventions- / verifiers-. Correctif OPS-030 e563324, catalogue de référence actualisé dans DevOps. 74 tests ciblés et 264 tests des vérificateurs réussis ; exécutions réelles lint, documentation, contrats et architecture réussies sans rebuild. Anciens noms conservés comme alias ; aucun push ni verdict humain implicite.

Présentation et reporting autorisés le 2026-11-17, portés par OPS-030 : bandeaux à six champs, contexte par message, journaux hôtes persistants et bilan checks-run. Commit local 99bc7fe ; 74 tests ciblés, 162 Python, 66 Vitest et 44 Bun des vérificateurs réussis. Recette groupée testée avec outils simulés ; la recette complète et les échecs de la sortie humaine ne sont pas corrigés ni rejoués dans ce changement. Décompte des avertissements non consolidé explicitement. Documentation d’exécution canonique actualisée ; vérification humaine attendue. Cette autorisation remplace la précédente limitation du reporting au brouillon.

Correction des échecs d’intégration Docker le 2026-11-17, OPS-030, commit local 7b00b0f : Make absent ajouté, erreurs de démarrage explicites et intégration bornée à deux workers sans hausse des délais. Suite ciblée 53 tests réussis sur hôte et Docker ; intégration Showcase complète confirmée à 243 tests/23 fichiers, code 0. Versions, image, empreinte du journal et limites dans le rapport OPS-031. Aucun test supprimé ou ignoré ; sécurité/SOLID et verdict humain restent ouverts.

Aide navigateur du 2026-11-17, OPS-030, commit d9e7b69 : checks-fixture-start/stop ajoutés et éprouvés, préparation Nuxt + SSR dans le conteneur jetable avec surcharge de sortie Nitro. API et médias fictifs, URL locale explicite, port occupé et cible inconnue refusés, serveur arrêté après essai. 53 tests Make réussis. Les deux parcours navigateur sont exécutés mais échouent sur des erreurs IPX ; défaut ouvert consigné dans OPS-031. Le défaut composants Dashboard (configuration générée absente avant les tests) reste également ouvert et non corrigé à la demande humaine.

## Report confirmé des quatre écarts SOLID — 2026-11-18

Après restitution, l’humain confirme leur traitement dans la nouvelle consolidation DEM-012 (brouillon réservé dans le principal). Les mesures et preuves restent dans le bilan OPS-031 ; le contrôle SOLID conserve son échec, sans changement de seuil ni exemption. Ce report ciblé ne vaut ni acceptation des autres signalements, ni clôture, validation globale ou livraison de DEM-011.

## Validation humaine finale — 2026-11-18

Verdict explicite « oui validé » sur les 18 cartes et les correctifs présentés, sous les réserves détaillées dans le [rapport de verdict](../reports/ops031-verdict-final.json). Les réserves et références Git ont cette source unique. La vérification/arbitrage est terminée ; aucune reconstitution ni livraison déduite. Trace documentaire locale : 44711c8.

## Reconstitution locale — 2026-11-18

Branche `demands/DEM-011` créée depuis `develop` local à `ca571d60c39b8b5932d74cd43dcbe4131c47c578`, sans fetch. Les 70 commits validés sont appliqués par cherry-pick `-x`, sans conflit, dans leur ordre de dépendance. La [correspondance source → obtenu](../reports/tests-conventions-nuxt-reconstitution.json) conserve tous les SHA. Avant matérialisation documentaire, l’arbre obtenu est identique à celui de `44711c8ae1a4d56cc99dd55fae042183623558f3` ; les `.env` préexistants sont inchangés. Les couches conservent leurs branches. Le verdict sous réserves reste applicable, dont le contrôle SOLID en échec ; aucune CI distante ni livraison déduite.

Le contrôle de contribution extrait de `develop` refuse deux scopes de commits ; les références exactes sont consignées dans la trace de reconstitution. L’un appartient aux sources validées, l’autre à la matérialisation documentaire. Aucun commit réécrit ni contrôle assoupli ; cet écart doit être arbitré avant livraison. Les contrôles documentation, liens locaux et traces des cartes réussissent.

## Tentative de livraison — 2026-11-18

La base distante est vérifiée par fetch. Les contrôles frontend, vérificateurs, documentation, traces et les deux parcours navigateur réussissent après préparation de l’environnement local et utilisation d’un dossier neuf de rapports, sans modification des anciens fichiers. Les preuves et limites sont centralisées dans la [trace de reconstitution](../reports/tests-conventions-nuxt-reconstitution.json), entrée `tentative_livraison_2026_11_18`. Le contrôle des scopes de contribution reste en échec ; livraison arrêtée avant push ou PR, sans réécriture des commits ni contournement.

## Déclaration de contribution

```contribution-json
{
  "version": 1,
  "corrections": [
    {
      "convention": "codebase-integrity/README.md#conventions-techniques",
      "controles": [
        "webapp/scripts/quality/ci-plan.vitest.ts"
      ],
      "chemins": [
        ".github/workflows/ai-development-engineering.yml",
        ".github/workflows/conventions.yml",
        ".github/workflows/quality-extended.yml",
        ".github/workflows/quality.yml",
        "webapp/scripts/quality/ci-plan.vitest.ts"
      ]
    },
    {
      "convention": "codebase-integrity/README.md#conventions-techniques",
      "controles": [
        "webapp/scripts/quality/architecture.vitest.ts",
        "webapp/scripts/quality/ci-plan.vitest.ts",
        "webapp/scripts/quality/contracts.vitest.ts",
        "webapp/scripts/quality/lighthouse.vitest.ts",
        "webapp/scripts/quality/load.vitest.ts",
        "webapp/scripts/quality/manifest.vitest.ts",
        "webapp/scripts/quality/mutation.vitest.ts",
        "webapp/scripts/quality/run.vitest.ts",
        "webapp/scripts/quality/security.vitest.ts"
      ],
      "chemins": [
        "codebase-integrity/README.md"
      ]
    },
    {
      "convention": "codebase-integrity/README.md#conventions-techniques",
      "controles": [
        "codebase-integrity/domaines/qualite-code/tests/verify-frontend-conventions.vitest.ts"
      ],
      "chemins": [
        "codebase-integrity/bun.lock",
        "codebase-integrity/conventions.json",
        "codebase-integrity/domaines/qualite-code/regles.yaml",
        "codebase-integrity/domaines/qualite-code/scripts/verify-code-quality.ts",
        "codebase-integrity/package.json",
        "codebase-integrity/commun/frontend-policy.ts",
        "codebase-integrity/commun/test_domains.py",
        "codebase-integrity/domaines/architecture-dependances/scripts/verify-types-placement.ts",
        "codebase-integrity/domaines/architecture-dependances/tests/verify-layer-scopes.vitest.ts",
        "codebase-integrity/domaines/fiabilite-verifications/tests/test_frontend_paths.py",
        "codebase-integrity/domaines/qualite-code/scripts/verify-frontend-conventions.ts",
        "codebase-integrity/domaines/qualite-code/scripts/verify-solid.ts",
        "codebase-integrity/domaines/qualite-code/tests/verify-code-quality.vitest.ts",
        "codebase-integrity/domaines/qualite-code/tests/verify-frontend-cli.vitest.ts",
        "codebase-integrity/domaines/qualite-code/tests/verify-frontend-conventions.vitest.ts",
        "codebase-integrity/domaines/qualite-code/tests/verify-solid.vitest.ts"
      ]
    },
    {
      "convention": "codebase-integrity/README.md#conventions-techniques",
      "controles": [
        "webapp/scripts/quality/contracts.vitest.ts",
        "webapp/scripts/quality/manifest.vitest.ts"
      ],
      "chemins": [
        "docs/2.architecture/3.page-layout-screen-model.md",
        "docs/3.application/ci-conventions-validation.md",
        "webapp/scripts/quality/contracts.ts",
        "webapp/scripts/quality/contracts.vitest.ts",
        "webapp/scripts/quality/manifest.vitest.ts"
      ]
    },
    {
      "convention": "codebase-integrity/README.md#conventions-techniques",
      "controles": [
        "webapp/scripts/quality/lighthouse.vitest.ts"
      ],
      "chemins": [
        "infra/docker/Dockerfile.lighthouse",
        "webapp/scripts/quality/lighthouse.ts",
        "webapp/scripts/quality/lighthouse.vitest.ts",
        "webapp/scripts/quality/lighthouse/profiles.json"
      ]
    },
    {
      "convention": "codebase-integrity/README.md#conventions-techniques",
      "controles": [
        "webapp/scripts/quality/ci-plan.vitest.ts",
        "webapp/scripts/quality/lighthouse.vitest.ts",
        "webapp/scripts/quality/load.vitest.ts",
        "webapp/scripts/quality/run.vitest.ts"
      ],
      "chemins": [
        "infra/docker/docker-compose.quality.yml"
      ]
    },
    {
      "convention": "codebase-integrity/README.md#conventions-techniques",
      "controles": [
        "webapp/scripts/quality/run.vitest.ts"
      ],
      "chemins": [
        "infra/make/Makefile.dev",
        "webapp/bun.lock",
        "webapp/package.json",
        "webapp/playwright.config.ts",
        "webapp/scripts/quality/run.ts",
        "webapp/scripts/quality/run.vitest.ts",
        "webapp/vitest.config.ts"
      ]
    },
    {
      "convention": "codebase-integrity/README.md#conventions-techniques",
      "controles": [
        "webapp/tests/e2e/client2-articles.spec.ts",
        "webapp/tests/e2e/client2.smoke.spec.ts",
        "webapp/tests/e2e/home.smoke.spec.ts",
        "webapp/tests/layers/structure-web.vitest.ts"
      ],
      "chemins": [
        "webapp/base/real-estate/README.md",
        "webapp/base/real-estate/components/screen/Blockquote.vue",
        "webapp/base/real-estate/components/screen/Contact.vue",
        "webapp/base/real-estate/components/screen/EssaouiraTheJewel.vue",
        "webapp/base/real-estate/components/screen/Footer.vue",
        "webapp/base/real-estate/components/screen/Footer2.vue",
        "webapp/base/real-estate/components/screen/Investing.vue",
        "webapp/base/real-estate/components/screen/PanelMDC.vue",
        "webapp/base/real-estate/components/screen/PanelScrollDualSynced.vue",
        "webapp/base/real-estate/components/screen/PropertyDetail.vue",
        "webapp/base/real-estate/components/screen/PropertyExceptional.vue",
        "webapp/base/real-estate/components/screen/PropertyList.vue",
        "webapp/base/real-estate/components/screen/WhyChooseShowcase.vue",
        "webapp/base/real-estate/components/screen/real-estate/FullImage.vue",
        "webapp/base/real-estate/components/screen/real-estate/Rounded.vue",
        "webapp/base/real-estate/components/screen/real-estate/Split.vue",
        "webapp/base/real-estate/components/screen/real-estate/ThreeColProperties.vue",
        "webapp/sites/README.md",
        "webapp/sites/client2-immobilier/README.md",
        "webapp/sites/client2-immobilier/app/components/ScreenArticles.vue",
        "webapp/sites/client2-immobilier/app/layouts/editorial.vue",
        "webapp/sites/client2-immobilier/app/pages/[locale]/articles/[[slug]].vue",
        "webapp/sites/client2-immobilier/app/pages/index.vue",
        "webapp/sites/showcase-immobilier/app/README.md",
        "webapp/sites/showcase-immobilier/app/components/AppBootShell.vue",
        "webapp/sites/showcase-immobilier/app/components/AppOverlay.vue",
        "webapp/sites/showcase-immobilier/app/components/HelloWorld.vue",
        "webapp/sites/showcase-immobilier/app/components/README.md",
        "webapp/sites/showcase-immobilier/app/components/blockquote/Default.vue",
        "webapp/sites/showcase-immobilier/app/components/blockquote/Oneline.vue",
        "webapp/sites/showcase-immobilier/app/components/card/Invest.vue",
        "webapp/sites/showcase-immobilier/app/components/carousel/Panel.vue",
        "webapp/sites/showcase-immobilier/app/components/dashboard/CategoryCodeSelect.vue",
        "webapp/sites/showcase-immobilier/app/components/dashboard/OfferField.vue",
        "webapp/sites/showcase-immobilier/app/components/dashboard/PropertyAssociatedMediaEditor.vue",
        "webapp/sites/showcase-immobilier/app/components/dashboard/PropertyContentEditor.vue",
        "webapp/sites/showcase-immobilier/app/components/dashboard/PropertyCreatorPanel.vue",
        "webapp/sites/showcase-immobilier/app/components/dashboard/PropertyEditorPanel.vue",
        "webapp/sites/showcase-immobilier/app/components/dashboard/PropertyFieldEditor.vue",
        "webapp/sites/showcase-immobilier/app/components/dashboard/PropertyPlaceEditor.vue",
        "webapp/sites/showcase-immobilier/app/components/dashboard/PropertyScreenEditor.vue",
        "webapp/sites/showcase-immobilier/app/components/dashboard/PropertyScreensEditor.vue",
        "webapp/sites/showcase-immobilier/app/components/dashboard/PropertyWorkspace.vue",
        "webapp/sites/showcase-immobilier/app/components/dashboard/QualitiesEditor.vue",
        "webapp/sites/showcase-immobilier/app/components/dashboard/ScreenMediaSelector.vue",
        "webapp/sites/showcase-immobilier/app/components/dashboard/ScreenTemplateSelect.vue",
        "webapp/sites/showcase-immobilier/app/components/dashboard/ScreenTemplateSkeleton.vue",
        "webapp/sites/showcase-immobilier/app/components/dashboard/SidebarFilters.vue",
        "webapp/sites/showcase-immobilier/app/components/dashboard/SidebarUserCard.vue",
        "webapp/sites/showcase-immobilier/app/components/dashboard/TiptapEditor.vue",
        "webapp/sites/showcase-immobilier/app/components/gallery/Images.vue",
        "webapp/sites/showcase-immobilier/app/components/heading/h1.vue",
        "webapp/sites/showcase-immobilier/app/components/heading/h2.vue",
        "webapp/sites/showcase-immobilier/app/components/heading/h3.vue",
        "webapp/sites/showcase-immobilier/app/components/heading/h4.vue",
        "webapp/sites/showcase-immobilier/app/components/line/Property.vue",
        "webapp/sites/showcase-immobilier/app/components/logo/ShowcaseFull.vue",
        "webapp/sites/showcase-immobilier/app/components/logo/ShowcasePicto.vue",
        "webapp/sites/showcase-immobilier/app/components/markdown/PanelMdc.vue",
        "webapp/sites/showcase-immobilier/app/components/mdc/Card.vue",
        "webapp/sites/showcase-immobilier/app/components/mdc/Headband.vue",
        "webapp/sites/showcase-immobilier/app/components/mdc/PageIntro.vue",
        "webapp/sites/showcase-immobilier/app/components/mdc/Youtube.vue",
        "webapp/sites/showcase-immobilier/app/components/navigation/LangSwitcher.vue",
        "webapp/sites/showcase-immobilier/app/components/navigation/QuickActions.vue",
        "webapp/sites/showcase-immobilier/app/components/navigation/SocialNetwork.vue",
        "webapp/sites/showcase-immobilier/app/components/panel/ActiveContent.vue",
        "webapp/sites/showcase-immobilier/app/components/panel/ThreeCols.vue",
        "webapp/sites/showcase-immobilier/app/components/paragraph/Default.vue",
        "webapp/sites/showcase-immobilier/app/components/progress/Bar.vue",
        "webapp/sites/showcase-immobilier/app/components/progress/Counter.vue",
        "webapp/sites/showcase-immobilier/app/components/property/DetailPanel.vue",
        "webapp/sites/showcase-immobilier/app/components/property/ExceptionalContact.vue",
        "webapp/sites/showcase-immobilier/app/components/property/ExceptionalSplit.vue",
        "webapp/sites/showcase-immobilier/app/components/property/ExceptionalSummary.vue",
        "webapp/sites/showcase-immobilier/app/components/property/ExceptionalTriptych.vue",
        "webapp/sites/showcase-immobilier/app/components/property/OverlayGridList.vue",
        "webapp/sites/showcase-immobilier/app/components/toggle/CinemaMode.vue",
        "webapp/sites/showcase-immobilier/app/components/toggle/ThemeMode.vue",
        "webapp/sites/showcase-immobilier/app/components/toggle/TransitionMode.vue",
        "webapp/sites/showcase-immobilier/app/components/toggle/ViewModeList.vue",
        "webapp/sites/showcase-immobilier/app/components/typewriter/Text.vue",
        "webapp/sites/showcase-immobilier/app/layouts/README.md",
        "webapp/sites/showcase-immobilier/app/layouts/dashboard.vue",
        "webapp/sites/showcase-immobilier/app/layouts/default.vue",
        "webapp/sites/showcase-immobilier/app/pages/README.md",
        "webapp/sites/showcase-immobilier/app/pages/[...page].vue",
        "webapp/sites/showcase-immobilier/app/pages/contact.vue",
        "webapp/sites/showcase-immobilier/app/pages/dashboard/index.vue",
        "webapp/sites/showcase-immobilier/app/pages/dashboard/login.vue",
        "webapp/sites/showcase-immobilier/app/pages/echo.vue",
        "webapp/sites/showcase-immobilier/app/pages/index.vue",
        "webapp/sites/showcase-immobilier/app/pages/properties/[realEstateListing]/[accommodationCategory]/[accommodationSlug].vue",
        "webapp/sites/showcase-immobilier/app/pages/properties/[realEstateListing]/[accommodationCategory]/index.vue",
        "webapp/sites/showcase-immobilier/app/pages/properties/[realEstateListing]/index.vue",
        "webapp/sites/showcase-immobilier/app/pages/villa-des-alizes-content.vue",
        "webapp/sites/showcase-immobilier/app/pages/villa-des-alizes-mobile.vue",
        "webapp/sites/showcase-immobilier/app/pages/villa-des-alizes.vue",
        "webapp/tests/e2e/client2-articles.spec.ts",
        "webapp/tests/e2e/client2.smoke.spec.ts",
        "webapp/tests/e2e/home.smoke.spec.ts",
        "webapp/tests/layers/structure-web.vitest.ts"
      ]
    },
    {
      "convention": "codebase-integrity/README.md#conventions-techniques",
      "controles": [
        "webapp/dashboard/tests/AccessForm.nuxt.vitest.ts",
        "webapp/tests/e2e/saas-access.spec.ts",
        "webapp/tests/e2e/saas-editor.spec.ts"
      ],
      "chemins": [
        "webapp/dashboard/README.md",
        "webapp/dashboard/app/components/dashboard/Administration.vue",
        "webapp/dashboard/app/components/dashboard/Articles.vue",
        "webapp/dashboard/app/components/dashboard/Brand.vue",
        "webapp/dashboard/app/components/dashboard/Navigation.vue",
        "webapp/dashboard/app/components/dashboard/Overview.vue",
        "webapp/dashboard/app/components/dashboard/RichText.vue",
        "webapp/dashboard/app/layouts/auth.vue",
        "webapp/dashboard/app/layouts/default.vue",
        "webapp/dashboard/app/pages/[access].vue",
        "webapp/dashboard/app/pages/administration.vue",
        "webapp/dashboard/app/pages/articles.vue",
        "webapp/dashboard/app/pages/index.vue",
        "webapp/dashboard/tests/AccessForm.nuxt.vitest.ts",
        "webapp/tests/e2e/saas-access.spec.ts",
        "webapp/tests/e2e/saas-editor.spec.ts"
      ]
    },
    {
      "convention": "codebase-integrity/README.md#conventions-techniques",
      "controles": [
        "webapp/services/saas/articles.vitest.ts",
        "webapp/shared/saas/links.vitest.ts"
      ],
      "chemins": [
        "webapp/schemas/README.md",
        "webapp/services/README.md",
        "webapp/services/saas/articles.vitest.ts",
        "webapp/shared/README.md",
        "webapp/shared/saas/links.vitest.ts"
      ]
    },
    {
      "convention": "codebase-integrity/README.md#conventions-techniques",
      "controles": [
        "webapp/scripts/quality/architecture.vitest.ts"
      ],
      "chemins": [
        "webapp/scripts/quality/architecture.ts",
        "webapp/scripts/quality/architecture.vitest.ts",
        "webapp/scripts/quality/dependency-cruiser.cjs"
      ]
    },
    {
      "convention": "codebase-integrity/README.md#conventions-techniques",
      "controles": [
        "webapp/scripts/quality/load.vitest.ts",
        "webapp/scripts/quality/fixture-media.vitest.ts"
      ],
      "chemins": [
        "webapp/scripts/quality/fixture-server.ts",
        "webapp/scripts/quality/fixture-media.vitest.ts"
      ]
    },
    {
      "convention": "codebase-integrity/README.md#conventions-techniques",
      "controles": [
        "webapp/scripts/quality/load.vitest.ts"
      ],
      "chemins": [
        "webapp/scripts/quality/load.ts",
        "webapp/scripts/quality/load.vitest.ts",
        "webapp/scripts/quality/load/scenarios.js"
      ]
    },
    {
      "convention": "codebase-integrity/README.md#conventions-techniques",
      "controles": [
        "webapp/scripts/quality/mutation.vitest.ts"
      ],
      "chemins": [
        "webapp/scripts/quality/mutation.ts",
        "webapp/scripts/quality/mutation.vitest.ts",
        "webapp/scripts/quality/stryker.config.mjs",
        "webapp/scripts/quality/vitest-mutation.config.ts"
      ]
    },
    {
      "convention": "codebase-integrity/README.md#conventions-techniques",
      "controles": [
        "webapp/scripts/quality/security.vitest.ts"
      ],
      "chemins": [
        "webapp/scripts/quality/security-exceptions.json",
        "webapp/scripts/quality/security.ts",
        "webapp/scripts/quality/security.vitest.ts"
      ]
    },
    {
      "convention": "codebase-integrity/README.md#conventions-techniques",
      "controles": [
        "webapp/server/tests/quality-boundaries.vitest.ts"
      ],
      "chemins": [
        "webapp/server/README.md",
        "webapp/server/tests/quality-boundaries.vitest.ts"
      ]
    },
    {
      "convention": "codebase-integrity/README.md#conventions-techniques",
      "controles": [
        "codebase-integrity/domaines/fiabilite-verifications/tests/test_check_output.py"
      ],
      "chemins": [
        "codebase-integrity/commun/console-context.ts",
        "codebase-integrity/commun/run_check_output.py",
        "codebase-integrity/domaines/fiabilite-verifications/tests/test_check_output.py"
      ]
    },
    {
      "convention": "codebase-integrity/README.md#conventions-techniques",
      "controles": [
        "codebase-integrity/domaines/fiabilite-verifications/tests/test_aide_runner.py"
      ],
      "chemins": [
        "codebase-integrity/commun/run_aide_checks.py",
        "codebase-integrity/domaines/fiabilite-verifications/tests/test_aide_runner.py"
      ]
    },
    {
      "convention": "codebase-integrity/README.md#conventions-techniques",
      "controles": [
        "codebase-integrity/domaines/construction-livraison/tests/test_devbook.py"
      ],
      "chemins": [
        "codebase-integrity/domaines/construction-livraison/scripts/check_devbook.py",
        "codebase-integrity/domaines/construction-livraison/tests/test_devbook.py"
      ]
    },
    {
      "convention": "codebase-integrity/README.md#conventions-techniques",
      "controles": [
        "codebase-integrity/domaines/fiabilite-verifications/tests/test_docs.py"
      ],
      "chemins": [
        "codebase-integrity/domaines/fiabilite-verifications/scripts/check_docs.py",
        "codebase-integrity/domaines/fiabilite-verifications/tests/test_docs.py"
      ]
    },
    {
      "convention": "codebase-integrity/README.md#conventions-techniques",
      "controles": [
        "codebase-integrity/domaines/fiabilite-verifications/tests/test_readmes.py"
      ],
      "chemins": [
        "codebase-integrity/domaines/fiabilite-verifications/scripts/check_readmes.py",
        "codebase-integrity/domaines/fiabilite-verifications/tests/test_readmes.py"
      ]
    },
    {
      "convention": "codebase-integrity/README.md#exécution-des-contrôles",
      "controles": [
        "codebase-integrity/domaines/fiabilite-verifications/tests/test_check_presentation.py"
      ],
      "chemins": [
        "codebase-integrity/commun/check_presentation.py",
        "codebase-integrity/domaines/fiabilite-verifications/tests/test_check_presentation.py"
      ]
    },
    {
      "convention": "infra/README.md#mode-test-des-couches",
      "controles": [
        "infra/tests/test_lanes.py"
      ],
      "chemins": [
        "infra/scripts/lanes.py",
        "infra/tests/test_lanes.py"
      ]
    }
  ],
  "accompagnements": [
    {
      "motif": "Exécution isolée des contrôles, exclusion des secrets et conservation de leurs rapports.",
      "chemins": [
        ".dockerignore",
        ".gitignore",
        "infra/docker/Dockerfile.playwright",
        "infra/make/Makefile.ai-development-engineering"
      ]
    },
    {
      "motif": "Alignement documentaire et conservation des preuves de la consolidation ; procédures déplacées hors des README.",
      "chemins": [
        "AGENTS.md",
        "dev-book/README.md",
        "dev-book/demand/DEM-004-vhosts-locaux.md",
        "dev-book/demand/DEM-006-commandes-lanes.md",
        "dev-book/demand/DEM-007-couche-dashboard.md",
        "dev-book/reports/ops023-verification.json",
        "dev-book/reports/ops025-audit.json",
        "dev-book/reports/ops026-architecture.json",
        "dev-book/reports/ops033-verification.json",
        "dev-book/runbooks/README.md",
        "dev-book/tasks/OPS-008-router-vhosts-par-pile.md",
        "dev-book/tasks/OPS-012-servir-dashboard-et-projeter-articles.md",
        "dev-book/templates/README.md",
        "dev-book/templates/carte.md",
        "docs/1.getting-started/dashboard-saas.md",
        "docs/1.getting-started/setup-local.md",
        "docs/2.architecture/11.stores-standard.md",
        "docs/2.architecture/12.content-model.md",
        "docs/2.architecture/13.routing-and-middleware.md",
        "docs/2.architecture/14.site-layers.md",
        "docs/2.architecture/5.responsibility-boundaries.md",
        "docs/2.architecture/6.script-setup-standard.md",
        "docs/2.architecture/7.auto-imports-and-aliases.md",
        "docs/2.architecture/8.composables-standard.md",
        "docs/3.application/contenus-et-fixtures.md",
        "docs/3.application/dashboard-saas-contrats.md",
        "docs/3.application/scripts-application.md",
        "docs/README.md",
        "docs/controle-contributions.md",
        "docs/controle-conventions-frontend.md",
        "docs/executer-controles.md",
        "docs/index.md",
        "docs/nginx-local.md",
        "docs/perimetre-controles-frontend.md",
        "docs/verifier-traces-devbook.md",
        "docs/worktrees.md",
        "infra/README.md",
        "infra/nginx/README.md",
        "webapp/base/README.md",
        "webapp/base/assets/README.md",
        "webapp/base/components/README.md",
        "webapp/base/composables/README.md",
        "webapp/base/layouts/README.md",
        "webapp/base/middleware/README.md",
        "webapp/base/pages/README.md",
        "webapp/base/plugins/README.md",
        "webapp/base/stores/README.md",
        "webapp/base/utils/README.md",
        "webapp/content/README.md",
        "webapp/fixtures/accommodations/README.md",
        "webapp/fixtures/catalog/README.md",
        "webapp/public/README.md",
        "webapp/scripts/README.md",
        "webapp/sites/showcase-immobilier/README.md",
        "webapp/sites/showcase-immobilier/app/assets/README.md",
        "webapp/sites/showcase-immobilier/app/composables/README.md",
        "webapp/sites/showcase-immobilier/app/middleware/README.md",
        "webapp/sites/showcase-immobilier/app/plugins/README.md",
        "webapp/sites/showcase-immobilier/app/stores/README.md",
        "webapp/sites/showcase-immobilier/app/utils/README.md",
        "worktree/README.md"
      ]
    },
    {
      "motif": "Conservation des résultats techniques et limites de la recette intégrée ; aucun verdict humain prérempli.",
      "chemins": [
        "dev-book/reports/ops031-verification.json"
      ]
    },
    {
      "motif": "Séparer préparation et réutilisation de l’image des contrôles ; aide et preuves associées, correction demandée dans DEM-011.",
      "chemins": [
        "Makefile"
      ]
    },
    {
      "motif": "Préparation explicite du serveur de fixtures : autoriser la recréation de la sortie Nitro dans le conteneur jetable, sans modifier les montages des contrôles ni les sources hôtes.",
      "chemins": [
        "infra/docker/docker-compose.fixtures.yml"
      ]
    },
    {
      "motif": "Analyse d’exposition Picomatch et proposition bornée à arbitrer ; aucune exception appliquée.",
      "chemins": [
        "dev-book/reports/ops030-exposition-picomatch.md"
      ]
    },
    {
      "motif": "Trace documentaire du verdict humain explicite sur les 18 cartes et les réserves, sans livraison implicite.",
      "chemins": [
        "dev-book/reports/ops031-verdict-final.json"
      ]
    },
    {
      "motif": "Matérialisation des sources de cadrage et traces de reconstitution de la consolidation validée ; aucun changement fonctionnel.",
      "chemins": [
        "dev-book/reports/tests-conventions-nuxt-analyse.md",
        "dev-book/reports/tests-conventions-nuxt-plan.md",
        "dev-book/reports/tests-conventions-nuxt-inventaire.json",
        "dev-book/reports/tests-conventions-nuxt-reconstitution.json"
      ]
    }
  ],
  "sans_correction": ""
}
```
