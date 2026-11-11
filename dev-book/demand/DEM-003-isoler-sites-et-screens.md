# DEM-003 — Isoler Showcase, extraire les screens et ouvrir Client 2 en SSR local

- Type : consolidation
- Session de création et de livraison : 01a1c16c-2085-7141-83fa-3460f6bd4463
- État : livraison directe demandée le 2026-11-10
- Branche : `demands/DEM-003` ; retour prévu : `develop`
- Source réunie validée : `layers/devops`, `f7d9e35db2ff7f345bf72ff908083ca5468b3198`

## Besoin et décisions

Poursuivre la migration dans ce dépôt. L’application actuelle `webapp/app/`
correspond à Showcase Immobilier ; elle doit résider dans
`webapp/sites/showcase-immobilier/app/`. Le premier lot a séparé les identités et
contenus, mais conserve encore cette application à la racine.

Extraire les 16 fichiers du catalogue `webapp/app/components/screen/` vers
`webapp/base/real-estate/components/screen/`. Conserver les noms `Screen*` et
`LazyScreen*`, les parcours existants et la priorité des surcharges clientes.

L’humain choisit de déplacer seulement les screens : leurs composants de support,
composables et stores restent dans l’application Showcase. Le catalogue reste donc
provisoirement dépendant de cette application ; Client 2 ne le charge pas. Le
`app.vue`, les pages, layouts, plugins, middlewares, styles et le dashboard actuels
suivent l’application Showcase, sauf le catalogue explicitement extrait.

Créer `webapp/sites/client2-immobilier/` comme cible indépendante, avec une page SSR
minimale « Client 2 Immobilier », sans données ni dashboard. Ne pas lui transmettre
par héritage les pages, contenus, médias ou initialisations propres à Showcase.

Servir simultanément deux builds SSR, chacune figée sur sa cible, derrière les
vhosts locaux suivants :

- `http://showcase-immobilier.localhost:8080` ;
- `http://client2-immobilier.localhost:8080` ;
- `http://webapp.localhost:8080`, alias conservé pour Showcase.

Conserver le principe une cible par build : Nginx route vers les deux serveurs,
sans sélection du client par `Host` dans une application Nuxt unique.

## Critères et cartes

- [OPS-003](../tasks/OPS-003-preparer-controles-et-routage-layers.md) : réalisation, preuves et verdict humain.
- [OPS-004](../tasks/OPS-004-composer-cibles-nuxt-et-outillage.md) : réalisation, preuves et verdict humain.
- [OPS-005](../tasks/OPS-005-servir-deux-cibles-ssr-locales.md) : réalisation, preuves et verdict humain.
- [WEB-001](../tasks/WEB-001-isoler-showcase-et-extraire-screens.md) : réalisation, preuves et verdict humain.
- [WEB-002](../tasks/WEB-002-creer-client2-immobilier-minimal.md) : réalisation, preuves et verdict humain.
- [OPS-006](../tasks/OPS-006-consolider-references-et-preuves.md) : réalisation, preuves et verdict humain.

## Vérification et livraison

Les six cartes sont validées et commitées. Verdict final : « c’est validé ».
La branche de livraison reprend directement le HEAD réuni validé, sans réécriture
ni fusion des couches. Les correspondances des commits sources et repris restent
consignées dans les cartes et leurs trailers Git. Le brouillon de cadrage est
conservé dans `tmp/demande-extraire-screens-immobiliers.md`.

Instruction explicite de livraison directe : « tu dois livrer DEM-003 sans te
procupper de DEM-001 et DEM-002 ». Une seule livraison est préparée ; le diff
cumulé vers `origin/develop` embarque nécessairement les bases historiques déjà
présentes dans cette branche. Aucune livraison distincte de ces demandes.

Preuves du résultat validé : qualité Showcase, types Client 2, 70 et 45 tests
unitaires, deux builds SSR et quatre smoke tests desktop/mobile réussis ;
`make aide-check` : 111 tests Python. Détails et limites dans les cartes.
Les contrôles de conventions historiques restent en échec : images (3),
structure Vue (41), ternaires imbriqués (3). Ils ne sont pas déclarés réussis,
ni désactivés. La livraison demandée ne permet aucun contournement des protections
GitHub. Les couches Web et Devops sont conservées avec leurs environnements locaux.

## Déclaration de consolidation

```contribution-json
{
  "version": 1,
  "corrections": [
    {
      "chemins": [
        "codebase-integrity/commun/validation-rules.ts",
        "codebase-integrity/domaines/architecture-dependances/regles.yaml",
        "codebase-integrity/domaines/architecture-dependances/scripts/verify-no-business-logic.ts",
        "codebase-integrity/domaines/architecture-dependances/scripts/verify-soc-components.ts",
        "codebase-integrity/domaines/architecture-dependances/scripts/verify-types-placement.ts",
        "codebase-integrity/domaines/architecture-dependances/tests/verify-layer-scopes.vitest.ts",
        "codebase-integrity/domaines/interface-internationalisation/scripts/verify-app-image.ts",
        "codebase-integrity/domaines/qualite-code/scripts/verify-no-redundant-guards.ts",
        "codebase-integrity/domaines/qualite-code/scripts/verify-script-setup-standard.ts",
        "codebase-integrity/domaines/qualite-code/scripts/verify-solid.ts"
      ],
      "convention": "codebase-integrity/README.md#contrôles-existants",
      "controles": [
        "codebase-integrity/domaines/architecture-dependances/tests/verify-layer-scopes.vitest.ts",
        "codebase-integrity/domaines/construction-livraison/tests/test_layer_routing.py"
      ]
    },
    {
      "chemins": [
        "webapp/app/README.md",
        "webapp/app/app.config.ts",
        "webapp/app/app.vue",
        "webapp/app/assets/README.md",
        "webapp/app/assets/fonts/inter_18pt-regular.woff2",
        "webapp/app/assets/fonts/rationale-regular.woff2",
        "webapp/app/assets/main.css",
        "webapp/app/assets/styles/markdown.css",
        "webapp/app/assets/styles/theme.css",
        "webapp/app/assets/transitions.css",
        "webapp/app/components/AppBootShell.vue",
        "webapp/app/components/AppImage.vue",
        "webapp/app/components/AppLink.vue",
        "webapp/app/components/AppOverlay.vue",
        "webapp/app/components/CommandPropertySlideover.vue",
        "webapp/app/components/ConstructionModal.vue",
        "webapp/app/components/HelloWorld.vue",
        "webapp/app/components/README.md",
        "webapp/app/components/blockquote/Default.vue",
        "webapp/app/components/blockquote/Oneline.vue",
        "webapp/app/components/card/Invest.vue",
        "webapp/app/components/card/TitleProperty.vue",
        "webapp/app/components/carousel/Panel.vue",
        "webapp/app/components/dashboard/CategoryCodeSelect.vue",
        "webapp/app/components/dashboard/OfferField.vue",
        "webapp/app/components/dashboard/PropertyAssociatedMediaEditor.vue",
        "webapp/app/components/dashboard/PropertyContentEditor.vue",
        "webapp/app/components/dashboard/PropertyCreatorPanel.vue",
        "webapp/app/components/dashboard/PropertyEditorPanel.vue",
        "webapp/app/components/dashboard/PropertyEditorSlideover.vue",
        "webapp/app/components/dashboard/PropertyFieldEditor.vue",
        "webapp/app/components/dashboard/PropertyMediaGallery.vue",
        "webapp/app/components/dashboard/PropertyMediaPickerModal.vue",
        "webapp/app/components/dashboard/PropertyPlaceEditor.vue",
        "webapp/app/components/dashboard/PropertyPreview.vue",
        "webapp/app/components/dashboard/PropertyScreenEditor.vue",
        "webapp/app/components/dashboard/PropertyScreensEditor.vue",
        "webapp/app/components/dashboard/PropertySidebar.vue",
        "webapp/app/components/dashboard/PropertyWorkspace.vue",
        "webapp/app/components/dashboard/QualitiesEditor.vue",
        "webapp/app/components/dashboard/ScreenMediaSelector.vue",
        "webapp/app/components/dashboard/ScreenTemplateSelect.vue",
        "webapp/app/components/dashboard/ScreenTemplateSkeleton.vue",
        "webapp/app/components/dashboard/SidebarFilters.vue",
        "webapp/app/components/dashboard/SidebarUserCard.vue",
        "webapp/app/components/dashboard/TiptapEditor.vue",
        "webapp/app/components/form/Contact.vue",
        "webapp/app/components/form/ContactProperty.vue",
        "webapp/app/components/gallery/Images.vue",
        "webapp/app/components/heading/h1.vue",
        "webapp/app/components/heading/h2.vue",
        "webapp/app/components/heading/h2Screen.vue",
        "webapp/app/components/heading/h3.vue",
        "webapp/app/components/heading/h4.vue",
        "webapp/app/components/heading/sizePresets.ts",
        "webapp/app/components/line/Property.vue",
        "webapp/app/components/link/HeroNav.vue",
        "webapp/app/components/logo/ShowcaseFull.vue",
        "webapp/app/components/logo/ShowcasePicto.vue",
        "webapp/app/components/logo/ShowcaseReduce.vue",
        "webapp/app/components/markdown/PanelMdc.vue",
        "webapp/app/components/mdc/Card.vue",
        "webapp/app/components/mdc/Headband.vue",
        "webapp/app/components/mdc/PageIntro.vue",
        "webapp/app/components/mdc/Youtube.vue",
        "webapp/app/components/navigation/LangSwitcher.vue",
        "webapp/app/components/navigation/Main.vue",
        "webapp/app/components/navigation/MobileActionsMenu.vue",
        "webapp/app/components/navigation/QuickActions.vue",
        "webapp/app/components/navigation/SocialNetwork.vue",
        "webapp/app/components/panel/ActiveContent.vue",
        "webapp/app/components/panel/EditorialContent.vue",
        "webapp/app/components/panel/ThreeCols.vue",
        "webapp/app/components/paragraph/Articles.vue",
        "webapp/app/components/paragraph/Default.vue",
        "webapp/app/components/progress/Bar.vue",
        "webapp/app/components/progress/Counter.vue",
        "webapp/app/components/property/ContentZone.vue",
        "webapp/app/components/property/DetailDrawer.vue",
        "webapp/app/components/property/DetailPanel.vue",
        "webapp/app/components/property/ExceptionalCarousel.vue",
        "webapp/app/components/property/ExceptionalContact.vue",
        "webapp/app/components/property/ExceptionalDuo.vue",
        "webapp/app/components/property/ExceptionalFull.vue",
        "webapp/app/components/property/ExceptionalInfoPanel.vue",
        "webapp/app/components/property/ExceptionalLightbox.vue",
        "webapp/app/components/property/ExceptionalOverlay.vue",
        "webapp/app/components/property/ExceptionalSplit.vue",
        "webapp/app/components/property/ExceptionalSummary.vue",
        "webapp/app/components/property/ExceptionalTriptych.vue",
        "webapp/app/components/property/OverlayGridList.vue",
        "webapp/app/components/property/exceptional.helpers.ts",
        "webapp/app/components/screen/Blockquote.vue",
        "webapp/app/components/screen/Contact.vue",
        "webapp/app/components/screen/EssaouiraTheJewel.vue",
        "webapp/app/components/screen/Footer.vue",
        "webapp/app/components/screen/Footer2.vue",
        "webapp/app/components/screen/Investing.vue",
        "webapp/app/components/screen/PanelMDC.vue",
        "webapp/app/components/screen/PanelScrollDualSynced.vue",
        "webapp/app/components/screen/PropertyDetail.vue",
        "webapp/app/components/screen/PropertyExceptional.vue",
        "webapp/app/components/screen/PropertyList.vue",
        "webapp/app/components/screen/WhyChooseShowcase.vue",
        "webapp/app/components/screen/real-estate/FullImage.vue",
        "webapp/app/components/screen/real-estate/Rounded.vue",
        "webapp/app/components/screen/real-estate/Split.vue",
        "webapp/app/components/screen/real-estate/ThreeColProperties.vue",
        "webapp/app/components/select/CategoryPropertyList.vue",
        "webapp/app/components/select/RealEstateListing.vue",
        "webapp/app/components/toggle/CinemaMode.vue",
        "webapp/app/components/toggle/ThemeMode.vue",
        "webapp/app/components/toggle/TransitionMode.vue",
        "webapp/app/components/toggle/ViewModeList.vue",
        "webapp/app/components/typewriter/Text.vue",
        "webapp/app/components/udrawer/DesignSystem.vue",
        "webapp/app/composables/README.md",
        "webapp/app/composables/dashboard/useDashboardAccommodations.ts",
        "webapp/app/composables/dashboard/useDashboardPlaceText.ts",
        "webapp/app/composables/dashboard/useDashboardSave.ts",
        "webapp/app/composables/dashboard/useDesignationPlaceholder.ts",
        "webapp/app/composables/dashboard/useDesignationPlaceholder.vitest.ts",
        "webapp/app/composables/dashboard/useSymfonyStatus.ts",
        "webapp/app/composables/useAccommodation.ts",
        "webapp/app/composables/useApp.ts",
        "webapp/app/composables/useAppFooter.ts",
        "webapp/app/composables/useAppImage.ts",
        "webapp/app/composables/useAppNavigation.ts",
        "webapp/app/composables/useAppPending.ts",
        "webapp/app/composables/useConstructionModal.ts",
        "webapp/app/composables/useContactForm.ts",
        "webapp/app/composables/useContentVersion.ts",
        "webapp/app/composables/useDashboard.ts",
        "webapp/app/composables/useDeferredRuntime.ts",
        "webapp/app/composables/useDeferredScreenVisuals.ts",
        "webapp/app/composables/useDesignSystem.ts",
        "webapp/app/composables/useDeviceDetect.ts",
        "webapp/app/composables/useEcho.ts",
        "webapp/app/composables/useExceptionalRail.ts",
        "webapp/app/composables/useGalleryItems.ts",
        "webapp/app/composables/useHeroBackgroundVideo.ts",
        "webapp/app/composables/useImageWarmup.ts",
        "webapp/app/composables/useLang.ts",
        "webapp/app/composables/useLogger.ts",
        "webapp/app/composables/useLongPress.ts",
        "webapp/app/composables/useLongPress.vitest.ts",
        "webapp/app/composables/useMetadata.ts",
        "webapp/app/composables/useNuxtServerInit.ts",
        "webapp/app/composables/usePageSeo.ts",
        "webapp/app/composables/useProjectLocales.ts",
        "webapp/app/composables/usePropertyDetailPanelData.ts",
        "webapp/app/composables/usePropertyListOptions.ts",
        "webapp/app/composables/useQuickActionWarmup.ts",
        "webapp/app/composables/useScreenSystem.ts",
        "webapp/app/composables/useTransitions.ts",
        "webapp/app/composables/useTypewriter.ts",
        "webapp/app/composables/useWebPage.ts",
        "webapp/app/error.vue",
        "webapp/app/layouts/README.md",
        "webapp/app/layouts/dashboard.vue",
        "webapp/app/layouts/default.vue",
        "webapp/app/middleware/README.md",
        "webapp/app/middleware/auth.ts",
        "webapp/app/middleware/construction-lock.global.ts",
        "webapp/app/middleware/locale.global.ts",
        "webapp/app/pages/README.md",
        "webapp/app/pages/[...page].vue",
        "webapp/app/pages/contact.vue",
        "webapp/app/pages/dashboard/index.vue",
        "webapp/app/pages/dashboard/login.vue",
        "webapp/app/pages/echo.vue",
        "webapp/app/pages/index.vue",
        "webapp/app/pages/properties/[realEstateListing]/[accommodationCategory]/[accommodationSlug].vue",
        "webapp/app/pages/properties/[realEstateListing]/[accommodationCategory]/index.vue",
        "webapp/app/pages/properties/[realEstateListing]/index.vue",
        "webapp/app/plugins/README.md",
        "webapp/app/plugins/deferred-runtime.client.ts",
        "webapp/app/plugins/project-locales.ts",
        "webapp/app/router.options.ts",
        "webapp/app/stores/README.md",
        "webapp/app/stores/accommodation.ts",
        "webapp/app/stores/echo.ts",
        "webapp/app/stores/metadata.ts",
        "webapp/app/stores/webPage.ts",
        "webapp/app/utils/README.md",
        "webapp/app/utils/assets.ts",
        "webapp/app/utils/loadContentResource.ts",
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
        "webapp/base/real-estate/nuxt.config.ts",
        "webapp/sites/README.md",
        "webapp/sites/showcase-immobilier/README.md",
        "webapp/sites/showcase-immobilier/app/README.md",
        "webapp/sites/showcase-immobilier/app/app.config.ts",
        "webapp/sites/showcase-immobilier/app/app.vue",
        "webapp/sites/showcase-immobilier/app/assets/README.md",
        "webapp/sites/showcase-immobilier/app/assets/fonts/inter_18pt-regular.woff2",
        "webapp/sites/showcase-immobilier/app/assets/fonts/rationale-regular.woff2",
        "webapp/sites/showcase-immobilier/app/assets/main.css",
        "webapp/sites/showcase-immobilier/app/assets/styles/markdown.css",
        "webapp/sites/showcase-immobilier/app/assets/styles/theme.css",
        "webapp/sites/showcase-immobilier/app/assets/transitions.css",
        "webapp/sites/showcase-immobilier/app/components/AppBootShell.vue",
        "webapp/sites/showcase-immobilier/app/components/AppImage.vue",
        "webapp/sites/showcase-immobilier/app/components/AppLink.vue",
        "webapp/sites/showcase-immobilier/app/components/AppOverlay.vue",
        "webapp/sites/showcase-immobilier/app/components/CommandPropertySlideover.vue",
        "webapp/sites/showcase-immobilier/app/components/ConstructionModal.vue",
        "webapp/sites/showcase-immobilier/app/components/HelloWorld.vue",
        "webapp/sites/showcase-immobilier/app/components/README.md",
        "webapp/sites/showcase-immobilier/app/components/blockquote/Default.vue",
        "webapp/sites/showcase-immobilier/app/components/blockquote/Oneline.vue",
        "webapp/sites/showcase-immobilier/app/components/card/Invest.vue",
        "webapp/sites/showcase-immobilier/app/components/card/TitleProperty.vue",
        "webapp/sites/showcase-immobilier/app/components/carousel/Panel.vue",
        "webapp/sites/showcase-immobilier/app/components/dashboard/CategoryCodeSelect.vue",
        "webapp/sites/showcase-immobilier/app/components/dashboard/OfferField.vue",
        "webapp/sites/showcase-immobilier/app/components/dashboard/PropertyAssociatedMediaEditor.vue",
        "webapp/sites/showcase-immobilier/app/components/dashboard/PropertyContentEditor.vue",
        "webapp/sites/showcase-immobilier/app/components/dashboard/PropertyCreatorPanel.vue",
        "webapp/sites/showcase-immobilier/app/components/dashboard/PropertyEditorPanel.vue",
        "webapp/sites/showcase-immobilier/app/components/dashboard/PropertyEditorSlideover.vue",
        "webapp/sites/showcase-immobilier/app/components/dashboard/PropertyFieldEditor.vue",
        "webapp/sites/showcase-immobilier/app/components/dashboard/PropertyMediaGallery.vue",
        "webapp/sites/showcase-immobilier/app/components/dashboard/PropertyMediaPickerModal.vue",
        "webapp/sites/showcase-immobilier/app/components/dashboard/PropertyPlaceEditor.vue",
        "webapp/sites/showcase-immobilier/app/components/dashboard/PropertyPreview.vue",
        "webapp/sites/showcase-immobilier/app/components/dashboard/PropertyScreenEditor.vue",
        "webapp/sites/showcase-immobilier/app/components/dashboard/PropertyScreensEditor.vue",
        "webapp/sites/showcase-immobilier/app/components/dashboard/PropertySidebar.vue",
        "webapp/sites/showcase-immobilier/app/components/dashboard/PropertyWorkspace.vue",
        "webapp/sites/showcase-immobilier/app/components/dashboard/QualitiesEditor.vue",
        "webapp/sites/showcase-immobilier/app/components/dashboard/ScreenMediaSelector.vue",
        "webapp/sites/showcase-immobilier/app/components/dashboard/ScreenTemplateSelect.vue",
        "webapp/sites/showcase-immobilier/app/components/dashboard/ScreenTemplateSkeleton.vue",
        "webapp/sites/showcase-immobilier/app/components/dashboard/SidebarFilters.vue",
        "webapp/sites/showcase-immobilier/app/components/dashboard/SidebarUserCard.vue",
        "webapp/sites/showcase-immobilier/app/components/dashboard/TiptapEditor.vue",
        "webapp/sites/showcase-immobilier/app/components/form/Contact.vue",
        "webapp/sites/showcase-immobilier/app/components/form/ContactProperty.vue",
        "webapp/sites/showcase-immobilier/app/components/gallery/Images.vue",
        "webapp/sites/showcase-immobilier/app/components/heading/h1.vue",
        "webapp/sites/showcase-immobilier/app/components/heading/h2.vue",
        "webapp/sites/showcase-immobilier/app/components/heading/h2Screen.vue",
        "webapp/sites/showcase-immobilier/app/components/heading/h3.vue",
        "webapp/sites/showcase-immobilier/app/components/heading/h4.vue",
        "webapp/sites/showcase-immobilier/app/components/heading/sizePresets.ts",
        "webapp/sites/showcase-immobilier/app/components/line/Property.vue",
        "webapp/sites/showcase-immobilier/app/components/link/HeroNav.vue",
        "webapp/sites/showcase-immobilier/app/components/logo/ShowcaseFull.vue",
        "webapp/sites/showcase-immobilier/app/components/logo/ShowcasePicto.vue",
        "webapp/sites/showcase-immobilier/app/components/logo/ShowcaseReduce.vue",
        "webapp/sites/showcase-immobilier/app/components/markdown/PanelMdc.vue",
        "webapp/sites/showcase-immobilier/app/components/mdc/Card.vue",
        "webapp/sites/showcase-immobilier/app/components/mdc/Headband.vue",
        "webapp/sites/showcase-immobilier/app/components/mdc/PageIntro.vue",
        "webapp/sites/showcase-immobilier/app/components/mdc/Youtube.vue",
        "webapp/sites/showcase-immobilier/app/components/navigation/LangSwitcher.vue",
        "webapp/sites/showcase-immobilier/app/components/navigation/Main.vue",
        "webapp/sites/showcase-immobilier/app/components/navigation/MobileActionsMenu.vue",
        "webapp/sites/showcase-immobilier/app/components/navigation/QuickActions.vue",
        "webapp/sites/showcase-immobilier/app/components/navigation/SocialNetwork.vue",
        "webapp/sites/showcase-immobilier/app/components/panel/ActiveContent.vue",
        "webapp/sites/showcase-immobilier/app/components/panel/EditorialContent.vue",
        "webapp/sites/showcase-immobilier/app/components/panel/ThreeCols.vue",
        "webapp/sites/showcase-immobilier/app/components/paragraph/Articles.vue",
        "webapp/sites/showcase-immobilier/app/components/paragraph/Default.vue",
        "webapp/sites/showcase-immobilier/app/components/progress/Bar.vue",
        "webapp/sites/showcase-immobilier/app/components/progress/Counter.vue",
        "webapp/sites/showcase-immobilier/app/components/property/ContentZone.vue",
        "webapp/sites/showcase-immobilier/app/components/property/DetailDrawer.vue",
        "webapp/sites/showcase-immobilier/app/components/property/DetailPanel.vue",
        "webapp/sites/showcase-immobilier/app/components/property/ExceptionalCarousel.vue",
        "webapp/sites/showcase-immobilier/app/components/property/ExceptionalContact.vue",
        "webapp/sites/showcase-immobilier/app/components/property/ExceptionalDuo.vue",
        "webapp/sites/showcase-immobilier/app/components/property/ExceptionalFull.vue",
        "webapp/sites/showcase-immobilier/app/components/property/ExceptionalInfoPanel.vue",
        "webapp/sites/showcase-immobilier/app/components/property/ExceptionalLightbox.vue",
        "webapp/sites/showcase-immobilier/app/components/property/ExceptionalOverlay.vue",
        "webapp/sites/showcase-immobilier/app/components/property/ExceptionalSplit.vue",
        "webapp/sites/showcase-immobilier/app/components/property/ExceptionalSummary.vue",
        "webapp/sites/showcase-immobilier/app/components/property/ExceptionalTriptych.vue",
        "webapp/sites/showcase-immobilier/app/components/property/OverlayGridList.vue",
        "webapp/sites/showcase-immobilier/app/components/property/exceptional.helpers.ts",
        "webapp/sites/showcase-immobilier/app/components/select/CategoryPropertyList.vue",
        "webapp/sites/showcase-immobilier/app/components/select/RealEstateListing.vue",
        "webapp/sites/showcase-immobilier/app/components/toggle/CinemaMode.vue",
        "webapp/sites/showcase-immobilier/app/components/toggle/ThemeMode.vue",
        "webapp/sites/showcase-immobilier/app/components/toggle/TransitionMode.vue",
        "webapp/sites/showcase-immobilier/app/components/toggle/ViewModeList.vue",
        "webapp/sites/showcase-immobilier/app/components/typewriter/Text.vue",
        "webapp/sites/showcase-immobilier/app/components/udrawer/DesignSystem.vue",
        "webapp/sites/showcase-immobilier/app/composables/README.md",
        "webapp/sites/showcase-immobilier/app/composables/dashboard/useDashboardAccommodations.ts",
        "webapp/sites/showcase-immobilier/app/composables/dashboard/useDashboardPlaceText.ts",
        "webapp/sites/showcase-immobilier/app/composables/dashboard/useDashboardSave.ts",
        "webapp/sites/showcase-immobilier/app/composables/dashboard/useDesignationPlaceholder.ts",
        "webapp/sites/showcase-immobilier/app/composables/dashboard/useDesignationPlaceholder.vitest.ts",
        "webapp/sites/showcase-immobilier/app/composables/dashboard/useSymfonyStatus.ts",
        "webapp/sites/showcase-immobilier/app/composables/useAccommodation.ts",
        "webapp/sites/showcase-immobilier/app/composables/useApp.ts",
        "webapp/sites/showcase-immobilier/app/composables/useAppFooter.ts",
        "webapp/sites/showcase-immobilier/app/composables/useAppImage.ts",
        "webapp/sites/showcase-immobilier/app/composables/useAppNavigation.ts",
        "webapp/sites/showcase-immobilier/app/composables/useAppPending.ts",
        "webapp/sites/showcase-immobilier/app/composables/useConstructionModal.ts",
        "webapp/sites/showcase-immobilier/app/composables/useContactForm.ts",
        "webapp/sites/showcase-immobilier/app/composables/useContentVersion.ts",
        "webapp/sites/showcase-immobilier/app/composables/useDashboard.ts",
        "webapp/sites/showcase-immobilier/app/composables/useDeferredRuntime.ts",
        "webapp/sites/showcase-immobilier/app/composables/useDeferredScreenVisuals.ts",
        "webapp/sites/showcase-immobilier/app/composables/useDesignSystem.ts",
        "webapp/sites/showcase-immobilier/app/composables/useDeviceDetect.ts",
        "webapp/sites/showcase-immobilier/app/composables/useEcho.ts",
        "webapp/sites/showcase-immobilier/app/composables/useExceptionalRail.ts",
        "webapp/sites/showcase-immobilier/app/composables/useGalleryItems.ts",
        "webapp/sites/showcase-immobilier/app/composables/useHeroBackgroundVideo.ts",
        "webapp/sites/showcase-immobilier/app/composables/useImageWarmup.ts",
        "webapp/sites/showcase-immobilier/app/composables/useLang.ts",
        "webapp/sites/showcase-immobilier/app/composables/useLogger.ts",
        "webapp/sites/showcase-immobilier/app/composables/useLongPress.ts",
        "webapp/sites/showcase-immobilier/app/composables/useLongPress.vitest.ts",
        "webapp/sites/showcase-immobilier/app/composables/useMetadata.ts",
        "webapp/sites/showcase-immobilier/app/composables/useNuxtServerInit.ts",
        "webapp/sites/showcase-immobilier/app/composables/usePageSeo.ts",
        "webapp/sites/showcase-immobilier/app/composables/useProjectLocales.ts",
        "webapp/sites/showcase-immobilier/app/composables/usePropertyDetailPanelData.ts",
        "webapp/sites/showcase-immobilier/app/composables/usePropertyListOptions.ts",
        "webapp/sites/showcase-immobilier/app/composables/useQuickActionWarmup.ts",
        "webapp/sites/showcase-immobilier/app/composables/useScreenSystem.ts",
        "webapp/sites/showcase-immobilier/app/composables/useTransitions.ts",
        "webapp/sites/showcase-immobilier/app/composables/useTypewriter.ts",
        "webapp/sites/showcase-immobilier/app/composables/useWebPage.ts",
        "webapp/sites/showcase-immobilier/app/error.vue",
        "webapp/sites/showcase-immobilier/app/layouts/README.md",
        "webapp/sites/showcase-immobilier/app/layouts/dashboard.vue",
        "webapp/sites/showcase-immobilier/app/layouts/default.vue",
        "webapp/sites/showcase-immobilier/app/middleware/README.md",
        "webapp/sites/showcase-immobilier/app/middleware/auth.ts",
        "webapp/sites/showcase-immobilier/app/middleware/construction-lock.global.ts",
        "webapp/sites/showcase-immobilier/app/middleware/locale.global.ts",
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
        "webapp/sites/showcase-immobilier/app/plugins/README.md",
        "webapp/sites/showcase-immobilier/app/plugins/deferred-runtime.client.ts",
        "webapp/sites/showcase-immobilier/app/plugins/project-locales.ts",
        "webapp/sites/showcase-immobilier/app/router.options.ts",
        "webapp/sites/showcase-immobilier/app/stores/README.md",
        "webapp/sites/showcase-immobilier/app/stores/accommodation.ts",
        "webapp/sites/showcase-immobilier/app/stores/echo.ts",
        "webapp/sites/showcase-immobilier/app/stores/metadata.ts",
        "webapp/sites/showcase-immobilier/app/stores/webPage.ts",
        "webapp/sites/showcase-immobilier/app/utils/README.md",
        "webapp/sites/showcase-immobilier/app/utils/assets.ts",
        "webapp/sites/showcase-immobilier/app/utils/loadContentResource.ts",
        "webapp/sites/showcase-immobilier/nuxt.config.ts",
        "webapp/tests/layers/showcase-components.vitest.ts"
      ],
      "convention": "webapp/sites/README.md#conventions-techniques",
      "controles": [
        "webapp/tests/layers/showcase-components.vitest.ts"
      ]
    },
    {
      "chemins": [
        "webapp/sites/client2-immobilier/README.md",
        "webapp/sites/client2-immobilier/app/app.vue",
        "webapp/sites/client2-immobilier/app/pages/index.vue",
        "webapp/sites/client2-immobilier/i18n/locales/fr.json",
        "webapp/sites/client2-immobilier/nuxt.config.ts",
        "webapp/sites/client2-immobilier/server/.gitkeep",
        "webapp/sites/client2-immobilier/site.ts",
        "webapp/tests/e2e/client2.smoke.spec.ts",
        "webapp/tests/layers/client2.vitest.ts"
      ],
      "convention": "webapp/sites/README.md#conventions-techniques",
      "controles": [
        "webapp/tests/layers/client2.vitest.ts",
        "webapp/tests/e2e/client2.smoke.spec.ts"
      ]
    },
    {
      "chemins": [
        ".github/workflows/quality.yml",
        "sonar-project.properties",
        "webapp/base/README.md",
        "webapp/base/nuxt.config.ts",
        "webapp/eslint.config.ts",
        "webapp/nuxt.config.ts",
        "webapp/playwright.config.ts",
        "webapp/scripts/build/site-targets.vitest.ts",
        "webapp/scripts/build/site.ts",
        "webapp/scripts/check-feature-001.sh",
        "webapp/tailwind.config.ts",
        "webapp/tsconfig.json",
        "webapp/vitest.config.ts"
      ],
      "convention": "webapp/base/README.md#conventions-techniques",
      "controles": [
        "webapp/scripts/build/site-targets.vitest.ts"
      ]
    },
    {
      "chemins": [
        "infra/docker/Dockerfile",
        "infra/docker/docker-compose.dev.yml",
        "infra/make/Makefile.dev",
        "infra/nginx/vhost.conf",
        "infra/scripts/check-local-ssr.py",
        "infra/tests/test_local_ssr.py",
        "webapp/.env.example"
      ],
      "convention": "codebase-integrity/README.md#worktrees-et-environnements",
      "controles": [
        "infra/tests/test_local_ssr.py",
        "infra/scripts/check-local-ssr.py"
      ]
    },
    {
      "chemins": [
        "README.md",
        "codebase-integrity/conventions.json",
        "codebase-integrity/domaines/construction-livraison/tests/test_layer_routing.py",
        "codebase-integrity/domaines/fiabilite-verifications/tests/test_frontend_paths.py",
        "docs/1.getting-started/setup-local.md",
        "docs/2.architecture/11.stores-standard.md",
        "docs/2.architecture/13.routing-and-middleware.md",
        "docs/2.architecture/14.site-layers.md",
        "docs/2.architecture/3.page-layout-screen-model.md",
        "docs/2.architecture/5.responsibility-boundaries.md",
        "docs/2.architecture/6.script-setup-standard.md",
        "docs/2.architecture/7.auto-imports-and-aliases.md",
        "docs/2.architecture/8.composables-standard.md",
        "docs/3.application/ci-conventions-validation.md",
        "docs/4.design-system/1.tailwind-et-tokens.md",
        "docs/4.design-system/2.themes-et-palettes.md",
        "docs/4.design-system/3.color-mode.md",
        "infra/config/layers.json",
        "worktree/README.md"
      ],
      "convention": "codebase-integrity/README.md#classement-des-conventions",
      "controles": [
        "codebase-integrity/domaines/fiabilite-verifications/tests/test_frontend_paths.py",
        "codebase-integrity/domaines/construction-livraison/tests/test_layer_routing.py"
      ]
    },
    {
      "chemins": [
        ".github/workflows/ai-development-engineering.yml",
        "AGENTS.md",
        "codebase-integrity/README.md",
        "codebase-integrity/domaines/construction-livraison/scripts/contribution.py",
        "codebase-integrity/domaines/construction-livraison/tests/test_contributions.py"
      ],
      "convention": "codebase-integrity/README.md#contributions",
      "controles": [
        "codebase-integrity/domaines/construction-livraison/tests/test_contributions.py"
      ]
    }
  ],
  "accompagnements": [],
  "sans_correction": ""
}
```

## Suppression autorisée de l’amorçage CI

Le 2026-11-11, l’utilisateur demande la suppression de la variable d’amorçage,
puis autorise explicitement la suppression de l’étape CI de contrôle de
contribution : « oui j’autorise ». Cette décision remplace l’adaptation bornée
précédemment préparée ; celle-ci est abandonnée sans publication.

La variable et l’étape CI qui en dépend sont retirées. Il n’y a aucune variable
GitHub distante à supprimer (liste vérifiée vide). Les tests des vérificateurs,
les contrôles documentaires et les contrôles applicatifs restent exécutés.
Le contrôle local de contribution reste disponible, sans lecture de variable
d’environnement ; son amorçage historique exige toujours un SHA explicitement
fourni en argument CLI. Le contrôle de contribution n’est plus exécuté en CI :
cette divergence avec la référence AIDE est expressément autorisée et marquée ici.

La référence du cadre reste `/home/johan/www/lab/ai-development-engineering/` ;
Nuxt Builder est la référence des layers. AGENTS consigne cette distinction et
l’exigence de validation et de traçabilité des divergences.
Correction : [OPS-007](../tasks/OPS-007-borner-amorcage-livraison.md).
