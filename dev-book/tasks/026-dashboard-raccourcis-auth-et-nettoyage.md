# Raccourcis dashboard — gating auth, nettoyage et recherche en slideover

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Réserver les raccourcis `meta+q` (panneau designControls) et `ctrl+s` (command property) aux utilisateurs connectés, conserver `ctrl+d` inchangé, supprimer les raccourcis `ctrl+m` (panneau mainMenu), `meta+k` et `escape` (command palette), puis supprimer la mécanique « command palette » devenue morte (composant + état + actions).

**Constat (vérifié) :** `CommandPaletteModal.vue` n'est monté dans aucun layout ni page — il n'est déjà jamais rendu. Son unique déclencheur clavier était `meta+k`. En retirant `meta+k` et `escape`, l'état `isCommandPaletteOpen` et les actions `open/close/toggleCommandPalette` n'ont plus aucun consommateur : c'est du code mort qu'on retire dans le même périmètre puisqu'il ne meurt **qu'à cause** de cette task.

**Refonte de la recherche de biens (`ctrl+s`) :** la modale centrée actuelle (`UModal` + `UCommandPalette`) est remplacée par un **slideover latéral droit** au look du sidebar dashboard ([PropertySidebar.vue](../../webapp/app/components/dashboard/PropertySidebar.vue)) : fond `#212121`, liseré olive `#6B7A4A`, champ de recherche, liste `identifier` + titre. Contenu volontairement réduit à **recherche texte + liste** (pas de filtres type/catégorie). Mécanisme : `USlideover` en overlay (côté `right` desktop, `bottom` mobile), fermable Escape / clic extérieur. La navigation vers la fiche du bien est conservée.

**Comportement attendu hors connexion :** `meta+q` et `ctrl+s` sont **silencieusement inactifs** quand l'utilisateur n'est pas connecté. Le garde est un **no-op** (`return`) : il ne déclenche **aucune navigation** et **n'ouvre jamais la page de connexion**. Le raccourci ne fait simplement rien.

**Architecture:** Tous les raccourcis sont déclarés dans le bloc `defineShortcuts` (client-only) de `_useDashboard` ([app/composables/useDashboard.ts:105-145](../../webapp/app/composables/useDashboard.ts#L105-L145)). L'état de connexion est fourni par `useUserSession().loggedIn` (nuxt-auth-utils), déjà utilisé dans [app/middleware/auth.ts](../../webapp/app/middleware/auth.ts) et [app/composables/useApp.ts:50](../../webapp/app/composables/useApp.ts#L50).

**Tech Stack:** Nuxt 4, Vue 3 Composition API, Nuxt UI (`defineShortcuts`), nuxt-auth-utils (`useUserSession`), TypeScript strict.

---

## État actuel des raccourcis

| Raccourci | Action                                | `usingInput` (cible) | Décision                                   |
| --------- | ------------------------------------- | :------------------: | ------------------------------------------ |
| `meta+k`  | Toggle command palette                |          —           | **Supprimer**                              |
| `escape`  | Ferme la command palette (si ouverte) |          —           | **Supprimer**                              |
| `meta+q`  | Toggle panneau `designControls`       |        `true`        | **Gater sur `loggedIn`**                   |
| `ctrl+m`  | Toggle panneau `mainMenu`             |          —           | **Supprimer**                              |
| `ctrl+s`  | Toggle recherche de biens (slideover) |        `true`        | **Gater sur `loggedIn`** + passer à `true` |
| `ctrl+d`  | Navigue vers `/dashboard`             |       `false`        | Inchangé                                   |

**Point D tranché** — `meta+q` et `ctrl+s` passent/restent en `usingInput: true` : ce sont des combos avec modificateur (aucune interférence avec la frappe), donc déclenchables même focus dans un champ ; bonus, `ctrl+s` en `usingInput: true` neutralise le « Enregistrer la page » du navigateur partout.

À la suppression des raccourcis `meta+k` / `escape` s'ajoute le retrait du code mort associé : le composant `CommandPaletteModal.vue` (non monté) et l'état/actions `isCommandPaletteOpen` dans `useDashboard.ts`.

---

## Périmètre — fichiers touchés

| Action    | Fichier                                                                    |
| --------- | -------------------------------------------------------------------------- |
| Modifier  | `app/composables/useDashboard.ts`                                          |
| Supprimer | `app/components/CommandPaletteModal.vue`                                   |
| Renommer  | `app/components/CommandPropertyModal.vue` → `CommandPropertySlideover.vue` |
| Réécrire  | `app/components/CommandPropertySlideover.vue` (slideover style sidebar)    |
| Modifier  | `app/layouts/default.vue` (mise à jour du composant monté)                 |

---

### Task 1 : Exposer `loggedIn` dans `_useDashboard`

**Files:**

- Modify: `app/composables/useDashboard.ts`

#### Contexte

`useUserSession()` renvoie un `loggedIn: Ref<boolean>` SSR-safe. Comme le bloc `defineShortcuts` est protégé par `import.meta.client`, on peut lire `loggedIn.value` dans les handlers sans risque d'hydratation. On déclare `loggedIn` en tête de `_useDashboard`, au même niveau que `useRoute()`.

- [ ] **Étape 1 : Ajouter la déclaration**

Dans `_useDashboard`, après `const route = useRoute()` ([ligne 36](../../webapp/app/composables/useDashboard.ts#L36)), ajouter :

```typescript
const { loggedIn } = useUserSession()
```

---

### Task 2 : Nettoyer et gater le bloc `defineShortcuts`

**Files:**

- Modify: `app/composables/useDashboard.ts`

#### Contexte

On supprime `meta_k`, `escape` et `ctrl_m`, et on ajoute un garde `if (!loggedIn.value) return` en tête des handlers `meta_q` et `ctrl_s`. Ce garde est un **no-op silencieux** : aucune navigation, aucune ouverture de la page de login. `ctrl_d` reste strictement identique.

`escape` ne servait qu'à fermer la command palette ; sa suppression est cohérente avec le retrait de `meta_k`.

- [ ] **Étape 1 : Remplacer le bloc `defineShortcuts`**

Remplacer le contenu actuel ([lignes 106-144](../../webapp/app/composables/useDashboard.ts#L106-L144)) par :

```typescript
defineShortcuts({
  meta_q: {
    usingInput: true,
    handler: () => {
      if (!loggedIn.value) return
      toggleSidePanel('designControls')
    },
  },
  ctrl_s: {
    usingInput: true,
    handler: () => {
      if (!loggedIn.value) return
      toggleCommandProperty()
    },
  },
  ctrl_d: {
    usingInput: false,
    handler: () => {
      navigateTo(useLocalePath()('/dashboard'))
    },
  },
})
```

- [ ] **Étape 2 : Confirmer l'absence de consommateur résiduel**

Avant suppression, vérifier qu'aucun autre fichier n'ouvre la palette (attendu : seuls `useDashboard.ts` et `CommandPaletteModal.vue` ressortent) :

```bash
cd /home/johan/www/graines-digitales/modern-web-apps/showcase-immobilier-webapp
grep -rn "isCommandPaletteOpen\|openCommandPalette\|closeCommandPalette\|toggleCommandPalette\|CommandPaletteModal" app/ server/ --include="*.vue" --include="*.ts"
```

- [ ] **Étape 3 : Supprimer l'état et les actions command palette dans `useDashboard.ts`**

Retirer, dans `_useDashboard` et son type de retour, tout ce qui concerne la command palette devenu mort :

- dans `UseDashboardReturn` : les 4 lignes `isCommandPaletteOpen` / `openCommandPalette` / `closeCommandPalette` / `toggleCommandPalette` ;
- la déclaration `const isCommandPaletteOpen = useState(...)` et les 3 fonctions `openCommandPalette` / `closeCommandPalette` / `toggleCommandPalette` ;
- les 4 clés correspondantes dans l'objet `return`.

Conserver intégralement le pendant `commandProperty` (`isCommandPropertyOpen` + actions), qui reste utilisé par `ctrl+s` et le composant de recherche (renommé en `CommandPropertySlideover.vue` en Task 4).

---

### Task 3 : Supprimer le composant `CommandPaletteModal.vue`

**Files:**

- Delete: `app/components/CommandPaletteModal.vue`

#### Contexte

Le composant n'est monté nulle part (vérifié) et, après Task 2, n'a plus aucune source d'ouverture. Il est supprimé.

- [ ] **Étape 1 : Re-confirmer qu'il n'est monté nulle part**

```bash
cd /home/johan/www/graines-digitales/modern-web-apps/showcase-immobilier-webapp
grep -rn "CommandPaletteModal" app/ --include="*.vue" | grep -v "components/CommandPaletteModal.vue"
```

Attendu : aucune sortie.

- [ ] **Étape 2 : Supprimer le fichier**

```bash
git rm app/components/CommandPaletteModal.vue
```

---

### Task 4 : Refondre la recherche de biens en slideover latéral

**Files:**

- Rename + rewrite: `app/components/CommandPropertyModal.vue` → `app/components/CommandPropertySlideover.vue`
- Modify: `app/layouts/default.vue`

#### Contexte

`ctrl+s` ouvre aujourd'hui une modale centrée (`UModal` + `UCommandPalette`). On la remplace par un **slideover latéral droit** au look du sidebar dashboard, contenu réduit à **recherche texte + liste**.

Référence de thème et de mécanisme : [PropertyEditorSlideover.vue](../../webapp/app/components/dashboard/PropertyEditorSlideover.vue) (USlideover, `side` responsive, `:ui` `bg-[#212121] text-white`, overlay `bg-black/55`).
Référence de style de liste : [PropertySidebar.vue](../../webapp/app/components/dashboard/PropertySidebar.vue) — la liste de résultats doit être **graphiquement identique** : item `identifier` mono + titre tronqué, hover `bg-white/5`, **item actif** `bg-white/10` avec identifiant en olive `#6B7A4A` (inactif en `text-white/35`), piloté par un `activeIndex`.

**Polices :** le slideover est monté dans le layout **public**, il n'hérite donc pas des polices du dashboard. On les force explicitement, conformément au thème dashboard : **Rationale** sur le titre (`font-[rationale]`), **Inter** sur les textes (`font-[Inter]` sur le conteneur), `font-mono` sur l'identifiant (comme `PropertySidebar`).

**Header :** titre « Rechercher un bien » en **olive** avec une **icône search à sa gauche** ; l'input n'a donc **pas** d'icône interne, mais une **bordure olive** (`ring-[#6B7A4A]`).

**Données :** `useAccommodation().items: ComputedRef<Accommodation[]>` (déjà utilisé par le composant actuel). Le filtrage n'est plus délégué à `UCommandPalette` → on filtre localement sur `identifier` + `name` (insensible à la casse).

**Navigation conservée :** `/properties/${listingSlug}/${categorySlug}/${slug}` via `localePath`, suivie de `closeCommandProperty()`.

- [ ] **Étape 1 : Renommer le fichier**

```bash
cd /home/johan/www/graines-digitales/modern-web-apps/showcase-immobilier-webapp
git mv app/components/CommandPropertyModal.vue app/components/CommandPropertySlideover.vue
```

- [ ] **Étape 2 : Réécrire le composant en slideover**

Remplacer le contenu par un `USlideover` calqué sur les références ci-dessus. Structure attendue :

```vue
<template>
  <USlideover
    :open="isCommandPropertyOpen"
    :side="isMobile ? 'bottom' : 'right'"
    :ui="slideoverUi"
    @update:open="handleOpenChange"
  >
    <template #content>
      <div class="flex h-dvh min-h-0 flex-col bg-[#212121] font-[Inter] text-white">
        <!-- Liseré olive -->
        <div class="h-0.5 w-full shrink-0 bg-[#6B7A4A]" />

        <!-- Header : icône + titre olive + fermeture -->
        <div class="flex shrink-0 items-center gap-2 px-5 pt-5 pb-4">
          <UIcon
            name="i-lucide-search"
            class="shrink-0 text-sm text-[#6B7A4A]"
            aria-hidden="true"
          />
          <p
            class="flex-1 font-[rationale] text-[0.7rem] font-semibold tracking-[0.22em] text-[#6B7A4A] uppercase"
          >
            Rechercher un bien
          </p>
          <UButton
            icon="i-lucide-x"
            color="neutral"
            variant="ghost"
            size="xs"
            aria-label="Fermer"
            class="text-white/40 hover:bg-white/10 hover:text-white"
            @click="closeCommandProperty"
          />
        </div>

        <!-- Champ de recherche : bordure olive, sans icône interne -->
        <div class="shrink-0 px-5 pb-3">
          <UInput
            v-model="query"
            placeholder="Rechercher par référence ou nom…"
            autofocus
            class="w-full"
            :ui="{
              base: 'bg-white/5 text-white placeholder:text-white/35 ring-1 ring-inset ring-[#6B7A4A] focus-visible:ring-2 focus-visible:ring-[#6B7A4A]',
            }"
            @keydown.down.prevent="moveActive(1)"
            @keydown.up.prevent="moveActive(-1)"
            @keydown.enter.prevent="selectActive"
          />
        </div>

        <!-- Compteur (aligné à droite, comme le sidebar) -->
        <div class="flex shrink-0 justify-end px-5 pb-2">
          <span class="text-xs font-semibold text-white/60">
            {{ filteredItems.length }} bien{{ filteredItems.length > 1 ? 's' : '' }}
          </span>
        </div>

        <div class="mx-5 h-px shrink-0 bg-white/5" />

        <!-- Liste scrollable (design identique au sidebar dashboard) -->
        <div class="min-h-0 flex-1 overflow-y-auto">
          <ul v-if="filteredItems.length" class="space-y-0.5 px-5 py-2">
            <li v-for="(item, index) in filteredItems" :key="item.id">
              <button
                type="button"
                class="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left transition-colors hover:bg-white/5"
                :class="index === activeIndex ? 'bg-white/10' : ''"
                @mouseenter="activeIndex = index"
                @click="item.onSelect"
              >
                <span
                  class="shrink-0 font-mono text-[0.6rem] leading-none"
                  :class="index !== activeIndex ? 'text-white/35' : ''"
                  :style="index === activeIndex ? 'color: #6B7A4A' : ''"
                >
                  {{ item.identifier }}
                </span>
                <span class="min-w-0 truncate text-xs text-white/60">
                  {{ item.propertyName }}
                </span>
              </button>
            </li>
          </ul>
          <p v-else class="px-5 py-6 text-center text-xs text-white/35">Aucun bien trouvé.</p>
        </div>
      </div>
    </template>
  </USlideover>
</template>
```

Côté script :

- conserver `buildPropertyItem` (référence + nom + slugs + `onSelect`) ;
- état local : `query = ref('')`, `isMobile = ref(false)`, `activeIndex = ref(0)` ;
- `filteredItems` = `propertyItems` filtré localement sur `identifier`/`propertyName` (normalisés `toLowerCase().trim()`), sans la limite `slice(0, 5)` (la liste défile) ;
- `isMobile` + `slideoverUi` repris du pattern de `PropertyEditorSlideover.vue` (`bottom` < 1024px, `right` au-delà ; `content: '...bg-[#212121] text-white...'`, `overlay: 'bg-black/55'`) ;
- `handleOpenChange = (open: boolean) => { if (!open) closeCommandProperty() }` ;
- navigation clavier : `moveActive(delta)` (modulo sur `filteredItems.length`) et `selectActive()` (`filteredItems[activeIndex]?.onSelect()`) ;
- watch : réinitialiser `query` à la fermeture (`isCommandPropertyOpen`) et `activeIndex = 0` quand `filteredItems` change.

- [ ] **Étape 3 : Mettre à jour le montage dans `default.vue`**

Dans [app/layouts/default.vue:23](../../webapp/app/layouts/default.vue#L23), remplacer :

```vue
<LazyCommandPropertyModal />
```

par :

```vue
<LazyCommandPropertySlideover />
```

---

### Task 5 : Vérifications

**Files:**

- Modify: `app/composables/useDashboard.ts`
- Delete: `app/components/CommandPaletteModal.vue`
- Rename + rewrite: `app/components/CommandPropertySlideover.vue`
- Modify: `app/layouts/default.vue`

- [ ] **Étape 1 : Type-check**

```bash
cd /home/johan/www/graines-digitales/modern-web-apps/showcase-immobilier-webapp
make type-check 2>&1 | head -40
```

Attendu : aucune erreur — ni sur `useDashboard.ts`, ni référence orpheline à `CommandPaletteModal` ou `CommandPropertyModal` (auto-import résolu sur `CommandPropertySlideover`).

- [ ] **Étape 2 : Lint**

```bash
make lint:check 2>&1 | head -20
```

> Vérifier le nom exact des targets dans le `Makefile`.

- [ ] **Étape 3 : Test manuel**

1. Lancer le dev server.
2. **Déconnecté** (page publique) :
   - `meta+q` → ne fait rien.
   - `ctrl+s` → ne fait rien.
   - `meta+k` → ne fait rien (supprimé).
   - `ctrl+m` → ne fait rien (supprimé).
   - `ctrl+d` → navigue vers `/dashboard` (puis redirigé vers login par le middleware).
3. **Connecté** :
   - `meta+q` → ouvre/ferme `designControls`.
   - `ctrl+s` → ouvre le **slideover de recherche** depuis la droite (overlay, fond `#212121`, liseré olive). Y compris quand le focus est dans un champ (`usingInput: true`).
   - Saisie partielle (ex. `BAV`) → la liste se filtre sur référence + nom ; le 1ᵉʳ résultat est mis en surbrillance (`activeIndex = 0`).
   - **Parité visuelle** : titre olive + icône search, input à bordure olive, liste identique au sidebar dashboard (identifiant mono olive sur l'item actif, titre Inter, titre du panneau en Rationale).
   - Survol / flèches ↑↓ → déplacent l'item actif ; `Entrée` ouvre l'item actif.
   - Clic sur un bien → navigation vers `/properties/{listing}/{category}/{slug}` + fermeture du slideover.
   - Escape / clic extérieur → ferme le slideover, `query` réinitialisé.
   - `ctrl+d` → navigue vers `/dashboard`.
4. **Mobile** : `ctrl+s` ouvre le slideover en `side="bottom"`.

- [ ] **Étape 4 : Commit**

```bash
git add app/composables/useDashboard.ts \
        app/components/CommandPaletteModal.vue \
        app/components/CommandPropertySlideover.vue \
        app/layouts/default.vue
git commit -m "feat(dashboard): gater meta+q/ctrl+s sur la connexion, nettoyer la command palette morte et refondre la recherche de biens en slideover"
```

---

## Points de vigilance

| Sujet                      | Note                                                                                                                                               |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| SSR-safety                 | `loggedIn` est un état SSR-safe ; sa lecture reste dans `import.meta.client` — aucun risque d'hydratation.                                         |
| No-op silencieux           | Hors connexion, `meta+q` et `ctrl+s` ne font **rien** : pas de navigation, pas de page de login. Garde = `if (!loggedIn.value) return`.            |
| Command palette morte      | Retirée intégralement (composant + état + actions). Vérifier qu'aucune référence orpheline ne subsiste avant commit (grep + type-check).           |
| `commandProperty` préservé | Ne **pas** toucher à `isCommandPropertyOpen` ni à ses actions : encore utilisés par `ctrl+s` et le slideover.                                      |
| `usingInput`               | `meta+q` **et** `ctrl+s` en `usingInput: true` (point D) — actifs même focus input ; `ctrl+s` capte aussi le « Save » navigateur.                  |
| Slideover SSR-safe         | `isMobile` se calcule dans `onMounted` (`matchMedia`) — pas de lecture `window` au SSR. `isCommandPropertyOpen` est un `useState`.                 |
| Auto-import / Lazy         | Le renommage casse l'auto-import `LazyCommandPropertyModal` : mettre à jour `default.vue` **dans le même commit** (sinon build KO).                |
| `query` réinitialisé       | Vider `query` à la fermeture pour ne pas rouvrir le slideover sur un filtre obsolète.                                                              |
| Scope                      | Aucune modification de `ctrl+d`. Diff : `useDashboard.ts`, suppression `CommandPaletteModal.vue`, refonte + renommage du slideover, `default.vue`. |
