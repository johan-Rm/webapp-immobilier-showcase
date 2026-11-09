---
# ──────────────────────────────────────────────────────────────────────────
# COPIE DE SAUVEGARDE (non purgée par content-sync) — POC parcours immersif.
# Le dossier content/*/accommodations/ est gitignoré ET purgé par
# `make dev-content-sync` (scripts/content-sync.ts → purgeMarkdownDir).
# Source de vérité de ce contenu : app/pages/villa-des-alizes-mobile.vue.
# À supprimer une fois le bien `villa-des-alizes` géré côté back (Symfony).
# Pour réactiver la page content-driven : copier ce fichier dans
#   content/fr/accommodations/villa-des-alizes.md
# ──────────────────────────────────────────────────────────────────────────
identifier: FBAVVA001
slug: villa-des-alizes
name: Villa des Alizés
dateCreated: 2026-06-09T00:00:00+00:00
dateModified: 2026-06-09T00:00:00+00:00
category: villa
realEstateListing: bien-a-vendre
place: essaouira
offer:
  price: 12500000
  priceCurrency: MAD
  priceSpecification: À la vente
floorSize: 280
numberOfRooms: 5
numberOfBedrooms: 3
numberOfBathroomsTotal: 2
occupancy: 6
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
  - image: villa-des-alizes-vue-ensemble-01
    url: /demo/property.svg
    caption: Villa et piscine privée ouvertes sur le jardin
    representativeOfPage: true
  - image: villa-des-alizes-entree-01
    url: /demo/property.svg
    caption: Couloir d'entrée lumineux avec banquette
  - image: villa-des-alizes-salon-04
    url: /demo/property.svg
    caption: Salon ouvert sur le jardin
  - image: villa-des-alizes-salon-02
    url: /demo/property.svg
    caption: Séjour et salle à manger réunis
  - image: villa-des-alizes-salon-05
    url: /demo/property.svg
    caption: Salon avec cheminée et large vue
  - image: villa-des-alizes-exterieur-01
    url: /demo/property.svg
    caption: Terrasse repas ouverte sur le jardin et la piscine
  - image: villa-des-alizes-piscine-01
    url: /demo/property.svg
    caption: Piscine privée bordée de pierre avec transat
  - image: villa-des-alizes-piscine-02
    url: /demo/property.svg
    caption: Transats au bord de la piscine
  - image: villa-des-alizes-exterieur-03
    url: /demo/property.svg
    caption: Toit-terrasse avec vue sur le golf
  - image: villa-des-alizes-exterieur-05
    url: /demo/property.svg
    caption: Terrasse ombragée sous voile au cœur du jardin
  - image: villa-des-alizes-cuisine-01
    url: /demo/property.svg
    caption: Cuisine américaine ouverte sur la salle à manger
  - image: villa-des-alizes-chambre-05
    url: /demo/property.svg
    caption: Suite aux teintes chaudes ouverte sur le jardin
  - image: villa-des-alizes-chambre-02
    url: /demo/property.svg
    caption: Chambre lits jumeaux et coin bibliothèque
  - image: villa-des-alizes-chambre-04
    url: /demo/property.svg
    caption: Chambre double avec banquette en rotin
  - image: villa-des-alizes-chambre-06
    url: /demo/property.svg
    caption: Chambre lumineuse ouverte sur la pelouse
  - image: villa-des-alizes-salle-de-bains-03
    url: /demo/property.svg
    caption: Douche à l'italienne et baignoire en travertin
  - image: villa-des-alizes-salle-de-bains-02
    url: /demo/property.svg
    caption: Vasque et baignoire ouvertes sur le jardin
realEstateAgent: null
highlight: null
review: null
isActive: true
metaTitle: Villa des Alizés — Visite immersive | Essaouira, Maroc
metaDescription: Découvrez la Villa des Alizés, oasis contemporaine au cœur d'un domaine de golf à Essaouira, à travers un parcours immersif, espace après espace.

# Parcours immersif horizontal — un bloc hasPart = un écran (cf. deriveScreens).
# additionalType → gabarit, headline avec **accent**, meta.reverse / meta.overlayMode.
hasPart:
  - additionalType: SCREEN_ACCOMMODATION_FULL
    position: 1
    name: Vue d'ensemble
    headline: Une oasis contemporaine **au cœur du golf**
    text: Entre fairways et Atlantique, une villa de plain-pied baignée de lumière, pensée pour le calme et la douceur de vivre.
    associatedMedia:
      - image: villa-des-alizes-vue-ensemble-01

  - additionalType: SCREEN_ACCOMMODATION_SPLIT
    position: 2
    name: L'entrée
    headline: Le seuil de la **sérénité**
    text: 'Un couloir lumineux ponctué de banquettes et de pièces chinées donne le ton : calme et élégance discrète.'
    meta:
      reverse: true
    associatedMedia:
      - image: villa-des-alizes-entree-01

  - additionalType: SCREEN_ACCOMMODATION_TRYPTIQUE
    position: 3
    name: Les salons
    headline: Vivre grand, **autour du feu**
    text: Un salon et une salle à manger réunis sous de hautes baies vitrées, autour d'une cheminée et prolongés par la terrasse.
    associatedMedia:
      - image: villa-des-alizes-salon-04
      - image: villa-des-alizes-salon-02
      - image: villa-des-alizes-salon-05

  - additionalType: SCREEN_ACCOMMODATION_CAROUSEL
    position: 4
    name: Les extérieurs
    headline: Le jardin, prolongé **jusqu'au green**
    text: Terrasses, piscine privée de 9,5 × 4 m et toit-terrasse aménagé ouvrent la villa sur le domaine de golf.
    associatedMedia:
      - image: villa-des-alizes-exterieur-01
      - image: villa-des-alizes-piscine-01
      - image: villa-des-alizes-piscine-02
      - image: villa-des-alizes-exterieur-03
      - image: villa-des-alizes-exterieur-05

  - additionalType: SCREEN_ACCOMMODATION_OVERLAY
    position: 5
    name: La cuisine
    headline: L'art de **recevoir**
    text: Une cuisine américaine entièrement équipée, ouverte sur la grande table conviviale et la terrasse.
    meta:
      overlayMode: dark
    associatedMedia:
      - image: villa-des-alizes-cuisine-01

  - additionalType: SCREEN_ACCOMMODATION_CAROUSEL
    position: 6
    name: Les chambres
    headline: Trois chambres de **plain-pied**
    text: Trois chambres climatisées ouvertes sur le jardin, dont une suite avec cheminée, salon et salle de bain privée.
    associatedMedia:
      - image: villa-des-alizes-chambre-05
      - image: villa-des-alizes-chambre-02
      - image: villa-des-alizes-chambre-04
      - image: villa-des-alizes-chambre-06

  - additionalType: SCREEN_ACCOMMODATION_DUO
    position: 7
    name: Les salles de bains
    headline: Une parenthèse **spa**
    text: Travertin, double vasque, baignoire et douche à l'italienne composent des salles d'eau pleines de douceur.
    associatedMedia:
      - image: villa-des-alizes-salle-de-bains-03
      - image: villa-des-alizes-salle-de-bains-02

  - additionalType: SCREEN_ACCOMMODATION_CONTACT
    position: 8
    name: Dernière étape
    headline: Intéressé ?
    text: "Vous venez de visiter la Villa des Alizés. Ménage quotidien, chef et entretien sont inclus : il ne vous reste qu'à profiter. Laissez-nous vos coordonnées pour une visite privée."
    associatedMedia: []
---

## Villa des Alizés

Oasis contemporaine de plain-pied au cœur d'un domaine de golf à Essaouira, pensée pour le calme et la douceur de vivre. Parcours immersif espace après espace, de la vue d'ensemble au contact.
