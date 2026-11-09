# Parcours immersif horizontal d'un bien d'exception

> Statut : spec de référence — **implémentée**.
> Périmètre : template de page réutilisable pour présenter un bien immobilier d'exception.
>
> **Implémentation :**
>
> - **Rendu** (tâche 031, ✅) : `services/mapper/exceptional.ts` (dérivation `hasPart` → écrans
>   - garde `isExceptionalProperty`), composants `app/components/property/Exceptional*.vue`,
>     composable `app/composables/useExceptionalRail.ts`, orchestrateur
>     `app/components/screen/PropertyExceptional.vue`. Activé sur la fiche bien si `hasPart` valide,
>     sinon repli sur `ScreenPropertyDetail`. Coexistence verticale via le patron `ScreenPropertyList`
>     (capture `navigator.enabled:false` + emit `next-screen`).
> - **Saisie** (tâche 032, en cours) : bloc « Parcours » du dashboard ; images = sélection parmi
>   les médias associés du bien. Persistance API Symfony + localisation hybride : tranche 2.
> - Le POC d'origine `app/pages/villa-des-alizes-content.vue` reste comme référence figée.

## Concept

Créer une expérience de visite immersive où chaque bien d'exception est présenté sous forme de
**screens plein écran défilant horizontalement**.

Le visiteur avance d'espace en espace comme lors d'une visite guidée. L'objectif est de
remplacer la fiche immobilière classique par un **parcours horizontal narratif** : plus
élégant, plus premium et plus engageant. Le dernier screen mène naturellement vers le
formulaire de contact, comme conclusion de la visite.

Chaque screen met en valeur une zone précise du bien à travers des **visuels immersifs** et
un **contenu éditorial concis** (une seule idée forte par écran).

Le template est intégré au layout public par défaut du site afin de conserver les repères
globaux : logo, actions rapides, navigation principale, réseaux sociaux et boot shell.
Comme ce POC ne s'appuie pas sur le `useScreenSystem` global pour fournir les metas de
screen, il force explicitement l'affichage du logo via la meta de page `headerLogo`.

## Parcours

| Étape                         | Screen recommandé                |
| ----------------------------- | -------------------------------- |
| 01 — Vue d'ouverture          | SCREEN_03 — Full Image + texte   |
| 02 — Espace d'accueil         | SCREEN_04 — Split 50/50          |
| 03 — Pièce de vie             | SCREEN_01 — Triptyque            |
| 04 — Espace extérieur         | SCREEN_05 — Mini Carousel        |
| 05 — Cuisine / réception      | SCREEN_02 — Full Image + Overlay |
| 06 — Espace nuit              | SCREEN_05 — Mini Carousel        |
| 07 — Espace d'eau / bien-être | SCREEN_06 — Duo                  |
| 08 — Contact                  | Split 50/50 contact              |

_Le screen indiqué est une affectation recommandée pour créer un rythme éditorial. Elle
reste configurable par bien (cf. [Principe](#principe--vues--screens))._

## Bibliothèque de screens

Chaque vue du parcours utilise l'un des screens de la bibliothèque, afin de créer un
**rythme visuel varié** tout au long de la visite. Toutes les zones de texte comportent au
minimum un sur-titre (eyebrow), un titre et un court paragraphe.

| Réf           | Screen                           | Description                                                                                                                                                                                                                                                                                                                                      |
| ------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **SCREEN_01** | Triptyque + texte                | Trois visuels en composition éditoriale superposée : une horizontale principale en haut, une horizontale secondaire dessous, une verticale à droite + zone de texte latérale. Les visuels utilisent un arrondi léger. Chaque visuel est **cliquable** et s'agrandit en lightbox (cf. [Lightbox du triptyque](#lightbox-du-triptyque-screen_01)). |
| **SCREEN_02** | Full Image + Overlay + texte     | Image plein cadre recouverte d'un **panneau overlay translucide** (l'image transparaît) qui porte la zone de texte.                                                                                                                                                                                                                              |
| **SCREEN_03** | Full Image + texte (optionnel)   | **Une seule** image plein cadre, zone de texte en surimpression **optionnelle**, sans vignettes.                                                                                                                                                                                                                                                 |
| **SCREEN_04** | Split 50/50 + texte              | **Vrai split** : colonne image et colonne texte côte à côte, sans superposition du contenu. Ratio 50/50.                                                                                                                                                                                                                                         |
| **SCREEN_05** | Mini Carousel Full Image + texte | Image plein cadre + zone de texte alignée à droite intégrant de petites **vignettes** pour défiler entre plusieurs visuels du même espace. Les visuels défilent en **autoplay** tant que l'écran est actif (cf. [Autoplay du SCREEN_05](#autoplay-du-screen_05)).                                                                                |
| **SCREEN_06** | Duo + texte                      | **Deux visuels juxtaposés** + zone de texte blanche en surimpression, alignée à droite sur desktop.                                                                                                                                                                                                                                              |

### Points de distinction

- **01** (3 visuels en collage) ≠ **06** (2 visuels juxtaposés).
- **03** (1 image, sans vignettes) ≠ **05** (plusieurs images avec vignettes / carousel).
- **02** (panneau de contenu translucide _sur_ l'image) ≠ **04** (vrai split, dont seul le voile
  chromatique optionnel couvre l'image).
- La **progressbar globale** indique l'avancement dans le parcours horizontal.
- Le premier screen peut afficher un indicateur discret de défilement horizontal.
- La bande de vignettes du SCREEN_05 est une navigation interne à un espace ; elle ne remplace
  pas la navigation globale du parcours.
- La zone de texte du SCREEN_05 est alignée à droite et contient les vignettes réduites, afin
  de conserver une seule zone de lecture et de navigation interne.
- La zone de texte du SCREEN_06 suit le même placement desktop que le SCREEN_05 :
  `md:bottom-36 md:right-32`, avec textes blancs.

### Voile des images

Tous les templates éditables acceptent `meta.imageOverlay` pour piloter le voile de leurs images :

- `dark` (valeur par défaut) conserve le traitement sombre propre au template ;
- `light` applique un voile blanc léger ;
- `none` affiche l'image sans voile.

Le voile couvre les visuels principaux du screen, mais pas les vignettes de navigation du carousel.

### Prop `reverse`

Les templates `SCREEN_01`, `SCREEN_02` et `SCREEN_04` acceptent une prop `reverse` pour
intervertir leurs deux blocs principaux sur desktop :

- `SCREEN_01` : triptyque et zone de texte sont inversés horizontalement ;
- `SCREEN_02` : panneau overlay et zone de texte passent de gauche à droite, ou inversement ;
- `SCREEN_04` : colonne image et colonne texte sont inversées.

Sur mobile, l'ordre reste stable pour préserver la lecture verticale.

### Mode lecture cinématique

Le parcours peut proposer un **mode lecture** depuis le premier screen uniquement.
Ce mode lance une cinématique horizontale continue de toute la fiche, depuis la vue
d'ouverture jusqu'au screen final de contact.

Règles d'expérience :

- le bouton de lancement utilise une icône `play` pleine ;
- le bouton est visible uniquement sur le premier screen, avant le lancement ;
- une fois la cinématique déclenchée, l'icône disparaît pour ne pas concurrencer le parcours ;
- le défilement est progressif, lent et continu, sans transition de navigation screen par screen ;
- le scroll-snap et le smooth scroll natifs sont neutralisés pendant la lecture ;
- l'animation pilote directement `scrollLeft` via `requestAnimationFrame` ;
- la vitesse de référence du POC est `280 px/s` ;
- la lecture s'arrête automatiquement à l'arrivée sur le screen de contact ;
- l'utilisateur reprend le contrôle sur action explicite : clic/tap, molette ou flèches clavier ;
- un simple mouvement de souris ne doit pas interrompre la cinématique.

### Modes d'overlay du SCREEN_02

Le SCREEN_02 peut utiliser deux modes, sans `backdrop-blur` :

- **dark** : panneau `bg-foreground`, texte blanc, accent `text-background`.
- **light** : panneau `bg-background`, texte `text-foreground`, accent blanc.

### Lightbox du triptyque (SCREEN_01)

Les trois visuels du SCREEN_01 sont des cibles cliquables (curseur de zoom au survol)
qui ouvrent une **lightbox** plein écran, afin d'examiner un visuel en détail sans quitter
le parcours.

Règles d'expérience :

- overlay modal sombre, fermeture par bouton dédié, clic en dehors du visuel ou touche `Échap` ;
- navigation entre les trois visuels du triptyque par flèches précédent/suivant et touches `←`/`→`,
  avec un compteur `index / total` ;
- la navigation **boucle** sur les visuels de l'espace courant ;
- tant que la lightbox est ouverte, elle capte le clavier en priorité (la navigation globale du
  parcours est neutralisée) ;
- la lightbox reste interne à un espace : elle ne fait pas progresser le parcours.

### Autoplay du SCREEN_05

Les vignettes du SCREEN_05 défilent **automatiquement** tant que l'écran est actif, pour
animer l'espace sans action de l'utilisateur.

Règles d'expérience :

- l'autoplay ne tourne que sur l'écran **actif** et uniquement s'il comporte plusieurs visuels ;
- changer d'écran relance l'autoplay sur la nouvelle cible (et l'arrête si ce n'est pas un carousel) ;
- la cadence de référence du POC est de `3500 ms` par visuel, en boucle ;
- une sélection manuelle de vignette reste prioritaire et choisit le visuel affiché ;
- l'autoplay est une animation interne à un espace ; il ne fait pas progresser le parcours.

## Zone de texte

Chaque screen comporte une zone de texte, composée de trois éléments (de haut en bas). Seul
le titre est obligatoire ; la désignation et le texte sont optionnels selon le screen.

1. **Désignation** — le nom de l'étape (« Espace extérieur », « Espace nuit »…). Présentée comme un
   **label** : précédée d'un **tiret** en début de ligne, en petites capitales avec un
   interlettrage large, et une **opacité réduite** (texte atténué).
   Exemple : `— Espace extérieur`
2. **Titre (heading)** — l'idée forte de l'écran, sur **1 à 2 phrases**. Certains mots peuvent
   être **mis en avant par une couleur d'accent**.
3. **Texte** — un court paragraphe descriptif, dont la couleur dépend du contexte de fond
   (cf. [Typographie et couleurs](#typographie-et-couleurs)).

Le tout reste concis : une seule idée forte par écran.

## Typographie et couleurs

La page utilise les tokens du thème du site pour rester cohérente avec les autres écrans :

- **Police** : Inter pour toute la page.
- Sur `bg-background` : texte `text-foreground`, mise en avant en blanc.
- Sur image : texte blanc, mise en avant en `text-foreground`.
- Vue d'ouverture sur image : texte entièrement blanc, sans couleur d'accent, et zone de
  texte alignée à droite pour ne pas entrer en conflit avec la synthèse fixe du bien.
- **Overlays** : aplats translucides autorisés, sans `backdrop-blur`.

## Principe : vues × screens

Le parcours sépare deux notions, ce qui permet de garder un déroulé cohérent tout en
laissant une grande liberté de composition d'un bien à l'autre.

Les **vues** définissent _ce qui_ est présenté :

```text
Vue d'ouverture · Espace d'accueil · Pièce de vie · Espace extérieur
Cuisine / réception · Espace nuit · Espace d'eau / bien-être · Contact
```

Les **screens** définissent _comment_ c'est présenté :

```text
SCREEN_01 Triptyque · SCREEN_02 Full Image + Overlay · SCREEN_03 Full Image + texte
SCREEN_04 Split 50/50 · SCREEN_05 Mini Carousel · SCREEN_06 Duo
```

Une même vue peut être rendue par n'importe quel screen de la bibliothèque : l'affectation
vue → screen est libre et se choisit pour créer du rythme. Le screen final **Contact** reste
unique et hors bibliothèque.

### Interversion par props

Les vues qui portent une composition éditoriale structurante doivent pouvoir recevoir leur
screen par prop/configuration, sans changer la donnée métier de la vue.

Les templates suivants sont explicitement interchangeables :

```text
SCREEN_01 Triptyque · SCREEN_02 Full Image + Overlay · SCREEN_04 Split 50/50
```

Le contrat attendu est :

```text
vue métier + props de contenu + prop de template screen
```

Changer la prop de template doit suffire à remplacer la composition visuelle. Les contenus
éditoriaux restent les mêmes : désignation, titre, texte, visuels et options éventuelles
comme le mode d'overlay.

## Synthèse fixe du bien

La page affiche une synthèse fixe du bien, visible pendant toute la visite et collée à la
progressbar, en bas à gauche du viewport. Elle reste indépendante des screens et du rail
horizontal. Elle contient :

```text
Désignation du bien · badge 1 · badge 2 · badge 3 · badge 4
```

Règles visuelles :

- désignation en majuscules, gras, avec une taille légèrement supérieure aux badges ;
- badges sur une seule ligne quand l'espace le permet ;
- badges avec le même arrondi léger que les visuels du triptyque ;
- la synthèse n'agit pas comme navigation entre les screens du parcours ; elle peut en
  revanche servir de **déclencheur du panneau d'informations du bien** (cf. ci-dessous).

Les badges sont configurables par bien. Pour un bien résidentiel, le jeu recommandé est :

```text
Surface · Nombre de pièces · Nombre de chambres · Nombre de salles d'eau
```

### Panneau d'informations du bien

La synthèse fixe est interactive : un clic ouvre un **panneau d'informations** (drawer latéral
gauche, plein hauteur) qui rassemble les détails du bien sans interrompre le parcours.

Règles d'expérience :

- ouverture depuis la synthèse fixe ; fermeture par bouton dédié, clic sur le voile ou touche `Échap` ;
- le panneau reprend la désignation, la localisation, les badges et la référence du bien ;
- il propose un appel à l'action **« Demander une visite »** qui referme le panneau et rejoint
  le screen de contact final — seule action de navigation rattachée à la synthèse ;
- l'ouverture du panneau interrompt le mode lecture cinématique éventuellement en cours ;
- le panneau est une surcouche : il n'altère pas le rail horizontal ni l'avancement du parcours.
