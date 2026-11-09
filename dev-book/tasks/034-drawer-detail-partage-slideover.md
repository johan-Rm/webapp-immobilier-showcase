---
status: En cours
dependances: [031]
---

# 034 — Drawer de détail partagé (shell USlideover)

**Goal:** Factoriser le « chrome de drawer » dupliqué entre la fiche détail classique
([app/components/screen/PropertyDetail.vue](../../webapp/app/components/screen/PropertyDetail.vue))
et le parcours immersif
([app/components/property/ExceptionalInfoPanel.vue](../../webapp/app/components/property/ExceptionalInfoPanel.vue))
dans un composant présentationnel unique basé sur `USlideover` (Nuxt UI v4), au lieu de deux
`<aside>` + `<Teleport>`/`<Transition>` réimplémentés à la main.

## Contexte

Les deux écrans partagent le même `SCREEN_ID = 'screen-property-detail'` et jouent le même
rôle (panneau d'infos du bien), mais réimplémentent chacun leur drawer, différemment et
incomplètement :

- `PropertyDetail` : `Teleport to="body"` + `<aside>` (bottom-sheet mobile / panneau gauche
  desktop), pas de `role=dialog`, pas de focus-trap, pas de scroll-lock, pas d'ESC.
- `ExceptionalInfoPanel` : deux `<Transition>` + `<aside>` (panneau gauche sur tous les
  formats), `role/aria-modal` présents mais pas de focus-trap / ESC / scroll-lock, pas de
  `Teleport`.

Le projet a déjà un patron répété pour ce besoin
([CommandPropertySlideover.vue](../../webapp/app/components/CommandPropertySlideover.vue),
[dashboard/PropertyEditorSlideover.vue](../../webapp/app/components/dashboard/PropertyEditorSlideover.vue)) :
`USlideover` + `isMobile` (matchMedia `(max-width: 1023px)`) + `slideoverUi` qui bascule
largeur/hauteur. `USlideover` apporte nativement Teleport, focus-trap, scroll-lock, ESC,
`role=dialog`, transitions.

## Décisions

- **Base technique** : primitives Nuxt UI (`USlideover`), pas de shell maison.
- **Placement** : shell dans `app/components/`, monté **dans chaque écran** (la page
  entrypoint n'est pas touchée — frontières `pages/` orchestre, `components/` affiche).
- **UX mobile unifiée (assumée)** : le panneau du parcours immersif passe de panneau latéral
  à **bottom-sheet** sur mobile, comme le reste de l'app.
- **Hors périmètre** : les slideovers du dashboard (`CommandPropertySlideover`,
  `PropertyEditorSlideover`) ne sont pas refactorés.

## Plan

1. **Créer** `app/components/property/DetailDrawer.vue` (`<PropertyDetailDrawer>`) :
   - props : `open` (`v-model:open`), `desktopSide?: 'left' | 'right'` (défaut `left`),
     `contentClass?: string`, `ariaLabel?: string` ;
   - émet `update:open` ;
   - interne : `isMobile` (matchMedia, cleanup) + `slideoverUi` (mobile `max-h-[82dvh]` /
     desktop largeur via `contentClass`, overlay `bg-black/55`) ;
   - `#content` : conteneur `flex h-dvh min-h-0 flex-col bg-background` + bouton de fermeture +
     `<slot>`.
2. **PropertyDetail.vue** : remplacer le bloc `<Teleport>` (overlay + `<aside>` + boutons de
   fermeture + `<style scoped>`) par `<PropertyDetailDrawer>`, en conservant les deux
   déclencheurs (barre mobile + bouton desktop) et le `PropertyDetailPanel`.
3. **ExceptionalInfoPanel.vue** : remplacer les `<Transition>` + `<aside>` par le shell, en
   conservant son contenu (nom, localisation, badges, référence, CTA `request-visit`).
   `PropertyExceptional.vue` reste inchangé.

## Vérifications (point de contrôle pré-commit)

- ouverture/fermeture des deux drawers (clic overlay, bouton X, ESC) ;
- bottom-sheet mobile + panneau gauche desktop sur les deux écrans ;
- pas de déclenchement de la navigation par screens depuis l'intérieur du drawer ;
- scroll interne OK, scroll-lock du fond actif ;
- `bun run lint:check` + type-check avant commit.
