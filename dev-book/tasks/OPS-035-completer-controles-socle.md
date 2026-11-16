# OPS-035 — Compléter les contrôles du socle frontend

- Demande : DEM-011 ; type : consolidation.
- Session de création : 01a1d56d-446b-7931-bf53-7687a7d10912
- Date : 2026-11-15
- Couche : devops
- Branche : layers/devops
- Worktree : `/home/johan/www/graines-digitales/modern-web-apps/showcase-immobilier/worktree/devops`
- Périmètre autorisé : moteur AST commun frontend, commande et tests du domaine qualité, règles YAML, dépendances verrouillées Codebase Integrity, résolution des alias et ses tests, registre, commande Make de conventions, workflow CI de conventions, documentation de cette extension et cette carte.
- Dépendances : base `ca571d60c39b8b5932d74cd43dcbe4131c47c578` ; rédaction et tests du moteur indépendants ; raccordement aux sources canoniques attend le commit validé de WEB-007, sans copie de documents Web non commitées.
- État : implémentée et commitée, à vérifier ; bilan global dans OPS-031.

Chemins de cette extension (en plus de cette carte) :

- `codebase-integrity/commun/frontend-policy.ts`
- `codebase-integrity/commun/console-context.ts`
- `codebase-integrity/domaines/qualite-code/scripts/verify-frontend-conventions.ts`
- `codebase-integrity/domaines/qualite-code/tests/verify-frontend-conventions.vitest.ts`
- `codebase-integrity/domaines/qualite-code/tests/verify-frontend-cli.vitest.ts`
- `codebase-integrity/domaines/qualite-code/regles.yaml`
- `codebase-integrity/domaines/qualite-code/scripts/verify-code-quality.ts`
- `codebase-integrity/domaines/qualite-code/tests/verify-code-quality.vitest.ts`
- `codebase-integrity/domaines/qualite-code/scripts/verify-solid.ts`
- `codebase-integrity/domaines/qualite-code/tests/verify-solid.vitest.ts`
- `codebase-integrity/domaines/architecture-dependances/scripts/verify-types-placement.ts`
- `codebase-integrity/domaines/architecture-dependances/tests/verify-layer-scopes.vitest.ts`
- `codebase-integrity/package.json`
- `codebase-integrity/bun.lock`
- `codebase-integrity/conventions.json`
- `infra/make/Makefile.dev`
- `infra/make/Makefile.ai-development-engineering`
- `codebase-integrity/commun/run_check_output.py`
- `codebase-integrity/commun/run_aide_checks.py`
- `codebase-integrity/domaines/fiabilite-verifications/tests/test_check_output.py`
- `.github/workflows/conventions.yml`
- `docs/controle-conventions-frontend.md`
- `docs/executer-controles.md`
- `docs/index.md`
- Traces de reprise dans OPS-024 et WEB-006 ; le changement de marqueur Echo appartient à Web.

## Résultat et critères

L’humain a explicitement approuvé les propositions puis demandé leur implémentation immédiate : contrôles stricts des faits certains et warnings sur les détections nécessitant un jugement. Vue doit accepter les styles avec ou sans scoped. Les exceptions DEM-007 de sections script restent inchangées. L’installation isolée du parseur Vue ne modifie pas les dépendances des autres worktrees.

## Réalisation et preuves

Le moteur utilise le parseur Vue et l’AST TypeScript. Blocs et setup TS, marqueurs et noms, régions stables, propriétaire de main, imports des encapsulations déclarées et sélection statique des layers sont contrôlés. Les textes, transformations de template, écouteurs DOM et commentaires historiques sont des warnings ; les racines et contenus éditoriaux exemptés sont rapportés. Un main délégué à un composant reste à vérifier au navigateur ; aucune preuve du rendu complet n’est inventée.

Les contrôles existants de sections script, types et gardes sont conservés. Une correction de résolution d’alias partagé utilise le root explicitement fourni, avec tests sur plusieurs applications. Les dépendances Codebase Integrity sont isolées ; seul le lien node_modules vers le principal a été remplacé par une installation locale, sans toucher sa cible. Le parseur Vue est verrouillé à la version déjà utilisée par le projet.

Commandes : depuis Codebase Integrity, `bun run check:frontend:policy`, `bun run test:typescript`, `bun run test:bun` ; depuis la racine, `make frontend-conventions-check` pour le moteur seul et `make quality-conventions-check` pour les contrôles regroupés ; depuis webapp, `bun run verify -- conventions`. Les commandes et la CI appellent le moteur ; le rapport JSON complet est conservé dans `.tmp/quality/frontend-conventions.json` de la webapp contrôlée. Le montage Docker de ce dossier conserve le rapport côté hôte. Aucune CI distante ni pile utilisateur exécutée pour cette reprise.

Résultats : 44 tests Vitest et 44 tests Bun réussis. Cas couverts : formes conformes et invalides, styles scoped ou non, script absent, racines exemptées, routes dynamiques, régions répétées, textes et exceptions éditoriales, imports statiques et dynamiques, sélection effective des sources, aliases par application et vraie commande sur inventaire Git temporaire. Les fixtures nécessitant des subprocess Git sont exécutées hors sandbox restrictive. Types ciblés, lint et formatage vérifiés séparément.

L’exécution réelle est volontairement bloquante sur les sources non encore migrées : rapport local DevOps et lecture des sources Web, sans transfert. Relevé final Web : 213 sources contrôlées, 14 erreurs dans Dashboard, 411 warnings de revue et 41 exemptions visibles. Les erreurs restantes côté Web concernent le Dashboard. Un marqueur de région de présentation manquant dans la page Echo a été ajouté dans Web, sans modification de son script ou de sa logique ; ce complément reprend le périmètre WEB-006.

Les entrées existantes du registre pour blocs Vue, données de template et encapsulations sont actualisées sur leur couverture réelle. Les références canoniques de WEB-007 sont préparées dans le relevé du principal ; leur intégration reste différée jusqu’à disponibilité par commit. Aucun succès global de DEM-011, aucun budget ni exception élargis.

La commande locale `make frontend-conventions-check` a été exécutée : 213 sources, 127 erreurs, 411 warnings et 41 exemptions dans DevOps, dont les sources ne contiennent pas encore les marqueurs de Web. Make conserve un statut d’échec (2) lorsque le contrôleur échoue ; journal dans `/tmp/dem011-frontend-make.log`.

Présentation harmonisée avec aide-check : trois étapes expliquées, trois erreurs maximum, rapport JSON intégral, couleurs conditionnelles au terminal et respect de NO_COLOR. Invocation directe Bun depuis Make pour éviter les messages intermédiaires du lanceur de scripts. Deux tests CLI réussis ; terminal avec couleurs et NO_COLOR vérifiés, ainsi que la sortie redirigée sans couleurs. Les 127 erreurs existantes restent bloquantes. Journal : `/tmp/dem011-frontend-presentation.log`.

Complément après revue des neuf README spécialisés : leurs règles de structure et de contenu passent le vérificateur documentaire (9 fichiers, aucun écart). L’humain confirme que 200 lignes reste un avertissement, contrairement au maximum de huit propriétés retournées par un composable, bloquant. Le README composants est ajusté dans Web ; aucune copie documentaire non commitée vers DevOps.

Le contrôle SOLID compte désormais les propriétés par AST : données et fonctions, objets sur une seule ligne, branches, objets constants et spreads statiques, sans les retours des fonctions internes. Les retours dynamiques produisent un avertissement ; erreurs de lecture ou de syntaxe bloquantes. Les modifications de formes d’objets reconnaissables rendent la résolution incertaine ; la sémantique arbitraire, les regroupements artificiels et le découpage restent humains. Les composants volumineux et types larges restent non bloquants.

Validation du complément : 9 tests Vitest réussis, lint, formatage, TypeScript strict ciblé (déclaration temporaire de ImportMeta.main), registre et diff vérifiés. Deux exécutions CLI dans un dépôt temporaire : composant de plus de 200 lignes avec huit propriétés → code 0 ; avec neuf propriétés → code 1. Lecture réelle Web : 4 erreurs et 66 avertissements, journal `/tmp/dem011-solid-web.log`. Dépassements : useDashboardSave (9), useDeviceDetect (10), useExceptionalRail (27), useScreenSystem (11). Aucun de ces composables modifié.

Restes de la comparaison documentaire : accès réseau et mutations de stores partiellement détectés ; presets image non garantis ; règles sémantiques principalement humaines ; guide d’architecture encore prescriptif sur le plein écran ; migration des références du registre toujours dépendante de WEB-007. Le moteur frontend seul ne lance pas SOLID ; la commande qualité regroupée le lance.

Vérification des conflits README à la demande humaine : les six worktrees enregistrés partagent la base ca571d60c39b8b5932d74cd43dcbe4131c47c578. Aucun chemin README modifié dans plusieurs worktrees. Comptage des modifications, ajouts et suppressions : principal 0, Dashboard 0, BFF 1, Domaine 3, DevOps 7, Web 24. Ce relevé est ponctuel et doit être actualisé avant intégration. Risque à conserver : Web supprime les README applicatifs historiques tandis que DevOps conserve des références à ces chemins ; raccorder les références après disponibilité du commit WEB-007, sans copier le travail non commité entre couches.

Sortie manuelle jointe par l’humain : fichier `Texte collé.txt`, pièce jointe 9d06d9a7-e87d-4c77-8955-3a15d54c9c5f. Les cibles aide-check et frontend-conventions-check sont absentes du contexte d’exécution ; le dossier codebase-integrity est absent. La commande Docker utilise le projet mlk-my-little-kasbah et les anciens scripts scripts/ci/app, ce qui indique un autre contexte que le worktree DevOps de Showcase. La construction d’image réussit, puis le premier contrôle échoue faute de dépôt Git dans /app ; les commandes suivantes reliées par && ne sont pas exécutées. BASE=<SHA> est un exemple non exécutable tel quel : les chevrons provoquent une erreur de syntaxe shell. Aucun résultat de conformité applicative établi par cette sortie ; fournir les commandes depuis le bon worktree avec une base Git réelle.

Harmonisation des cinq commandes demandée après lecture de la pièce jointe 2da7393d-7328-4663-b6ac-5ead18c0607d : chacune affiche une description INFO bleue dans un terminal compatible. AIDE et frontend conservent leurs étapes ; Docker et dev-book utilisent une présentation commune avec journal intégral temporaire et code de sortie conservé ; SOLID limite la console à trois diagnostics et écrit le rapport complet dans webapp/.tmp/quality/solid.json. NO_COLOR est respecté ; aucune couleur dans les sorties redirigées et rapports. L’environnement privé absent n’est ni créé ni contourné. Les chevrons de BASE=<SHA> restent une notation illustrative : documentation remplacée par un exemple Git exécutable.

Vérification réelle des cinq commandes depuis DevOps : INFO présente et sans ANSI en redirection, erreurs connues conservées. Journaux `/tmp/dem011-command-0.log` à `/tmp/dem011-command-4.log`. Docker échoue explicitement sur webapp/.env absent ; dev-book relève les deux verdicts historiques non structurés ; aucune réussite globale inventée. Onze tests Vitest ciblés et sept tests Python de présentation réussis ; couleurs SOLID en pseudo-terminal et NO_COLOR vérifiés ; lint, formatage, types stricts ciblés et diff vérifiés.

Reprise de l’étape 03 explicitement demandée après la recette manuelle : les descriptions INFO et les couleurs sont conservées. Précondition Docker vérifiée avant tout lancement : un fichier d’environnement absent produit NON EXÉCUTÉ, code non nul et rapport ; aucun fichier privé créé. Un exécutable absent reçoit le même statut, tandis qu’un contrôle lancé avec écarts reste ÉCHEC. Le contexte AIDE/dev-book est affiché ; frontend et SOLID affichent le chemin et la branche des sources, y compris avec une racine Web fournie depuis DevOps. Les petits ensembles d’erreurs sont affichés intégralement : huit au plus pour frontend/SOLID, douze lignes au plus pour le journal commun ; au-delà, sortie abrégée et rapport complet. Les deux verdicts historiques du dev-book et les quatre erreurs SOLID sont désormais tous visibles.

Preuves de cette reprise : 151 tests Python, 55 Vitest et 44 Bun réussis. Lint et TypeScript strict ciblés, formatage et diff vérifiés. Six exécutions réelles contrôlées, journaux `/tmp/dem011-reprise-{aide,frontend,docker,devbook,solid,frontend-web}.log` : les cinq commandes locales conservent leur échec attendu ; Docker n’est pas exécuté sans son environnement ; la lecture des sources Web affiche bien layers/web, sans transfert ni changement de sources. Le résultat frontend reste différent selon le worktree : les marqueurs non commités de Web ne sont pas disponibles dans DevOps. Aucun budget, seuil, exception DEM-007 ni verdict historique modifié.

Relevé historique avant changement du workflow : les cartes dépendantes attendaient alors les commits amont et les compléments OPS-035 n’étaient pas commités. Cette attente est levée par les commits techniques autorisés ; le bilan courant est OPS-031. Cette reprise n’autorise ni à copier les sources non commitées, ni à déduire une validation des cartes de la seule validation des chapitres README. Aucun déploiement ni service utilisateur lancé.

Reprise de l’étape 03 après la sortie manuelle jointe ccf05b08-4e02-46f6-bd50-a8b41eaa687a : correction du faux positif « construite » détecté comme const. La reconnaissance conserve l’espace final des motifs YAML configurés au lieu de le supprimer ; les vrais commentaires de code restent signalés. Aucune suppression de garde ni modification applicative automatique ; détections d’imbrication et de gardes toujours informatives et heuristiques.

Les scripts du paquet pour les tests Python, Vitest, Bun, le lint et les huit contrôles historiques délèguent à la présentation commune. Le moteur et ses seuils, modes d’erreur et exceptions restent inchangés. Résumés des avertissements et totaux des tests visibles, refus simulés attendus masqués en console lorsque les tests réussissent, détail complet dans le journal. Python, Node et Bun restent des prérequis explicites. Les scripts exécutables directement restent disponibles pour diagnostiquer sans l’enveloppe.

Vérification finale : 153 tests Python, 66 Vitest et 44 Bun réussis via `bun run --cwd codebase-integrity test`, journal `/tmp/dem011-correction-tests-final.log`. Les commandes réelles individuelles ont toutes été exécutées, journaux `/tmp/dem011-correction-*.log` : lint sans erreur ; huit contrôles historiques sans échec bloquant ; frontend et SOLID conservent leurs erreurs existantes. Cas négatifs exécutés dans un dépôt temporaire : prose « construite » non signalée, vrai commentaire const toujours signalé sans blocage, ternaire imbriqué bloquant. Pseudo-terminal : INFO bleue, avertissement jaune et NO_COLOR respectés. Types stricts ciblés, lint, formatage et diff vérifiés. Les deux faux positifs disparaissent ; les 121 signalements d’imbrication et 47 gardes suspectes restent à relire. Aucun écart réel n’a été exempté pour obtenir ces résultats.

## Verdict humain

Aucun verdict sur l’implémentation. Les propositions sont approuvées ; les tests ne constituent pas une validation humaine du code.

## Commits

Aucun ; aucun push, PR ou fusion.

Identité de la présentation : `tmp/etat-implementation-controles-socle.json` du principal ; base, empreintes des fichiers et diff identifiés, sans commit.

Reprise du 2026-11-15 : WEB-007 disponible par e458abd843683845f598c4a4d0f61a45012b75f8 ; sources du registre et guides raccordés aux README communs sans copie de contenu. Le moteur et la présentation sont commités à l’implémentation, à vérifier humainement.
