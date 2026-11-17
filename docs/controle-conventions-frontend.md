# Contrôler les conventions frontend

> Distinguer les erreurs certaines de structure, les warnings à relire et les comportements qui nécessitent un navigateur.

## Exécuter

Depuis la racine du worktree, lancer `make frontend-conventions-check`. Cette commande utilise Bun localement. Le contrôle est aussi appelé par la famille `conventions` du lanceur qualité, la commande `make conventions-check` et le workflow de conventions. Il ne fait pas partie du contrôle documentaire rapide.

Les sources sont découvertes avec Git, y compris les fichiers non suivis non ignorés des clients inactifs. Le rapport complet est écrit dans `webapp/.tmp/quality/frontend-conventions.json`. La console présente trois étapes, les totaux et toutes les erreurs lorsqu’il y en a au plus huit, sinon les trois premières, puis ce chemin. Les couleurs distinguent progression (bleu), réussite (vert), erreur (rouge) et avertissements (jaune) ; elles sont désactivées hors terminal, avec TERM vide ou dumb, ou avec NO_COLOR ; le contrôle Docker monte ce dossier de rapport sur l’hôte. Aucun fichier applicatif n’est corrigé automatiquement.

Les tests du moteur sont inclus dans `bun run test:typescript` depuis `codebase-integrity/`. Les tests Bun existants des sections script et des types restent distincts et inchangés.

## Présentation des commandes

Le chemin des sources et, pour les contrôles locaux frontend et SOLID, leur branche sont affichés : le contrôle porte sur ces fichiers, sans intégrer les changements des autres worktrees.

Les commandes de contrôle démarrent par une description INFO en bleu dans un terminal compatible. Les erreurs restent rouges, les avertissements jaunes et les réussites vertes ; NO_COLOR désactive les couleurs. Les sorties redirigées et les rapports restent sans couleurs.

`make conventions-check` conserve la sortie Docker complète dans un journal temporaire et présente un résultat synthétique. Lorsque le fichier d’environnement manque ou que l’exécutable est absent, le statut est NON EXÉCUTÉ et le code de sortie reste non nul. Il ne crée pas ce fichier. Le contrôle SOLID présente toutes les erreurs jusqu’à huit, puis les trois premières au-delà ; sans erreur, il applique la même limite aux avertissements et conserve tous les résultats dans `webapp/.tmp/quality/solid.json`.

Pour les traces, utiliser une base réelle : `make devbook-check BASE="$(git rev-parse develop)"`. Les chevrons de la notation illustrative BASE=<SHA> ne constituent pas une commande shell exécutable.

## Erreurs bloquantes

- Syntaxe Vue et TypeScript non analysable, ordre incorrect des blocs ou script présent sans setup TypeScript.
- Marqueurs de racine absents ou mal nommés, valeurs dynamiques et régions dupliquées ou répétées par une boucle.
- Absence de marqueur sur un main natif, une racine native de Screen ou une région sémantique stable directement portée par une page ou un layout. La liste des balises est configurée en YAML ; cela ne permet pas de qualifier toute région visuellement importante.
- Main natif dans une page ou un Screen ; plusieurs main dans un layout. Sans composant intermédiaire ni slot, un layout sans main est aussi refusé.
- Import de module déclaré comme encapsulé depuis un fichier autre que son wrapper autorisé. Les modules non déclarés ne sont pas interdits implicitement ; l’import direct d’internationalisation reste autorisé.
- Extension globale du catalogue base et sélection de sources clientes depuis une layer du socle, dans les constructions statiques analysables. La racine doit utiliser une sélection explicite pour ses sources.

Les sections numérotées de script setup et le placement des types partagés conservent leurs contrôles existants. Les exceptions temporaires de sections script ne sont ni élargies ni réécrites par cette extension.

## Warnings et exemptions visibles

- Transformations de collections ou formatages reconnaissables dans les expressions de template : vérifier leur préparation en amont.
- Textes visibles, libellés d’accessibilité ou attributs textuels statiques : vérifier leur traduction ou leur provenance éditoriale.
- Écouteurs DOM directs : vérifier le besoin, le nettoyage et la pertinence de VueUse.
- Références de tâches, dates ou empreintes dans les commentaires : vérifier leur nécessité et leur place dans les traces.

Les racines de composants multiples, conditionnelles ou constituées d’un composant Vue sont rapportées comme exemptions. Le contenu des composants éditoriaux déclarés est aussi signalé comme exempté ; cela ne prouve pas sa traduction en amont.

Lorsqu’un layout ne contient aucun main natif mais délègue une partie du rendu à un composant ou un slot, le résultat reste un warning : l’analyse de source ne peut pas conclure au nombre de main réellement rendus. Les tests navigateur restent nécessaires, notamment pour Nuxt UI et les overlays.

Un warning ou une exemption ne provoque pas d’échec. Les erreurs déterministes et les erreurs d’exécution donnent un code non nul. Les gardes défensives et les détections métier existantes restent soumises à revue humaine.

## Taille des composants et des composables

Le contrôle `check:app:solid` de Codebase Integrity, inclus dans `make conventions-check`, conserve le dépassement de 200 lignes en avertissement. Le moteur seul lancé par `make frontend-conventions-check` ne lance pas ce contrôle complémentaire.

Le dépassement certain de huit propriétés retournées par un composable est bloquant. Le comptage AST inclut données et fonctions, indépendamment des lignes, et examine les branches sans compter les retours des fonctions internes. Les objets locaux constants et les spreads statiques sont résolus ; un retour dynamique ou une mutation empêchant le comptage produit un avertissement explicite. Les regroupements artificiels, la pertinence du découpage et les mutations indirectes complexes restent à examiner humainement. Une erreur de lecture ou de syntaxe d’un composable bloque le contrôle.

## Sorties des vérificateurs historiques

Les commandes du paquet Codebase Integrity utilisent la présentation commune pour les tests Python, Vitest et Bun, le lint, les types partagés, les images, les sections script, les calculs suspects, les responsabilités des composants, la qualité de code, les gardes et les imports des services. Le moteur frontend et SOLID conservent leurs rapports structurés dédiés. Python, Node et Bun doivent être installés pour exécuter les familles correspondantes.

Chaque commande affiche son rôle, son contexte, son résultat et le chemin du journal complet. Les sorties longues sont abrégées en conservant les résumés des tests ou des avertissements. Le code de sortie du vérificateur est conservé ; un avertissement ne devient pas une erreur et une réussite signifie absence d’écart bloquant, pas conformité sémantique exhaustive.

La détection de code commenté conserve l’espace délimitant le mot configuré : « const » ne reconnaît plus « construite ». Les formes ambiguës restent des signaux de revue. L’imbrication, les gardes défensives et les calculs suspects restent heuristiques ; leurs signalements ne justifient aucune suppression automatique.

## Limites et raccordement documentaire

L’analyse ne prouve pas la pertinence métier, la qualité d’une traduction, le choix du composant Nuxt UI le plus approprié ou l’absence de toute transformation indirecte. La configuration Nuxt est analysée sans l’exécuter : les cas dynamiques complexes restent à examiner et les tests de sélection et de build des applications complètent ce contrôle.

La migration des définitions vers les README partagés relève de WEB-007. Les sources historiques du registre seront remplacées par les nouvelles références lorsque ces documents seront disponibles par commit validé ; aucun contenu Web non commité n’est copié dans DevOps. La présence du moteur ne vaut pas conformité du code existant ni validation de l’intégration complète.
