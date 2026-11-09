---
# ──────────────────────────────────────────────────────────────────────────
# FIXTURE DE DÉMO — POC parcours immersif (tâche 033). Données FICTIVES,
# anonymisées, inspirées d'un listing réel (textes réécrits, nom/réf fictifs).
# content/*/accommodations/ est gitignoré ET purgé par `make dev-content-sync`.
# Source de vérité versionnée : ce fichier. Pour (ré)activer la fiche :
#   cp dev-book/fixtures/accommodations/dar-zahra-essaouira.md \
#      content/fr/accommodations/dar-zahra-essaouira.md
# ──────────────────────────────────────────────────────────────────────────
identifier: FBAVVA011
slug: dar-zahra-essaouira
name: Dar Zahra
dateCreated: 2026-06-10T00:00:00+00:00
dateModified: 2026-06-10T00:00:00+00:00
category: villa
realEstateListing: bien-a-vendre
place: campagne-d-essaouira
offer:
  price: 21500000
  priceCurrency: MAD
  priceSpecification: À la vente
floorSize: 520
numberOfRooms: 15
numberOfBedrooms: 9
numberOfBathroomsTotal: 6
occupancy: 18
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
  - image: dar-zahra-vue-ensemble-01
    url: /demo/property.svg
    caption: La demeure et sa piscine dans le jardin
    representativeOfPage: true
  - image: dar-zahra-patio-01
    url: /demo/property.svg
    caption: Patio intérieur aux arches fleuries
  - image: dar-zahra-exterieur-01
    url: /demo/property.svg
    caption: Piscine et patio fleuris
  - image: dar-zahra-exterieur-02
    url: /demo/property.svg
    caption: Grande table dressée sous les arbres
  - image: dar-zahra-tennis-01
    url: /demo/property.svg
    caption: Court de tennis bordé de cyprès
  - image: dar-zahra-chambre-01
    url: /demo/property.svg
    caption: Chambre aux tons vert d'eau
  - image: dar-zahra-chambre-02
    url: /demo/property.svg
    caption: Chambre en terre ocre et tapis rouge
  - image: dar-zahra-chambre-03
    url: /demo/property.svg
    caption: Chambre claire aux fenêtres cintrées
  - image: dar-zahra-chambre-04
    url: /demo/property.svg
    caption: Chambre verte aux accents traditionnels
  - image: dar-zahra-salon-01
    url: /demo/property.svg
    caption: Salon avec cheminée et assises profondes
  - image: dar-zahra-salle-a-manger-01
    url: /demo/property.svg
    caption: Salle à manger aux grands miroirs
  - image: dar-zahra-salon-02
    url: /demo/property.svg
    caption: Séjour rustique en bois patiné
  - image: dar-zahra-salon-03
    url: /demo/property.svg
    caption: Salon-bibliothèque aux teintes sable
  - image: dar-zahra-exterieur-03
    url: /demo/property.svg
    caption: Allée du jardin le long de la demeure
realEstateAgent: null
highlight: null
review: null
isActive: true
metaTitle: Dar Zahra — Visite immersive | Campagne d'Essaouira
metaDescription: Découvrez Dar Zahra, vaste demeure ocre aux patios fleuris dans la campagne d'Essaouira, à travers un parcours immersif espace après espace.

# Parcours immersif horizontal — un bloc hasPart = un écran (cf. deriveScreens).
hasPart:
  - additionalType: SCREEN_ACCOMMODATION_FULL
    position: 1
    name: Vue d'ensemble
    headline: Une demeure ocre **dans son jardin**
    text: Vaste maison de terre ocre déployée autour de ses jardins et de sa piscine, au cœur de la campagne d'Essaouira.
    associatedMedia:
      - image: dar-zahra-vue-ensemble-01

  - additionalType: SCREEN_ACCOMMODATION_SPLIT
    position: 2
    name: Le patio
    headline: Un patio **fleuri**
    text: Un patio intérieur aux arches ornées et plantes grimpantes, cœur frais de la maison.
    meta:
      reverse: true
    associatedMedia:
      - image: dar-zahra-patio-01

  - additionalType: SCREEN_ACCOMMODATION_TRYPTIQUE
    position: 3
    name: Les extérieurs
    headline: Jardins, piscine **et tennis**
    text: Piscine entourée de verdure, longues tables ombragées et court de tennis bordé de cyprès rythment le domaine.
    associatedMedia:
      - image: dar-zahra-exterieur-01
      - image: dar-zahra-exterieur-02
      - image: dar-zahra-tennis-01

  - additionalType: SCREEN_ACCOMMODATION_CAROUSEL
    position: 4
    name: Les chambres
    headline: Neuf chambres **hautes en couleur**
    text: Neuf chambres aux teintes profondes et matières naturelles, entre fenêtres cintrées et tapis chinés.
    associatedMedia:
      - image: dar-zahra-chambre-01
      - image: dar-zahra-chambre-02
      - image: dar-zahra-chambre-03
      - image: dar-zahra-chambre-04

  - additionalType: SCREEN_ACCOMMODATION_OVERLAY
    position: 5
    name: Les salons
    headline: Veillées **au coin du feu**
    text: Un grand salon rustique autour de sa cheminée, ponctué d'assises profondes et de bois patiné.
    meta:
      overlayMode: dark
    associatedMedia:
      - image: dar-zahra-salon-01

  - additionalType: SCREEN_ACCOMMODATION_SPLIT
    position: 6
    name: La salle à manger
    headline: Recevoir **en grand**
    text: Une salle à manger verte aux grands miroirs et table dressée, ouverte sur le jardin.
    associatedMedia:
      - image: dar-zahra-salle-a-manger-01

  - additionalType: SCREEN_ACCOMMODATION_CAROUSEL
    position: 7
    name: Vivre la maison
    headline: Des espaces **chaleureux**
    text: Du séjour rustique aux salons-bibliothèques jusqu'aux dépendances du jardin, la maison se vit d'un espace à l'autre.
    associatedMedia:
      - image: dar-zahra-salon-02
      - image: dar-zahra-salon-03
      - image: dar-zahra-exterieur-03

  - additionalType: SCREEN_ACCOMMODATION_CONTACT
    position: 8
    name: Dernière étape
    headline: Intéressé ?
    text: 'Vous venez de visiter Dar Zahra. Laissez-nous vos coordonnées pour organiser une visite privée.'
    associatedMedia: []
---

## Dar Zahra

Vaste demeure ocre aux patios fleuris dans la campagne d'Essaouira, neuf chambres, piscine et tennis. Parcours immersif espace après espace, de la vue d'ensemble au contact.
