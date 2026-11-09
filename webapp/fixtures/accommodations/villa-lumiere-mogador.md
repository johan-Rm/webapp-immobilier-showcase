---
# ──────────────────────────────────────────────────────────────────────────
# FIXTURE DE DÉMO — POC parcours immersif (tâche 033). Données FICTIVES,
# anonymisées, inspirées d'un listing réel (textes réécrits, nom/réf fictifs).
# content/*/accommodations/ est gitignoré ET purgé par `make dev-content-sync`.
# Source de vérité versionnée : ce fichier. Pour (ré)activer la fiche :
#   cp dev-book/fixtures/accommodations/villa-lumiere-mogador.md \
#      content/fr/accommodations/villa-lumiere-mogador.md
# ──────────────────────────────────────────────────────────────────────────
identifier: FBAVVA002
slug: villa-lumiere-mogador
name: Villa Lumière
dateCreated: 2026-06-10T00:00:00+00:00
dateModified: 2026-06-10T00:00:00+00:00
category: villa
realEstateListing: bien-a-vendre
place: golf-mogador
offer:
  price: 9800000
  priceCurrency: MAD
  priceSpecification: À la vente
floorSize: 200
numberOfRooms: 9
numberOfBedrooms: 5
numberOfBathroomsTotal: 4
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
  - image: villa-lumiere-vue-ensemble-01
    url: /demo/property.svg
    caption: La villa et sa piscine privée ouvertes sur le jardin
    representativeOfPage: true
  - image: villa-lumiere-salon-01
    url: /demo/property.svg
    caption: Salon ouvert sur le jardin par de larges baies
  - image: villa-lumiere-exterieur-01
    url: /demo/property.svg
    caption: Terrasse et piscine bordées de grandes jarres
  - image: villa-lumiere-exterieur-02
    url: /demo/property.svg
    caption: Pergola ombragée au cœur du jardin
  - image: villa-lumiere-exterieur-03
    url: /demo/property.svg
    caption: Grande table conviviale sous les arbres
  - image: villa-lumiere-chambre-01
    url: /demo/property.svg
    caption: Chambre double aux teintes claires
  - image: villa-lumiere-chambre-02
    url: /demo/property.svg
    caption: Chambre en bois ouverte sur la terrasse
  - image: villa-lumiere-chambre-03
    url: /demo/property.svg
    caption: Chambre lumineuse aux rideaux chaleureux
  - image: villa-lumiere-chambre-04
    url: /demo/property.svg
    caption: Chambre avec moustiquaire et coin salon
  - image: villa-lumiere-cuisine-01
    url: /demo/property.svg
    caption: Cuisine ouverte sur les espaces de vie
  - image: villa-lumiere-salle-de-bains-01
    url: /demo/property.svg
    caption: Double vasque et baignoire
  - image: villa-lumiere-salle-de-bains-02
    url: /demo/property.svg
    caption: Salle d'eau habillée de bois
  - image: villa-lumiere-salon-02
    url: /demo/property.svg
    caption: Second salon ouvert et lumineux
  - image: villa-lumiere-salle-a-manger-01
    url: /demo/property.svg
    caption: Salle à manger autour d'une grande table
  - image: villa-lumiere-terrasse-01
    url: /demo/property.svg
    caption: Terrasse lounge ouverte sur le jardin
  - image: villa-lumiere-salon-03
    url: /demo/property.svg
    caption: Salon de réception aux tons clairs
realEstateAgent: null
highlight: null
review: null
isActive: true
metaTitle: Villa Lumière — Visite immersive | Mogador, Essaouira
metaDescription: Découvrez la Villa Lumière, villa de plain-pied de cinq chambres ouverte sur le golf de Mogador, à travers un parcours immersif espace après espace.

# Parcours immersif horizontal — un bloc hasPart = un écran (cf. deriveScreens).
# additionalType → gabarit, headline avec **accent**, meta.reverse / meta.overlayMode.
hasPart:
  - additionalType: SCREEN_ACCOMMODATION_FULL
    position: 1
    name: Vue d'ensemble
    headline: Une villa de plain-pied **au bord du golf**
    text: Posée entre fairways et grands arbres, une villa lumineuse de cinq chambres, pensée pour la lumière et la vie au rez-de-jardin.
    associatedMedia:
      - image: villa-lumiere-vue-ensemble-01

  - additionalType: SCREEN_ACCOMMODATION_SPLIT
    position: 2
    name: Les salons
    headline: Vivre **en grand**, baies ouvertes
    text: Un vaste salon ouvert sur le jardin par de hautes baies vitrées, prolongé par un mur de pierre et des assises profondes.
    meta:
      reverse: true
    associatedMedia:
      - image: villa-lumiere-salon-01

  - additionalType: SCREEN_ACCOMMODATION_TRYPTIQUE
    position: 3
    name: Les extérieurs
    headline: Le jardin, prolongé **jusqu'aux fairways**
    text: Terrasses ombragées, table de plein air et piscine privée composent un dehors généreux ouvert sur le golf.
    associatedMedia:
      - image: villa-lumiere-exterieur-01
      - image: villa-lumiere-exterieur-02
      - image: villa-lumiere-exterieur-03

  - additionalType: SCREEN_ACCOMMODATION_CAROUSEL
    position: 4
    name: Les chambres
    headline: Cinq chambres **de plain-pied**
    text: Cinq chambres ouvertes sur le jardin, des suites parentales aux chambres familiales, toutes baignées de lumière.
    associatedMedia:
      - image: villa-lumiere-chambre-01
      - image: villa-lumiere-chambre-02
      - image: villa-lumiere-chambre-03
      - image: villa-lumiere-chambre-04

  - additionalType: SCREEN_ACCOMMODATION_OVERLAY
    position: 5
    name: La cuisine
    headline: L'art de **recevoir**
    text: Une cuisine entièrement équipée, ouverte sur les pièces de vie et tournée vers le jardin.
    meta:
      overlayMode: dark
    associatedMedia:
      - image: villa-lumiere-cuisine-01

  - additionalType: SCREEN_ACCOMMODATION_DUO
    position: 6
    name: Les salles d'eau
    headline: Une **parenthèse** d'eau claire
    text: Double vasque, baignoire et douche composent des salles d'eau douces, en prise directe avec la lumière.
    associatedMedia:
      - image: villa-lumiere-salle-de-bains-01
      - image: villa-lumiere-salle-de-bains-02

  - additionalType: SCREEN_ACCOMMODATION_CAROUSEL
    position: 7
    name: Les espaces de vie
    headline: Des pièces **baignées de soleil**
    text: Du second salon à la salle à manger jusqu'aux terrasses lounge, chaque pièce s'ouvre sur le dehors.
    associatedMedia:
      - image: villa-lumiere-salon-02
      - image: villa-lumiere-salle-a-manger-01
      - image: villa-lumiere-terrasse-01
      - image: villa-lumiere-salon-03

  - additionalType: SCREEN_ACCOMMODATION_CONTACT
    position: 8
    name: Dernière étape
    headline: Intéressé ?
    text: 'Vous venez de visiter la Villa Lumière. Laissez-nous vos coordonnées pour organiser une visite privée.'
    associatedMedia: []
---

## Villa Lumière

Villa contemporaine de plain-pied, cinq chambres ouvertes sur le jardin et le golf de Mogador. Parcours immersif espace après espace, de la vue d'ensemble au contact.
