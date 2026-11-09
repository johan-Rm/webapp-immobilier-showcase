Voici un document qui pourra servir de **socle fonctionnel** pour ton futur agent IA SEO. Il est volontairement orienté "expert métier" plutôt que simple référence théorique.

# Les 8 piliers du SEO moderne (2026)

## Objectif

Le référencement naturel ne se limite plus à optimiser quelques balises HTML. Un site performant combine aujourd'hui plusieurs disciplines complémentaires qui permettent d'améliorer sa visibilité aussi bien sur Google que dans les moteurs de recherche génératifs (ChatGPT, Gemini, Perplexity, Claude...).

L'ensemble de ces disciplines constitue le socle d'une stratégie SEO moderne.

---

# 1. SEO Technique

## Mission

Garantir que le site soit parfaitement exploré, compris et indexé par les moteurs de recherche.

## Compétences

- Architecture du site
- Arborescence
- Performances
- Core Web Vitals
- Temps de chargement
- Responsive
- Accessibilité
- Sitemap XML
- Robots.txt
- URLs
- Canonical
- Redirections
- Hreflang
- Données structurées (Schema.org)
- SSR / SSG
- Gestion du crawl
- Indexation
- Optimisation des images

## Questions auxquelles répondre

- Pourquoi cette page n'est-elle pas indexée ?
- Comment améliorer le LCP ?
- Les données structurées sont-elles correctes ?
- Cette architecture est-elle SEO Friendly ?

---

# 2. SEO On-Page

## Mission

Optimiser chaque page individuellement.

## Compétences

- Balises Title
- Meta Description
- Hiérarchie H1-H6
- Structure HTML
- Sémantique
- Optimisation des images
- Liens internes
- Rich Snippets
- FAQ
- Optimisation du contenu
- Intentions de recherche

## Questions

- Cette page est-elle optimisée ?
- Quel H1 utiliser ?
- Comment améliorer le CTR ?
- Quels mots-clés secondaires ajouter ?

---

# 3. Content SEO

## Mission

Produire un contenu utile, pertinent et durable.

## Compétences

- Recherche d'intentions
- Recherche de mots-clés
- Clusters
- Cocons sémantiques
- Calendrier éditorial
- Longue traîne
- Optimisation continue
- Maillage interne éditorial
- Evergreen Content

## Questions

- Quels articles produire ?
- Quels sujets sont manquants ?
- Quel cocon créer ?
- Comment enrichir cette page ?

---

# 4. SEO Off-Page

## Mission

Développer l'autorité du domaine.

## Compétences

- Netlinking
- Backlinks
- Digital PR
- Guest Blogging
- Mentions
- Réputation
- Branding
- Popularité

## Questions

- Pourquoi mon concurrent me dépasse ?
- Mon profil de backlinks est-il sain ?
- Quelle stratégie de netlinking adopter ?

---

# 5. Local SEO

## Mission

Optimiser la visibilité locale.

## Compétences

- Google Business Profile
- Avis clients
- NAP
- Pages locales
- Géolocalisation
- Cartographie
- SEO local

## Questions

- Pourquoi mon agence n'apparaît-elle pas sur Maps ?
- Comment améliorer ma visibilité locale ?

---

# 6. E-E-A-T

## Mission

Construire la confiance.

## Compétences

### Experience

Preuves d'expérience réelle.

### Expertise

Compétences démontrées.

### Authoritativeness

Autorité reconnue.

### Trustworthiness

Fiabilité.

## Questions

- Le contenu inspire-t-il confiance ?
- Comment renforcer la crédibilité ?
- Quels signaux de confiance manquent ?

---

# 7. SXO (Search Experience Optimization)

## Mission

Transformer le trafic en utilisateurs.

## Compétences

- UX
- UI
- Conversion
- Ergonomie
- Temps passé
- Engagement
- Funnel
- CTA
- Heatmaps

## Questions

- Pourquoi les visiteurs quittent-ils cette page ?
- Comment améliorer le taux de conversion ?

---

# 8. GEO (Generative Engine Optimization)

## Mission

Optimiser le contenu pour les moteurs de recherche basés sur l'IA.

## Compétences

- Réponses structurées
- FAQ
- Données structurées
- Sources
- Citations
- Contenu factuel
- Entités
- Relations entre concepts
- AEO
- LLM Optimization

## Questions

- Cette page sera-t-elle comprise par ChatGPT ?
- Peut-elle être citée par Gemini ?
- Comment structurer le contenu pour les IA ?

---

# Vision globale

```text
SEO Moderne

├── SEO Technique
│   ├── Crawl
│   ├── Indexation
│   ├── Performance
│   └── Structure
│
├── SEO On-Page
│   ├── HTML
│   ├── Balises
│   ├── Sémantique
│   └── Optimisation
│
├── Content SEO
│   ├── Intentions
│   ├── Mots-clés
│   ├── Clusters
│   └── Maillage
│
├── SEO Off-Page
│   ├── Backlinks
│   ├── Autorité
│   └── Popularité
│
├── Local SEO
│   ├── Maps
│   ├── Avis
│   └── Localisation
│
├── E-E-A-T
│   ├── Experience
│   ├── Expertise
│   ├── Authorité
│   └── Confiance
│
├── SXO
│   ├── UX
│   ├── Conversion
│   └── Engagement
│
└── GEO
    ├── IA Génératives
    ├── AEO
    ├── LLM
    └── Réponses structurées
```

# Vers un Agent IA SEO

L'étape suivante est particulièrement intéressante dans ton architecture.

Plutôt que de créer un simple "assistant SEO", je construirais un **Agent IA SEO** composé de plusieurs **experts spécialisés**, chacun responsable d'un des huit piliers.

```text
                 SEO MASTER AGENT
                        │
 ┌──────────────────────┼──────────────────────┐
 │                      │                      │
Technique          On-Page              Content SEO
 │                      │                      │
 ├── Audit         ├── Optimisation      ├── Editorial
 ├── Crawl         ├── HTML              ├── Clusters
 └── Performance   └── Intentions        └── Maillage

Off-Page           Local SEO             E-E-A-T
 │                  │                    │
 ├── Backlinks      ├── Maps             ├── Confiance
 ├── Autorité       └── Avis             └── Expertise

SXO                GEO
 │                  │
 ├── UX            ├── IA
 ├── Conversion    ├── ChatGPT
 └── Analytics     └── Gemini
```

Dans ton cas (dashboard immobilier Showcase Immobilier), cet agent pourrait être exposé via **MCP** et interroger directement :

- le CMS et les contenus,
- les pages Nuxt,
- les données SEO techniques,
- les performances Lighthouse,
- les données analytiques,
- les données immobilières (biens, villes, quartiers),
- les fichiers `robots.txt`, `sitemap.xml` et les données structurées.

L'agent ne se contenterait pas de répondre à des questions : il pourrait réaliser des audits, proposer des corrections, générer des contenus optimisés et suivre l'évolution du référencement de la plateforme de manière continue. C'est une architecture qui s'intègre particulièrement bien à ton écosystème Nuxt + Symfony + MCP.
