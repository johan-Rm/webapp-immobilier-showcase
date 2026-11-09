---
# ──────────────────────────────────────────────────────────────────────────
# FIXTURE DE DÉMO — POC parcours immersif (tâche 033). Données FICTIVES,
# anonymisées, inspirées d'un listing réel (textes réécrits, nom/réf fictifs).
# content/*/accommodations/ est gitignoré ET purgé par `make dev-content-sync`.
# Source de vérité versionnée : ce fichier. Pour (ré)activer la fiche :
#   cp dev-book/fixtures/accommodations/maison-amani-essaouira.md \
#      content/fr/accommodations/maison-amani-essaouira.md
# ──────────────────────────────────────────────────────────────────────────
identifier: FBAVVA008
slug: maison-amani-essaouira
name: Maison Amani
dateCreated: 2026-06-10T00:00:00+00:00
dateModified: 2026-06-10T00:00:00+00:00
category: villa
realEstateListing: bien-a-vendre
place: ghazoua
offer:
  price: 9200000
  priceCurrency: MAD
  priceSpecification: À la vente
floorSize: 280
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
  - image: maison-amani-vue-ensemble-01
    url: /demo/property.svg
    caption: Piscine et jardin planté de palmiers
    representativeOfPage: true
  - image: maison-amani-galerie-01
    url: /demo/property.svg
    caption: Galerie d'arches en pierre
  - image: maison-amani-exterieur-01
    url: /demo/property.svg
    caption: Terrasse repas couverte ouverte sur le jardin
  - image: maison-amani-exterieur-02
    url: /demo/property.svg
    caption: Lounge de jardin sous pergola
  - image: maison-amani-exterieur-03
    url: /demo/property.svg
    caption: Table de plein air sous la pergola
  - image: maison-amani-chambre-01
    url: /demo/property.svg
    caption: Chambre aux accents vert d'eau
  - image: maison-amani-chambre-02
    url: /demo/property.svg
    caption: Chambre aux tons bleu nuit
  - image: maison-amani-chambre-03
    url: /demo/property.svg
    caption: Chambre chaleureuse et son coin salon
  - image: maison-amani-chambre-04
    url: /demo/property.svg
    caption: Chambre ouverte sur la terrasse
  - image: maison-amani-salon-01
    url: /demo/property.svg
    caption: Séjour coloré ouvert sur la salle à manger
  - image: maison-amani-salle-de-bains-01
    url: /demo/property.svg
    caption: Double vasque et grand miroir
  - image: maison-amani-salle-de-bains-02
    url: /demo/property.svg
    caption: Salle de bain avec baignoire
  - image: maison-amani-cuisine-01
    url: /demo/property.svg
    caption: Cuisine-bar ouverte sur le jardin
  - image: maison-amani-salon-02
    url: /demo/property.svg
    caption: Salon aux banquettes intégrées
  - image: maison-amani-salon-03
    url: /demo/property.svg
    caption: Salon à la baie ouverte sur la piscine
  - image: maison-amani-patio-01
    url: /demo/property.svg
    caption: Patio planté d'un olivier
realEstateAgent: null
highlight: null
review: null
isActive: true
metaTitle: Maison Amani — Visite immersive | Ghazoua, Essaouira
metaDescription: Découvrez la Maison Amani, maison de campagne aux galeries d'arches et grand jardin à Ghazoua, à travers un parcours immersif espace après espace.

# Parcours immersif horizontal — un bloc hasPart = un écran (cf. deriveScreens).
hasPart:
  - additionalType: SCREEN_ACCOMMODATION_FULL
    position: 1
    name: Vue d'ensemble
    headline: Une maison **au grand jardin**
    text: À Ghazoua, une maison de plain-pied entourée d'un vaste jardin arboré, ouverte sur sa piscine et ses palmiers.
    associatedMedia:
      - image: maison-amani-vue-ensemble-01

  - additionalType: SCREEN_ACCOMMODATION_SPLIT
    position: 2
    name: Les galeries
    headline: Des galeries **d'arches**
    text: De longues galeries de pierre aux arches successives relient les espaces et abritent du soleil.
    meta:
      reverse: true
    associatedMedia:
      - image: maison-amani-galerie-01

  - additionalType: SCREEN_ACCOMMODATION_TRYPTIQUE
    position: 3
    name: Les extérieurs
    headline: Vivre **sous les pergolas**
    text: Terrasses couvertes, coins repas sous pergola et lounges de jardin prolongent la maison vers le dehors.
    associatedMedia:
      - image: maison-amani-exterieur-01
      - image: maison-amani-exterieur-02
      - image: maison-amani-exterieur-03

  - additionalType: SCREEN_ACCOMMODATION_CAROUSEL
    position: 4
    name: Les chambres
    headline: Cinq chambres **colorées**
    text: Cinq chambres aux teintes franches et tissus chinés, chacune ouverte sur le jardin ou une terrasse.
    associatedMedia:
      - image: maison-amani-chambre-01
      - image: maison-amani-chambre-02
      - image: maison-amani-chambre-03
      - image: maison-amani-chambre-04

  - additionalType: SCREEN_ACCOMMODATION_OVERLAY
    position: 5
    name: Le séjour
    headline: Un séjour **haut en couleur**
    text: Un séjour convivial aux banquettes basses et tables colorées, ouvert sur la salle à manger.
    meta:
      overlayMode: dark
    associatedMedia:
      - image: maison-amani-salon-01

  - additionalType: SCREEN_ACCOMMODATION_DUO
    position: 6
    name: Les salles de bains
    headline: Des salles d'eau **lumineuses**
    text: Plans vasques, miroirs et baignoires composent des salles d'eau claires aux matières douces.
    associatedMedia:
      - image: maison-amani-salle-de-bains-01
      - image: maison-amani-salle-de-bains-02

  - additionalType: SCREEN_ACCOMMODATION_CAROUSEL
    position: 7
    name: Vivre la maison
    headline: Des espaces **à partager**
    text: De la cuisine-bar aux salons-banquettes jusqu'au patio planté d'un olivier, la maison se vit dehors comme dedans.
    associatedMedia:
      - image: maison-amani-cuisine-01
      - image: maison-amani-salon-02
      - image: maison-amani-salon-03
      - image: maison-amani-patio-01

  - additionalType: SCREEN_ACCOMMODATION_CONTACT
    position: 8
    name: Dernière étape
    headline: Intéressé ?
    text: 'Vous venez de visiter la Maison Amani. Laissez-nous vos coordonnées pour organiser une visite privée.'
    associatedMedia: []
---

## Maison Amani

Maison de campagne aux galeries d'arches et grand jardin à Ghazoua, cinq chambres et piscine chauffée. Parcours immersif espace après espace, de la vue d'ensemble au contact.
