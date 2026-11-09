---
# ──────────────────────────────────────────────────────────────────────────
# FIXTURE DE DÉMO — POC parcours immersif (tâche 033). Données FICTIVES,
# anonymisées, inspirées d'un listing réel (textes réécrits, nom/réf fictifs).
# content/*/accommodations/ est gitignoré ET purgé par `make dev-content-sync`.
# Source de vérité versionnée : ce fichier. Pour (ré)activer la fiche :
#   cp dev-book/fixtures/accommodations/villa-soleil-essaouira.md \
#      content/fr/accommodations/villa-soleil-essaouira.md
# ──────────────────────────────────────────────────────────────────────────
identifier: FBAVVA005
slug: villa-soleil-essaouira
name: Villa Soleil
dateCreated: 2026-06-10T00:00:00+00:00
dateModified: 2026-06-10T00:00:00+00:00
category: villa
realEstateListing: bien-a-vendre
place: campagne-d-essaouira
offer:
  price: 24000000
  priceCurrency: MAD
  priceSpecification: À la vente
floorSize: 700
numberOfRooms: 14
numberOfBedrooms: 5
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
  - image: villa-soleil-vue-ensemble-01
    url: /demo/property.svg
    caption: La demeure et son bassin au crépuscule
    representativeOfPage: true
  - image: villa-soleil-salon-01
    url: /demo/property.svg
    caption: Grand salon voûté ouvert sur le jardin
  - image: villa-soleil-piscine-01
    url: /demo/property.svg
    caption: Piscine et parasols devant la demeure
  - image: villa-soleil-exterieur-01
    url: /demo/property.svg
    caption: Terrasse ombragée ouverte sur le jardin
  - image: villa-soleil-terrasse-01
    url: /demo/property.svg
    caption: Toit-terrasse lounge panoramique
  - image: villa-soleil-chambre-01
    url: /demo/property.svg
    caption: Chambre double aux fenêtres cintrées
  - image: villa-soleil-chambre-02
    url: /demo/property.svg
    caption: Chambre blanche baignée de lumière
  - image: villa-soleil-chambre-03
    url: /demo/property.svg
    caption: Chambre aux teintes douces
  - image: villa-soleil-chambre-04
    url: /demo/property.svg
    caption: Chambre claire ouverte sur le jardin
  - image: villa-soleil-salon-02
    url: /demo/property.svg
    caption: Salon avec cheminée et assises colorées
  - image: villa-soleil-salle-de-bains-01
    url: /demo/property.svg
    caption: Double vasque sous fenêtre en mashrabiya
  - image: villa-soleil-salle-de-bains-02
    url: /demo/property.svg
    caption: Baignoire devant la fenêtre cintrée
  - image: villa-soleil-salle-a-manger-01
    url: /demo/property.svg
    caption: Salle à manger sous voûtes autour d'une grande table
  - image: villa-soleil-piscine-interieure-01
    url: /demo/property.svg
    caption: Piscine intérieure couverte et voûtée
  - image: villa-soleil-golf-01
    url: /demo/property.svg
    caption: Putting green privatif dans le jardin
  - image: villa-soleil-salon-03
    url: /demo/property.svg
    caption: Salon lounge aux banquettes basses
realEstateAgent: null
highlight: null
review: null
isActive: true
metaTitle: Villa Soleil — Visite immersive | Campagne d'Essaouira
metaDescription: Découvrez la Villa Soleil, vaste propriété de prestige dans la campagne d'Essaouira, avec tennis, putting green et piscines, à travers un parcours immersif.

# Parcours immersif horizontal — un bloc hasPart = un écran (cf. deriveScreens).
# additionalType → gabarit, headline avec **accent**, meta.reverse / meta.overlayMode.
hasPart:
  - additionalType: SCREEN_ACCOMMODATION_FULL
    position: 1
    name: Vue d'ensemble
    headline: Une propriété de prestige **au bord de l'eau**
    text: Dans la campagne d'Essaouira, une vaste demeure ocre déployée autour d'un bassin et de jardins, pensée pour recevoir en grand.
    associatedMedia:
      - image: villa-soleil-vue-ensemble-01

  - additionalType: SCREEN_ACCOMMODATION_SPLIT
    position: 2
    name: Les salons
    headline: De grands volumes **sous voûtes**
    text: Un salon vaste et lumineux sous de hautes voûtes, ouvert sur les jardins par de larges arches.
    meta:
      reverse: true
    associatedMedia:
      - image: villa-soleil-salon-01

  - additionalType: SCREEN_ACCOMMODATION_TRYPTIQUE
    position: 3
    name: Les extérieurs
    headline: Jardins, terrasses **et piscine**
    text: Piscine chauffée bordée de parasols, vaste terrasse de mille mètres carrés et toit-terrasse panoramique.
    associatedMedia:
      - image: villa-soleil-piscine-01
      - image: villa-soleil-exterieur-01
      - image: villa-soleil-terrasse-01

  - additionalType: SCREEN_ACCOMMODATION_CAROUSEL
    position: 4
    name: Les chambres
    headline: Cinq chambres **lumineuses**
    text: Cinq chambres aux fenêtres cintrées, entre blanc lumineux et matières naturelles, ouvertes sur les jardins.
    associatedMedia:
      - image: villa-soleil-chambre-01
      - image: villa-soleil-chambre-02
      - image: villa-soleil-chambre-03
      - image: villa-soleil-chambre-04

  - additionalType: SCREEN_ACCOMMODATION_OVERLAY
    position: 5
    name: Le salon cheminée
    headline: Veillées **au coin du feu**
    text: Un salon d'inspiration marocaine autour de sa cheminée, ponctué de couleurs et d'assises basses.
    meta:
      overlayMode: dark
    associatedMedia:
      - image: villa-soleil-salon-02

  - additionalType: SCREEN_ACCOMMODATION_DUO
    position: 6
    name: Les salles de bains
    headline: Six salles d'eau **baignées de jour**
    text: Doubles vasques, baignoires et mashrabiyas filtrent la lumière dans des salles d'eau spacieuses.
    associatedMedia:
      - image: villa-soleil-salle-de-bains-01
      - image: villa-soleil-salle-de-bains-02

  - additionalType: SCREEN_ACCOMMODATION_CAROUSEL
    position: 7
    name: Vivre et recevoir
    headline: Une propriété **à vivre**
    text: Salle à manger sous voûtes, piscine intérieure, putting green et salons composent un art de recevoir sans limite.
    associatedMedia:
      - image: villa-soleil-salle-a-manger-01
      - image: villa-soleil-piscine-interieure-01
      - image: villa-soleil-golf-01
      - image: villa-soleil-salon-03

  - additionalType: SCREEN_ACCOMMODATION_CONTACT
    position: 8
    name: Dernière étape
    headline: Intéressé ?
    text: 'Vous venez de visiter la Villa Soleil. Laissez-nous vos coordonnées pour organiser une visite privée.'
    associatedMedia: []
---

## Villa Soleil

Vaste propriété de prestige dans la campagne d'Essaouira : cinq chambres, tennis, putting green et piscines intérieure et extérieure. Parcours immersif espace après espace, de la vue d'ensemble au contact.
