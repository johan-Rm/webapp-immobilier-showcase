---
# ──────────────────────────────────────────────────────────────────────────
# FIXTURE DE DÉMO — POC parcours immersif (tâche 033). Données FICTIVES,
# anonymisées, inspirées d'un listing réel (textes réécrits, nom/réf fictifs).
# content/*/accommodations/ est gitignoré ET purgé par `make dev-content-sync`.
# Source de vérité versionnée : ce fichier. Pour (ré)activer la fiche :
#   cp dev-book/fixtures/accommodations/domaine-tilila-essaouira.md \
#      content/fr/accommodations/domaine-tilila-essaouira.md
# ──────────────────────────────────────────────────────────────────────────
identifier: FBAVVA007
slug: domaine-tilila-essaouira
name: Domaine Tilila
dateCreated: 2026-06-10T00:00:00+00:00
dateModified: 2026-06-10T00:00:00+00:00
category: villa
realEstateListing: bien-a-vendre
place: zone-rurale
offer:
  price: 32000000
  priceCurrency: MAD
  priceSpecification: À la vente
floorSize: 560
numberOfRooms: 20
numberOfBedrooms: 10
numberOfBathroomsTotal: 10
occupancy: 20
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
  - image: domaine-tilila-vue-ensemble-01
    url: /demo/property.svg
    caption: Le domaine et sa piscine au cœur du jardin
    representativeOfPage: true
  - image: domaine-tilila-salon-01
    url: /demo/property.svg
    caption: Séjour aux bibliothèques intégrées et cheminée
  - image: domaine-tilila-piscine-01
    url: /demo/property.svg
    caption: Piscine et transats sous les palmiers
  - image: domaine-tilila-exterieur-01
    url: /demo/property.svg
    caption: Piscine bordée de palmiers et de pelouse
  - image: domaine-tilila-exterieur-02
    url: /demo/property.svg
    caption: Lounge de jardin au bord de l'eau
  - image: domaine-tilila-chambre-01
    url: /demo/property.svg
    caption: Chambre aux accents turquoise
  - image: domaine-tilila-chambre-02
    url: /demo/property.svg
    caption: Chambre aux teintes safran
  - image: domaine-tilila-chambre-03
    url: /demo/property.svg
    caption: Chambre corail ouverte sur la vue
  - image: domaine-tilila-chambre-04
    url: /demo/property.svg
    caption: Chambre vert sauge ouverte sur le jardin
  - image: domaine-tilila-chambre-05
    url: /demo/property.svg
    caption: Chambre turquoise spacieuse
  - image: domaine-tilila-salon-02
    url: /demo/property.svg
    caption: Grand salon avec cheminée et larges baies
  - image: domaine-tilila-salle-de-bains-01
    url: /demo/property.svg
    caption: Double vasque de pierre ouverte sur la vue
  - image: domaine-tilila-salle-de-bains-02
    url: /demo/property.svg
    caption: Salle de bain avec double vasque et douche
  - image: domaine-tilila-salle-a-manger-01
    url: /demo/property.svg
    caption: Grande table de banquet sous les baies
  - image: domaine-tilila-salle-a-manger-02
    url: /demo/property.svg
    caption: Salle à manger ouverte sur le séjour
  - image: domaine-tilila-cuisine-01
    url: /demo/property.svg
    caption: Cuisine équipée à l'îlot central
  - image: domaine-tilila-exterieur-03
    url: /demo/property.svg
    caption: Table de plein air dressée sur la terrasse
  - image: domaine-tilila-terrasse-01
    url: /demo/property.svg
    caption: Terrasse lounge ouverte sur la piscine
realEstateAgent: null
highlight: null
review: null
isActive: true
metaTitle: Domaine Tilila — Visite immersive | Campagne d'Essaouira
metaDescription: Découvrez le Domaine Tilila, vaste propriété contemporaine aux teintes sable dans la campagne d'Essaouira, à travers un parcours immersif espace après espace.

# Parcours immersif horizontal — un bloc hasPart = un écran (cf. deriveScreens).
hasPart:
  - additionalType: SCREEN_ACCOMMODATION_FULL
    position: 1
    name: Vue d'ensemble
    headline: Un domaine contemporain **aux teintes sable**
    text: Dans la campagne d'Essaouira, une vaste propriété aux volumes épurés et tons sable, déployée autour de ses piscines et terrasses.
    associatedMedia:
      - image: domaine-tilila-vue-ensemble-01

  - additionalType: SCREEN_ACCOMMODATION_SPLIT
    position: 2
    name: Les pièces de vie
    headline: La lumière, **partout**
    text: De grands séjours aux bibliothèques intégrées et cheminées, baignés de lumière par de hautes baies.
    meta:
      reverse: true
    associatedMedia:
      - image: domaine-tilila-salon-01

  - additionalType: SCREEN_ACCOMMODATION_TRYPTIQUE
    position: 3
    name: Les extérieurs
    headline: Piscines **et palmeraie**
    text: Plusieurs piscines, transats à l'ombre des palmiers et lounges de jardin composent un dehors d'exception.
    associatedMedia:
      - image: domaine-tilila-piscine-01
      - image: domaine-tilila-exterieur-01
      - image: domaine-tilila-exterieur-02

  - additionalType: SCREEN_ACCOMMODATION_CAROUSEL
    position: 4
    name: Les chambres
    headline: Dix chambres **colorées**
    text: Dix chambres aux teintes vives et matières naturelles, chacune ouverte sur une terrasse ou le jardin.
    associatedMedia:
      - image: domaine-tilila-chambre-01
      - image: domaine-tilila-chambre-02
      - image: domaine-tilila-chambre-03
      - image: domaine-tilila-chambre-04
      - image: domaine-tilila-chambre-05

  - additionalType: SCREEN_ACCOMMODATION_OVERLAY
    position: 5
    name: Le grand salon
    headline: Un salon **au coin du feu**
    text: Un grand salon autour de sa cheminée et de ses bibliothèques, ouvert sur la terrasse par de larges baies.
    meta:
      overlayMode: dark
    associatedMedia:
      - image: domaine-tilila-salon-02

  - additionalType: SCREEN_ACCOMMODATION_DUO
    position: 6
    name: Les salles de bains
    headline: La pierre claire **et la lumière**
    text: Doubles vasques de pierre, douches à l'italienne et grands miroirs composent des salles d'eau lumineuses.
    associatedMedia:
      - image: domaine-tilila-salle-de-bains-01
      - image: domaine-tilila-salle-de-bains-02

  - additionalType: SCREEN_ACCOMMODATION_CAROUSEL
    position: 7
    name: Recevoir
    headline: Recevoir **sans limite**
    text: De la grande table de banquet aux séjours ouverts, à la cuisine équipée et aux repas au jardin, le domaine est pensé pour les grandes tablées.
    associatedMedia:
      - image: domaine-tilila-salle-a-manger-01
      - image: domaine-tilila-salle-a-manger-02
      - image: domaine-tilila-cuisine-01
      - image: domaine-tilila-exterieur-03

  - additionalType: SCREEN_ACCOMMODATION_SPLIT
    position: 8
    name: Les terrasses
    headline: Des terrasses **face au paysage**
    text: Terrasses privatives et coins lounge ouvrent les chambres et les salons sur la piscine et la campagne.
    associatedMedia:
      - image: domaine-tilila-terrasse-01

  - additionalType: SCREEN_ACCOMMODATION_CONTACT
    position: 9
    name: Dernière étape
    headline: Intéressé ?
    text: 'Vous venez de visiter le Domaine Tilila. Laissez-nous vos coordonnées pour organiser une visite privée.'
    associatedMedia: []
---

## Domaine Tilila

Vaste propriété contemporaine aux teintes sable dans la campagne d'Essaouira, dix chambres et piscines. Parcours immersif espace après espace, de la vue d'ensemble au contact.
