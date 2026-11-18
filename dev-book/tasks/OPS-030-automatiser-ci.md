# OPS-030 — Automatiser les contrôles sur les trois cibles

- Demande : DEM-011 ; type : consolidation.
- Session de création : 01a1d56d-446b-7931-bf53-7687a7d10912
- Date : 2026-11-14
- Couche : devops
- Branche : layers/devops
- Worktree : `/home/johan/www/graines-digitales/modern-web-apps/showcase-immobilier/worktree/devops`
- État : implémentée et commitée, à vérifier ; bilan global dans OPS-031.
- Base locale vérifiée : `ca571d60c39b8b5932d74cd43dcbe4131c47c578` ; aucun fetch.
- Dépendances : OPS-024, OPS-025, OPS-026, OPS-027, OPS-028, OPS-029, BFF-005, DOM-002 ; SHA à renseigner après validation des cartes amont, aucun SHA inventé.
- Référence de cadrage : `tmp/demande-consolidation-tests-conventions-nuxt.md`, relatif au principal, hors worktrees ; ne pas copier. Analyse et décisions : `tmp/analyse-tests-conventions-nuxt.md`.
- Chemins autorisés (en plus de cette carte) :

- `.github/workflows/quality.yml`
- `.github/workflows/conventions.yml`
- `.github/workflows/ai-development-engineering.yml`
- `.github/workflows/quality-extended.yml`
- `infra/docker/docker-compose.quality.yml`
- `webapp/scripts/quality/ci-plan.vitest.ts`
- `codebase-integrity/README.md`

## Résultat et critères

Parité local/CI, installations verrouillées, matrice Showcase/Client2/Dashboard. PR : types, lint/format, suites Node/Bun, conventions bloquantes confirmées, dependency-cruiser, scanner, builds SSR et smoke navigateur sur fixtures. Inclure guards et valider réellement les messages de la plage PR via vérificateur de la base ; ne pas exécuter le candidat comme autorité de contribution. Ne pas réactiver Sonar ni modifier les protections distantes. Workflow à la demande pour mutation/charge ; Lighthouse selon politique arbitrée. Joindre rapports et versions, distinguer refus, échec et étape non lancée ; pas de secret de production.

Exclusions communes : secrets et .env, données utilisateur, code Cap Nour/Kazen en écriture, production, DEM-010, nouvelles conventions non arbitrées. Préserver les rubriques et l’ordre des README. Un résultat inconnu ne vaut pas réussite.

### Critères complémentaires confirmés le 2026-11-17

- Appliquer les trois préfixes anglais et leurs responsabilités selon le README Codebase Integrity ; fournir des commandes Make directes, sans sélecteur public de famille.
- Conserver la séparation entre application des conventions au dépôt et tests de fiabilité des vérificateurs, en local et en CI.
- Rattacher chaque commande de conventions à un chapitre de README existant ; une correspondance vérifiée manuellement ne vaut pas contrôle automatique exhaustif des assertions.
- Conserver les codes d’échec, les alias historiques et la préparation explicite sans reconstruction à chaque contrôle.
- Distinguer ces correctifs techniques du verdict humain et de l’exécution distante des workflows.

## Réalisation et preuves

Les workflows couvrent les trois cibles et conservent les rapports même en échec. Les mesures longues restent manuelles. Le contrôle des messages utilise le vérificateur de la base PR. Aucune exécution GitHub n’a été effectuée à cette étape.

L’image qualité contient les deux paquets, Chromium, Lighthouse et k6 verrouillés. Son contexte exclut les secrets, dépendances locales et sorties de build. Les ajustements compagnons nécessaires concernent `.dockerignore`, `Dockerfile.playwright`, `Makefile.dev`, le lanceur et ses tests, le serveur de fixtures, le pilote de charge et la configuration Playwright. Le serveur de fixtures utilise une API fictive et des répertoires temporaires possédés ; l’image du héros CI est une simulation explicitement activée, jamais une preuve des médias réels.

Vérifications locales : 58 tests ciblés de qualité et vérification TypeScript réussis. `make quality-verify FAMILY=contracts` a construit l’image et comparé réellement 28 artefacts identiques. Les erreurs de sécurité restent bloquantes ; les avis existants ne sont pas exemptés. Les contrôles globaux et la recette sont consolidés dans OPS-031.

## Verdict humain

Aucun verdict d’implémentation. Le cadrage confirmé n’est pas une validation du code.

## Commits

Le workflow autorisé le 2026-11-15 permet un commit technique local par tâche terminée puis la poursuite des dépendances, avant vérification humaine globale. Les SHA réels sont consignés dans le récapitulatif du brouillon. Aucun push, PR ou fusion.

### Droits de l’image qualité

Les sources reçoivent leur propriétaire pendant la copie ; seules les racines et les caches nécessaires sont ajustés ensuite. Les dépendances installées restent lisibles sans parcours récursif coûteux. La reconstruction corrigée et les 28 contrats ont été réellement vérifiés dans l’image finale.

### Correction demandée le 2026-11-17 — réutiliser l’image

L’humain demande immédiatement dans DEM-011 de séparer préparation et exécution. `make quality-prepare` construit explicitement l’image une fois ; `quality-verify` vérifie sa présence locale puis la réutilise avec `--pull never --no-deps`, sans reconstruction ni téléchargement implicite, y compris si elle manque. Les sorties expliquent les deux étapes et rappellent de préparer à nouveau après une modification des sources. La fraîcheur n’est pas contrôlée automatiquement. Ce correctif ne met pas en œuvre le chantier plus large de présentation et de reporting, conservé en brouillon.

Chemins compagnons : `Makefile` (aide), `infra/make/Makefile.dev`, `webapp/scripts/quality/ci-plan.vitest.ts` et le catalogue `docs/executer-controles.md`. Neuf tests ciblés réussis, lint et formatage ciblés conformes, documentation et 24 README conformes. Construction explicite réelle réussie ; deux exécutions de contrats réussies ensuite, sans build. Le refus d’une image absente a été reproduit avec un nom de projet Compose isolé, sans créer d’image ni de conteneur. Aucun nouveau verdict humain.

### Correction demandée le 2026-11-17 — interface Make commune

L’humain exige une recette sans appels directs à Bun. Les contrôles lint, formatage, types, gardes et services utilisent désormais le lanceur qualité et l’image préparée, avec descriptions pédagogiques et codes d’échec préservés. Les raccourcis Make existants de contrôle sont raccordés à ce lanceur ; `integrity-test` délègue aux trois moteurs des vérificateurs. Les commandes de correction automatique ne font pas partie de cette recette. Le bilan groupé reste en brouillon.

Chemins compagnons : lanceur et ses tests, tests du plan Make, Makefile racine et Dev, catalogue documentaire. Vérifications : 38 tests ciblés réussis ; `make integrity-test` réussit avec 154 Python, 66 Vitest et 44 Bun. Les cinq raccourcis lint, formatage, types, gardes et services réussissent réellement sur Showcase dans l’image préparée, sans reconstruction ni démarrage web. Documentation, 24 README et traces conformes. Aucun verdict humain implicite.

### Préparation réutilisable demandée le 2026-11-17

L’humain demande de pouvoir rejouer la recette entière en ignorant le build déjà réalisé. `quality-prepare` construit seulement si l’image manque ; une image présente produit un message explicite de réutilisation. `quality-rebuild` reconstruit volontairement après modification des sources ou dépendances. La présence de l’image n’est pas une preuve de fraîcheur : ce dernier choix reste explicite. Les contrôles conservent leur refus d’image absente et ne reconstruisent pas implicitement. Quarante tests ciblés réussis, dont image absente, deux préparations avec un seul build, réutilisation et reconstruction explicite. Deux appels réels successifs à `quality-prepare` ont tous deux ignoré le build de l’image présente. Lint ciblé, documentation et 24 README conformes.

### Nommage confirmé le 2026-11-17

L’humain demande d’appliquer immédiatement les noms discutés : `check FAMILY=…`, `checks-prepare`, `checks-rebuild`, `conventions-check`, `conventions-guards-check` et `conventions-services-check`. Les raccourcis de qualité du code restent distincts. L’aide, les références actives et les recettes utilisent ces noms. Les anciens noms délèguent aux mêmes contrôles pour préserver les recettes existantes ; aucune règle, sévérité ni famille n’est modifiée. Les traces historiques conservent les commandes réellement exécutées. 46 tests ciblés réussis ; compatibilité des six anciens noms vérifiée. Les nouveaux noms sont exécutés réellement : préparation répétée sans build, contrats réussis, gardes et services réussis ; `conventions-check` conserve les quatre écarts SOLID bloquants. L’architecture est vérifiée après son correctif isolé OPS-026. Lint ciblé, documentation, 24 README et traces conformes.

### Commandes explicites demandées le 2026-11-17

L’humain remplace le choix public par `FAMILY` par des commandes directes. Toutes les conventions automatisées portent désormais le préfixe `conventions-`, y compris frontend, documentation, traces, architecture et contrats. Le catalogue de référence reste `docs/executer-controles.md` ; les anciennes entrées délèguent uniquement pour compatibilité. Aucun changement de sélection, de sévérité ou de construction implicite.

Vérifications : 57 tests ciblés réussis, dont les seize routages sans paramètre et plusieurs commandes dans un même appel Make ; lint ciblé, documentation et 24 README conformes. Les traces des cartes restent conformes. Exécution réelle des deux commandes explicites : 28 contrats identiques ; architecture sans violation, avec deux imports virtuels signalés. Image réutilisée sans build. Aucun nouveau verdict humain.

### Séparation des conventions et des tests de fiabilité — 2026-11-17

À la demande humaine, `conventions-docs-check` applique uniquement les trois contrôles de registre, demandes et documentation ; la suite Python des vérificateurs reste dans `integrity-test`, avec Vitest et Bun. La CI distingue les deux étapes pour ne perdre aucune suite. Les tests du lanceur vérifient les trois scripts réellement appelés, les rapports, la couleur et la conservation des échecs. Les fichiers non suivis préexistants de DevOps sont préservés.

Vérifications : trois contrôles documentaires réussis ; 154 tests Python réussis. Exécution séparée de `integrity-test` réussie : 154 Python, 66 Vitest et 44 Bun. Traces des cartes conformes. Aucun verdict humain ajouté.

### Trois préfixes anglais confirmés le 2026-11-17

L’humain exige les préfixes `third-party-tests-`, `conventions-` et `verifiers-`. La règle durable est définie dans le README Codebase Integrity ; le catalogue des commandes reste dans la documentation d’exécution. Les commandes de préparation restent distinctes. Les noms directs, l’aide groupée, les références actives et la CI sont harmonisés ; les noms précédents restent des alias masqués pour compatibilité. Les preuves historiques restent inchangées.

Vérifications : 74 tests ciblés réussis (routages, alias, appels multiples et échecs), lint ciblé conforme ; `verifiers-test` réussit avec 154 Python, 66 Vitest et 44 Bun. Les nouvelles commandes de lint, contrats et architecture réussissent réellement sans reconstruction : 28 contrats identiques, zéro violation d’architecture et deux imports virtuels signalés. Les trois contrôles documentaires et les 24 README sont conformes. Fichiers non suivis préexistants conservés. Aucun verdict humain ni contrôle CI distant ajouté.

### Présentation et reporting autorisés le 2026-11-17

Après examen de la sortie humaine complète, l’humain autorise la présentation immédiatement et réserve le diagnostic des tests échoués à un échange ultérieur. Le périmètre couvre la présentation commune et ses métadonnées, ses tests Python, les raccordements Make et Compose, l’aide et la documentation d’exécution. Les tests de routage Make ne changent que pour fournir les prérequis explicites aux outils simulés ; aucun contrôle produit ni seuil n’est corrigé ou désactivé.

Le bandeau affiche les six champs du catalogue et la cible. Chaque événement contient commande et cible ; les sorties imbriquées restent dans un journal complet sans couleur sur l’hôte. Les journaux temporaires du conteneur sont placés dans un montage persistant. Les prérequis absents sont distingués des tests échoués et gardent un code non nul. `checks-run` poursuit les contrôles de la cible après échec, distingue les profils Lighthouse et produit un bilan de son exécution, sans démarrer de serveur. Les comptes d’avertissements non fiables restent explicitement non consolidés.

Vérifications : 74 tests ciblés de routage et lanceur réussis, lint ciblé conforme ; 162 tests Python réussis, dont huit cas de présentation (contexte, journaux, couleurs, prérequis, code non nul, interruption du seul groupe possédé et poursuite du bilan groupé). Exécutions réelles de documentation, traces et contrats réussies ; préparation avec image présente sans build. `verifiers-test` réussit : 162 Python, 66 Vitest, 44 Bun. Les scénarios groupés sont éprouvés avec outils simulés ; la recette entière et ses échecs existants ne sont pas rejoués ni corrigés dans ce lot. Aucun verdict humain, push ou CI distante.

### Diagnostic des échecs Make dans Docker — 2026-11-17

L’humain autorise le diagnostic puis la correction des 47 échecs de la recette d’intégration. Dans l’ancienne image, le lancement de `make --version` retourne `spawnSync make ENOENT`, tandis que Python, Git et Node sont présents. Après préparation Nuxt dans le même conteneur, le cas « reconstruit explicitement » reproduit `Error: NaN` suivi du journal absent. La suite ne pouvait pas démarrer Make ; l’addition de sorties nulles masquait cette cause.

Le Dockerfile déclare explicitement Make et Python. Le scénario de test vérifie l’erreur de démarrage et le signal avant de lire le journal ; son diagnostic conserve la cause système. Un cas dédié exige un message explicite en l’absence de Make. Aucun test n’est supprimé, ignoré ou rendu moins strict. Les avis de sécurité et écarts SOLID ne sont pas modifiés par ce correctif.

Vérification initiale : 53 tests de cette suite réussis sur l’hôte, lint ciblé conforme. Les résultats Docker et le rejeu complet sont précisés ci-dessous.

La nouvelle image confirme Make 4.3 et Python 3.12.3 ; les 53 tests ciblés passent dans Docker. Le premier rejeu complet découvre deux timeouts à 5 secondes (architecture et scénario Make multi-commandes), avec 241 autres tests réussis sur 243. Ils ne proviennent plus d’un exécutable absent. La configuration borne à deux workers les suites Node de la famille intégration afin de limiter les processus Nuxt et CLI simultanés ; aucun timeout ni assertion n’est assoupli.

Confirmation finale dans l’image `sha256:c6243334f4483f22d89c74118b662eaea51ef7f5b600872c003dc5a4f9f5dd96` : 243 tests réussis sur 23 fichiers, code 0, durée Vitest 83,23 secondes, sans augmenter les délais. La suite Make de 53 tests est incluse dans ce total, pas additionnelle. Le premier rejeu borné annonçait également 243 réussites mais le lanceur avait été interrompu (143) sans bilan ; la confirmation finale écrit directement son journal et son code sur le montage hôte. Les conteneurs temporaires utilisent leur suppression automatique ; aucun serveur utilisateur n’est démarré. Documentation, 24 README et traces des cartes contrôlés séparément.

### Signalement composants et aide aux parcours navigateur — 2026-11-17

Problème composants consigné à la demande humaine, sans correction dans ce lot : le journal `third-party-tests-components-hatqjzlg/output.log` signale l’absence de `dashboard/.nuxt/tsconfig.site.json`, avant toute exécution de test. Le lanceur composants ne prépare pas Nuxt ; le conteneur possède un dossier généré temporaire vide. Ce défaut reste ouvert.

L’humain demande ensuite de rendre les parcours navigateur exécutables. Les commandes explicites `checks-fixture-start` et `checks-fixture-stop` préparent le vrai SSR avec les fixtures et contrôlent uniquement leur conteneur nommé par worktree et cible. Les tests restent séparés et exigent leur URL. Le serveur écoute uniquement la boucle locale, avec API et médias fictifs ; aucun accès Symfony réel ni démarrage de pile utilisateur. La compilation et le service partagent le même conteneur jetable, sans reconstruction de l’image.

Vérifications de cette aide : compilation SSR puis disponibilité réelle du serveur ; refus d’une cible inconnue et d’un port occupé avant démarrage ; arrêt du seul conteneur nommé, confirmé absent ensuite. Les 53 tests de routage Make restent réussis. La surcharge Compose dédiée retire uniquement le montage de sortie Nitro : le build peut recréer son répertoire, contrairement au montage tmpfs initial qui provoquait EBUSY.

Les deux parcours Playwright Showcase sont réellement exécutés, mais échouent sur les erreurs console d’images : 400 IPX_INVALID_MODIFIER sur l’image du héros et six 404 IPX_FILE_NOT_FOUND sur ordinateur, trois erreurs au total sur mobile. Les assertions structurelles et la capture sont franchies avant cet échec final. Le rapport de référence OPS-031 conserve ce nouveau blocage, distinct du prérequis d’URL désormais résolu. Les erreurs ne sont ni filtrées ni exemptées. Le serveur de fixtures est arrêté après l’essai ; les commandes documentées permettent la reprise humaine.

### Correction des médias simulés du navigateur — 2026-11-17

À la demande humaine, correction du serveur de fixtures : le PNG injecté sous le nom JPEG du hero provoquait une erreur libpng dans Sharp ; six autres images locales étaient absentes. Sous le seul opt-in média, une image JPEG valide remplit désormais les références JPEG de la configuration de navigation et des trois pages d’accueil traduites. Les fichiers existants sont conservés par création exclusive. Aucune assertion navigateur ni source applicative n’est modifiée.

Vérifications : 15 tests ciblés réussis, dont deux nouveaux tests de préparation des médias (transformation réelle IPX vers WebP des sept images attendues, conservation des originaux et fichiers étrangers, répétition sans remplacement). Lint et formatage ciblés conformes. Après reconstruction explicite de l’image, compilation SSR de fixtures sur le port séparé 19857 et deux parcours Chromium desktop/mobile réussis, code 0. Journal persistant : `webapp/.tmp/quality/console/third-party-tests-browser-8qnwx7sn/output.log`. Le seul conteneur possédé `devops-dem011-ipx-verification` a été arrêté. Les contrôles documentation et traces passent ; aucune CI distante ni nouvelle validation humaine. Les médias simulés ne prouvent pas le rendu réel. Le défaut composants Dashboard reste ouvert.

### Cycle de vie des couches en mode test — 2026-11-18

Sur demande humaine, les commandes `lane-up`, `lane-down`, `lane-logs`, `lane-status` et `lane-rebuild` acceptent `MODE=test` ; le mode par défaut reste le développement. Le mode test résout le worktree affecté, utilise l’image des contrôles et les fixtures existantes sans valider ni lire le fichier d’environnement privé. Le nom du conteneur distingue dépôt, couche et cible ; le port par défaut est la base 19850 augmentée de l’identifiant de couche (DevOps : 19854), modifiable explicitement. Les anciens noms de fixtures restent des alias cachés. La reconstruction est explicite et son échec interdit le démarrage suivant.

Preuves : 21 tests Python des couches réussis, dont quatre nouveaux scénarios sur routage sans secrets, refus des paramètres invalides, port propre à la couche et arrêt après échec de reconstruction. Démarrage réel via `lane-up devops MODE=test`, deux parcours Chromium réussis avec assertions inchangées, journal `webapp/.tmp/quality/console/third-party-tests-browser-9kmz59ga/output.log`. Cette recette utilisait le port 19856 avant correction de l’export Make de la valeur par défaut ; le calcul final 19854 est vérifié par test et par `lane-status`. `lane-down devops MODE=test` a arrêté le seul conteneur possédé ; la vérification suivante dans `docker ps -a` confirme sa disparition automatique. Aucun conteneur ancien n’est supprimé. Documentation et traces conformes ; aucune CI distante ni validation humaine nouvelle. Les défauts composants et autres écarts ouverts ne sont pas corrigés par ce changement.

### Relance du mode test après création incomplète — 2026-11-18

Le signalement humain révèle un conteneur jetable à l’état `created`, jamais démarré, réservant le nom du serveur. Le lancement vérifie maintenant son état, les labels Compose et la suppression automatique : un serveur actif reste intact ; un ancien conteneur jetable créé, arrêté ou mort est supprimé sans force ni suppression de volumes avant relance. Un nom étranger, un état transitoire ou Docker inaccessible bloque sans suppression. La reconstruction d’un serveur actif est refusée avant toute reconstruction d’image.

Vérification : 25 tests Python des couches réussis, incluant absence, erreur Docker, appartenance étrangère, états récupérables et serveur actif. Le garde-fou a supprimé le seul conteneur incomplet signalé ; son absence est confirmée dans Docker. Aucun nouveau serveur ni parcours navigateur lancé pour cette correction du cycle de vie. Contrôles documentaires et traces exécutés séparément ; aucune CI distante ni validation humaine nouvelle.

### Diagnostic Docker insensible à la casse — 2026-11-18

Le daemon réel répond `error: no such object` pour le conteneur absent ; le garde-fou attendait une majuscule et refusait à tort le démarrage. La détection est désormais insensible à la casse ; les autres erreurs gardent un code non nul et leur diagnostic Docker est affiché. Le test reprend le message exact, vérifie l’absence de suppression et conserve le cas d’accès refusé. Les 25 tests des couches passent ; le garde-fou exécuté contre le daemon réel autorise désormais le démarrage sans créer ni supprimer de conteneur. Le serveur et les parcours ne sont pas relancés dans cette vérification ciblée.

### Descriptions pédagogiques et affichage direct — 2026-11-18

À la demande humaine, chaque commande du catalogue affiche dans son bandeau une description de l’objet vérifié et des limites du résultat. Le paramètre Make `LIVE=1` active explicitement la restitution des sorties reçues pendant l’exécution, avec commande et cible ; les autres valeurs gardent la synthèse. Le journal complet, les codes d’échec, le contrôle des prérequis et l’arrêt du groupe possédé sont conservés. Les outils peuvent garder leur propre mise en tampon ; le lanceur ne garantit pas l’émission immédiate de leur sortie interne. Le présentateur imbriqué laisse passer les sorties sous ce seul mode et conserve son refus d’un fichier d’environnement requis absent.

Preuves : 11 tests ciblés de présentation réussis (couverture des descriptions, activation explicite, stdout/stderr et échec conservés, absence de résumé imbriqué en direct et prérequis préservé). Exécution réelle de `make conventions-docs LIVE=1` réussie avec sorties contextualisées et rapport hôte. Le contrôle complet des vérificateurs Python réussit également : 165 tests, dont les 11 ciblés. Documentation et traces conformes ; aucun test applicatif, serveur ou conteneur lancé pour cette évolution de présentation.

### Nom du mode verbeux — 2026-11-18

L’humain choisit `VERBOSE=1` à la place de `LIVE=1` pour demander la sortie détaillée en direct. Lanceur, présentateur imbriqué, tests et commande documentaire utilisent ce seul nouveau paramètre ; le résumé reste le mode par défaut. Les preuves antérieures conservent le nom réellement utilisé à leur date. Vérification : 11 tests ciblés de présentation réussis et `make conventions-docs VERBOSE=1` réussi avec affichage direct et rapport conservé. Aucun test applicatif ni serveur lancé pour ce renommage.

### Description intégrée au bandeau — 2026-11-18

Sur demande humaine, la description figure en tête du bandeau, avant les métadonnées, avec retour à la ligne et séparateur horizontal. Elle utilise le magenta, réservé à cette présentation descriptive ; la progression reste distincte. La description reste lisible sans couleur et ne se répète pas comme événement après le bandeau. Onze tests ciblés de présentation réussissent, avec vérification de l’ordre et du séparateur ; contrôle documentaire réel réussi. Aucun test applicatif relancé.

### Identité de marque et nom du contrôle — 2026-11-18

Sur instruction humaine, le bandeau utilise désormais l’olive clair Graines Digitales `#A8B97A`, référencé dans la charte officielle du dépôt et dans le thème sombre du Dashboard, à la place du magenta. Cette couleur d’identité est distincte du vert ANSI de réussite ; les statuts conservent leur palette sémantique. Le nom de la commande précède la description, puis le séparateur et les métadonnées. Les 11 tests de présentation passent, avec assertions sur la couleur de marque, la distinction de réussite, le rendu sans couleur et l’ordre nom/description/métadonnées. Le contrôle documentaire réel passe ; aucun test applicatif relancé.

### Renommage de la commande unitaire — 2026-11-18

Sur demande humaine, `verifiers-tests-unit` remplace `third-party-tests-unit` dans Make, le bandeau, le catalogue et les tests de routage. Le périmètre exécuté est conservé : il inclut de la logique applicative et des outils internes, ce que la description indique explicitement. Ce renommage ne réalise pas le tri par responsabilité ni la séparation Vitest/Bun discutés ensuite. Les commandes séparées par moteur ne sont pas encore disponibles. Vérifications : 11 tests Python de présentation et 53 tests Vitest de routage réussis ; aucune assertion applicative modifiée.

### Description positive du lint — 2026-11-18

À la demande humaine lors de la revue manuelle, la description ESLint présente uniquement les vérifications effectuées et précise le périmètre application Nuxt et vérificateurs. Les commandes et les assertions restent identiques. Le résultat humain transmis pour le lint est réussi, code 0 ; aucun nouveau lint applicatif exécuté pour cette modification rédactionnelle.

### Description positive du formatage — 2026-11-18

Lors de la revue humaine, la description Prettier est précisée positivement : périmètre application et vérificateurs, indentation, guillemets, points-virgules, retours à la ligne et ordre des classes Tailwind. L’objet du bandeau devient « Mise en forme des fichiers ». Le journal humain `third-party-tests-format-c920__si/output.log` signale un écart de formatage dans `codebase-integrity/README.md` ; cet échec reste distinct et n’est pas corrigé par cette évolution rédactionnelle. Contrôle documentaire exécuté ; aucun nouveau formatage global lancé.

### Revue de toutes les descriptions — 2026-11-18

À la demande humaine, les 23 descriptions du catalogue et les explications intermédiaires sont revues pour présenter positivement les vérifications effectuées et leur périmètre. Les descriptions précisent les objets analysés, les outils et les mesures selon la commande. Les prérequis, erreurs et niveaux de blocage restent dans les champs et diagnostics dédiés. La règle de présentation est alignée dans le README responsable et le guide d’exécution. La sélection mixte de la suite unitaire reste explicite ; aucun périmètre de contrôle ni assertion n’est changé.

Vérifications : 11 tests ciblés de présentation réussis, contrôle documentaire réel réussi, formatage et lint ciblés du lanceur TypeScript conformes. Aucun contrôle applicatif global ni reconstruction d’image lancé pour cette revue rédactionnelle ; les textes embarqués dans l’image actuelle seront actualisés lors de la prochaine reconstruction explicite.
