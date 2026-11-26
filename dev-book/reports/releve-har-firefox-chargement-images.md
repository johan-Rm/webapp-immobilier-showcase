# Ordre de chargement des images - Firefox HAR

- Source: `firefox.har`
- Page capturee: `http://localhost:3000/fr`
- Debut capture HAR: `2026-05-07T10:59:20.497+01:00`

## Tableau

|   # | Debut        |    Delta | Statut |   Duree | Taille transferee | Type            | Image demandee                                                                                           | Composant implique                                                         | Lecture                                                                              |
| --: | ------------ | -------: | -----: | ------: | ----------------: | --------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
|   1 | 10:59:20.497 |     0 ms |    200 |    4 ms |            7.4 KB | `image/svg+xml` | `/favicon.svg`                                                                                           | Navigateur / document HTML                                                 | Favicon, hors composant Vue.                                                         |
|   2 | 10:59:28.486 | +7989 ms |    200 |  696 ms |          279.7 KB | `image/webp`    | `/_ipx/w_2048&f_webp&q_70&fit_cover/images/essaouira-en-drone.jpg`                                       | `ScreenRealEstateFullImage` -> `AppImage`                                  | Hero de la landing, `loading="eager"`, `fetchpriority="high"`, `preload`.            |
|   3 | 10:59:28.523 | +8026 ms |    200 |  880 ms |          242.6 KB | `image/webp`    | `/_ipx/w_2048&f_webp&q_80&fit_cover/images/essaouira-porte-de-bab-sbah.jpg`                              | `ScreenInvest` -> `AppImage`                                               | Fond de la section investissement, charge au palier `runtime`.                       |
|   4 | 10:59:28.527 | +8030 ms |    200 |  777 ms |          109.5 KB | `image/webp`    | `/_ipx/w_2048&f_webp&q_80&fit_cover/images/portrait-lifestyle-en-lumiere-naturelle.jpg`                  | `ScreenWhyChooseShowcase` -> `LazyAppImage`                                | Visuel lateral du premier screen differe.                                            |
|   5 | 10:59:28.582 | +8085 ms |    200 |  399 ms |           29.7 KB | `image/webp`    | `/_ipx/w_1704&f_webp&q_80&fit_cover/images/skala-du-port-dessaouira-mouette-au-coucher-de-soleil.jpg`    | `ScreenRealEstateThreeColProperties` -> `LazyPanelThreeCols` -> `AppImage` | Colonne `for-sale`, chargee en eager car index `0`.                                  |
|   6 | 10:59:28.583 | +8086 ms |    200 |  656 ms |          115.9 KB | `image/webp`    | `/_ipx/w_1704&f_webp&q_80&fit_cover/images/skala-de-la-kasbah-les-remparts-vertical.jpg`                 | `ScreenRealEstateThreeColProperties` -> `LazyPanelThreeCols` -> `AppImage` | Colonne `seasonal-rental`, `loading="lazy"`.                                         |
|   7 | 10:59:28.584 | +8087 ms |    200 |  812 ms |           60.6 KB | `image/webp`    | `/_ipx/w_1704&f_webp&q_80&fit_cover/images/medina-dessaouira-remparts-vertical.jpg`                      | `ScreenRealEstateThreeColProperties` -> `LazyPanelThreeCols` -> `AppImage` | Colonne `long-term-rental`, `loading="lazy"`.                                        |
|   8 | 10:59:28.694 | +8197 ms |    200 |  494 ms |           80.5 KB | `image/jpeg`    | `/images/essaouira-navigation-hero.jpg`                                                                  | `QuickActions` -> `prefetchImage`                                          | Warmup image centrale du menu, declenche par action rapide visible/intersection.     |
|   9 | 10:59:28.696 | +8199 ms |    200 | 1096 ms |          250.5 KB | `image/webp`    | `/_ipx/w_4096&f_webp&q_80&fit_cover/images/bavlc001-local-commercial-erraounak-interieur-espace-01.jpeg` | `QuickActions` -> `useQuickActionWarmup`                                   | Warmup de la premiere annonce de `/properties/bien-a-vendre`.                        |
|  10 | 10:59:28.700 | +8203 ms |    200 | 1010 ms |          132.6 KB | `image/webp`    | `/_ipx/w_4096&f_webp&q_80&fit_cover/images/contact-essaouira-port-mouette.jpeg`                          | `QuickActions` -> `useQuickActionWarmup`                                   | Warmup de la page `/contact`, image hero issue de `content/fr/web-pages/contact.md`. |

## Notes

- Les icones SVG inline en `data:image/svg+xml` presentes dans le HAR ne sont pas listees dans le tableau, car elles ne generent pas de requete image vers le serveur.
- Toutes les images reseau du tableau retournent `200`; la requete `bavlc001-local-commercial-erraounak-interieur-espace-01` reste bien corrigee et ne retourne pas `404`.
- Les URLs generees par IPX utilisent maintenant le format `w_2048`, `w_1704` ou `w_4096`, et non plus le format `s_2048x1152` ou `s_1704x2556` de la capture precedente.
- Les images principales partent autour de `+8 s` dans cette capture. Cette valeur doit etre interpretee avec le contexte exact de navigation/capture Firefox, pas comme un temps universel de chargement initial.

## Cible souhaitee

La page d'accueil doit appliquer une file de priorite claire, afin de ne pas faire
concurrencer les images critiques par les images de confort ou de sections plus basses.

### Ordre de priorite attendu

| Priorite | Famille d'image                              | Declenchement attendu                                                                      | Objectif produit / perf                                                                       |
| -------: | -------------------------------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
|        1 | Image hero du screen landing                 | SSR/Nuxt image critique: `preload`, `loading="eager"`, `fetchpriority="high"`              | Afficher l'image LCP ou l'image critique du premier ecran avant tout le reste.                |
|        2 | Image principale du menu                     | Warmup client juste apres le lancement de l'image critique landing                         | Ouvrir le menu sans latence visuelle perceptible.                                             |
|        3 | Images des prochaines actions probables      | Warmup client apres l'image menu, idealement en file controlee                             | Preparer les routes probables: contact, biens, page metier, sans degrader le hero.            |
|        4 | Images single des autres screens de l'ecran  | `onMounted` des screens differes, apres le palier runtime ou quand le screen devient actif | Charger les visuels utiles des sections suivantes sans bloquer le premier ecran.              |
|        5 | Screens lourds: galerie, carousel, slideshow | `onMounted`: precharger seulement les images critiques; puis continuer quand visible       | Eviter un pic reseau massif et ne demarrer l'animation qu'avec les images necessaires pretes. |

### Regles par type de screen

- Un screen landing ne doit declarer qu'une image critique prioritaire par contexte
  d'affichage: desktop ou mobile portrait. Cette image est la seule candidate
  `fetchpriority="high"` au-dessus du fold.
- L'image principale du menu doit etre prefetchee avant les images des routes
  probables, car elle sert une interaction globale plus immediate que la navigation
  vers une autre page.
- Les images de prochaines actions doivent etre dedupliquees et chargees dans un ordre
  stable. Elles ne doivent pas partir en concurrence directe avec l'image hero.
- Un screen avec une seule image non critique doit monter son image apres le rendu
  initial, via le palier `runtime` ou quand le screen devient actif.
- Un screen avec beaucoup d'images ne doit pas rendre toutes ses images au montage.
  Il doit precharger le minimum visible, bloquer le demarrage de l'animation tant que
  ce minimum n'est pas charge, puis charger le reste progressivement lorsque le screen
  est visible.

### Cas attendu pour `ScreenEssaouiraTheJewel`

Pour `ScreenEssaouiraTheJewel`, la cible est:

1. au `onMounted`, precharger les deux premieres images critiques de la galerie;
2. ne pas demarrer la galerie tant que ces deux images ne sont pas chargees;
3. lorsque le screen devient visible, activer la galerie;
4. apres activation, poursuivre le chargement progressif des autres images.

Cette regle evite un demarrage de galerie vide ou saccade, tout en evitant de charger
la galerie complete avant que l'utilisateur atteigne le screen.

## Analyse de conformite de la page d'accueil

### Synthese

La page d'accueil respecte partiellement la cible. Elle dispose deja de mecanismes
utiles: image hero declaree critique, paliers runtime/passive, warmup QuickActions et
blocage du demarrage de certaines animations tant que les images attendues ne sont pas
chargees. En revanche, le HAR courant montre un ordre effectif non conforme a la file
ideale: l'image menu part apres plusieurs images de screens, et les images des autres
screens partent en paquet autour du meme moment que les warmups d'action.

### Points conformes

- `ScreenRealEstateFullImage` declare l'image hero avec `loading="eager"`,
  `fetchpriority="high"` et `preload`. L'intention de priorite critique est donc
  presente cote composant.
- `QuickActions` precharge bien l'image principale du menu
  `/images/essaouira-navigation-hero.jpg` via `prefetchImage`.
- `useQuickActionWarmup` deduit et precharge les images landing des routes cibles.
  Les images `/properties/bien-a-vendre` et `/contact` apparaissent bien dans le HAR.
- `useDeferredRuntime` et `useDeferredScreenVisuals` donnent deja un cadre pour retarder
  les visuels non critiques apres le rendu initial ou jusqu'a l'activation du screen.
- `PanelScrollDualSynced` bloque l'autoplay tant que les images attendues du carousel
  ne sont pas chargees, ce qui va dans le sens de la cible pour les screens lourds.

### Ecarts constates

| Gravite | Ecart                                                         | Observation HAR / code                                                                                                                                                               | Effet potentiel                                                                                |
| ------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| Haute   | L'image hero ne part pas en premier apres le document         | Dans le HAR, `/images/essaouira-en-drone.jpg` part a `+7989 ms`, apres le favicon et des SVG inline.                                                                                 | Risque LCP si ce delai reflete une navigation froide ou une capture representative.            |
| Haute   | L'image principale du menu ne precede pas les autres warmups  | `/images/essaouira-navigation-hero.jpg` part ligne 8, apres les images `ScreenInvest`, `ScreenWhyChooseShowcase` et trois colonnes.                                                  | Le menu peut ne pas etre pret alors que des images moins immediates consomment deja le reseau. |
| Moyenne | Les images single et les images de panels partent en paquet   | Lignes 3 a 7: investissement, pourquoi choisir Showcase Immobilier et trois colonnes partent entre `+8026 ms` et `+8087 ms`.                                                         | Pic reseau post-runtime, sans priorisation assez nette entre screens.                          |
| Moyenne | Les prochaines actions ne sont pas clairement sequentielles   | Les warmups QuickActions partent apres les images de sections et sont lances par `Promise.all` par cible.                                                                            | Risque de concurrence reseau entre routes probables et images de sections.                     |
| Moyenne | `ScreenEssaouiraTheJewel` ne suit pas encore la cible precise | Le screen est commente dans `app/pages/index.vue`; si reactive, `GalleryImages` charge `EAGER_COUNT = 6` images au moment de l'activation, pas deux images critiques au `onMounted`. | Rechargement trop tardif ou trop large pour une galerie fluide et sobre.                       |

### Conclusion operationnelle

Le modele vise doit etre plus strict que le comportement actuel:

1. garantir que l'image hero est vraiment la premiere image applicative declenchee;
2. lancer ensuite le warmup de l'image menu;
3. lancer seulement apres les warmups de routes probables;
4. conserver les images single des autres screens derriere un palier runtime/activation,
   mais avec une file ordonnee plutot qu'un depart simultane;
5. adapter les galeries pour precharger un petit noyau critique au montage, puis charger
   le reste uniquement lorsque le screen devient visible.
