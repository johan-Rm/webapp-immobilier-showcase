---
# ──────────────────────────────────────────────────────────────────────────
# FIXTURE DE DÉMO — POC parcours immersif (tâche 033). Données FICTIVES,
# anonymisées, inspirées d'un listing réel (textes réécrits, nom/réf fictifs).
# content/*/accommodations/ est gitignoré ET purgé par `make dev-content-sync`.
# Source de vérité versionnée : ce fichier. Pour (ré)activer la fiche :
#   cp dev-book/fixtures/accommodations/villa-dunes-essaouira.md \
#      content/fr/accommodations/villa-dunes-essaouira.md
# ──────────────────────────────────────────────────────────────────────────
identifier: FBAVVA006
slug: villa-dunes-essaouira
name: Villa Dunes
dateCreated: 2026-06-10T00:00:00+00:00
dateModified: 2026-06-10T00:00:00+00:00
category: villa
realEstateListing: bien-a-vendre
place: campagne
offer:
  price: 14500000
  priceCurrency: MAD
  priceSpecification: À la vente
floorSize: 330
numberOfRooms: 9
numberOfBedrooms: 5
numberOfBathroomsTotal: 5
occupancy: 10
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
  - image: villa-dunes-vue-ensemble-01
    url: /demo/property.svg
    caption: Façade de pierre et piscine au crépuscule
    representativeOfPage: true
  - image: villa-dunes-terrasse-01
    url: /demo/property.svg
    caption: Terrasse couverte en pierre meublée en lounge
  - image: villa-dunes-piscine-01
    url: /demo/property.svg
    caption: Piscine bordée de pierre et d'oliviers
  - image: villa-dunes-exterieur-01
    url: /demo/property.svg
    caption: Table dressée près de la piscine
  - image: villa-dunes-exterieur-02
    url: /demo/property.svg
    caption: Terrasse lounge ouverte sur la campagne
  - image: villa-dunes-chambre-01
    url: /demo/property.svg
    caption: Chambre ouverte sur la terrasse et un olivier
  - image: villa-dunes-chambre-02
    url: /demo/property.svg
    caption: Chambre baignée de lumière sur le jardin
  - image: villa-dunes-chambre-03
    url: /demo/property.svg
    caption: Chambre aux accents chaleureux
  - image: villa-dunes-chambre-04
    url: /demo/property.svg
    caption: Chambre double ouverte sur la terrasse
  - image: villa-dunes-salon-01
    url: /demo/property.svg
    caption: Séjour ouvert sur la campagne
  - image: villa-dunes-salle-de-bains-01
    url: /demo/property.svg
    caption: Douche à l'italienne et baignoire en pierre
  - image: villa-dunes-salle-de-bains-02
    url: /demo/property.svg
    caption: Double vasque en pierre et plantes
  - image: villa-dunes-cuisine-01
    url: /demo/property.svg
    caption: Cuisine en bois et pierre ouverte sur la terrasse
  - image: villa-dunes-salon-02
    url: /demo/property.svg
    caption: Lounge sous pergola de bois
  - image: villa-dunes-terrasse-02
    url: /demo/property.svg
    caption: Terrasse couverte aux coussins colorés
  - image: villa-dunes-patio-01
    url: /demo/property.svg
    caption: Patio vitré ouvert sur le jardin
realEstateAgent: null
highlight: null
review: null
isActive: true
metaTitle: Villa Dunes — Visite immersive | Campagne d'Essaouira
metaDescription: Découvrez la Villa Dunes, villa de pierre épurée au milieu des oliviers dans la campagne d'Essaouira, à travers un parcours immersif espace après espace.

# Parcours immersif horizontal — un bloc hasPart = un écran (cf. deriveScreens).
# additionalType → gabarit, headline avec **accent**, meta.reverse / meta.overlayMode.
hasPart:
  - additionalType: SCREEN_ACCOMMODATION_FULL
    position: 1
    name: Vue d'ensemble
    headline: La pierre, **épurée**
    text: Au milieu des oliviers, une villa de pierre aux lignes franches, posée autour de sa piscine et ouverte sur la campagne d'Essaouira.
    associatedMedia:
      - image: villa-dunes-vue-ensemble-01

  - additionalType: SCREEN_ACCOMMODATION_SPLIT
    position: 2
    name: Les terrasses
    headline: Vivre **dehors**
    text: De larges terrasses couvertes en pierre, meublées de banquettes profondes, prolongent les pièces de vie vers le jardin.
    meta:
      reverse: true
    associatedMedia:
      - image: villa-dunes-terrasse-01

  - additionalType: SCREEN_ACCOMMODATION_TRYPTIQUE
    position: 3
    name: Les extérieurs
    headline: Une piscine **parmi les oliviers**
    text: Piscine chauffée bordée de pierre, transats à l'ombre des oliviers et coins repas ouverts sur l'horizon.
    associatedMedia:
      - image: villa-dunes-piscine-01
      - image: villa-dunes-exterieur-01
      - image: villa-dunes-exterieur-02

  - additionalType: SCREEN_ACCOMMODATION_CAROUSEL
    position: 4
    name: Les chambres
    headline: Cinq chambres **plain-pied jardin**
    text: Cinq chambres aux teintes minérales, chacune ouverte de plain-pied sur le jardin par de grandes baies.
    associatedMedia:
      - image: villa-dunes-chambre-01
      - image: villa-dunes-chambre-02
      - image: villa-dunes-chambre-03
      - image: villa-dunes-chambre-04

  - additionalType: SCREEN_ACCOMMODATION_OVERLAY
    position: 5
    name: Le séjour
    headline: Un séjour **face au paysage**
    text: Un séjour ouvert sur la campagne par une large baie, autour d'une grande table et d'objets chinés.
    meta:
      overlayMode: dark
    associatedMedia:
      - image: villa-dunes-salon-01

  - additionalType: SCREEN_ACCOMMODATION_DUO
    position: 6
    name: Les salles de bains
    headline: La pierre **et l'eau**
    text: Douche à l'italienne, baignoire et plans de pierre composent des salles d'eau brutes et lumineuses.
    associatedMedia:
      - image: villa-dunes-salle-de-bains-01
      - image: villa-dunes-salle-de-bains-02

  - additionalType: SCREEN_ACCOMMODATION_CAROUSEL
    position: 7
    name: Vivre la villa
    headline: Des espaces **à habiter**
    text: De la cuisine ouverte aux lounges sous pergola et au patio vitré, la villa se prolonge d'un espace à l'autre.
    associatedMedia:
      - image: villa-dunes-cuisine-01
      - image: villa-dunes-salon-02
      - image: villa-dunes-terrasse-02
      - image: villa-dunes-patio-01

  - additionalType: SCREEN_ACCOMMODATION_CONTACT
    position: 8
    name: Dernière étape
    headline: Intéressé ?
    text: 'Vous venez de visiter la Villa Dunes. Laissez-nous vos coordonnées pour organiser une visite privée.'
    associatedMedia: []
---

## Villa Dunes

Villa de pierre épurée au milieu des oliviers, dans la campagne d'Essaouira : cinq chambres de plain-pied et piscine chauffée. Parcours immersif espace après espace, de la vue d'ensemble au contact.
