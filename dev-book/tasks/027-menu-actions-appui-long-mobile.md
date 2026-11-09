# Spec — Menu d'actions par appui long (mobile)

> **Statut : implémenté.** Document de design (brainstorming) ci-dessous, conservé comme
> référence. Livré conformément à la section « Fichiers touchés » :
> `app/composables/useLongPress.ts`, `app/components/navigation/MobileActionsMenu.vue`,
> montage dans `app/layouts/default.vue`. Test unitaire node du helper pur
> `exceedsMoveThreshold` (`useLongPress.vitest.ts`) ; les tests de geste/timer et de
> composant nécessitent un environnement DOM (happy-dom + @vue/test-utils) absent du projet.

## Problème

Le dashboard expose 3 actions via raccourcis clavier dans [useDashboard.ts](../../webapp/app/composables/useDashboard.ts) :

- `meta+q` → panneau `designControls`
- `ctrl+s` → slideover de recherche de biens
- `ctrl+d` → navigation vers `/dashboard`

Sur mobile, sans clavier physique, ces actions sont **inaccessibles**. Un admin connecté qui navigue le site public depuis un téléphone ou une tablette ne peut pas les déclencher.

## Objectif

Offrir un **appui long (long-press) n'importe où** sur les pages du site public qui ouvre un **petit context menu** ancré sous le doigt, proposant les 3 actions. Réservé aux **utilisateurs connectés**, sur **appareils tactiles** (mobile + tablette), hors dashboard.

## Décisions actées (brainstorming)

| Sujet              | Décision                                                                                                              |
| ------------------ | --------------------------------------------------------------------------------------------------------------------- |
| Déclencheur        | Appui long **n'importe où** sur la page                                                                               |
| Rendu              | Petit context menu ancré aux coordonnées du doigt                                                                     |
| Actions            | Les 3 : Rechercher un bien, Tableau de bord, Contrôles de design                                                      |
| Périmètre          | Site public (layout `default`), **connecté**, appareils **tactiles** (phone + tablette)                               |
| Approche technique | Détection custom (timer tactile) + `UDropdownMenu` ancré sur un trigger invisible                                     |
| Libellés           | **Français en dur** (cohérent avec la famille admin `PropertySidebar` / `CommandPropertySlideover`, pas de clés i18n) |
| Champs de saisie   | Long-press démarrant sur `input/textarea/[contenteditable]/select` → **ignoré** (préserve l'édition)                  |
| Liens / cartes     | Non épargnés : un long-press dessus ouvre **notre** menu (choix « n'importe où » assumé)                              |

## Pourquoi détecter le geste nous-mêmes

L'event natif `contextmenu` au long-press est **peu fiable sur iOS Safari** (callout/sélection natifs à la place). On détecte donc le long-press via un **timer tactile** (`touchstart` + délai, annulé au mouvement), puis on ouvre un `UDropdownMenu` Nuxt UI ancré sur un élément invisible positionné aux coordonnées du doigt. On réutilise ainsi le style, la fermeture au clic extérieur, le focus et le clavier du composant Nuxt UI, tout en gardant un déclenchement cross-platform.

## Architecture

### Unité 1 — `app/composables/useLongPress.ts` (détecteur de geste)

Composable client-only, sans dépendance au menu ni au dashboard, testable isolément.

**Contrat :**

```ts
interface UseLongPressOptions {
  enabled: Ref<boolean> // n'attache les listeners que si true
  delay?: number // défaut 500 ms
  moveThreshold?: number // défaut 10 px — au-delà = scroll → annulation
  ignoreSelector?: string // ex. 'input, textarea, [contenteditable], select'
  onLongPress: (point: { x: number; y: number }) => void
}

function useLongPress(options: UseLongPressOptions): void
```

**Comportement :**

- attache `touchstart/touchmove/touchend/touchcancel` sur `document`, **uniquement** quand `enabled` est vrai (watch + cleanup) ;
- `touchstart` mono-touch dont la cible ne matche pas `ignoreSelector` → mémorise le point + démarre le timer ;
- `touchmove` au-delà de `moveThreshold`, ou `touchend/cancel` avant l'échéance, ou `touches.length > 1` → annule ;
- échéance atteinte → `onLongPress({ x, y })`, puis neutralise le `contextmenu` natif suivant (`preventDefault`) et le `click` synthétique ;
- SSR-safe : liaison en `onMounted`, libération en `onUnmounted` / au passage `enabled=false`.

### Unité 2 — `app/components/navigation/MobileActionsMenu.vue` (le menu)

Monté dans le layout, auto-gating, client-only.

- Composables : `useUserSession().loggedIn`, `useDeviceDetect()` (`isPhoneDevice` / `isTabletDevice`), `useDashboard()` (`openCommandProperty`, `toggleSidePanel`), `useLocalePath()`, `useLongPress()`.
- `isActive = computed(() => loggedIn.value && (isPhoneDevice.value || isTabletDevice.value))` → passé en `enabled`.
- État : `open = ref(false)`, `anchor = reactive({ x: 0, y: 0 })`.
- Au long-press : clampe `(x, y)` au viewport, met à jour `anchor`, `open = true`.
- **Ancrage** : un `<div>` invisible `position: fixed; left/top = anchor` sert de **trigger** au `UDropdownMenu` (`v-model:open`). Le flottant s'ancre dessus → le menu apparaît sous le doigt.
- Fermeture : sélection d'item (auto), tap extérieur (auto), **changement de route** (`watch route`), **scroll**.

**Items (thème dashboard `#212121` / olive `#6B7A4A`, libellés FR en dur) :**

| Libellé             | Icône                       | Action                                 |
| ------------------- | --------------------------- | -------------------------------------- |
| Rechercher un bien  | `i-lucide-search`           | `openCommandProperty()`                |
| Tableau de bord     | `i-lucide-layout-dashboard` | `navigateTo(localePath('/dashboard'))` |
| Contrôles de design | `i-lucide-sliders`          | `toggleSidePanel('designControls')`    |

### Montage — `app/layouts/default.vue`

Ajouter `<LazyNavigationMobileActionsMenu />` au même niveau que `<LazyCommandPropertySlideover />`. Le composant s'auto-désactive si non connecté ou non tactile.

## Flux de données

```
default.vue
  └─ <LazyNavigationMobileActionsMenu />   (auto-gating, client)
       ├─ useLongPress(enabled = isActive)  ──long-press(x,y)──▶ anchor + open=true
       └─ UDropdownMenu (ancré sur trigger invisible @ anchor)
            └─ item.onSelect ─▶ useDashboard / navigateTo
```

## Mitigation des conflits (le point dur du « n'importe où »)

| Risque                              | Mitigation                                                      |
| ----------------------------------- | --------------------------------------------------------------- |
| Scroll confondu avec long-press     | annulation si `touchmove` > seuil                               |
| Pinch / zoom                        | ignoré si `touches.length > 1`                                  |
| Édition / sélection dans un champ   | long-press sur `input/textarea/[contenteditable]/select` ignoré |
| Menu contextuel natif (image, lien) | `preventDefault` du `contextmenu` suivant le déclenchement      |
| Clic fantôme après le geste         | neutralisation du `click` synthétique                           |
| Menu hors écran                     | coordonnées **clampées** au viewport                            |

## Points transverses

- **SSR-safety** : composant `Lazy`, listeners en `onMounted` ; `useDeviceDetect` a un `ssrWidth`, `loggedIn` est un `useState`. Aucun accès `window` au SSR.
- **Accessibilité** : un geste caché n'a pas d'affordance et n'est pas utilisable hors tactile — commodité **admin** assumée et documentée. Une fois ouvert, `UDropdownMenu` fournit focus / clavier / aria.
- **i18n** : libellés FR en dur, cohérents avec la famille admin (pas de catalogue de messages dans ce projet).
- **Sécurité** : aucune donnée sensible exposée ; les actions sont déjà accessibles au même utilisateur via raccourcis.

## Tests

- Unitaire `useLongPress` (vitest + fake timers, cf. task 016) : déclenchement après délai, annulation au mouvement, annulation multi-touch, respect de `ignoreSelector`.
- Composant `MobileActionsMenu` : `isActive` selon connecté/tactile ; chaque item appelle la bonne action de `useDashboard`.

## Fichiers touchés

| Action   | Fichier                                           |
| -------- | ------------------------------------------------- |
| Créer    | `app/composables/useLongPress.ts`                 |
| Créer    | `app/components/navigation/MobileActionsMenu.vue` |
| Modifier | `app/layouts/default.vue` (montage)               |

## Hors périmètre

- Affordance visible / onboarding du geste (non demandé).
- Activation dans le dashboard (le sidebar y couvre déjà les actions).
- Internationalisation des libellés (famille admin en FR).
