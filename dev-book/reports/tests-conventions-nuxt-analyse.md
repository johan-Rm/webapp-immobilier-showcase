# DEM-011 — Analyse des tests et conventions Nuxt

- Type : consolidation ; [besoin et décisions](../demand/DEM-011-tests-conventions-nuxt.md).
- Session : 01a1d56d-446b-7931-bf53-7687a7d10912 ; analyse du 2026-11-14.
- Showcase : `ca571d60c39b8b5932d74cd43dcbe4131c47c578`.
- Cap Nour : `/home/johan/www/lab/cap-nour-mvp`, develop
  `20bbb75ace8c477de35d193990dde64184d89e7f` ; source en lecture seule.
- État : propositions en attente d’arbitrage, aucune carte prête.

## Couverture et méthode

Inventaire Git du principal uniquement, sans compter ses worktrees comme d’autres
occurrences. Lecture des configurations de suites, commandes, workflows, registre,
paramètres des conventions et README concernés. Recherche textuelle sur tous les
394 fichiers Vue/TypeScript suivis, dont 146 Vue. Lecture ciblée des tests et
handlers pour qualifier ce qu’ils prouvent ; pas de revue sémantique exhaustive
des 394 fichiers ni de preuve de couverture de toutes les branches du produit.

Cap Nour : README racine et webapp, services, shared, base/server, base/app et
ses composants/pages/layouts/composables/stores/utils/middleware/assets, ainsi que
le README du layout Entreprise ; les README de cadrage produit ne sont pas des
conventions techniques Nuxt. Lecture des 19 règles des deux YAML, du lanceur,
de l’extraction de régions Vue et du début des vérificateurs structurels, des
configurations Vitest et des workflows frontend/commits. Les vérificateurs AST
sources n’ont pas pu être importés : dépendance `vue/compiler-sfc` non résolue
depuis Cap Nour ; aucune installation ni modification de la source effectuée.
Leurs résultats sur Showcase restent donc inconnus, pas réputés conformes.

Le worktree source `socle-webapp` est propre, au même SHA que son principal ;
aucune configuration dependency-cruiser ni déclaration de dépendance trouvée là.
La migration non commitée citée dans l’inventaire humain n’est pas retrouvée à
cet emplacement actuel. Ne pas reprendre ses nombres comme preuve ni prétendre
la récupérer. L’outil éventuel serait une nouvelle adoption locale à arbitrer.

Les suites complètes, builds et commandes Docker n’ont pas été exécutés ici.
Les résultats ci-dessous portent sur les fichiers, pas sur leur réussite actuelle.
Les métriques textuelles incluent tests et chaînes : ce sont des candidats à
examiner, jamais des violations certifiées ni un motif d’exemption automatique.

## Existant Showcase et angles morts

| Famille | Traces existantes | Limite constatée |
| --- | --- | --- |
| Logique et intégration | 23 fichiers `*.vitest.ts` applicatifs ; configuration `webapp/vitest.config.ts` | Environnement Node ; certains tests préparent réellement Nuxt ou lancent HTTP, donc pas tous unitaires |
| BFF sécurité | Suites `server/tests/saas-{auth,editor,publication}.vitest.ts` avec handlers H3 et API amont simulée | Prouvent le BFF sur fixtures, pas Symfony réel ni son déploiement |
| Test Bun BFF | `server/utils/auth/symfonyProjectMember.test.ts` | Non sélectionné par `bun run test` (Vitest) ; aucune étape CI dédiée trouvée |
| Vérificateurs | 2 fichiers Vitest, 2 Bun et 10 Python dans Codebase Integrity | Couverture de tous les vérificateurs non établie ; ne pas compter les noms de fichiers comme une couverture fonctionnelle |
| Infrastructure | 4 fichiers `infra/tests/test_*.py` et scripts spécialisés ailleurs | `unittest discover -s infra/tests` ne couvre pas automatiquement tous les scripts Python du dépôt |
| Navigateur | 5 fichiers Playwright, Chromium bureau et mobile, sélection selon cible | Captures de diagnostic, pas de comparaison visuelle de référence ; API Dashboard simulée |
| Accessibilité | Assertions clavier, focus et contrastes dans `saas-access.spec.ts` | Pas de scan axe déclaré ; contrôles existants à conserver, ne pas qualifier l’accessibilité d’absente |
| Rendu | Smoke SSR, SEO, absence d’erreurs et certains avertissements d’hydratation | Pas de suite générique d’hydratation sur toutes les cibles |
| Types | `scripts/build/type-check.ts` prépare Nuxt et sélectionne le tsconfig Dashboard | CI qualité limitée à Showcase et Client 2 ; Dashboard non sélectionné |
| Contrats | Sources YAML locales, génération au prepare/type-check ; contrat SaaS strict et tests projecteur | Artefacts générés ignorés par Git ; un `git diff` de types générés ne détecterait pas leur dérive ici |
| OpenAPI | `server/api/openapi.get.ts` relaie la documentation Symfony | Pas un contrat OpenAPI local versionné ni un contrôle automatique producteur/consommateur |
| Qualité CI | lint, formatage, types, tests et Python ; conventions dans workflow séparé | Pas de build ni Playwright dans la CI actuelle ; commande guards absente du workflow conventions mais présente dans Make |
| Commits | Vérificateur et tests de contribution AIDE ; checkout complet | Le workflow AIDE exécute les tests du vérificateur, pas une validation visible de tous les commits de la PR |
| Dépendances | Vérificateurs locaux imports/types/services | Pas de graphe dependency-cruiser déclaré ; cycles et imports non résolus non couverts globalement |
| CD | Makefiles preprod/prod présents ; aucun workflow de déploiement identifié dans `.github/workflows` | Aucune preuve de déploiement ni smoke automatiquement rattaché ; Sonar configuré ne prouve pas son activation distante |

Sources de référence : `webapp/package.json`, configurations Vitest/Playwright,
`codebase-integrity/package.json`, `infra/make/Makefile.dev`, quatre workflows
de `.github/workflows/`. Ne pas dupliquer ces commandes dans chaque README.

## Reprise des conventions de Cap Nour

Chaque ligne est une proposition, pas une adoption. Aucune exception Cap Nour
ne doit être copiée : les chemins et causes ne sont pas ceux de Showcase.
La source finale doit être un README responsable existant, puis un lien depuis
les autres scopes. Le registre Codebase Integrity porte l’état et les limites.

| Règle source | Correspondance / adaptation proposée |
| --- | --- |
| services-no-framework-imports | Déjà documentée et bloquante ici : conserver, comparer les contre-exemples plutôt que dupliquer |
| app-no-fetch-in-components | Déjà documentée, signalement humain ici contre blocage source : proposer blocage seulement après inventaire des vrais appels et corrections |
| pages-no-space-meta | Adapter à l’isolation des cibles locales ; ne pas rechercher arbitrairement la propriété `spaces` d’un autre produit |
| app-no-hardcoded-text | Reprendre le principe et les attributs accessibles, avec distinction littéral/prop/traduction ; textes éditoriaux reçus des contenus autorisés |
| encapsulation-i18n | Ne pas imposer `useLocale` : son existence et son intérêt locaux ne sont pas démontrés ; maintien de l’usage direct proposé |
| pages-no-interactive-template | Compatible avec orchestration, à adapter aux screens et composants du modèle local ; corrections structurelles à inventorier avant blocage |
| components-root-marker | Nouvelle convention ; proposer un attribut de diagnostic sans ajout de wrapper, avec exemption fragments explicite ; ne pas imposer aveuglément la première classe |
| components-no-page-region | Conflit avec les composants Screen possédant une section : exclure les screens de cette interdiction et documenter leur rôle, ou garder la règle en revue |
| layouts-single-main | Invariant rendu « exactement un main par document » pertinent ; vérifier `<UMain>` et les compositions réelles avant généralisation |
| layouts-no-raw-spacing | Tokens propres à Cap Nour non transférables ; ne pas importer `p-element`, `gap-block`, etc. sans correspondance à la charte locale |
| pages-no-main | Reprendre seulement avec décision explicite de propriété du main par layout et migration cohérente des pages existantes |
| app-prefer-useeventlistener | Reprendre la préférence VueUse, avec inventaire des cibles DOM et nettoyage ; distinguer préférence et interdiction automatique |
| app-no-space-prefix | Le nom des espaces Cap Nour ne correspond pas aux sites et au catalogue ici ; pas de renommage global proposé |
| app-no-comment-journal | Reprendre commentaires au présent et références historiques dans dev-book ; ne pas supprimer une contrainte utile ; marqueurs de dette déjà informatifs ici |
| app-no-ambiguous-kit-class | Dépend de la palette et du thème effectifs : conserver en revue tant que l’ambiguïté locale n’est pas prouvée |
| pages-native-root | Racine unique déjà attendue ici ; décision distincte sur racine HTML native plutôt qu’un composant Nuxt UI |
| pages-root-marker | Nouveau `data-page` proposé, dérivé des chemins locaux, sans wrapper ni CSS attaché |
| layouts-root-marker | Nouveau `data-layout` proposé, avec même limite et convention de nommage explicite |
| structure-section-semantics | `data-section` statique et unique pour zones stables, adapté au modèle Screen ; contrôle AST, pas recherche tronquée au premier slot |

Autres conventions README :

- Ordre Vue : conserver `template → script → style`, actuellement verrouillé par
  ESLint ici ; ne pas reprendre `script → template → style` de Cap Nour.
- Sections script setup : ne pas trancher dans DEM-011 la divergence déjà analysée
  dans DEM-010 ; préserver l’exception temporaire et ses limites.
- Services purs, types partagés, données prêtes à afficher, responsabilité unique,
  séparation état local/global et logique métier : largement communs ; compléter
  seulement les différences utiles dans les README responsables.
- Composables sans effets critiques cachés, stores sérialisables, navigation comme
  garde UX et autorisation réelle dans BFF : principes pertinents, à comparer aux
  usages actuels sans transformer une recommandation en interdiction rétroactive.
- Wrappers : le principe local général est plus strict que celui de Cap Nour,
  qui exige un défaut concret absorbé. Proposer de conserver la règle locale
  dans DEM-011 et de garder `AppImage`, sans nouveau wrapper i18n implicite.
- Nuxt UI prioritaire et organisation par feature : adapter à la coexistence
  catalogue/screens/sites/dashboard ; aucune migration de composants par goût.
- Sessions : ne pas importer `session_expired` comme contrat sans démontrer le
  besoin local ; BFF existant et tests d’autorisation restent la référence.
- Langues : ne pas reprendre FR/EN/AR, stratégie URL/cookie ou domaines de Cap Nour ;
  examiner la parité des catalogues et le registre existant FR/EN/ES.
- CSS/fonts/assets : référence à la charte officielle locale ; ne pas importer
  les tokens, règles de hauteur ou assets du design system Cap Nour.

Ordres de grandeur du scan global : i18n direct dans 47 fichiers (48 occurrences),
écouteurs DOM dans 14 (85), attributs texte littéraux dans 46 (174), marqueur de
dette dans un fichier. Les littéraux techniques, fixtures et tests sont inclus :
la qualification et le coût exact des migrations restent à établir avant cartes
prêtes sur ces règles. Cinq fichiers contiennent explicitement main/UMain ; ce
nombre ne démontre pas l’unicité dans le DOM final.

## Options de réalisation et coût relatif

**Socle recommandé dans DEM-011 :** rendre les contrôles existants réellement
exécutables et cohérents local/CI, avec sélection des trois cibles ; lier chaque
commande à sa portée et à des tests positifs/négatifs. Coût modéré, forte valeur
sur les angles morts observés. Reprendre les conventions communes sans conflit,
et documenter explicitement celles conservées en revue ou reportées.

**Extension proposée à confirmer :** tests Nuxt de composants, contrôle AST des
conventions retenues, scan d’accessibilité et comparaison visuelle sur un petit
jeu d’écrans stable. Coût supérieur : environnement DOM/Nuxt, fixtures et baselines
à maintenir. Prévoir des preuves pilotes avant de rendre chaque contrôle bloquant.

**Généralisation complète :** migration de tous les écrans vers toutes les règles
structurelles Cap Nour, graphes de dépendances, mutation et charge systématiques.
Coût élevé et plusieurs conventions encore contradictoires ; pas de carte prête
possible sans inventaire sémantique et arbitrages supplémentaires. Ne pas cacher
les écarts par une exclusion de toute application.

## Contrôles proposés par famille

| Famille | Choix proposé et déclenchement | Coût / preuve requise |
| --- | --- | --- |
| Vitest logique/BFF | Bloquant local et PR sur les trois cibles ; séparer logique pure et intégration sans perdre de tests | Modéré ; liste des fichiers découverts et échec injecté détecté |
| Bun BFF | Commande explicite pour le test ignoré, exécutée en CI | Faible ; cas autorisé, refus et panne déjà présents |
| Conventions | Même commande locale/CI ; tests des vérificateurs incluant slots imbriqués, fichiers inactifs et limites | Modéré à élevé selon règles choisies ; aucune regex présentée comme preuve sémantique |
| Composants Nuxt | Pilote `@nuxt/test-utils` avec Vitest, environnement Nuxt séparé du Node actuel | Modéré ; composant à comportement réel, auto-imports et erreurs de validation, pas de test miroir |
| Architecture | Mettre en place dependency-cruiser, conserver le contrôle services jusqu’à preuve de parité ; traiter alias et imports Nuxt explicitement | Élevé pour migration globale ; imports non résolus et dépendances non couvertes visibles |
| Types/lint/format | Bloquant, trois cibles ; installations reproductibles et parité local/CI | Faible à modéré ; preuve que Dashboard est réellement inclus |
| Contrats YAML | Génération reproductible en répertoire temporaire et validation des entrées/sorties | Modéré ; deux générations identiques, entrée invalide rejetée ; pas de faux git diff sur artefacts ignorés |
| Contrat Symfony | Distinguer fixture consommateur, documentation relayée et appel réel ; pas de récupération réseau obligatoire en CI sans contrat local approuvé | Modéré ; panne amont et dérive de fixture explicites |
| Build SSR | Build réel bloquant des trois cibles en CI | Modéré en durée ; pas de substitution par prepare/type-check ni par image existante |
| Playwright | Smoke des trois cibles bureau/mobile en PR avec serveur isolé et données fictives ; compléter selon changement | Modéré ; SSR/hydratation, erreurs, refus et conservation saisie ; API simulée signalée |
| Accessibilité | Conserver tests existants ; pilote axe et clavier/focus, puis blocage sur périmètre explicitement arbitré | Modéré ; scan ne prouve pas toute la conformité |
| Visuel | Pilote screenshots comparés, environnement Docker fixe et références validées humainement | Modéré ; modification visuelle volontaire détectée ; pas de mise à jour automatique des références |
| Sécurité | Tests négatifs BFF existants bloquants ; scanner des dépendances vulnérables en local et en CI inclus sur décision humaine | Modéré ; outil, portée et critères bloquants à arbitrer ; ne pas assimiler un audit de paquets à une preuve de sécurité globale |
| Performance/charge | Mettre en place des scénarios locaux reproductibles ; budgets et fréquence à confirmer | Élevé pour budget fiable ; pas de charge sur API externe ni seuil arbitraire |
| Mutation JavaScript | Mettre en place une suite ciblée sur logique pure ; seuil et fréquence à confirmer | Élevé ; pas de seuil zéro annoncé comme protection |
| Commits PR | Valider la plage réelle avec le vérificateur du projet extrait de la base d’intégration | Faible à modéré ; commit invalide refusé, pas de remplacement de l’autorité locale par commitlint source |
| Après déploiement | Proposer smoke HTTP/SSR en lecture seule, commande explicite ; aucune automatisation de déploiement acquise | Modéré ; refus des origines inconnues et erreurs explicites |

Références officielles vérifiées :
[tests Nuxt](https://nuxt.com/docs/4.x/getting-started/testing),
[accessibilité Playwright](https://playwright.dev/docs/accessibility-testing),
[comparaison visuelle](https://playwright.dev/docs/test-snapshots),
[dependency-cruiser](https://github.com/sverweij/dependency-cruiser).
Ces possibilités ne valent pas choix d’outil accepté ni compatibilité démontrée
avec les versions verrouillées du projet.

## Vérification humaine et responsabilités à préparer

### Complément outillage après élargissement humain

Propositions techniques, sans installation ni choix encore confirmé :

- Scanner : `bun audit --json` pour chacun des deux lockfiles, webapp et
  Codebase Integrity ; normaliser les résultats et appliquer la politique
  confirmée. Bun 1.4.0 local propose `--json`, `--audit-level` et `--ignore`
  (`bun audit --help` exécuté, aucun audit réseau lancé). Vérifier erreurs de
  transport, paquets ignorés et exceptions expirées ; aucun `audit fix` implicite.
  [Documentation](https://bun.sh/docs/pm/cli/audit).
- Mutation : StrykerJS avec son
  [runner Vitest](https://stryker-mutator.io/docs/stryker-js/vitest-runner/),
  configuration isolée pour les fonctions pures, sans lancer les suites HTTP
  pour chaque mutant. Compatibilité exacte avec Vitest 4.1.10 à prouver avant
  verrouillage des versions ; ne pas déduire cette compatibilité du seul nom du plugin.
- Charge : k6 conteneurisé, scénarios de lecture SSR et BFF avec amont simulé,
  volume borné, origine locale explicitement validée et rapports exportables.
  Ses [thresholds](https://grafana.com/docs/k6/latest/using-k6/thresholds/)
  permettent de rendre les budgets bloquants ; leurs valeurs doivent découler
  d’une mesure de référence, pas des exemples de la documentation.
- Dépendances : configuration dependency-cruiser propre à ce dépôt ; ne pas
  affirmer avoir récupéré une migration absente de Cap Nour. Comparer imports
  explicites, alias et auto-imports réellement couverts ; nombre de modules
  analysés visible même avec zéro violation.

Choix d’outils et exécution confirmés par « oui » : Stryker avec Vitest pour la
mutation et k6 pour la charge ; architecture et scanner bloquants en PR ;
mutation et charge exécutables manuellement dès DEM-011 et automatiquement via
workflow dédié déclenchable à la demande. Leurs budgets de score/latence sont
informatifs au premier relevé ; erreur d’exécution et échec fonctionnel restent
des échecs. Fixer leurs budgets bloquants après ce relevé humainement examiné,
avant de présenter ces suites comme une protection par seuil.

### Lighthouse — source Kazen Garden, priorité humaine

Instruction : analyser les deux scripts `/home/johan/www/kazen-garden/scripts/lighthouse-*.sh`,
puis « ça c’est très important ». Volet prioritaire de DEM-011 ; source en lecture
seule au SHA `80a356629a5ed330df7ed6ed0c4c75600f918430`, aucune modification
locale signalée pour ces deux fichiers. README racine lu ; README scripts absent
et guide `docs/guides/development.md` référencé par la racine introuvable.

Les deux scripts ont été lus intégralement et passent `bash -n`. Aucun navigateur,
audit Lighthouse, téléchargement npx ni arrêt de processus n’a été lancé.

| Script | Comportement observé |
| --- | --- |
| lighthouse-desktop.sh | URL et sortie paramétrables, défaut localhost:3001/fr ; preset desktop et throttling provided ; port 9333 par défaut ; profil temporaire ; délai fixe de deux secondes avant audit |
| lighthouse-mobile-4g.sh | Profil mobile, ralentissement réseau DevTools configuré et CPU ×4 ; port aléatoire ; attente de disponibilité DevTools ; validation de syntaxe JSON ; catégories absentes affichées n/a sauf performance |

Les deux vérifient jq/npx/curl, cherchent Chrome dans le cache Playwright,
contrôlent l’accès HTTP, rejettent l’interstitiel Chrome connu et chrome-error,
produisent un JSON et affichent performance/accessibilité/bonnes pratiques/SEO.
Les couleurs 90/50 sont uniquement de présentation : aucun score faible ne
provoque explicitement un exit non nul. Leur réussite ne prouve donc aucun budget.

Points à adapter avant reprise :

- `npx lighthouse` ne verrouille pas de version dans ces scripts ; fixer ensemble
  Lighthouse/Chrome et le profil, et enregistrer les versions dans les rapports.
- `pkill -f remote-debugging-port=...` peut arrêter un processus étranger ; ne
  reprendre que le nettoyage du PID créé par la commande, avec port réservé.
- Créer le profil après les vérifications ou installer le trap immédiatement :
  les erreurs de prérequis actuelles peuvent laisser un dossier temporaire.
- Remplacer délai fixe et recherche arbitraire du premier Chrome par attente
  active et binaire explicite. Examiner `--no-sandbox` dans le contexte du
  conteneur retenu ; ne pas en faire une option hôte systématique.
- Auditer un build SSR réel, vérifier route et URL finale attendues après
  redirections ; une connexion renvoyée à la place d’une page privée peut donner
  de bons scores tout en testant le mauvais écran. Prévoir une session fictive
  locale dédiée pour Dashboard et la réinitialiser entre mesures.
- Rejeter tout runtimeError, JSON absent/invalide et catégorie requise sans score,
  pas uniquement l’erreur d’interstitiel. Ne pas interpréter n/a comme une réussite.
- Écrire chaque résultat dans un dossier isolé par cible/profil/run. Conserver
  les diagnostics d’un échec au lieu de supprimer systématiquement son rapport ;
  ne pas écraser ou supprimer un rapport utilisateur passé en argument.
- Distinguer desktop provided, qui dépend des conditions de la machine, et mobile
  DevTools : « mobile 4G » est un profil de laboratoire, pas une mesure terrain.
  Documenter les paramètres réellement appliqués et répéter les mesures ; aucune
  comparaison entre profils ni budgets définis par la seule couleur du score.

Proposition de réalisation : deux commandes desktop/mobile partageant un lanceur,
sur Showcase, Client 2 et un parcours Dashboard fixture, localement et via workflow
dédié à la demande. Rapports JSON et HTML, métriques brutes et synthèse ; trois
mesures par route/profil et médiane, environnement conteneurisé identique. Tests
du lanceur avec navigateur/Lighthouse simulés pour URL inaccessible, rapport
invalide, runtimeError, catégorie manquante, mauvais écran, processus étranger et
budget non atteint ; audit réel ensuite pour prouver les deux profils.

Les seuils et routes précises restent à confirmer. Proposition : échec d’exécution
bloquant dès le départ ; scores et métriques informatifs au relevé initial, puis
budgets explicites après examen humain. Les métriques de navigation mesurées en
laboratoire ne remplacent pas la mesure terrain, les tests de charge k6 ou les
tests clavier/axe. Pas de preuve de sécurité globale par « Best Practices ».

Références officielles :
[profils de ralentissement](https://github.com/GoogleChrome/lighthouse/blob/main/docs/throttling.md),
[variabilité et calcul des scores](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring).

Instruction humaine du 2026-11-14 : « lors de l’implémentation et la vérification
je vais relire le code et tester les commandes de tests manuellement ».
Chaque future carte devra donc donner : fichiers à relire, répertoire exact,
préparation nécessaire, commande copiable, résultat attendu et contre-exemple
contrôlé dans une fixture temporaire. Ne pas demander de modifier le code produit
pour démontrer un échec. Les résultats humains restent à recueillir à l’étape 04 ;
aucun verdict ni commit de validation ne peut être déduit d’un succès technique.

DevOps : Codebase Integrity, CI, commandes, dépendances d’outillage et guides ;
Web : sites et catalogue/tests généraux ; Dashboard : frontend/tests dédiés ;
BFF : routes et tests serveur ; Domaine : contrats/services partagés.
Les modifications de configuration racine/package/scripts de test devront être
explicitement routées à DevOps dans les cartes plutôt que supposées autorisées.
Les README applicatifs suivent leur propriétaire ; ne pas créer de dépendance
artificielle par commit pour un simple document commun. Arbres DevOps et Dashboard
propres au relevé, disponibilité humaine non démontrée.

Après décision seulement : inventaire final des corrections par chemin, déclaration
de contribution et cartes avec commits amont réels. Étape 05 prévue dans le
principal libre et propre sur `demands/DEM-011`, depuis develop vérifié, demande
définitive `dev-book/demand/DEM-011-tests-conventions-nuxt.md`. Aucune branche créée.

## Décisions encore requises

Ajout humain confirmé par « oui c’est à inclure » : mettre en place un contrôle
des dépendances vulnérables en local et en CI. Ce contrôle fait partie de DEM-011,
en complément des tests de sécurité applicatifs.
Politique confirmée par « oui » : couvrir les dépendances du produit et de
l’outillage ; bloquer sur les vulnérabilités élevées et critiques. Toute exception
est justifiée et limitée dans le temps. Un scanner indisponible n’est pas déclaré
réussi. Le choix de l’outil et les modalités d’exécution restent à étudier ; aucune
exception effective ni durée particulière n’est approuvée par cette décision.
Ajout humain confirmé par « à inclure » : mettre en place dependency-cruiser,
les tests de mutation JavaScript et les tests de charge dans DEM-011. Leur report
n’est pas retenu. Cette décision remplace les propositions de report ou d’étude
seule ci-dessus : prévoir configuration, commandes reproductibles, scénarios
pertinents, documentation et preuves pour les trois volets.
Restent à analyser les versions compatibles, la résolution des alias et imports
Nuxt, les modules soumis à mutation, les parcours et budgets de charge ainsi que
les déclencheurs et niveaux bloquants. Ne pas inventer de seuils ni revendiquer
une couverture complète. Les essais de charge doivent cibler un environnement
local isolé avec données fictives ; aucune charge sur une API externe ou une
production n’est autorisée par cette inclusion.

1. Choix acquis : « le socle et les pilotes » ; socle et pilotes composants Nuxt,
   accessibilité et comparaison visuelle retenus. Leur sélection n’approuve pas
   implicitement les conventions contradictoires ni leurs seuils de blocage.
2. Arbitrage i18n acquis, réponse « oui » à la proposition : usage direct d’i18n
   et maintien d’AppImage, sans nouveau wrapper i18n faute de problème démontré.
   Cette décision ciblée ne modifie pas la convention générale des wrappers.
   Arbitrage Screens acquis par « oui » : conserver le modèle local ; les Screens
   peuvent porter leurs sections et aside, sans interdiction générale reprise de
   Cap Nour.
   Arbitrage main acquis par « oui » : exactement un main par page rendue, porté
   par le layout autour du contenu de route ; les pages et Screens n’en ajoutent
   pas. Vérification navigateur requise en complément de la lecture des fichiers.
   Arbitrage marqueurs acquis par « oui » : data-page sur la racine des pages,
   data-layout sur celle des layouts et data-section sur les grandes zones des
   pages, layouts et Screens. Valeurs statiques et descriptives, sans rôle dans
   le style ; aucun élément HTML ajouté uniquement pour porter un marqueur.
   Arbitrage composants acquis par « oui » : data-component="nom-du-composant"
   sur leur racine unique, nom dérivé du chemin, plutôt qu’une classe CSS.
   Les composants à plusieurs racines sont dispensés, sans ajout d’élément HTML.
   Arbitrage événements acquis par « oui » : préférer les outils VueUse pour
   bénéficier du nettoyage des écouteurs au démontage ; les appels directs
   restent autorisés pour un besoin concret expliqué localement. Le contrôle
   est initialement informatif, sans migration automatique des usages existants.
   Arbitrage traductions acquis par « oui » : tout texte d’interface, y compris
   les libellés d’accessibilité, passe par i18n. Contenus éditoriaux et textes
   reçus par propriétés autorisés, traduction assurée en amont. Contrôle
   initialement informatif pour qualifier les signalements avant tout blocage.
   Arbitrage commentaires acquis par « oui » : décrire la raison actuelle du
   code ; chronologie et références de tâches restent dans Git et le dev-book.
   TODO et autres signalements restent informatifs. Leur correction conserve
   les contraintes utiles qu’ils expliquent.
   Restent à confirmer les autres adaptations de la matrice.
3. Niveaux des pilotes confirmés par « oui » : tests de composants Nuxt bloquants
   sur les comportements sélectionnés ; tests clavier bloquants et nouveau scan
   d’accessibilité informatif pendant le pilote ; comparaison visuelle informative
   jusqu’à validation humaine des images de référence, puis bloquante sur les
   écrans retenus. Cette validation visuelle n’est pas acquise ici.
   Restent à préciser les périmètres et seuils des autres nouvelles règles après
   qualification des candidats ; l’inventaire textuel ne suffit pas à préparer
   leur migration.

## Reprise du découpage — inventaire structurel complet

Même base et même session ; l’[inventaire par fichier](tests-conventions-nuxt-inventaire.json)
fait référence pour les chemins, racines et marqueurs. Il provient de `git ls-files`
et de la lecture AST par le compilateur Vue installé ici, sans copie de worktrees.
Il lève la limite précédente sur le comptage structurel ; les vérificateurs propres
à Cap Nour n’ont toujours pas été exécutés, ni les rendus navigateur.

Les 146 SFC sont analysables sans erreur de parse : 119 composants, 18 pages,
5 layouts et 4 points d’entrée/autres. Aucun attribut data-page/data-layout/
data-component/data-section détecté. Les 18 pages ont une racine élémentaire,
dont 8 racines sont des composants Vue ; les 5 layouts ont une racine HTML native.
Sur les 119 composants, 23 ont une racine composant Vue, 13 plusieurs racines ;
17 au total présentent plusieurs racines ou une racine conditionnelle/template.
Ces chiffres décrivent l’AST, pas le nombre final de nœuds DOM.

Corrections certaines pour la règle main confirmée :

- `dashboard/app/layouts/default.vue` : transformer le conteneur du slot en main
  sans modifier son contrat de hauteur/scroll ni les secours ClientOnly.
- `sites/client2-immobilier/app/pages/index.vue` : déplacer la responsabilité de
  main vers un layout explicitement choisi ; conserver le rendu et les liens.
- `sites/client2-immobilier/app/pages/[locale]/articles/[[slug]].vue` : utilise déjà
  un NuxtLayout editorial explicite malgré layout:false ; conserver cet assemblage,
  ne pas déduire de la meta seule que le layout manque.
- Les deux layouts Showcase et le layout auth Dashboard portent déjà main/UMain :
  vérifier leur unicité dans le rendu après migration des marqueurs et overlays.

### Point à arbitrer avant les cartes de migration

Le choix humain de data-component sur une racine unique reste acquis. Cependant,
quand cette racine est un autre composant Vue, les deux instances peuvent partager
le même nœud HTML : deux valeurs différentes de data-component ne peuvent pas
occuper le même attribut. Une simple propagation peut remplacer une identité
par l’autre ; ClientOnly, Teleport et les rendus dynamiques exigent aussi une preuve.
La dispense confirmée ne concernait jusqu’ici que les racines multiples.

Option confirmée par « confirmé » : porter le marqueur obligatoire sur une racine HTML native
unique ; dispenser aussi les racines composant Vue et conditionnelles, avec motif
visible dans le rapport du contrôle. Aucun wrapper ajouté, aucune dispense globale
d’application. Coût limité et identification partielle honnête.

Alternative : accumuler plusieurs identités dans un attribut multivalué sur le
nœud partagé, avec propagation contrôlée. Coût supérieur : nouvelle convention
de valeurs et adaptation/test des composants enveloppes, Nuxt UI et rendus différés.
Cette alternative modifie la proposition initiale de valeur unique ; pas acquise.

### Préparation des critères pilotes et Lighthouse

Proposition technique à confirmer avec les derniers arbitrages : pilote composant
sur DashboardPanel (titre, absence de titre, contenu du slot et icône par kind),
clavier et scan sur connexion/contexte/édition Dashboard, home Showcase et articles
Client 2 sur fixtures. Comparaison visuelle ciblée sur connexion et édition
Dashboard bureau/mobile, thèmes clair/sombre ; images de référence à valider à
l’étape 04, sans approbation présumée.

Lighthouse proposé sur /fr Showcase, /fr/articles Client 2 avec article fixture
et connexion Dashboard ; compléter par une page privée Dashboard avec session
fictive pour prouver que la mesure ne porte pas sur une redirection de connexion.
Deux profils, trois mesures, médiane et rapports JSON/HTML. Les erreurs d’audit
sont des échecs ; budgets de scores informatifs au relevé initial, puis fixation
humaine des seuils. Aucune promesse de score terrain par un audit de laboratoire.

Pour mutation et charge : les commandes et workflows à la demande sont confirmés ;
proposer la mutation de la validation pure des liens éditoriaux et une charge
bornée de lecture SSR/BFF fictif, excluant toute requête sortante vers l’API réelle.
Ne pas inventer un score minimum ou une latence cible avant la première mesure.

Les chemins exacts de corrections structurelles sont inventoriés. Les
[13 cartes et leur ordre](tests-conventions-nuxt-plan.md) sont préparés dans le
dev-book de DevOps, sans implémentation. Les dépendances amont restent sans SHA
tant que les cartes concernées ne sont pas validées et commitées. La
[déclaration prévisionnelle](../demand/DEM-011-tests-conventions-nuxt.md#déclaration-de-contribution) couvre les
chemins proposés ; elle sera réconciliée avec le diff réel avant livraison.

Point supplémentaire à arbitrer : modifier le template des six fichiers encore
tolérés par DEM-007 change leur SHA-256, même sans modifier script setup. Il faut
soit autoriser une actualisation strictement limitée de leurs empreintes après
preuve que les sections absentes sont identiques, soit différer leurs marqueurs
jusqu’à DEM-010. Aucune actualisation automatique de l’exception n’est autorisée
par la seule confirmation des marqueurs. DASH-004 et OPS-024 restent en attente
de cet arbitrage, en plus de leurs vrais commits amont. Les preuves de reconstitution
incluront les fichiers et leur configuration d’exception correspondante.

Autre point restant : confirmer le caractère informatif des scores Lighthouse
avant les premières mesures, les échecs d’exécution restant des échecs. Aucun
seuil de score n’a été approuvé. Aucun code, contrôle, README, commit ou étape 03
réalisé ; les cartes en attente ne sont pas présentées comme prêtes à implémenter.

## Arbitrages de reprise du 2026-11-15

Réponses humaines explicites : « Oui, actualisation limitée » pour les seules empreintes des six fichiers encore sous exception DEM-007, après preuve de sections manquantes identiques, sans ajout ni élargissement ; « Oui, mesures initiales informatives » pour Lighthouse, avec erreurs d’exécution bloquantes et budgets de scores à définir après les premières mesures. Ces réponses lèvent les deux arbitrages signalés, sans lever les dépendances par commits des cartes.
