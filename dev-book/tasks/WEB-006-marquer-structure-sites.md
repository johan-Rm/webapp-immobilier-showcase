# WEB-006 — Migrer les marqueurs et main des sites et du catalogue

- Demande : DEM-011 ; type : consolidation.
- Session de création : 01a1d56d-446b-7931-bf53-7687a7d10912
- Date : 2026-11-14
- Couche : web
- Branche : layers/web
- Worktree : `/home/johan/www/graines-digitales/modern-web-apps/showcase-immobilier/worktree/web`
- État : implémentée et commitée, à vérifier.
- Base locale vérifiée : `ca571d60c39b8b5932d74cd43dcbe4131c47c578` ; aucun fetch.
- Dépendances : aucune dépendance de code nouvelle ; base ci-dessus.
- Référence de cadrage : `tmp/demande-consolidation-tests-conventions-nuxt.md`, relatif au principal, hors worktrees ; ne pas copier. Analyse et décisions : `tmp/analyse-tests-conventions-nuxt.md`.
- Chemins autorisés (en plus de cette carte) :

- `webapp/base/real-estate/components/screen/Blockquote.vue`
- `webapp/base/real-estate/components/screen/Contact.vue`
- `webapp/base/real-estate/components/screen/EssaouiraTheJewel.vue`
- `webapp/base/real-estate/components/screen/Footer.vue`
- `webapp/base/real-estate/components/screen/Footer2.vue`
- `webapp/base/real-estate/components/screen/Investing.vue`
- `webapp/base/real-estate/components/screen/PanelMDC.vue`
- `webapp/base/real-estate/components/screen/PanelScrollDualSynced.vue`
- `webapp/base/real-estate/components/screen/PropertyDetail.vue`
- `webapp/base/real-estate/components/screen/PropertyExceptional.vue`
- `webapp/base/real-estate/components/screen/PropertyList.vue`
- `webapp/base/real-estate/components/screen/WhyChooseShowcase.vue`
- `webapp/base/real-estate/components/screen/real-estate/FullImage.vue`
- `webapp/base/real-estate/components/screen/real-estate/Rounded.vue`
- `webapp/base/real-estate/components/screen/real-estate/Split.vue`
- `webapp/base/real-estate/components/screen/real-estate/ThreeColProperties.vue`
- `webapp/sites/client2-immobilier/app/components/ArticleView.vue`
- `webapp/sites/client2-immobilier/app/components/ScreenArticles.vue`
- `webapp/sites/client2-immobilier/app/layouts/editorial.vue`
- `webapp/sites/client2-immobilier/app/pages/[locale]/articles/[[slug]].vue`
- `webapp/sites/client2-immobilier/app/pages/index.vue`
- `webapp/sites/showcase-immobilier/app/components/AppBootShell.vue`
- `webapp/sites/showcase-immobilier/app/components/AppImage.vue`
- `webapp/sites/showcase-immobilier/app/components/AppLink.vue`
- `webapp/sites/showcase-immobilier/app/components/AppOverlay.vue`
- `webapp/sites/showcase-immobilier/app/components/CommandPropertySlideover.vue`
- `webapp/sites/showcase-immobilier/app/components/ConstructionModal.vue`
- `webapp/sites/showcase-immobilier/app/components/HelloWorld.vue`
- `webapp/sites/showcase-immobilier/app/components/blockquote/Default.vue`
- `webapp/sites/showcase-immobilier/app/components/blockquote/Oneline.vue`
- `webapp/sites/showcase-immobilier/app/components/card/Invest.vue`
- `webapp/sites/showcase-immobilier/app/components/card/TitleProperty.vue`
- `webapp/sites/showcase-immobilier/app/components/carousel/Panel.vue`
- `webapp/sites/showcase-immobilier/app/components/dashboard/CategoryCodeSelect.vue`
- `webapp/sites/showcase-immobilier/app/components/dashboard/OfferField.vue`
- `webapp/sites/showcase-immobilier/app/components/dashboard/PropertyAssociatedMediaEditor.vue`
- `webapp/sites/showcase-immobilier/app/components/dashboard/PropertyContentEditor.vue`
- `webapp/sites/showcase-immobilier/app/components/dashboard/PropertyCreatorPanel.vue`
- `webapp/sites/showcase-immobilier/app/components/dashboard/PropertyEditorPanel.vue`
- `webapp/sites/showcase-immobilier/app/components/dashboard/PropertyEditorSlideover.vue`
- `webapp/sites/showcase-immobilier/app/components/dashboard/PropertyFieldEditor.vue`
- `webapp/sites/showcase-immobilier/app/components/dashboard/PropertyMediaGallery.vue`
- `webapp/sites/showcase-immobilier/app/components/dashboard/PropertyMediaPickerModal.vue`
- `webapp/sites/showcase-immobilier/app/components/dashboard/PropertyPlaceEditor.vue`
- `webapp/sites/showcase-immobilier/app/components/dashboard/PropertyPreview.vue`
- `webapp/sites/showcase-immobilier/app/components/dashboard/PropertyScreenEditor.vue`
- `webapp/sites/showcase-immobilier/app/components/dashboard/PropertyScreensEditor.vue`
- `webapp/sites/showcase-immobilier/app/components/dashboard/PropertySidebar.vue`
- `webapp/sites/showcase-immobilier/app/components/dashboard/PropertyWorkspace.vue`
- `webapp/sites/showcase-immobilier/app/components/dashboard/QualitiesEditor.vue`
- `webapp/sites/showcase-immobilier/app/components/dashboard/ScreenMediaSelector.vue`
- `webapp/sites/showcase-immobilier/app/components/dashboard/ScreenTemplateSelect.vue`
- `webapp/sites/showcase-immobilier/app/components/dashboard/ScreenTemplateSkeleton.vue`
- `webapp/sites/showcase-immobilier/app/components/dashboard/SidebarFilters.vue`
- `webapp/sites/showcase-immobilier/app/components/dashboard/SidebarUserCard.vue`
- `webapp/sites/showcase-immobilier/app/components/dashboard/TiptapEditor.vue`
- `webapp/sites/showcase-immobilier/app/components/form/Contact.vue`
- `webapp/sites/showcase-immobilier/app/components/form/ContactProperty.vue`
- `webapp/sites/showcase-immobilier/app/components/gallery/Images.vue`
- `webapp/sites/showcase-immobilier/app/components/heading/h1.vue`
- `webapp/sites/showcase-immobilier/app/components/heading/h2.vue`
- `webapp/sites/showcase-immobilier/app/components/heading/h2Screen.vue`
- `webapp/sites/showcase-immobilier/app/components/heading/h3.vue`
- `webapp/sites/showcase-immobilier/app/components/heading/h4.vue`
- `webapp/sites/showcase-immobilier/app/components/line/Property.vue`
- `webapp/sites/showcase-immobilier/app/components/link/HeroNav.vue`
- `webapp/sites/showcase-immobilier/app/components/logo/ShowcaseFull.vue`
- `webapp/sites/showcase-immobilier/app/components/logo/ShowcasePicto.vue`
- `webapp/sites/showcase-immobilier/app/components/logo/ShowcaseReduce.vue`
- `webapp/sites/showcase-immobilier/app/components/markdown/PanelMdc.vue`
- `webapp/sites/showcase-immobilier/app/components/mdc/Card.vue`
- `webapp/sites/showcase-immobilier/app/components/mdc/Headband.vue`
- `webapp/sites/showcase-immobilier/app/components/mdc/PageIntro.vue`
- `webapp/sites/showcase-immobilier/app/components/mdc/Youtube.vue`
- `webapp/sites/showcase-immobilier/app/components/navigation/LangSwitcher.vue`
- `webapp/sites/showcase-immobilier/app/components/navigation/Main.vue`
- `webapp/sites/showcase-immobilier/app/components/navigation/MobileActionsMenu.vue`
- `webapp/sites/showcase-immobilier/app/components/navigation/QuickActions.vue`
- `webapp/sites/showcase-immobilier/app/components/navigation/SocialNetwork.vue`
- `webapp/sites/showcase-immobilier/app/components/panel/ActiveContent.vue`
- `webapp/sites/showcase-immobilier/app/components/panel/EditorialContent.vue`
- `webapp/sites/showcase-immobilier/app/components/panel/ThreeCols.vue`
- `webapp/sites/showcase-immobilier/app/components/paragraph/Articles.vue`
- `webapp/sites/showcase-immobilier/app/components/paragraph/Default.vue`
- `webapp/sites/showcase-immobilier/app/components/progress/Bar.vue`
- `webapp/sites/showcase-immobilier/app/components/progress/Counter.vue`
- `webapp/sites/showcase-immobilier/app/components/property/ContentZone.vue`
- `webapp/sites/showcase-immobilier/app/components/property/DetailDrawer.vue`
- `webapp/sites/showcase-immobilier/app/components/property/DetailPanel.vue`
- `webapp/sites/showcase-immobilier/app/components/property/ExceptionalCarousel.vue`
- `webapp/sites/showcase-immobilier/app/components/property/ExceptionalContact.vue`
- `webapp/sites/showcase-immobilier/app/components/property/ExceptionalDuo.vue`
- `webapp/sites/showcase-immobilier/app/components/property/ExceptionalFull.vue`
- `webapp/sites/showcase-immobilier/app/components/property/ExceptionalInfoPanel.vue`
- `webapp/sites/showcase-immobilier/app/components/property/ExceptionalLightbox.vue`
- `webapp/sites/showcase-immobilier/app/components/property/ExceptionalOverlay.vue`
- `webapp/sites/showcase-immobilier/app/components/property/ExceptionalSplit.vue`
- `webapp/sites/showcase-immobilier/app/components/property/ExceptionalSummary.vue`
- `webapp/sites/showcase-immobilier/app/components/property/ExceptionalTriptych.vue`
- `webapp/sites/showcase-immobilier/app/components/property/OverlayGridList.vue`
- `webapp/sites/showcase-immobilier/app/components/select/CategoryPropertyList.vue`
- `webapp/sites/showcase-immobilier/app/components/select/RealEstateListing.vue`
- `webapp/sites/showcase-immobilier/app/components/toggle/CinemaMode.vue`
- `webapp/sites/showcase-immobilier/app/components/toggle/ThemeMode.vue`
- `webapp/sites/showcase-immobilier/app/components/toggle/TransitionMode.vue`
- `webapp/sites/showcase-immobilier/app/components/toggle/ViewModeList.vue`
- `webapp/sites/showcase-immobilier/app/components/typewriter/Text.vue`
- `webapp/sites/showcase-immobilier/app/components/udrawer/DesignSystem.vue`
- `webapp/sites/showcase-immobilier/app/layouts/dashboard.vue`
- `webapp/sites/showcase-immobilier/app/layouts/default.vue`
- `webapp/sites/showcase-immobilier/app/pages/[...page].vue`
- `webapp/sites/showcase-immobilier/app/pages/contact.vue`
- `webapp/sites/showcase-immobilier/app/pages/dashboard/index.vue`
- `webapp/sites/showcase-immobilier/app/pages/dashboard/login.vue`
- `webapp/sites/showcase-immobilier/app/pages/echo.vue`
- `webapp/sites/showcase-immobilier/app/pages/index.vue`
- `webapp/sites/showcase-immobilier/app/pages/properties/[realEstateListing]/[accommodationCategory]/[accommodationSlug].vue`
- `webapp/sites/showcase-immobilier/app/pages/properties/[realEstateListing]/[accommodationCategory]/index.vue`
- `webapp/sites/showcase-immobilier/app/pages/properties/[realEstateListing]/index.vue`
- `webapp/sites/showcase-immobilier/app/pages/villa-des-alizes-content.vue`
- `webapp/sites/showcase-immobilier/app/pages/villa-des-alizes-mobile.vue`
- `webapp/sites/showcase-immobilier/app/pages/villa-des-alizes.vue`
- `webapp/sites/README.md`
- `webapp/base/real-estate/README.md`
- `webapp/sites/showcase-immobilier/app/README.md`
- `webapp/sites/showcase-immobilier/app/pages/README.md`
- `webapp/sites/showcase-immobilier/app/layouts/README.md`
- `webapp/sites/showcase-immobilier/app/components/README.md`
- `webapp/sites/client2-immobilier/README.md`
- `webapp/tests/layers/structure-web.vitest.ts`
- `webapp/tests/e2e/home.smoke.spec.ts`
- `webapp/tests/e2e/client2.smoke.spec.ts`
- `webapp/tests/e2e/client2-articles.spec.ts`

## Résultat et critères

Appliquer les marqueurs et exemptions confirmés aux seuls fichiers Vue listés ; attribuer des noms statiques dérivés du chemin, sans wrapper ni modification visuelle. data-section identifie les grandes zones réelles, pas chaque élément décoratif. Déplacer le main de Client 2 index dans un layout explicitement sélectionné ; préserver le NuxtLayout editorial déjà explicite des articles. Conserver le plein écran/scroll du catalogue et la composition Screens. Ne pas changer les sections script setup ni leur exception DEM-007. Documenter les conventions dans les rubriques existantes puis référencer ces règles dans les autres README, sans recopier leur définition.

Exclusions communes : secrets et .env, données utilisateur, code Cap Nour/Kazen en écriture, production, DEM-010, nouvelles conventions non arbitrées. Préserver les rubriques et l’ordre des README. Un résultat inconnu ne vaut pas réussite.

## Réalisation et preuves

Reprise du 2026-11-15, session de création conservée.

Marqueurs statiques ajoutés sur les racines éligibles ; exemptions conservées sans wrapper. Le layout editorial possède maintenant le main de la page d’accueil Client2 avec variante plain ; conventions documentées par références.

Vérifié : 3 tests SSR du layout et de la délégation du main ; builds Showcase et Client2 ; 6 tests Playwright (2 Showcase, 4 Client2, desktop/mobile) contre ces builds locaux dans l’image Playwright officielle. Types Client2, lint, formatage et conventions réussis. Sur 91 fichiers Vue modifiés, 90 sections script restent identiques ; seule la prop plain du layout editorial ajoute du script. Aucun test contre une API de production.

Recette depuis `worktree/web/webapp/` : `node node_modules/vitest/vitest.mjs run tests/layers/structure-web.vitest.ts`. Les tests navigateur nécessitent le build cible et une URL locale explicite ; les six tests exécutés sont les smokes et articles existants enrichis des assertions main/marqueurs. Relire aussi les pages villa et la variante plain du layout.

Contenu présenté : inventaire des fichiers et empreintes dans `tmp/etat-implementation-tests-conventions-nuxt.json` du principal ; base inchangée indiquée ci-dessus. Sorties détaillées locales `/tmp/dem011-*`, non durables.

## Verdict humain

Aucun verdict d’implémentation. Le cadrage confirmé n’est pas une validation du code.

## Commits

Commit local de cette tâche créé à l’implémentation selon l’autorisation du 2026-11-15 ; SHA réel dans le récapitulatif du brouillon. Aucun verdict humain déduit de ce commit. Aucun push, PR ni fusion.

Complément détecté par le nouveau contrôle OPS-035 : marqueur statique de la région de présentation ajouté au header de la page Echo. Comparaison avec HEAD : script identique ; aucun changement fonctionnel, aucun wrapper ajouté. Les erreurs AST restantes du relevé Web concernent Dashboard et ne sont pas exemptées.

Reprise du workflow le 2026-11-15 : commits techniques autorisés avant vérification humaine globale ; cette carte préparée est rattachée à sa couche, sans duplication ni transfert de code applicatif non commité. Les états et consignes antérieurs décrivent l’ancien workflow.
