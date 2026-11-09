Très bonne base. Je le renforcerais avec une couche **produit + architecture MCP**, pour passer de “bonne idée” à “feature cadrée”.

# Agent IA SEO Expert — SEO Copilot MCP

## Vision

Créer un **SEO Copilot** intégré au **dashboard Nuxt / CMS**, capable d’accompagner l’utilisateur pendant la création, l’édition et la publication des contenus.

L’agent ne se limite pas à répondre à des questions SEO. Il agit comme un **consultant SEO senior embarqué dans l’interface**, capable d’analyser le contenu, le contexte métier, la structure technique du site et les données de performance.

Son objectif : aider l’utilisateur à publier des pages déjà optimisées pour le SEO classique, l’expérience utilisateur et les moteurs de recherche génératifs.

---

## Principe central

Le SEO ne doit plus être une correction après coup.

L’agent intervient **avant publication**, directement dans le workflow d’édition :

```text
Utilisateur édite une page
        ↓
Le dashboard Nuxt transmet le contexte via MCP
        ↓
L’agent analyse la page
        ↓
Il détecte les problèmes
        ↓
Il propose des corrections contextualisées
        ↓
L’utilisateur publie une page plus propre
```

---

## Cas d’usage principal

Pendant qu’un utilisateur édite une page dans le CMS Nuxt, l’agent peut l’avertir si un élément risque de nuire au référencement :

- titre trop court ou trop long ;
- absence de H1 ;
- mauvaise hiérarchie Hn ;
- contenu trop faible ;
- manque de liens internes ;
- images sans attribut `alt` ;
- métadonnées absentes ou faibles ;
- données structurées manquantes ;
- contenu peu crédible selon E-E-A-T ;
- contenu mal adapté au GEO ;
- opportunités SXO non exploitées.

L’idée est simple : **éviter de publier une page bancale**. Le SEO devient un garde-fou intégré, pas une rustine posée trois semaines plus tard avec un café froid.

---

## Compétences SEO couvertes

L’agent maîtrise les 8 piliers du SEO moderne :

1. SEO Technique
2. SEO On-Page
3. Content SEO
4. SEO Off-Page
5. Local SEO
6. E-E-A-T
7. SXO
8. GEO

---

## Sources accessibles via MCP

Grâce au protocole MCP, l’agent peut interroger différents contextes du projet :

- contenu en cours d’édition ;
- pages publiées ;
- structure des routes Nuxt ;
- CMS Nuxt ;
- biens immobiliers ;
- médias ;
- métadonnées SEO ;
- données structurées ;
- sitemap.xml ;
- robots.txt ;
- données Lighthouse ;
- Google Search Console ;
- Google Analytics ;
- Bing Webmaster Tools ;
- logs serveur ;
- APIs externes.

---

## Capacités principales

L’agent peut :

- analyser une page en temps réel ;
- détecter les problèmes SEO bloquants ;
- expliquer pourquoi un point pose problème ;
- proposer une correction prête à appliquer ;
- générer les titles et meta descriptions ;
- suggérer des liens internes ;
- améliorer un contenu ;
- vérifier la cohérence E-E-A-T ;
- évaluer le potentiel GEO ;
- auditer un site complet ;
- suivre les performances SEO dans le temps ;
- comparer plusieurs pages ;
- prioriser les actions selon leur impact.

---

## Intégration dans le dashboard Nuxt

L’agent peut être affiché sous plusieurs formes :

```text
CMS Nuxt

┌─────────────────────────────────────────────┐
│ Éditeur de page                              │
│                                             │
│ Titre, contenu, images, SEO, publication     │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ SEO Copilot                                 │
│                                             │
│ Score de préparation SEO                    │
│ Alertes importantes                         │
│ Suggestions rapides                         │
│ Actions recommandées                        │
└─────────────────────────────────────────────┘
```

Il peut fonctionner avec plusieurs niveaux d’alerte :

```text
🔴 Bloquant     À corriger avant publication
🟠 Important    Fortement recommandé
🟢 Opportunité  Amélioration possible
```

---

## Ambition produit

Construire un véritable **assistant SEO intelligent**, connecté au contexte réel du projet.

L’utilisateur ne reçoit pas des conseils génériques. Il reçoit des recommandations adaptées :

- à la page qu’il édite ;
- au type de contenu ;
- au projet ;
- aux performances existantes ;
- aux mots-clés ciblés ;
- à la structure du site ;
- aux objectifs business.

Le SEO devient une partie naturelle du processus éditorial, au même titre que le contenu, les images ou la mise en page.

---

## Résultat attendu

À terme, le dashboard Nuxt ne sert plus seulement à administrer du contenu.

Il devient un **CMS augmenté**, capable d’aider l’utilisateur à produire des pages plus propres, plus performantes, plus crédibles et mieux préparées pour Google, Bing, les IA génératives et les futurs moteurs conversationnels.
