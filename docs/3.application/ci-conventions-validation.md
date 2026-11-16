# Conventions et validation continue

> Relier les règles documentées, leurs contrôles et leurs limites de vérification.

## Sources de référence

Les conventions communes Nuxt résident dans le [README du socle](../../webapp/base/README.md). Les README locaux portent les responsabilités et règles propres à leur dossier. Le [contrat documentaire](../README.md) définit leur structure et leur périmètre ; ils ne contiennent aucun lien, historique ni information temporaire.

La documentation explique les règles sans les recopier. Le [catalogue des commandes](../executer-controles.md) constitue la référence pour préparer et exécuter les vérifications.

## Règles et contrôles

Le registre Codebase Integrity relie chaque convention à sa source et son vérificateur. Les paramètres déclaratifs appartiennent aux règles YAML quand le moteur les utilise. Chaque règle possède un identifiant stable et un niveau de sévérité ; `requiresManualReview` distingue les détections à relire des écarts déterministes bloquants.

L’évolution d’une convention met à jour sa source, les paramètres et les tests du vérificateur dans la même consolidation. Les cas conformes, erreurs, exceptions et limites doivent être vérifiés ; une heuristique ne prouve pas l’adéquation métier.

## Automatisation

Les workflows PR couvrent les trois cibles, avec installations verrouillées, tests applicatifs, conventions, contrats et builds SSR. Les contrôles de sécurité restent bloquants. Mutation, charge et Lighthouse se lancent à la demande ; les erreurs d’exécution bloquent, leurs scores restent informatifs tant que les budgets ne sont pas approuvés.

Les rapports sont conservés même en échec. Les fixtures simulent les dépendances distantes ; elles ne prouvent ni le fonctionnement d’une API réelle ni la qualité du déploiement de production. Un workflow configuré n’est réputé exécuté qu’après observation de son résultat distant.
