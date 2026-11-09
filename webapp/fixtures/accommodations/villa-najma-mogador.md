---
# ──────────────────────────────────────────────────────────────────────────
# FIXTURE DE DÉMO — POC parcours immersif (tâche 033). Données FICTIVES,
# anonymisées, inspirées d'un listing réel (textes réécrits, nom/réf fictifs).
# content/*/accommodations/ est gitignoré ET purgé par `make dev-content-sync`.
# Source de vérité versionnée : ce fichier. Pour (ré)activer la fiche :
#   cp dev-book/fixtures/accommodations/villa-najma-mogador.md \
#      content/fr/accommodations/villa-najma-mogador.md
# ──────────────────────────────────────────────────────────────────────────
identifier: FBAVVA003
slug: villa-najma-mogador
name: Villa Najma
dateCreated: 2026-06-10T00:00:00+00:00
dateModified: 2026-06-10T00:00:00+00:00
category: villa
realEstateListing: bien-a-vendre
place: golf-mogador
offer:
  price: 11200000
  priceCurrency: MAD
  priceSpecification: À la vente
floorSize: 240
numberOfRooms: 8
numberOfBedrooms: 4
numberOfBathroomsTotal: 4
occupancy: 9
yearBuilt: null
landArea: null
areaSize: null
areaTerrace: null
numberOfGarages: null
amenityFeature: []
additionalProperty:
  - name: dataSource
    value: fixture
associatedMedia:
  - image: villa-najma-vue-ensemble-01
    url: /demo/property.svg
    caption: Façade contemporaine ouverte sur la pelouse
    representativeOfPage: true
  - image: villa-najma-salon-01
    url: /demo/property.svg
    caption: Séjour et salle à manger en enfilade
  - image: villa-najma-exterieur-01
    url: /demo/property.svg
    caption: Jardin et piscine ouverts sur le plan d'eau
  - image: villa-najma-piscine-01
    url: /demo/property.svg
    caption: Piscine à débordement face au golf
  - image: villa-najma-terrasse-01
    url: /demo/property.svg
    caption: Terrasse repas ombragée sous parasol
  - image: villa-najma-chambre-01
    url: /demo/property.svg
    caption: Chambre lumineuse ouverte sur le jardin
  - image: villa-najma-chambre-02
    url: /demo/property.svg
    caption: Chambre aux accents bleus
  - image: villa-najma-salon-02
    url: /demo/property.svg
    caption: Salon TV avec assises profondes
  - image: villa-najma-terrasse-02
    url: /demo/property.svg
    caption: Toit-terrasse lounge avec vue panoramique
  - image: villa-najma-salle-de-bains-01
    url: /demo/property.svg
    caption: Douche à l'italienne et plan vasque en bois
  - image: villa-najma-salle-de-bains-02
    url: /demo/property.svg
    caption: Double vasque ouverte sur le jardin
realEstateAgent: null
highlight: null
review: null
isActive: true
metaTitle: Villa Najma — Visite immersive | Mogador, Essaouira
metaDescription: Découvrez la Villa Najma, villa contemporaine ouverte sur le golf de Mogador, à travers un parcours immersif espace après espace.

# Parcours immersif horizontal — un bloc hasPart = un écran (cf. deriveScreens).
# additionalType → gabarit, headline avec **accent**, meta.reverse / meta.overlayMode.
hasPart:
  - additionalType: SCREEN_ACCOMMODATION_FULL
    position: 1
    name: Vue d'ensemble
    headline: Une architecture contemporaine **face au green**
    text: Lignes nettes, pierre claire et grandes ouvertures pour une villa résolument moderne, posée au cœur d'un domaine de golf.
    associatedMedia:
      - image: villa-najma-vue-ensemble-01

  - additionalType: SCREEN_ACCOMMODATION_SPLIT
    position: 2
    name: Les séjours
    headline: Un volume **traversant**
    text: Séjour et salle à manger réunis dans un même volume lumineux, ouvert de part en part sur le jardin.
    meta:
      reverse: true
    associatedMedia:
      - image: villa-najma-salon-01

  - additionalType: SCREEN_ACCOMMODATION_TRYPTIQUE
    position: 3
    name: Les extérieurs
    headline: Une piscine **à débordement**
    text: Piscine chauffée ouverte sur le plan d'eau et les fairways, terrasses ombragées et coins repas au grand air.
    associatedMedia:
      - image: villa-najma-exterieur-01
      - image: villa-najma-piscine-01
      - image: villa-najma-terrasse-01

  - additionalType: SCREEN_ACCOMMODATION_CAROUSEL
    position: 4
    name: Les chambres
    headline: Quatre chambres **avec salle d'eau**
    text: Quatre chambres aux teintes douces, chacune avec sa salle d'eau privative et sa vue sur le jardin.
    associatedMedia:
      - image: villa-najma-chambre-01
      - image: villa-najma-chambre-02

  - additionalType: SCREEN_ACCOMMODATION_OVERLAY
    position: 5
    name: Le salon TV
    headline: Un coin **cocooning**
    text: Un second salon avec cheminée et télévision, pensé pour les soirées au calme.
    meta:
      overlayMode: dark
    associatedMedia:
      - image: villa-najma-salon-02

  - additionalType: SCREEN_ACCOMMODATION_SPLIT
    position: 6
    name: Le toit-terrasse
    headline: Le panorama, **plein ciel**
    text: Un toit-terrasse aménagé en lounge, ouvert sur le golf et l'arrière-pays jusqu'à l'horizon.
    associatedMedia:
      - image: villa-najma-terrasse-02

  - additionalType: SCREEN_ACCOMMODATION_DUO
    position: 7
    name: Les salles d'eau
    headline: Le bois et **l'eau claire**
    text: Travertin et bois clair composent des salles d'eau apaisantes, baignées de lumière naturelle.
    associatedMedia:
      - image: villa-najma-salle-de-bains-01
      - image: villa-najma-salle-de-bains-02

  - additionalType: SCREEN_ACCOMMODATION_CONTACT
    position: 8
    name: Dernière étape
    headline: Intéressé ?
    text: 'Vous venez de visiter la Villa Najma. Laissez-nous vos coordonnées pour organiser une visite privée.'
    associatedMedia: []
---

## Villa Najma

Villa contemporaine au cœur du golf de Mogador, quatre chambres avec salle d'eau et piscine à débordement. Parcours immersif espace après espace, de la vue d'ensemble au contact.
