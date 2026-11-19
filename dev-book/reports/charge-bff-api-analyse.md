# Analyse — Charge des lectures BFF → API

- Demande : DEM-015 ; consolidation.
- Session : 01a1ee70-2dc4-7331-992b-b24155dfd09a.
- Base examinée : `4c04cb2fdab715eb0ea38596961133ef0549ef27` ; analyse statique, aucun service ou test lancé.

## Constat et périmètre

Le test k6 existant vise `/fr` pour Showcase, `/` pour Client 2 et, pour Dashboard, la connexion ainsi que le refus 401 de session ; il ne mesure pas les lectures authentifiées d’articles via le BFF. Les scénarios existants bornent les itérations à 3 ou 30, la concurrence à 1 ou 3 utilisateurs et n’autorisent que l’origine locale du BFF. Les délais sont informatifs mais les réponses incorrectes échouent. Les tests BFF existants utilisent des amonts simulés ; leur réussite ne démontre pas le comportement de Symfony réel.

Les routes de liste et détail d’articles déléguent aux handlers SaaS, qui contrôlent l’accès au projet et sollicitent l’API amont. La liste parcourt les articles et demande leurs traductions séparément ; elle peut donc amplifier les appels amont. Elle n’établit pas à elle seule une preuve de requêtes SQL N+1. Les routes de contenu et certaines lectures Dashboard utilisent des fichiers locaux et ne conviennent pas comme preuve d’un appel à l’API SaaS. Les données, routes réellement disponibles, nombre d’articles, temps et comportement de l’API du VPS n’ont pas été observés.

## Décisions confirmées

L’humain remplace le projet isolé initialement envisagé par la vraie API Symfony SaaS sur le VPS et les projets des TARGET réels. La première version mesure la liste des articles et le détail d’un article, via le BFF, en lecture métier seule. Le lancement est manuel au départ ; DEM-016 examinera une automatisation sécurisée. Profils : 1 utilisateur virtuel et 3 requêtes par scénario ; 3 utilisateurs et 30 requêtes par scénario. L’authentification peut nécessiter une requête de session ; aucune écriture métier n’est autorisée.

Les réponses et accès incorrects sont des échecs techniques ; les temps restent informatifs, y compris les repères 200/500 ms et 10–15/30 secondes décrits dans le brouillon. Aucun secret ni contenu privé dans les rapports. Mesurer le temps de bout en bout BFF → API ; un temps propre à l’API ne doit être annoncé que si une mesure distincte fiable existe. Le réseau, les volumes réels, caches et contraintes du VPS influencent le résultat ; indexation et SQL ne sont pas vérifiés sans instrumentation adaptée.

## Analyse de réalisation

Adapter l’outillage de charge et son environnement afin de sélectionner explicitement TARGET, projet et article existants, de préparer une session sans exposer d’identifiants, et de refuser les opérations d’écriture et les destinations non voulues. Les détails de conservation des secrets, d’autorisation du projet et de vérification des réponses restent à concevoir ; le test ne doit pas exposer de données privées dans les erreurs, arguments ou rapports. Aucun endpoint de test produit n’est ajouté.

Prévoir des tests légers déterministes avec amonts simulés : chemins liste/détail acceptés, écriture refusée, absence d’authentification, cible ou projet invalide, données insuffisantes, réponse erronée et absence de secret dans les sorties. Le contrôle réel avec service relève de l’humain : documenter commande, répertoire, origine, prérequis, profil et résultat attendu ; aucun seuil de latence ne bloque. Conserver les preuves et les limites, sans supposer une réussite réelle.

L’outillage et sa documentation relèvent de DevOps. Une modification de `webapp/server/` nécessiterait une carte BFF distincte ; elle n’est pas établie comme nécessaire. Les commandes runtime finales dépendent de DEM-014, mais la conception des scénarios n’exige pas de commit amont ; leur raccordement doit intégrer le commit validé si les mêmes fichiers sont modifiés. Les workflows relèvent de DEM-016.

## Limites et disponibilité

Recherche statique des routes GET et de leurs handlers SaaS, des contrôles et fixtures pertinents ; aucune analyse de la base Symfony distante, des autres dépôts, des données effectives ou des performances observées. Les worktrees n’ont pas été comptés comme occurrences. DEM-014 est fusionnée et son commit de réalisation est présent dans la couche DevOps. Les brouillons de DEM-016 présents dans cette couche sont conservés séparément, avec accord humain pour poursuivre DEM-015.
