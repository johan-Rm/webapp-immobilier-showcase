---
# ──────────────────────────────────────────────────────────────────────────
# FIXTURE DE DÉMO — POC parcours immersif (tâche 033). Données FICTIVES,
# anonymisées, inspirées d'un listing réel (textes réécrits, nom/réf fictifs).
# content/*/accommodations/ est gitignoré ET purgé par `make dev-content-sync`.
# Source de vérité versionnée : ce fichier. Pour (ré)activer la fiche :
#   cp dev-book/fixtures/accommodations/villa-saadia-essaouira.md \
#      content/fr/accommodations/villa-saadia-essaouira.md
# ──────────────────────────────────────────────────────────────────────────
identifier: FBAVVA004
slug: villa-saadia-essaouira
name: Villa Saadia
dateCreated: 2026-06-10T00:00:00+00:00
dateModified: 2026-06-10T00:00:00+00:00
category: villa
realEstateListing: bien-a-vendre
place: ida-ougourd
offer:
  price: 18500000
  priceCurrency: MAD
  priceSpecification: À la vente
floorSize: 500
numberOfRooms: 12
numberOfBedrooms: 6
numberOfBathroomsTotal: 6
occupancy: 12
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
  - image: villa-saadia-vue-ensemble-01
    url: /demo/property.svg
    caption: Bassin et palmeraie au cœur de la demeure
    representativeOfPage: true
  - image: villa-saadia-patio-01
    url: /demo/property.svg
    caption: Patio ombragé sous les arches en terre
  - image: villa-saadia-piscine-01
    url: /demo/property.svg
    caption: Piscine entourée de verdure et de palmiers
  - image: villa-saadia-exterieur-01
    url: /demo/property.svg
    caption: Bassin fleuri au cœur du jardin
  - image: villa-saadia-exterieur-02
    url: /demo/property.svg
    caption: Grande table dressée pour les repas au jardin
  - image: villa-saadia-chambre-01
    url: /demo/property.svg
    caption: Chambre aux teintes sable et coussins moelleux
  - image: villa-saadia-chambre-02
    url: /demo/property.svg
    caption: Chambre à la tête de lit colorée
  - image: villa-saadia-chambre-03
    url: /demo/property.svg
    caption: Chambre aux poutres de bois et fenêtre cintrée
  - image: villa-saadia-chambre-04
    url: /demo/property.svg
    caption: Chambre en alcôve voûtée
  - image: villa-saadia-salon-01
    url: /demo/property.svg
    caption: Salon voûté aux assises profondes
  - image: villa-saadia-salle-de-bains-01
    url: /demo/property.svg
    caption: Plan vasque en pierre et miroir
  - image: villa-saadia-salle-de-bains-02
    url: /demo/property.svg
    caption: Salle d'eau en tadelakt ocre et lanternes
  - image: villa-saadia-salon-02
    url: /demo/property.svg
    caption: Séjour lumineux ouvert sur le jardin
  - image: villa-saadia-salon-03
    url: /demo/property.svg
    caption: Salon cosy ponctué de plantes et lanternes
  - image: villa-saadia-salon-04
    url: /demo/property.svg
    caption: Salon marocain aux tapis et coussins
  - image: villa-saadia-terrasse-01
    url: /demo/property.svg
    caption: Lounge ombragé sous pergola
realEstateAgent: null
highlight: null
review: null
isActive: true
metaTitle: Villa Saadia — Visite immersive | Campagne d'Essaouira
metaDescription: Découvrez la Villa Saadia, vaste demeure d'inspiration marocaine nichée dans la campagne d'Essaouira, à travers un parcours immersif espace après espace.

# Parcours immersif horizontal — un bloc hasPart = un écran (cf. deriveScreens).
# additionalType → gabarit, headline avec **accent**, meta.reverse / meta.overlayMode.
hasPart:
  - additionalType: SCREEN_ACCOMMODATION_FULL
    position: 1
    name: Vue d'ensemble
    headline: Une demeure **sous les palmiers**
    text: À vingt minutes d'Essaouira, une vaste demeure de tadelakt et d'arches, nichée dans un jardin de palmiers autour d'un grand bassin.
    associatedMedia:
      - image: villa-saadia-vue-ensemble-01

  - additionalType: SCREEN_ACCOMMODATION_SPLIT
    position: 2
    name: Le patio
    headline: Vivre **à l'ombre des arches**
    text: Un patio aux murs ocres et banquettes profondes, point de ralliement entre dedans et dehors aux heures chaudes.
    meta:
      reverse: true
    associatedMedia:
      - image: villa-saadia-patio-01

  - additionalType: SCREEN_ACCOMMODATION_TRYPTIQUE
    position: 3
    name: Les extérieurs
    headline: Un jardin **luxuriant**
    text: Piscine à débordement bordée de fleurs, longues tables de plein air et coins d'ombre rythment un jardin généreux.
    associatedMedia:
      - image: villa-saadia-piscine-01
      - image: villa-saadia-exterieur-01
      - image: villa-saadia-exterieur-02

  - additionalType: SCREEN_ACCOMMODATION_CAROUSEL
    position: 4
    name: Les chambres
    headline: Six chambres **indépendantes**
    text: Six chambres habillées de tadelakt et de bois, entre alcôves voûtées et fenêtres ouvertes sur la verdure.
    associatedMedia:
      - image: villa-saadia-chambre-01
      - image: villa-saadia-chambre-02
      - image: villa-saadia-chambre-03
      - image: villa-saadia-chambre-04

  - additionalType: SCREEN_ACCOMMODATION_OVERLAY
    position: 5
    name: Les salons
    headline: Sous les **voûtes**
    text: Un grand salon voûté aux assises basses et tapis, prolongé par la cheminée en tadelakt.
    meta:
      overlayMode: dark
    associatedMedia:
      - image: villa-saadia-salon-01

  - additionalType: SCREEN_ACCOMMODATION_DUO
    position: 6
    name: Les salles de bains
    headline: Le tadelakt et **la lumière**
    text: Vasques de pierre, miroirs ronds et lanternes composent des salles d'eau aux matières brutes et chaleureuses.
    associatedMedia:
      - image: villa-saadia-salle-de-bains-01
      - image: villa-saadia-salle-de-bains-02

  - additionalType: SCREEN_ACCOMMODATION_CAROUSEL
    position: 7
    name: Les espaces de vie
    headline: Des pièces **chaleureuses**
    text: Du séjour lumineux aux salons d'inspiration marocaine jusqu'aux lounges sous pergola, chaque pièce invite à la détente.
    associatedMedia:
      - image: villa-saadia-salon-02
      - image: villa-saadia-salon-03
      - image: villa-saadia-salon-04
      - image: villa-saadia-terrasse-01

  - additionalType: SCREEN_ACCOMMODATION_CONTACT
    position: 8
    name: Dernière étape
    headline: Intéressé ?
    text: 'Vous venez de visiter la Villa Saadia. Laissez-nous vos coordonnées pour organiser une visite privée.'
    associatedMedia: []
---

## Villa Saadia

Vaste demeure d'inspiration marocaine dans la campagne d'Essaouira, six chambres indépendantes et grand bassin sous les palmiers. Parcours immersif espace après espace, de la vue d'ensemble au contact.
