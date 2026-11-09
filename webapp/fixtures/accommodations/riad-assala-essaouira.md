---
# ──────────────────────────────────────────────────────────────────────────
# FIXTURE DE DÉMO — POC parcours immersif (tâche 033). Données FICTIVES,
# anonymisées, inspirées d'un listing réel (textes réécrits, nom/réf fictifs).
# content/*/accommodations/ est gitignoré ET purgé par `make dev-content-sync`.
# Source de vérité versionnée : ce fichier. Pour (ré)activer la fiche :
#   cp dev-book/fixtures/accommodations/riad-assala-essaouira.md \
#      content/fr/accommodations/riad-assala-essaouira.md
# ──────────────────────────────────────────────────────────────────────────
identifier: FBAVVA009
slug: riad-assala-essaouira
name: Riad Assala
dateCreated: 2026-06-10T00:00:00+00:00
dateModified: 2026-06-10T00:00:00+00:00
category: villa
realEstateListing: bien-a-vendre
place: ounagha
offer:
  price: 16900000
  priceCurrency: MAD
  priceSpecification: À la vente
floorSize: 420
numberOfRooms: 12
numberOfBedrooms: 7
numberOfBathroomsTotal: 7
occupancy: 14
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
  - image: riad-assala-vue-ensemble-01
    url: /demo/property.svg
    caption: Le riad et sa piscine au crépuscule
    representativeOfPage: true
  - image: riad-assala-patio-01
    url: /demo/property.svg
    caption: Patio couvert aux lanternes et tapis
  - image: riad-assala-piscine-01
    url: /demo/property.svg
    caption: Piscine sous pergola et zellige
  - image: riad-assala-spa-01
    url: /demo/property.svg
    caption: Jacuzzi extérieur entouré de verdure
  - image: riad-assala-exterieur-01
    url: /demo/property.svg
    caption: Jardins arborés et dépendances
  - image: riad-assala-chambre-01
    url: /demo/property.svg
    caption: Chambre aux teintes grenat et fenêtres cintrées
  - image: riad-assala-chambre-02
    url: /demo/property.svg
    caption: Chambre épurée aux tons neutres
  - image: riad-assala-chambre-03
    url: /demo/property.svg
    caption: Chambre aux rideaux rouges et décor ciselé
  - image: riad-assala-chambre-04
    url: /demo/property.svg
    caption: Chambre chaleureuse aux coussins brodés
  - image: riad-assala-salon-01
    url: /demo/property.svg
    caption: Salon marocain aux banquettes basses
  - image: riad-assala-salle-de-bains-01
    url: /demo/property.svg
    caption: Double vasque en zellige bleu
  - image: riad-assala-salle-de-bains-02
    url: /demo/property.svg
    caption: Salle de bain aux faïences ciselées
  - image: riad-assala-hammam-01
    url: /demo/property.svg
    caption: Hammam habillé de zellige
  - image: riad-assala-petit-dejeuner-01
    url: /demo/property.svg
    caption: Petit-déjeuner dressé sur table en zellige
  - image: riad-assala-salon-02
    url: /demo/property.svg
    caption: Salon ouvert sur le jardin par les arches
  - image: riad-assala-patio-02
    url: /demo/property.svg
    caption: Patio planté aux assises colorées
realEstateAgent: null
highlight: null
review: null
isActive: true
metaTitle: Riad Assala — Visite immersive | Campagne d'Essaouira
metaDescription: Découvrez le Riad Assala, riad d'exception aux zelliges et patios dans la campagne d'Essaouira, à travers un parcours immersif espace après espace.

# Parcours immersif horizontal — un bloc hasPart = un écran (cf. deriveScreens).
hasPart:
  - additionalType: SCREEN_ACCOMMODATION_FULL
    position: 1
    name: Vue d'ensemble
    headline: Un riad **au cœur du jardin**
    text: Un riad d'exception et ses dépendances, ouverts sur la piscine et les jardins à la tombée du jour.
    associatedMedia:
      - image: riad-assala-vue-ensemble-01

  - additionalType: SCREEN_ACCOMMODATION_SPLIT
    position: 2
    name: Le patio
    headline: Le patio, **cœur du riad**
    text: Un patio couvert aux lanternes et tapis, point de passage frais entre les espaces de vie.
    meta:
      reverse: true
    associatedMedia:
      - image: riad-assala-patio-01

  - additionalType: SCREEN_ACCOMMODATION_TRYPTIQUE
    position: 3
    name: Les extérieurs
    headline: Piscine, spa **et jardins**
    text: Piscine sous pergola habillée de zellige, jacuzzi extérieur et jardins arborés composent un dehors raffiné.
    associatedMedia:
      - image: riad-assala-piscine-01
      - image: riad-assala-spa-01
      - image: riad-assala-exterieur-01

  - additionalType: SCREEN_ACCOMMODATION_CAROUSEL
    position: 4
    name: Les chambres
    headline: Sept chambres **ornées**
    text: Sept chambres habillées de tissus et de zelliges, chacune avec sa salle de bain privative.
    associatedMedia:
      - image: riad-assala-chambre-01
      - image: riad-assala-chambre-02
      - image: riad-assala-chambre-03
      - image: riad-assala-chambre-04

  - additionalType: SCREEN_ACCOMMODATION_OVERLAY
    position: 5
    name: Les salons
    headline: L'art du **salon marocain**
    text: Un salon marocain aux banquettes basses et table ciselée, pensé pour les longues soirées.
    meta:
      overlayMode: dark
    associatedMedia:
      - image: riad-assala-salon-01

  - additionalType: SCREEN_ACCOMMODATION_DUO
    position: 6
    name: Les salles de bains
    headline: Le zellige **en majesté**
    text: Doubles vasques, miroirs cintrés et zelliges bleus composent des salles de bains précieuses.
    associatedMedia:
      - image: riad-assala-salle-de-bains-01
      - image: riad-assala-salle-de-bains-02

  - additionalType: SCREEN_ACCOMMODATION_CAROUSEL
    position: 7
    name: Bien-être et convivialité
    headline: Prendre **le temps**
    text: Du hammam aux petits-déjeuners colorés jusqu'aux salons ouverts et patios, le riad invite à ralentir.
    associatedMedia:
      - image: riad-assala-hammam-01
      - image: riad-assala-petit-dejeuner-01
      - image: riad-assala-salon-02
      - image: riad-assala-patio-02

  - additionalType: SCREEN_ACCOMMODATION_CONTACT
    position: 8
    name: Dernière étape
    headline: Intéressé ?
    text: 'Vous venez de visiter le Riad Assala. Laissez-nous vos coordonnées pour organiser une visite privée.'
    associatedMedia: []
---

## Riad Assala

Riad d'exception aux zelliges et patios dans la campagne d'Essaouira, sept chambres, piscine, hammam et spa. Parcours immersif espace après espace, de la vue d'ensemble au contact.
