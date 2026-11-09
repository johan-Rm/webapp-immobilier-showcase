<template>
  <!--
    POC (démo) — Parcours immersif HORIZONTAL d'un bien d'exception (variante sombre).
    Implémente la spec dev-book/parcours-immersif-horizontal.md :
      Parcours : Vue d'ensemble → Entrée → Salons → Extérieur → Cuisine → Chambres → Salles de bains → Contact
      Bibliothèque : SCREEN_01 Triptyque · SCREEN_02 Full+Overlay · SCREEN_03 Full+texte
                     SCREEN_04 Split 50/50 · SCREEN_05 Mini Carousel · SCREEN_06 Duo
    Zone de texte = désignation (label tiret, atténué) + titre (mots en accent possibles) + texte contextuel.
    Tout est "en dur" dans ce fichier unique ; rail scroll-snap horizontal (molette → horizontal,
    clavier, swipe) + mode lecture cinématique. Bien fictif inspiré d'une villa réelle d'Essaouira.

    ── Carte des régions du template (ordre de lecture du DOM) ─────────────────
      RÉGION A · Rail horizontal       — les écrans du parcours (scroll-snap), cœur de la page
      RÉGION B · Mode lecture          — déclencheur flottant du travelling cinématique
      RÉGION C · Synthèse fixe         — repère permanent du bien + ouverture du drawer d'infos
      RÉGION D · Barre de progression  — avancement dans le parcours (index courant / total)
      RÉGION E · Lightbox              — visuel agrandi du triptyque (overlay modal)
      RÉGION F · Panneau d'infos       — drawer gauche : détails du bien + accès au contact
    Les régions B→F sont des surcouches `fixed`/`absolute` : elles vivent hors du flux du rail.
  -->
  <div ref="rootRef" class="bg-background font-body relative h-dvh w-full overflow-hidden">
    <h1 class="sr-only">{{ property.name }} — {{ property.location }}</h1>

    <!-- ╔══════════════════════════════════════════════════════════════════╗
         ║ RÉGION A — RAIL HORIZONTAL (parcours de visite)                  ║
         ╚══════════════════════════════════════════════════════════════════╝
         Conteneur scrollable unique : chaque <section> est un écran plein
         viewport aimanté (snap). La molette verticale est convertie en
         défilement horizontal (cf. handleWheel). En mode lecture, le snap est
         neutralisé via scrollerStyle pour un travelling continu.
         `overscroll-x-contain` : en mobile, empêche le swipe horizontal en
         butée de bord de déclencher le geste « retour » du navigateur (iOS Safari). -->
    <div
      ref="scrollerRef"
      class="flex h-full w-full snap-x snap-mandatory [scrollbar-width:none] overflow-x-auto overflow-y-hidden overscroll-x-contain scroll-smooth [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      :style="scrollerStyle"
    >
      <!-- Un écran du parcours. Le layout rendu dépend de screen.template,
           résolu en `screenLayout(screen)` puis aiguillé par le v-if/v-else-if
           ci-dessous (un seul des 7 blocs est monté par écran). -->
      <section
        v-for="(screen, index) in screens"
        :id="screen.id"
        :key="screen.id"
        :ref="(el) => registerScreen(el, screen.id)"
        class="relative h-full w-screen shrink-0 snap-start snap-always overflow-hidden"
      >
        <!-- ┌─ SCREEN_04 — Split 50/50 ────────────────────────────────────┐
             │ Moitié image + moitié panneau texte sur fond `background`.   │
             │ `screen.reverse` permute les deux moitiés sur desktop.       │
             │ Mobile : image en haut (42%), panneau dessous (colonne).     │
             └──────────────────────────────────────────────────────────────┘ -->
        <div
          v-if="screenLayout(screen) === 'split'"
          class="flex h-full w-full flex-col md:flex-row"
        >
          <!-- Zone média — visuel pleine moitié (eager + priorité haute si 1er écran).
               sizes : pleine largeur en mobile, moitié à partir de md. -->
          <div
            class="relative order-first h-[42%] md:h-full md:w-1/2"
            :class="screen.reverse ? 'md:order-2' : 'md:order-1'"
          >
            <AppImage
              :src="screen.media[0]?.src ?? ''"
              :alt="screen.media[0]?.alt ?? ''"
              class="absolute inset-0 size-full object-cover"
              sizes="xs:100vw md:50vw"
              :loading="index === 0 ? 'eager' : 'lazy'"
              :preload="index === 0"
              :fetchpriority="index === 0 ? 'high' : 'auto'"
            />
          </div>
          <!-- Zone texte — désignation (eyebrow) + titre (accent) + contexte + specs/CTA. -->
          <div
            class="bg-background text-foreground flex flex-1 flex-col justify-center px-6 py-10 md:w-1/2 md:px-16"
            :class="screen.reverse ? 'md:order-1' : 'md:order-2'"
          >
            <p :class="BACKGROUND_LABEL_CLASS">— {{ screen.eyebrow }}</p>
            <h2 class="text-4xl leading-tight font-light text-balance md:text-5xl">
              <span
                v-for="(part, partIndex) in titleParts(screen)"
                :key="partIndex"
                :class="part.accent ? BACKGROUND_ACCENT_CLASS : ''"
                >{{ part.text }}</span
              >
            </h2>
            <p class="text-foreground mt-5 max-w-md text-base leading-relaxed">{{ screen.text }}</p>
            <ul
              v-if="screen.specs"
              class="text-foreground/70 mt-7 flex flex-wrap gap-x-4 gap-y-2 text-xs tracking-wide"
            >
              <li v-for="spec in screen.specs" :key="spec">{{ spec }}</li>
            </ul>
            <button
              v-if="screen.cta"
              type="button"
              class="border-foreground/50 mt-8 inline-flex w-fit items-center gap-2 border-b pb-1 text-base transition-opacity hover:opacity-70"
              @click="goToNext(screen.id)"
            >
              {{ screen.cta }} <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>

        <!-- ┌─ SCREEN_02 — Full image + overlay translucide ───────────────┐
             │ Image plein écran, panneau semi-opaque (desktop) portant le  │
             │ texte. `overlayMode` (dark/light) pilote contraste et accent │
             │ via overlayPanelClass / overlayTextClass / overlayAccentClass.│
             └──────────────────────────────────────────────────────────────┘ -->
        <template v-else-if="screenLayout(screen) === 'full-overlay'">
          <!-- Zone média — image de fond plein écran (sizes : pleine largeur). -->
          <AppImage
            :src="screen.media[0]?.src ?? ''"
            :alt="screen.media[0]?.alt ?? ''"
            class="absolute inset-0 size-full object-cover"
            sizes="sm:100vw md:100vw lg:100vw xl:100vw 2xl:100vw"
            :loading="index === 0 ? 'eager' : 'lazy'"
            :preload="index === 0"
            :fetchpriority="index === 0 ? 'high' : 'auto'"
          />
          <!-- Voile global (lisibilité) + panneau latéral teinté (desktop, côté selon reverse). -->
          <div class="bg-foreground/45 md:bg-foreground/20 absolute inset-0" />
          <div
            class="absolute inset-y-0 hidden w-1/2 md:block"
            :class="[screen.reverse ? 'right-0' : 'left-0', overlayPanelClass(screen)]"
          />
          <!-- Zone texte — posée sur le panneau (desktop) / centrée verticalement (mobile). -->
          <div
            class="absolute top-1/2 right-6 left-6 z-10 -translate-y-1/2 md:top-[55%] md:w-[40%]"
            :class="screen.reverse ? 'md:right-[5%] md:left-auto' : 'md:left-[5%]'"
          >
            <p :class="overlayLabelClass(screen)">— {{ screen.eyebrow }}</p>
            <h2
              class="text-4xl leading-tight font-light text-balance md:text-5xl"
              :class="overlayTextClass(screen)"
            >
              <span
                v-for="(part, partIndex) in titleParts(screen)"
                :key="partIndex"
                :class="part.accent ? overlayAccentClass(screen) : ''"
                >{{ part.text }}</span
              >
            </h2>
            <p class="mt-5 max-w-md text-base leading-relaxed" :class="overlayTextClass(screen)">
              {{ screen.text }}
            </p>
          </div>
        </template>

        <!-- ┌─ SCREEN_03 — Full image + texte (zone optionnelle) ──────────┐
             │ Image plein écran avec dégradé de lisibilité bas → haut.     │
             │ Cas particulier index 0 (écran d'ouverture) : bloc texte     │
             │ aligné à droite pour ne pas concurrencer la synthèse fixe.   │
             └──────────────────────────────────────────────────────────────┘ -->
        <template v-else-if="screenLayout(screen) === 'full'">
          <!-- Zone média — image de fond + dégradé sombre (sizes : pleine largeur). -->
          <AppImage
            :src="screen.media[0]?.src ?? ''"
            :alt="screen.media[0]?.alt ?? ''"
            class="absolute inset-0 size-full object-cover"
            sizes="sm:100vw md:100vw lg:100vw xl:100vw 2xl:100vw"
            :loading="index === 0 ? 'eager' : 'lazy'"
            :preload="index === 0"
            :fetchpriority="index === 0 ? 'high' : 'auto'"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/20" />
          <!-- Bloc texte ancré en bas. Hauteur de départ harmonisée avec les autres écrans de
               la famille « bas » (carousel, duo) : bottom-28 en mobile, md:bottom-36 en desktop.
               index 0 (ouverture) aligné à droite pour ne pas concurrencer la synthèse fixe. -->
          <div
            v-if="screen.title"
            class="absolute z-10 max-w-xl text-white"
            :class="
              index === 0
                ? 'right-6 bottom-28 left-6 text-right md:right-32 md:bottom-36 md:left-auto md:max-w-2xl'
                : 'bottom-28 left-6 md:bottom-36 md:left-16'
            "
          >
            <p :class="IMAGE_LABEL_CLASS">— {{ screen.eyebrow }}</p>
            <h2 class="text-4xl leading-tight font-light text-balance md:text-5xl">
              <span
                v-for="(part, partIndex) in titleParts(screen)"
                :key="partIndex"
                :class="part.accent && index !== 0 ? IMAGE_ACCENT_CLASS : ''"
                >{{ part.text }}</span
              >
            </h2>
            <p
              v-if="screen.text"
              class="mt-4 max-w-md text-base leading-relaxed text-white"
              :class="index === 0 ? 'ml-auto' : ''"
            >
              {{ screen.text }}
            </p>
          </div>
        </template>

        <!-- ┌─ SCREEN_01 — Triptyque (3 visuels) + texte ──────────────────┐
             │ Composition éditoriale de 3 visuels superposés, chacun       │
             │ cliquable (→ lightbox, RÉGION E), sur fond `background`.      │
             │ Desktop : texte et triptyque côte à côte (centrés). Mobile : │
             │ texte en haut, triptyque en bas (empilés). `reverse` permute │
             │ les deux blocs sur desktop.                                  │
             └──────────────────────────────────────────────────────────────┘ -->
        <template v-else-if="screenLayout(screen) === 'triptych'">
          <!-- Empilé en mobile (texte en haut, triptyque en bas via flex), positionné en
               absolu côte à côte en desktop. Aucun visuel de fond : fond `background` hérité
               de la racine, comme en desktop. -->
          <div class="flex h-full w-full flex-col justify-center px-6 pt-28 pb-24 md:block md:p-0">
            <!-- Zone texte — face au triptyque, côté opposé selon `reverse` en desktop. -->
            <div
              class="text-foreground md:absolute md:top-1/2 md:z-10 md:max-w-sm md:-translate-y-1/2"
              :class="
                screen.reverse ? 'md:right-12 md:text-right lg:right-20' : 'md:left-12 lg:left-20'
              "
            >
              <p :class="BACKGROUND_LABEL_CLASS">— {{ screen.eyebrow }}</p>
              <h2 class="text-3xl leading-tight font-light md:text-4xl">
                <span
                  v-for="(part, partIndex) in titleParts(screen)"
                  :key="partIndex"
                  :class="part.accent ? BACKGROUND_ACCENT_CLASS : ''"
                  >{{ part.text }}</span
                >
              </h2>
              <p
                class="text-foreground/80 mt-4 text-sm leading-relaxed"
                :class="screen.reverse ? 'md:ml-auto' : ''"
              >
                {{ screen.text }}
              </p>
              <button
                v-if="screen.cta"
                type="button"
                class="border-foreground/50 mt-6 inline-flex items-center gap-2 border-b pb-1 text-sm transition-opacity hover:opacity-70"
                @click="goToNext(screen.id)"
              >
                {{ screen.cta }} <span aria-hidden="true">→</span>
              </button>
            </div>
            <!-- Triptyque éditorial superposé : deux visuels horizontaux + un vertical, chacun
                 cliquable (→ lightbox). En mobile, sous le texte et centré avec lui (ratio
                 paysage pour garder la composition) ; dimensionné en vw/dvh en desktop. -->
            <div
              class="relative mt-12 aspect-3/2 w-full md:absolute md:top-1/2 md:mt-0 md:aspect-auto md:h-[68dvh] md:w-[58vw] md:-translate-y-1/2"
              :class="screen.reverse ? 'md:left-10 lg:left-16' : 'md:right-10 lg:right-16'"
            >
              <button
                v-if="screen.media[0]"
                type="button"
                class="group absolute top-0 right-[10%] z-20 aspect-video w-[62%] cursor-zoom-in overflow-hidden rounded-md bg-white p-1 shadow-2xl transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                :aria-label="`Agrandir : ${screen.media[0].alt}`"
                @click="openLightbox(screen.media, 0)"
              >
                <AppImage
                  :src="screen.media[0].src"
                  :alt="screen.media[0].alt"
                  class="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="sm:58vw md:36vw"
                  loading="lazy"
                />
              </button>
              <button
                v-if="screen.media[1]"
                type="button"
                class="group absolute bottom-[10%] left-[4%] z-10 aspect-video w-[58%] cursor-zoom-in overflow-hidden rounded-md shadow-2xl transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                :aria-label="`Agrandir : ${screen.media[1].alt}`"
                @click="openLightbox(screen.media, 1)"
              >
                <AppImage
                  :src="screen.media[1].src"
                  :alt="screen.media[1].alt"
                  class="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="sm:54vw md:34vw"
                  loading="lazy"
                />
              </button>
              <button
                v-if="screen.media[2]"
                type="button"
                class="group absolute right-[6%] bottom-0 z-30 h-[56%] w-[32%] cursor-zoom-in overflow-hidden rounded-md shadow-2xl transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                :aria-label="`Agrandir : ${screen.media[2].alt}`"
                @click="openLightbox(screen.media, 2)"
              >
                <AppImage
                  :src="screen.media[2].src"
                  :alt="screen.media[2].alt"
                  class="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="sm:30vw md:18vw"
                  loading="lazy"
                />
              </button>
            </div>
          </div>
        </template>

        <!-- ┌─ SCREEN_05 — Mini carousel (full image + vignettes) ─────────┐
             │ Le visuel principal (currentMedia) change selon la vignette  │
             │ sélectionnée (galleryIndex[screen.id]). Autoplay tant que    │
             │ l'écran est actif (cf. watch activeScreenId).                │
             └──────────────────────────────────────────────────────────────┘ -->
        <template v-else-if="screenLayout(screen) === 'carousel'">
          <!-- Zone média — visuel principal courant (transition d'opacité au changement). -->
          <AppImage
            :src="currentMedia(screen).src"
            :alt="currentMedia(screen).alt"
            class="absolute inset-0 size-full object-cover transition-[opacity] duration-300"
            sizes="sm:100vw md:100vw lg:100vw xl:100vw 2xl:100vw"
            loading="lazy"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/30" />
          <!-- Zone texte — désignation + titre + contexte + bande de vignettes (navigation).
               Hauteur de départ harmonisée famille « bas » : bottom-28 / md:bottom-36. -->
          <div
            class="absolute right-6 bottom-28 left-6 z-10 max-w-xl text-right md:right-32 md:bottom-36 md:left-auto"
          >
            <p :class="IMAGE_LABEL_CLASS">— {{ screen.eyebrow }}</p>
            <h2 class="text-4xl leading-tight font-light text-balance text-white md:text-5xl">
              <span v-for="(part, partIndex) in titleParts(screen)" :key="partIndex">{{
                part.text
              }}</span>
            </h2>
            <p class="mt-4 ml-auto max-w-md text-base leading-relaxed text-white">
              {{ screen.text }}
            </p>

            <!-- Navigation interne au SCREEN_05 (max 5 vignettes) : intégrée au bloc texte pour
                 garder une zone unique. Mobile : flex-1 → toutes visibles, sans troncature.
                 Desktop : taille fixe alignée à droite. -->
            <div class="mt-5 flex gap-1.5 md:justify-end">
              <button
                v-for="(media, mediaIndex) in screen.media.slice(0, 5)"
                :key="media.src"
                type="button"
                class="relative h-11 min-w-0 flex-1 overflow-hidden rounded border transition-all md:h-12 md:w-18 md:flex-none"
                :class="
                  (galleryIndex[screen.id] ?? 0) === mediaIndex
                    ? 'border-white opacity-100'
                    : 'border-white/30 opacity-70 hover:opacity-100'
                "
                :aria-label="`Voir : ${media.alt}`"
                @click="selectMedia(screen.id, mediaIndex)"
              >
                <!-- Vignette : largeur source réduite (~72px) via sizes, pas la pleine image. -->
                <AppImage
                  :src="media.src"
                  :alt="media.alt"
                  class="size-full object-cover"
                  sizes="xs:64px md:72px"
                  loading="lazy"
                />
              </button>
            </div>
          </div>
        </template>

        <!-- ┌─ SCREEN_06 — Duo (2 visuels juxtaposés) + texte ─────────────┐
             │ Deux visuels côte à côte (desktop) / empilés (mobile),       │
             │ dégradé sombre, puis bloc texte aligné à droite.             │
             └──────────────────────────────────────────────────────────────┘ -->
        <template v-else-if="screenLayout(screen) === 'duo'">
          <!-- Zone média — grille des 2 visuels (colonnes desktop / lignes mobile).
               sizes : pleine largeur en mobile (empilés), moitié à partir de md. -->
          <div class="absolute inset-0 grid grid-rows-2 md:grid-cols-2 md:grid-rows-1">
            <AppImage
              v-for="media in screen.media"
              :key="media.src"
              :src="media.src"
              :alt="media.alt"
              class="size-full object-cover"
              sizes="xs:100vw md:50vw"
              loading="lazy"
            />
          </div>
          <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10" />
          <!-- Zone texte — désignation + titre + contexte.
               Hauteur de départ harmonisée famille « bas » : bottom-28 / md:bottom-36. -->
          <div
            class="absolute right-6 bottom-28 left-6 z-10 max-w-xl text-right md:right-32 md:bottom-36 md:left-auto"
          >
            <p :class="IMAGE_LABEL_CLASS">— {{ screen.eyebrow }}</p>
            <h2 class="text-4xl leading-tight font-light text-balance text-white md:text-5xl">
              <span v-for="(part, partIndex) in titleParts(screen)" :key="partIndex">{{
                part.text
              }}</span>
            </h2>
            <p class="mt-4 ml-auto max-w-md text-base leading-relaxed text-white">
              {{ screen.text }}
            </p>
          </div>
        </template>

        <!-- ┌─ ÉCRAN FINAL — Footer / Contact (template CONTACT) ──────────┐
             │ Branche `v-else` : tout template non graphique retombe ici.  │
             │ Formulaire de contact rattaché au bien via property.reference│
             │ (FormContactProperty). Visuel d'ambiance affiché à partir de │
             │ md seulement : masqué en mobile pour laisser le formulaire    │
             │ occuper tout l'écran.                                         │
             └──────────────────────────────────────────────────────────────┘ -->
        <div v-else class="flex h-full w-full flex-col overflow-hidden md:flex-row">
          <!-- Zone média — visuel d'ambiance (terrasse/piscine). Masqué en mobile
               (formulaire plein écran), demi-largeur à partir de md. -->
          <div class="relative hidden md:block md:h-full md:w-1/2">
            <AppImage
              :src="property.contactImage"
              alt="Terrasse extérieure et piscine de la villa au cœur du jardin"
              class="absolute inset-0 size-full object-cover"
              sizes="md:50vw"
              loading="lazy"
            />
          </div>
          <!-- Zone formulaire — titre + FormContactProperty (prérempli avec la référence). -->
          <div
            class="bg-background text-foreground flex flex-1 items-center justify-center px-6 py-10 md:w-1/2 md:px-16"
          >
            <div class="w-full max-w-lg">
              <h2 class="mb-8 text-4xl font-light uppercase md:text-6xl">{{ screen.title }}</h2>
              <FormContactProperty :property-reference="property.reference" />
            </div>
          </div>
        </div>
      </section>
    </div>
    <!-- ╚═ Fin RÉGION A — Rail horizontal ════════════════════════════════ -->

    <!-- ╔══════════════════════════════════════════════════════════════════╗
         ║ RÉGION B — MODE LECTURE (déclencheur du travelling cinématique)  ║
         ╚══════════════════════════════════════════════════════════════════╝
         Visible uniquement au point d'entrée du parcours (canStartReadingMode :
         premier écran, parcours non terminé, lecture non lancée).
         Masqué en mobile (`hidden md:flex`) : la navigation tactile se fait au
         swipe, la cinématique reste une affordance desktop. -->
    <button
      v-if="canStartReadingMode"
      type="button"
      class="fixed top-1/2 right-5 z-50 hidden -translate-y-1/2 animate-pulse items-center text-white/70 transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white md:right-4 md:flex"
      :aria-label="readingModeButtonLabel"
      :aria-pressed="false"
      @click="toggleReadingMode"
    >
      <UIcon :name="readingModeIcon" class="text-4xl" aria-hidden="true" />
    </button>

    <!-- ╔══════════════════════════════════════════════════════════════════╗
         ║ RÉGION C — SYNTHÈSE FIXE (repère permanent du bien)              ║
         ╚══════════════════════════════════════════════════════════════════╝
         Carte d'identité du bien (nom + prix + badges), ancrée en bas à gauche et
         indépendante du rail. Sert aussi de déclencheur du panneau
         d'informations détaillées (drawer gauche, RÉGION F).
         Mobile : la pastille passe pleine largeur — ligne 1 le nom, ligne 2 le prix à
         gauche et les badges (compacts) à droite. Desktop : nom + prix empilés, badges
         à droite, le tout centré. Le décalage bas intègre la safe-area iOS pour ne pas
         passer sous la barre gestuelle. -->
    <button
      type="button"
      class="fixed right-4 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] left-4 z-50 flex max-w-[calc(100vw-2rem)] cursor-pointer flex-col gap-1.5 overflow-hidden rounded-md text-left text-xs text-white transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white md:right-auto md:left-6 md:flex-row md:items-center md:gap-2"
      aria-label="Voir les informations du bien"
      aria-haspopup="dialog"
      :aria-expanded="isDetailPanelOpen"
      @click="openDetailPanel"
    >
      <!-- Identité — trait + nom (ligne 1 en mobile). Le prix s'y range sous le nom en desktop. -->
      <span class="flex shrink-0 flex-col gap-1.5">
        <span class="block h-px w-12 rounded-full bg-white/75" aria-hidden="true" />
        <span class="text-lg leading-none font-bold tracking-[0.08em] uppercase">
          {{ property.name }}
        </span>
        <!-- Prix (desktop) — sous la désignation, accentué (texte blanc plein). -->
        <span class="hidden self-start text-sm font-bold whitespace-nowrap text-white md:block">
          {{ property.price }}
        </span>
      </span>
      <!-- Ligne 2 (mobile) : prix à gauche, badges compacts à droite. Desktop : badges seuls à droite. -->
      <span class="flex items-center justify-between gap-2 md:w-auto md:justify-start">
        <!-- Prix (mobile) — colonne gauche de la ligne 2. -->
        <span class="text-sm font-bold whitespace-nowrap text-white md:hidden">
          {{ property.price }}
        </span>
        <!-- Badges — 4 max ; compacts en mobile, taille pleine à partir de md. -->
        <span class="flex min-w-0 items-center gap-1 overflow-hidden md:gap-1.5">
          <span
            v-for="badge in propertyBadges"
            :key="badge.full"
            class="bg-background/30 shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold text-white/75 backdrop-blur md:px-2.5 md:py-3 md:text-xs"
          >
            <span class="md:hidden">{{ badge.short }}</span>
            <span class="hidden md:inline">{{ badge.full }}</span>
          </span>
        </span>
      </span>
    </button>

    <!-- ╔══════════════════════════════════════════════════════════════════╗
         ║ RÉGION D — BARRE DE PROGRESSION                                  ║
         ╚══════════════════════════════════════════════════════════════════╝
         Remplissage horizontal = progress (index courant / dernier index),
         appliqué en scaleX pour une transition GPU peu coûteuse. -->
    <div class="absolute inset-x-0 bottom-0 z-50 h-1 bg-white/15">
      <div
        class="h-full origin-left bg-white/90 transition-transform duration-500"
        :style="{ transform: `scaleX(${progress})` }"
      />
    </div>

    <!-- ╔══════════════════════════════════════════════════════════════════╗
         ║ RÉGION E — LIGHTBOX (visuel agrandi du triptyque SCREEN_01)      ║
         ╚══════════════════════════════════════════════════════════════════╝
         Overlay modal monté seulement si un visuel est ouvert
         (currentLightboxMedia). Flèches précédent/suivant si plusieurs
         visuels ; navigation clavier gérée par handleKeydown. -->
    <Transition
      enter-active-class="transition-opacity duration-200"
      leave-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="currentLightboxMedia"
        class="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 md:p-12"
        role="dialog"
        aria-modal="true"
        aria-label="Visuel agrandi"
        @click.self="closeLightbox"
      >
        <button
          type="button"
          class="absolute top-4 right-4 z-10 flex size-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          aria-label="Fermer"
          @click="closeLightbox"
        >
          <UIcon name="i-heroicons-x-mark" class="text-2xl" aria-hidden="true" />
        </button>

        <button
          v-if="hasMultipleLightboxMedia"
          type="button"
          class="absolute left-3 z-10 flex size-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:left-6"
          aria-label="Visuel précédent"
          @click="showLightboxAt(-1)"
        >
          <UIcon name="i-heroicons-chevron-left" class="text-2xl" aria-hidden="true" />
        </button>

        <!-- Visuel agrandi : fit `contain` côté provider (pas de crop) + qualité relevée. -->
        <AppImage
          :src="currentLightboxMedia.src"
          :alt="currentLightboxMedia.alt"
          class="max-h-full max-w-full rounded-md object-contain shadow-2xl"
          sizes="sm:100vw md:100vw lg:100vw xl:100vw 2xl:100vw"
          fit="contain"
          :quality="85"
          loading="eager"
        />

        <button
          v-if="hasMultipleLightboxMedia"
          type="button"
          class="absolute right-3 z-10 flex size-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:right-6"
          aria-label="Visuel suivant"
          @click="showLightboxAt(1)"
        >
          <UIcon name="i-heroicons-chevron-right" class="text-2xl" aria-hidden="true" />
        </button>

        <p
          v-if="hasMultipleLightboxMedia"
          class="absolute bottom-5 left-1/2 -translate-x-1/2 text-xs tracking-[0.2em] text-white/70 tabular-nums"
        >
          {{ lightboxIndex + 1 }} / {{ lightboxMedia?.length }}
        </p>
      </div>
    </Transition>

    <!-- ╔══════════════════════════════════════════════════════════════════╗
         ║ RÉGION F — PANNEAU D'INFOS DU BIEN (drawer gauche)               ║
         ╚══════════════════════════════════════════════════════════════════╝
         Ouvert depuis la synthèse fixe (RÉGION C). Deux éléments coordonnés :
         le voile cliquable (ferme au clic extérieur) puis le drawer <aside>
         (nom, badges, référence, CTA « Demander une visite » → écran contact). -->
    <!-- Voile d'arrière-plan — assombrit la page et capte le clic de fermeture. -->
    <Transition
      enter-active-class="transition-opacity duration-200"
      leave-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isDetailPanelOpen"
        class="fixed inset-0 z-[70] bg-black/55"
        @click.self="closeDetailPanel"
      />
    </Transition>

    <!-- Drawer — panneau latéral coulissant (translate-x) portant les détails du bien. -->

    <Transition
      enter-active-class="transition-transform duration-300 ease-out"
      leave-active-class="transition-transform duration-200 ease-in"
      enter-from-class="-translate-x-full"
      leave-to-class="-translate-x-full"
    >
      <aside
        v-if="isDetailPanelOpen"
        class="bg-background text-foreground fixed inset-y-0 left-0 z-[71] flex h-dvh w-[min(88vw,24rem)] flex-col overflow-y-auto px-6 py-8 shadow-2xl md:px-8 md:py-10"
        role="dialog"
        aria-modal="true"
        aria-label="Informations du bien"
      >
        <button
          type="button"
          class="text-foreground/60 hover:text-foreground focus-visible:outline-foreground absolute top-4 right-4 flex size-11 items-center justify-center rounded-full transition focus-visible:outline-2 focus-visible:outline-offset-2"
          aria-label="Fermer les informations"
          @click="closeDetailPanel"
        >
          <UIcon name="i-heroicons-x-mark" class="text-2xl" aria-hidden="true" />
        </button>

        <span class="bg-foreground/70 block h-px w-12 rounded-full" aria-hidden="true" />
        <h2 class="mt-4 text-2xl font-bold tracking-[0.04em] uppercase">{{ property.name }}</h2>
        <p class="text-foreground/60 mt-1 text-sm">{{ property.location }}</p>

        <ul class="mt-8 flex flex-wrap gap-2">
          <li
            v-for="badge in propertyBadges"
            :key="badge.full"
            class="border-foreground/15 bg-foreground/5 rounded-md border px-3 py-1.5 text-xs font-bold tracking-[0.04em]"
          >
            {{ badge.full }}
          </li>
        </ul>

        <dl class="text-foreground/70 mt-8 text-sm">
          <dt class="text-foreground/45 text-xs tracking-[0.18em] uppercase">Référence</dt>
          <dd class="mt-1 font-medium">{{ property.reference }}</dd>
        </dl>

        <button
          type="button"
          class="border-foreground/50 hover:bg-foreground hover:text-background focus-visible:outline-foreground mt-auto inline-flex items-center justify-center gap-2 rounded-md border px-5 py-3 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2"
          @click="goToContactFromPanel"
        >
          Demander une visite <span aria-hidden="true">→</span>
        </button>
      </aside>
    </Transition>
  </div>
</template>

<script setup lang="ts">
// 1. Imports
import type { Accommodation } from '@schemas/interfaces'
import type { ComponentPublicInstance } from 'vue'

// 2. Types et constantes statiques
// Les 6 types de screens canoniques du parcours + l'écran de contact final.
// split → SCREEN_04 · full-overlay → SCREEN_02 · full → SCREEN_03
// triptych → SCREEN_01 · carousel → SCREEN_05 · duo → SCREEN_06
type ScreenLayout = 'split' | 'full-overlay' | 'full' | 'triptych' | 'carousel' | 'duo' | 'contact'

type ScreenTemplate =
  'SCREEN_01' | 'SCREEN_02' | 'SCREEN_03' | 'SCREEN_04' | 'SCREEN_05' | 'SCREEN_06' | 'CONTACT'

// Variante chromatique du panneau SCREEN_02.
type OverlayMode = 'dark' | 'light'

type Media = {
  src: string
  alt: string
}

type Screen = {
  id: string
  label: string
  /** Template visuel configurable, futur équivalent d'une prop de screen. */
  template: ScreenTemplate
  /** Désignation (label tiret, atténué). */
  eyebrow: string
  title: string
  /** Sous-chaîne du titre mise en avant par la couleur d'accent. */
  titleHighlight?: string
  text: string
  cta?: string
  media: readonly Media[]
  /** Caractéristiques clés optionnelles affichées dans certains templates. */
  specs?: readonly string[]
  /** SCREEN_01/02/04 : inverse les deux blocs principaux sur desktop. */
  reverse?: boolean
  /** full-overlay : variante chromatique du panneau. */
  overlayMode?: OverlayMode
}

type TitlePart = { text: string; accent: boolean }

// Badge de la synthèse fixe : libellé complet + diminutif compact (mobile).
type PropertyBadge = { full: string; short: string }

// Styles de la zone texte selon le contexte : image, panneau background ou overlay.
const IMAGE_LABEL_CLASS = 'mb-3 text-xs font-semibold tracking-[0.3em] text-white/55 uppercase'
const IMAGE_ACCENT_CLASS = 'text-foreground'
const BACKGROUND_LABEL_CLASS =
  'mb-3 text-xs font-semibold tracking-[0.3em] text-foreground/55 uppercase'
const BACKGROUND_ACCENT_CLASS = 'text-white'
// Vitesse de travelling du mode lecture : assez lent pour lire, sans effet de snap écran.
const READING_MODE_SCROLL_SPEED_PX_PER_SECOND = 280
// Cadence de défilement automatique des vignettes d'un écran carousel (SCREEN_05) actif.
const CAROUSEL_AUTOPLAY_INTERVAL_MS = 3500

const SCREEN_TEMPLATE_LAYOUTS: Readonly<Record<ScreenTemplate, ScreenLayout>> = {
  SCREEN_01: 'triptych',
  SCREEN_02: 'full-overlay',
  SCREEN_03: 'full',
  SCREEN_04: 'split',
  SCREEN_05: 'carousel',
  SCREEN_06: 'duo',
  CONTACT: 'contact',
}

type UnknownRecord = Record<string, unknown>

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null

const asRecord = (value: unknown): UnknownRecord => (isRecord(value) ? value : {})

const readString = (value: unknown): string => (typeof value === 'string' ? value.trim() : '')

const readNumber = (value: unknown): number | null => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

// Mapping type de screen (contrat partagé hasPart) → template visuel interne.
const ADDITIONAL_TYPE_TO_TEMPLATE: Readonly<Record<string, ScreenTemplate>> = {
  SCREEN_ACCOMMODATION_FULL: 'SCREEN_03',
  SCREEN_ACCOMMODATION_SPLIT: 'SCREEN_04',
  SCREEN_ACCOMMODATION_TRYPTIQUE: 'SCREEN_01',
  SCREEN_ACCOMMODATION_CAROUSEL: 'SCREEN_05',
  SCREEN_ACCOMMODATION_OVERLAY: 'SCREEN_02',
  SCREEN_ACCOMMODATION_DUO: 'SCREEN_06',
  SCREEN_ACCOMMODATION_CONTACT: 'CONTACT',
}
const FALLBACK_TEMPLATE: ScreenTemplate = 'SCREEN_03'

// `headline` encode un éventuel mot accentué via le marqueur Markdown **...**.
// On en dérive le couple (title, titleHighlight) attendu par `titleParts`.
const parseHeadline = (headline: string): { title: string; titleHighlight?: string } => {
  const match = headline.match(/\*\*(.+?)\*\*/)
  const title = headline.replace(/\*\*(.+?)\*\*/g, '$1')
  return match?.[1] ? { title, titleHighlight: match[1] } : { title }
}

const slugify = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

const toMedia = (value: unknown): Media | null => {
  const record = asRecord(value)
  const src = readString(record.url)
  return src ? { src, alt: readString(record.caption) } : null
}

// Convertit les blocs `hasPart` du bien en screens internes du parcours.
const deriveScreens = (item: Accommodation | undefined): Screen[] => {
  const rawParts = Array.isArray(item?.hasPart) ? item.hasPart : []
  return rawParts
    .map((part): UnknownRecord => asRecord(part))
    .sort((left, right) => (readNumber(left.position) ?? 0) - (readNumber(right.position) ?? 0))
    .map((part, index): Screen => {
      const template =
        ADDITIONAL_TYPE_TO_TEMPLATE[readString(part.additionalType)] ?? FALLBACK_TEMPLATE
      const eyebrow = readString(part.name)
      const { title, titleHighlight } = parseHeadline(readString(part.headline))
      const media = (Array.isArray(part.associatedMedia) ? part.associatedMedia : [])
        .map(toMedia)
        .filter((entry): entry is Media => entry !== null)
      const meta = asRecord(part.meta)
      const overlayMode =
        meta.overlayMode === 'light' || meta.overlayMode === 'dark' ? meta.overlayMode : undefined

      return {
        id: template === 'CONTACT' ? 'contact' : slugify(eyebrow) || `screen-${index + 1}`,
        label: eyebrow.toLowerCase(),
        template,
        eyebrow,
        title,
        ...(titleHighlight ? { titleHighlight } : {}),
        text: readString(part.text),
        media,
        ...(typeof meta.reverse === 'boolean' ? { reverse: meta.reverse } : {}),
        ...(overlayMode ? { overlayMode } : {}),
      }
    })
}

// Prix affiché dans la synthèse fixe, formaté depuis l'offre du bien.
const formatPrice = (item: Accommodation | undefined): string => {
  const offer = asRecord(item?.offer)
  const price = readNumber(offer.price)
  if (price === null) return readString(offer.priceSpecification) || '—'
  return `${new Intl.NumberFormat('fr-FR').format(price)} DH`
}

// Synthèse fixe du bien dérivée des champs de la fiche.
const deriveProperty = (item: Accommodation | undefined, derivedScreens: readonly Screen[]) => {
  const place = asRecord(item?.place)
  const firstMedia = derivedScreens.flatMap((screen) => screen.media)[0]?.src ?? ''
  return {
    name: readString(item?.name) || 'Villa des Alizés',
    location: readString(place.name) || 'Essaouira, Maroc',
    reference: readString(item?.slug) || 'villa-des-alizes',
    price: formatPrice(item),
    contactImage: firstMedia,
  }
}

// Badges de la synthèse fixe : surface, pièces, chambres, salles de bains.
// `full` = libellé complet (drawer + desktop) ; `short` = diminutif compact (pastille mobile).
const derivePropertyBadges = (item: Accommodation | undefined): PropertyBadge[] => {
  const record = asRecord(item)
  const badges: PropertyBadge[] = []
  const surface = readNumber(record.floorSize)
  const rooms = readNumber(record.numberOfRooms)
  const bedrooms = readNumber(record.numberOfBedrooms)
  const bathrooms = readNumber(record.numberOfBathroomsTotal)
  if (surface !== null) badges.push({ full: `${surface} m²`, short: `${surface} m²` })
  if (rooms !== null) badges.push({ full: `${rooms} pièces`, short: `${rooms} p.` })
  if (bedrooms !== null) badges.push({ full: `${bedrooms} chambres`, short: `${bedrooms} ch.` })
  if (bathrooms !== null) {
    badges.push({ full: `${bathrooms} salles de bains`, short: `${bathrooms} sdb` })
  }
  return badges
}

// 3. Props et emits

// 4. Composables, stores, routeur
const { loadAccommodations } = useAccommodation()
const accommodationStore = useAccommodationStore()

// app.vue charge les biens en arrière-plan (loadBackgroundData dans onNuxtReady),
// mais côté client après hydratation seulement. On garantit donc le store pendant
// le SSR en ne (re)chargeant que s'il est vide — même garde que la fiche réelle.
await useAsyncData('villa-des-alizes-content', async () => {
  if (!accommodationStore.getAccommodations.length) {
    await loadAccommodations()
  }
  return true
})

const accommodation = computed(() => accommodationStore.getAccommodationBySlug('villa-des-alizes'))
const screens = computed<readonly Screen[]>(() => deriveScreens(accommodation.value))
const property = computed(() => deriveProperty(accommodation.value, screens.value))
const propertyBadges = computed(() => derivePropertyBadges(accommodation.value))

// 5. Etat local
const scrollerRef = useTemplateRef<HTMLElement>('scrollerRef')
// Conteneur racine : porte le listener `wheel` (élément normal → preventDefault honoré,
// contrairement à window/document que Chrome force en passive), et englobe les surcouches.
const rootRef = useTemplateRef<HTMLElement>('rootRef')
const screenElements = new Map<string, HTMLElement>()
const activeScreenId = ref<string>(screens.value[0]?.id ?? 'contact')
// Index du visuel principal sélectionné par écran carousel (SCREEN_05).
const galleryIndex = reactive<Record<string, number>>({})
const isReadingModeActive = ref(false)
// Navigation programmatique en cours (flèches/molette) : neutralise le scroll-snap le
// temps de l'animation pour un défilement fluide, et sert de garde anti-emballement molette.
const navigationInProgress = ref(false)
// Préférence d'accessibilité : si l'utilisateur réduit les animations, on désactive
// la cinématique et l'autoplay carousel. Résolu côté client au montage (SSR-safe).
const prefersReducedMotion = ref(false)
// Panneau d'informations du bien (drawer gauche) ouvert depuis la synthèse fixe.
const isDetailPanelOpen = ref(false)
// Lightbox du triptyque (SCREEN_01) : visuels affichés et index courant (null = fermée).
const lightboxMedia = ref<readonly Media[] | null>(null)
const lightboxIndex = ref(0)

let screenObserver: IntersectionObserver | null = null
let readingModeAnimationFrame: number | null = null
let readingModePreviousTimestamp: number | null = null
let carouselAutoplayTimer: ReturnType<typeof setInterval> | null = null
// Réactive le scroll-snap une fois l'animation de navigation terminée (cf. goToAdjacentScreen).
let programmaticScrollEndTimer: ReturnType<typeof setTimeout> | null = null

// 6. Data inputs

// 7. Validation et helpers purs
/** Découpe le titre en segments, en isolant la sous-chaîne à mettre en accent. */
const titleParts = (screen: Screen): TitlePart[] => {
  const { title, titleHighlight } = screen
  if (!titleHighlight) return [{ text: title, accent: false }]
  const start = title.indexOf(titleHighlight)
  if (start < 0) return [{ text: title, accent: false }]
  const parts: TitlePart[] = []
  if (start > 0) parts.push({ text: title.slice(0, start), accent: false })
  parts.push({ text: titleHighlight, accent: true })
  const end = start + titleHighlight.length
  if (end < title.length) parts.push({ text: title.slice(end), accent: false })
  return parts
}

/** Résout le template configurable vers le layout de rendu interne. */
const screenLayout = (screen: Screen): ScreenLayout => SCREEN_TEMPLATE_LAYOUTS[screen.template]

const overlayMode = (screen: Screen): OverlayMode => screen.overlayMode ?? 'dark'

// SCREEN_02 : le mode pilote le panneau et le contraste texte/accent sans backdrop blur.
const overlayPanelClass = (screen: Screen): string =>
  overlayMode(screen) === 'light' ? 'bg-background/80' : 'bg-foreground/80'

const overlayTextClass = (screen: Screen): string =>
  overlayMode(screen) === 'light' ? 'text-foreground' : 'text-white'

const overlayLabelClass = (screen: Screen): string =>
  overlayMode(screen) === 'light' ? BACKGROUND_LABEL_CLASS : IMAGE_LABEL_CLASS

const overlayAccentClass = (screen: Screen): string =>
  overlayMode(screen) === 'light' ? BACKGROUND_ACCENT_CLASS : 'text-background'

// 8. Computed UI-ready
const total = screens.value.length
const activeIndex = computed<number>(() =>
  Math.max(
    0,
    screens.value.findIndex((screen) => screen.id === activeScreenId.value),
  ),
)
// Remplissage de la barre : index courant / dernier index, ramené à [0, 1].
const progress = computed<number>(() => (total <= 1 ? 0 : activeIndex.value / (total - 1)))
const hasNextScreen = computed<boolean>(() => activeIndex.value < total - 1)
// Le mode lecture est une entrée de parcours : il ne se lance que depuis le premier écran,
// et jamais si l'utilisateur a demandé à réduire les animations.
const canStartReadingMode = computed<boolean>(
  () =>
    activeIndex.value === 0 &&
    hasNextScreen.value &&
    !isReadingModeActive.value &&
    !prefersReducedMotion.value,
)
const readingModeButtonLabel = computed<string>(() => 'Lancer le parcours automatique de la fiche')
const readingModeIcon = computed<string>(() => 'i-heroicons-play-solid')
const scrollerStyle = computed<Record<string, string> | undefined>(() => {
  // Cinématique : l'animation pilote `scrollLeft` à la main → on neutralise le smooth ET le snap.
  if (isReadingModeActive.value) {
    const style: Record<string, string> = { scrollBehavior: 'auto', scrollSnapType: 'none' }
    return style
  }
  // Navigation flèches/molette : on garde le smooth (classe `scroll-smooth`) mais on désactive
  // le snap mandatory le temps de l'animation, sinon il hache le défilement (effet saccadé).
  if (navigationInProgress.value) {
    const style: Record<string, string> = { scrollSnapType: 'none' }
    return style
  }
  return undefined
})
// Visuel agrandi courant ; null tant que la lightbox est fermée.
const currentLightboxMedia = computed<Media | null>(() => {
  const media = lightboxMedia.value
  if (!media) return null
  return media[lightboxIndex.value] ?? media[0] ?? null
})
const hasMultipleLightboxMedia = computed<boolean>(() => (lightboxMedia.value?.length ?? 0) > 1)

// 9. Actions et handlers
/** Enregistre l'élément DOM d'une section pour l'observation et le scroll programmatique. */
const registerScreen = (el: Element | ComponentPublicInstance | null, id: string): void => {
  if (el instanceof HTMLElement) {
    screenElements.set(id, el)
  } else {
    screenElements.delete(id)
  }
}

/** Visuel principal courant d'un écran carousel (premier visuel par défaut). */
const currentMedia = (screen: Screen): Media => {
  const mediaIndex = galleryIndex[screen.id] ?? 0
  return screen.media[mediaIndex] ?? screen.media[0] ?? { src: '', alt: '' }
}

/** Sélectionne le visuel principal affiché pour un écran carousel. */
const selectMedia = (id: string, mediaIndex: number): void => {
  galleryIndex[id] = mediaIndex
}

/** Arrête le défilement automatique du carousel en cours. */
const stopCarouselAutoplay = (): void => {
  if (carouselAutoplayTimer !== null) {
    clearInterval(carouselAutoplayTimer)
    carouselAutoplayTimer = null
  }
}

/**
 * Lance le défilement automatique des visuels d'un écran carousel actif (boucle).
 * N'a d'effet que sur un écran `carousel` comportant plusieurs visuels. Reste inactif
 * si l'utilisateur a demandé à réduire les animations, ou pendant le mode lecture
 * cinématique : le travelling traverse le carousel sans en déclencher l'autoplay.
 */
const startCarouselAutoplay = (id: string): void => {
  stopCarouselAutoplay()
  if (prefersReducedMotion.value || isReadingModeActive.value) return
  const screen = screens.value.find((item) => item.id === id)
  if (!screen || screenLayout(screen) !== 'carousel' || screen.media.length <= 1) return

  carouselAutoplayTimer = setInterval(() => {
    const current = galleryIndex[id] ?? 0
    galleryIndex[id] = (current + 1) % screen.media.length
  }, CAROUSEL_AUTOPLAY_INTERVAL_MS)
}

/** Ouvre la lightbox sur le visuel cliqué d'un triptyque. */
const openLightbox = (media: readonly Media[], index: number): void => {
  if (media.length === 0) return
  lightboxMedia.value = media
  lightboxIndex.value = index
}

/** Ferme la lightbox. */
const closeLightbox = (): void => {
  lightboxMedia.value = null
}

/** Navigue dans la lightbox (boucle sur les visuels du triptyque). */
const showLightboxAt = (offset: number): void => {
  const media = lightboxMedia.value
  if (!media) return
  lightboxIndex.value = (lightboxIndex.value + offset + media.length) % media.length
}

/** Défile horizontalement jusqu'à la section ciblée. */
const scrollToScreen = (id: string): void => {
  screenElements.get(id)?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' })
}

/** Avance vers la section suivante (CTA "Voir…"). */
const goToNext = (currentId: string): void => {
  const index = screens.value.findIndex((screen) => screen.id === currentId)
  const next = screens.value[index + 1]
  if (next) scrollToScreen(next.id)
}

/** Ouvre le panneau d'informations du bien ; stoppe la lecture cinématique en cours. */
const openDetailPanel = (): void => {
  stopReadingMode()
  isDetailPanelOpen.value = true
}

/** Ferme le panneau d'informations du bien. */
const closeDetailPanel = (): void => {
  isDetailPanelOpen.value = false
}

/** Depuis le panneau : referme et rejoint le formulaire de contact final. */
const goToContactFromPanel = (): void => {
  closeDetailPanel()
  scrollToScreen('contact')
}

/** Annule l'animation continue du mode lecture et remet le timestamp à zéro. */
const clearReadingModeAnimation = (): void => {
  if (readingModeAnimationFrame !== null) {
    cancelAnimationFrame(readingModeAnimationFrame)
    readingModeAnimationFrame = null
  }

  readingModePreviousTimestamp = null
}

/** Arrête la lecture automatique horizontale. */
const stopReadingMode = (): void => {
  isReadingModeActive.value = false
  clearReadingModeAnimation()
  // Si l'arrêt laisse l'utilisateur sur un carousel (interruption manuelle), on (re)lance
  // l'autoplay que le mode lecture avait neutralisé.
  startCarouselAutoplay(activeScreenId.value)
}

/**
 * Anime un travelling horizontal continu jusqu'au formulaire de contact.
 * Ne pas remplacer par `scrollIntoView` ou `scrollBy({ behavior: 'smooth' })` :
 * le mode lecture doit rester cinématique, indépendant des transitions de navigation.
 */
const runReadingModeFrame = (timestamp: number): void => {
  const scroller = scrollerRef.value

  if (!scroller || !isReadingModeActive.value) {
    stopReadingMode()
    return
  }

  const maxScrollLeft = Math.max(0, scroller.scrollWidth - scroller.clientWidth)
  const previousTimestamp = readingModePreviousTimestamp ?? timestamp
  const elapsedSeconds = Math.max(0, timestamp - previousTimestamp) / 1000
  const nextScrollLeft = Math.min(
    maxScrollLeft,
    scroller.scrollLeft + READING_MODE_SCROLL_SPEED_PX_PER_SECOND * elapsedSeconds,
  )

  readingModePreviousTimestamp = timestamp
  scroller.scrollLeft = nextScrollLeft

  if (nextScrollLeft >= maxScrollLeft) {
    stopReadingMode()
    return
  }

  readingModeAnimationFrame = requestAnimationFrame(runReadingModeFrame)
}

/** Lance le parcours automatique depuis l'ouverture jusqu'au formulaire de contact. */
const startReadingMode = (): void => {
  const scroller = scrollerRef.value
  if (!scroller || !hasNextScreen.value) return

  clearReadingModeAnimation()
  // Coupe un éventuel autoplay carousel en cours : la cinématique ne doit pas cohabiter
  // avec le défilement automatique des vignettes.
  stopCarouselAutoplay()
  isReadingModeActive.value = true
  readingModeAnimationFrame = requestAnimationFrame(runReadingModeFrame)
}

/** Bascule entre lecture automatique et arrêt manuel. */
const toggleReadingMode = (): void => {
  if (isReadingModeActive.value) {
    stopReadingMode()
    return
  }

  startReadingMode()
}

/**
 * Avance ou recule d'un écran (flèches clavier, molette).
 * Défile vers la position exacte de l'écran adjacent (`index × largeur`) en `smooth`, snap
 * neutralisé le temps de l'animation (via `scrollerStyle`) pour éviter l'effet saccadé du
 * ré-aimantage `mandatory`. `navigationInProgress` sert aussi de garde anti-emballement molette.
 */
const goToAdjacentScreen = (direction: 1 | -1): void => {
  stopReadingMode()
  const scroller = scrollerRef.value
  const targetIndex = activeIndex.value + direction
  if (!scroller || targetIndex < 0 || targetIndex >= screens.value.length) return

  navigationInProgress.value = true
  scroller.scrollTo({ left: targetIndex * scroller.clientWidth, behavior: 'smooth' })

  if (programmaticScrollEndTimer !== null) clearTimeout(programmaticScrollEndTimer)
  programmaticScrollEndTimer = setTimeout(() => {
    navigationInProgress.value = false
    programmaticScrollEndTimer = null
  }, 500)
}

/**
 * Convertit la molette verticale en navigation horizontale, un écran par geste.
 * `navigationInProgress` ignore les `wheel` pendant l'animation : un même geste de molette
 * (qui émet de nombreux événements) ne fait donc avancer que d'un écran à la fois.
 */
const handleWheel = (event: WheelEvent): void => {
  // Une surcouche scrollable est ouverte (drawer d'infos, lightbox) : on laisse le
  // défilement natif agir et on ne navigue pas dans le rail.
  if (isDetailPanelOpen.value || lightboxMedia.value) return
  if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return
  event.preventDefault()
  if (navigationInProgress.value) return
  goToAdjacentScreen(event.deltaY > 0 ? 1 : -1)
}

/** Navigation clavier : la lightbox capte les touches en priorité quand elle est ouverte. */
const handleKeydown = (event: KeyboardEvent): void => {
  if (lightboxMedia.value) {
    if (event.key === 'Escape') closeLightbox()
    else if (event.key === 'ArrowRight') showLightboxAt(1)
    else if (event.key === 'ArrowLeft') showLightboxAt(-1)
    return
  }
  if (isDetailPanelOpen.value) {
    if (event.key === 'Escape') closeDetailPanel()
    return
  }
  // preventDefault : empêche le défilement natif du conteneur par les flèches, qui se
  // cumulait avec notre navigation et faisait sauter deux écrans.
  if (event.key === 'ArrowRight') {
    event.preventDefault()
    goToAdjacentScreen(1)
  } else if (event.key === 'ArrowLeft') {
    event.preventDefault()
    goToAdjacentScreen(-1)
  }
}

/** Rend la main à l'utilisateur sur action explicite : clic/tap, molette ou clavier. */
const handleReadingModePointerInterrupt = (): void => {
  if (!isReadingModeActive.value) return
  stopReadingMode()
}

// 10. Watch et watchEffect
// Le carousel ne défile que tant que son écran est actif : changer d'écran relance
// l'autoplay sur la nouvelle cible (et l'arrête si elle n'est pas un carousel).
watch(activeScreenId, (id: string) => startCarouselAutoplay(id))

// 11. Metadonnees ecran ou page
// Le parcours démarre sur des visuels sombres plein écran : on force l'affichage
// du logo du header en blanc pour qu'il reste lisible par-dessus l'imagerie.
definePageMeta({
  headerLogo: {
    forceVisible: true,
    colorClass: 'text-white/90',
  },
})

useHead({
  title: () => `${property.value.name} — Visite immersive | ${property.value.location}`,
  meta: [
    {
      name: 'description',
      content:
        "Découvrez la Villa des Alizés, oasis contemporaine au cœur d'un domaine de golf à Essaouira, à travers un parcours immersif, espace après espace.",
    },
  ],
})

// 12. Lifecycle
onMounted(() => {
  // Résolution de la préférence d'animation réduite (client uniquement : `window`
  // est requis). Conditionne la cinématique et l'autoplay carousel.
  prefersReducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const scroller = scrollerRef.value
  if (!scroller) return

  screenObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && entry.target instanceof HTMLElement) {
          const matched = [...screenElements.entries()].find(([, el]) => el === entry.target)
          if (matched) activeScreenId.value = matched[0]
        }
      }
    },
    { root: scroller, threshold: 0.6 },
  )

  for (const el of screenElements.values()) {
    screenObserver.observe(el)
  }

  // wheel sur le conteneur racine (élément normal) : capte la molette quel que soit
  // l'élément survolé (overlays `fixed` inclus) ET honore preventDefault — ce que window
  // ne ferait pas (Chrome force les listeners wheel de window/document en passive).
  rootRef.value?.addEventListener('wheel', handleWheel, { passive: false })
  scroller.addEventListener('pointerdown', handleReadingModePointerInterrupt)
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  clearReadingModeAnimation()
  stopCarouselAutoplay()
  if (programmaticScrollEndTimer !== null) clearTimeout(programmaticScrollEndTimer)
  screenObserver?.disconnect()
  screenObserver = null
  rootRef.value?.removeEventListener('wheel', handleWheel)
  scrollerRef.value?.removeEventListener('pointerdown', handleReadingModePointerInterrupt)
  window.removeEventListener('keydown', handleKeydown)
})
</script>
