# Contrats de schéma

## Rôle et responsabilités

- Centraliser les contrats de données partagés entre contenu, services, serveur et frontend.
- Produire les artefacts de types depuis les sources de schéma.
- Expliquer **clairement et brièvement** la portée des contrats locaux.

## Conventions techniques

### Source de référence

Les sources YAML versionnées définissent les contrats générés. Les sorties sont régénérées, jamais modifiées manuellement. Leur absence du suivi Git ne réduit pas leur rôle dans la compilation.

### Neutralité technique

Les contrats restent indépendants de Vue, Nuxt et du DOM, sans logique métier. Un type spécifique à une interface appartient à son périmètre local.

### Reproductibilité

La reproductibilité des artefacts est vérifiée dans deux répertoires temporaires distincts. Une différence Git sur des sorties ignorées ne constitue pas une preuve. Une génération locale réussie ne prouve pas la conformité d’une API externe.
