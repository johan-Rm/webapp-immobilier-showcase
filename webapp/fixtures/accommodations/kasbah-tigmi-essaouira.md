---
# ──────────────────────────────────────────────────────────────────────────
# FIXTURE DE DÉMO — POC parcours immersif (tâche 033). Données FICTIVES,
# anonymisées, inspirées d'un listing réel (textes réécrits, nom/réf fictifs).
# content/*/accommodations/ est gitignoré ET purgé par `make dev-content-sync`.
# Source de vérité versionnée : ce fichier. Pour (ré)activer la fiche :
#   cp dev-book/fixtures/accommodations/kasbah-tigmi-essaouira.md \
#      content/fr/accommodations/kasbah-tigmi-essaouira.md
# ──────────────────────────────────────────────────────────────────────────
identifier: FBAVVA010
slug: kasbah-tigmi-essaouira
name: Kasbah Tigmi
dateCreated: 2026-06-10T00:00:00+00:00
dateModified: 2026-06-10T00:00:00+00:00
category: villa
realEstateListing: bien-a-vendre
place: had-draa
offer:
  price: 13800000
  priceCurrency: MAD
  priceSpecification: À la vente
floorSize: 320
numberOfRooms: 8
numberOfBedrooms: 4
numberOfBathroomsTotal: 4
occupancy: 8
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
  - image: kasbah-tigmi-vue-ensemble-01
    url: /demo/property.svg
    caption: Piscine et terrasses éclairées au crépuscule
    representativeOfPage: true
  - image: kasbah-tigmi-salon-01
    url: /demo/property.svg
    caption: Salon voûté ouvert sur la terrasse
  - image: kasbah-tigmi-cuisine-01
    url: /demo/property.svg
    caption: Cuisine rustique avec foyer maçonné
  - image: kasbah-tigmi-chambre-01
    url: /demo/property.svg
    caption: Chambre aux teintes profondes et plafond de bois
  - image: kasbah-tigmi-chambre-02
    url: /demo/property.svg
    caption: Chambre lumineuse et son coin salon
  - image: kasbah-tigmi-salle-de-bains-01
    url: /demo/property.svg
    caption: Dressing et salle d'eau en tadelakt
realEstateAgent: null
highlight: null
review: null
isActive: true
metaTitle: Kasbah Tigmi — Visite immersive | Campagne d'Essaouira
metaDescription: Découvrez la Kasbah Tigmi, demeure de terre aux lignes berbères dans la campagne d'Essaouira, à travers un parcours immersif espace après espace.

# Parcours immersif horizontal — un bloc hasPart = un écran (cf. deriveScreens).
hasPart:
  - additionalType: SCREEN_ACCOMMODATION_FULL
    position: 1
    name: Vue d'ensemble
    headline: Une kasbah **au crépuscule**
    text: Au cœur de la campagne, une demeure de terre aux lignes berbères, sa longue piscine et ses bougies à la tombée du jour.
    associatedMedia:
      - image: kasbah-tigmi-vue-ensemble-01

  - additionalType: SCREEN_ACCOMMODATION_SPLIT
    position: 2
    name: Les salons
    headline: Sous les **arches de terre**
    text: De vastes salons voûtés aux assises basses et tapis, ouverts sur la campagne par de larges arches.
    meta:
      reverse: true
    associatedMedia:
      - image: kasbah-tigmi-salon-01

  - additionalType: SCREEN_ACCOMMODATION_OVERLAY
    position: 3
    name: La cuisine
    headline: Le feu **au centre**
    text: Une cuisine rustique organisée autour de son foyer maçonné et de son grand plan de travail.
    meta:
      overlayMode: dark
    associatedMedia:
      - image: kasbah-tigmi-cuisine-01

  - additionalType: SCREEN_ACCOMMODATION_CAROUSEL
    position: 4
    name: Les chambres
    headline: Quatre chambres **en terre et bois**
    text: Quatre chambres aux plafonds de roseaux et murs de tadelakt, chacune avec sa salle d'eau privative.
    associatedMedia:
      - image: kasbah-tigmi-chambre-01
      - image: kasbah-tigmi-chambre-02

  - additionalType: SCREEN_ACCOMMODATION_SPLIT
    position: 5
    name: Bains et dressing
    headline: Le tadelakt **dans le détail**
    text: Vasques de pierre, miroirs cintrés et dressings habillés composent des espaces d'eau bruts et raffinés.
    associatedMedia:
      - image: kasbah-tigmi-salle-de-bains-01

  - additionalType: SCREEN_ACCOMMODATION_CONTACT
    position: 6
    name: Dernière étape
    headline: Intéressé ?
    text: 'Vous venez de visiter la Kasbah Tigmi. Laissez-nous vos coordonnées pour organiser une visite privée.'
    associatedMedia: []
---

## Kasbah Tigmi

Demeure de terre aux lignes berbères dans la campagne d'Essaouira, quatre chambres et longue piscine. Parcours immersif espace après espace, de la vue d'ensemble au contact.
