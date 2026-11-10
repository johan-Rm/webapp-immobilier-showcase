# OPS-004 — Composer les apps sélectionnées et adapter l’outillage Nuxt

- Demande : DEM-003 ; brouillon principal `tmp/demande-extraire-screens-immobiliers.md`
- Type : consolidation
- Session de création : 01a1c16c-2085-7141-83fa-3460f6bd4463
- Couche : devops
- Branche : layers/devops
- Worktree : worktree/devops
- État : validée et commitée localement le 2026-11-10 ; à reconstituer
- Chemins autorisés : Config Nuxt/TypeScript/Vitest/Tailwind/ESLint/Playwright de `webapp/`, `webapp/base/nuxt.config.ts`, `webapp/base/README.md`, scripts et workflow qualité, `sonar-project.properties` : liste exacte OPS-004 dans l’inventaire.
- Dépendances : Base 6f4ebb114a9e856e762690b46425e11f5df65796 ; pas de dépendance de réalisation à WEB-001/002. Consommer leurs contrats de chemins confirmés ; exécuter les contrôles globaux après leurs commits.

## Résultat et critères

La racine sélectionne la cible et son `app/` comme `srcDir`, puis étend sa config.
Elle n’étend plus globalement une layer qui pointe sur l’ancien app. L’app active
et les chemins de types doivent être spécifiques à la cible ; le catalogue n’est
présent que par l’extension Showcase définie par WEB-001.

Coordonner la bascule des options Showcase vers sa config : pas de CSS, module
d’édition/auth, bootstrap, BFF, sitemap ou copie obligatoire de thème/contenu pour
Client 2. Conserver le BFF dans `webapp/server/`, sélectionné par la config Showcase ;
Client 2 utilise explicitement son emplacement serveur vide. Aucune modification
des handlers ou contrats métier n’est nécessaire dans ce lot.

Résoudre `~`, `@`, `@utils`, `@site-assets` et les auto-imports depuis l’app active,
y compris le `~/stores/accommodation` des screens. Corriger les alias TS manuels
figés, les chemins du scanner CSS et les scripts d’assertion de structure. Adapter
le choix des tests navigateur par cible. Qualité CI sur les deux cibles ; Sonar
couvre les sites et le catalogue, sans élargir les exclusions.

Critères : le root ne référence plus `webapp/app/` ; préparation, types et builds
successifs des deux cibles ; aucune fuite de modules, ressources ou config privée
Showcase dans Client 2 ; cible inconnue refusée ; sortie autonome toujours complète
pour Showcase et possible pour la cible vide. Garder les sorties `.nuxt`/`.output`
historiques, utilisées séquentiellement par checkout et séparément par image.

Tests : fixtures jetables de composition, alias, serveur, sélection de suites et
packaging ; aucune vraie API. Tests/types/builds réels dépendent de la réunion des
commits WEB-001 et WEB-002. Retirer ou corriger l’ancienne déclaration de base,
sans déplacer leurs dépendances vers le catalogue.

## Réalisation et preuves

Implémentation réalisée le 2026-11-10. Base présentée à la validation :
`6f4ebb114a9e856e762690b46425e11f5df65796`, worktree Devops / `layers/devops`.
La racine sélectionne l’app cliente ; les alias TypeScript proviennent désormais
de Nuxt. Suppression de l’ancienne config de base ; scanners CSS, Vitest,
Playwright, assertions de structure, Sonar et matrice CI adaptés.

Contrat de reprise pour WEB-001 : reprendre toutes les options propres à Showcase
depuis `git show 6f4ebb1:webapp/nuxt.config.ts` dans sa config cliente, notamment
modules, runtimeConfig, CSS/transitions, i18n, hooks schémas/packaging et Vite.
Le CSS déplacé doit corriger son `@config` relatif vers le Tailwind racine.
Le root conserve uniquement sélection, SSR, strict, alias et identité compilée.

Preuves exécutées depuis ce worktree :

- `bun run --cwd webapp test -- scripts/build/site-targets.vitest.ts` : réussi.
  Vraie config racine copiée dans un projet jetable ; préparation successive des
  deux cibles, composants et routes serveur isolés, alias/sources ciblés, rejet
  d’un client inconnu. Build SSR de la cible témoin vide réussi, sans thème,
  contenu ni packaging Showcase. Log : `/tmp/dem003-targets-tests.log`.
- `bun run --cwd webapp test` : 59 tests / 10 fichiers réussis, y compris le build
  témoin final. Les 8 tests des deux composables encore
  dans l’ancien app attendent leur déplacement ; aucun succès global revendiqué.
- `bun run --cwd webapp lint:check`, formatage ciblé et `bash -n
webapp/scripts/check-feature-001.sh` : réussis.

Tests/types/builds des vraies applications et navigateurs différés aux commits
WEB-001/002. Le worktree Devops est intermédiaire : ne pas le démarrer comme une
application complète avant réunion. Le principal fonctionnel est préservé.
Diff présenté : chemins OPS-004 de l’inventaire ; nouveau contrôle
`webapp/scripts/build/site-targets.vitest.ts`. Index vide, aucun commit.

## Verdict humain

Validée le 2026-11-10 : « parfait, validé », après présentation des trois cartes
OPS-003/004/005, de leurs preuves et des vérifications globales différées.
Cette validation couvre le périmètre préparatoire présenté ; elle ne prouve pas
les builds et parcours des vrais clients, encore dépendants des cartes Web.

## Commits

- Réalisation initiale : `943ac3e2fbc1b269435936112be9efcea6b17ce3`.
- Correction validée : `0fb11118275083408e7f7a37f6cd9d12ff3133e2`.
- Aucun push, PR ou fusion ; suite hors de cette étape de validation.

## Correction à l’étape 03

La suppression complète des paths manuels a révélé des erreurs de résolution de
modules et d’inférence appConfig dans Showcase ; le contrôle de référence du
principal conserve zéro erreur. La politique d’alias historique est donc conservée,
avec les chemins app calculés pour la cible et #components pour les imports de
screens. `prepare:types` génère `.nuxt/tsconfig.site.json`, étendu par tsconfig.json.
Aucun changement de strict, skipLibCheck, seuil, règle, code métier ou API.
Cette limite décrivait l’étape 03 ; la correction a ensuite été validée et
reprise par commit dans Web.

Preuves de correction : fixture réelle de composition/build et alias, 2 tests
réussis (`/tmp/dem003-ops004-correction-tests.log`) ; lint réussi. La comparaison
sur Showcase préparé explicitement retrouve 9 erreurs avec les alias remplacés,
zéro avec la politique historique adaptée via une configuration temporaire
(`/tmp/dem003-types-compat.log`). Ce diagnostic n’est pas une consommation de la
correction non commitée par Web : la commande ordinaire reste à revalider après
commit et cherry-pick. Les réglages strict et skipLibCheck restent hérités inchangés.
Le verdict humain précédent couvre uniquement `943ac3e`, pas cette correction.

Validation de la correction le 2026-11-10 : « c’est validé », après essais humains
sur le vhost Web et présentation des preuves et de la limite TypeScript.
Le contenu présenté a été revérifié par empreinte avant indexation. Le contrôle
ordinaire sera exécuté après reprise du commit dans Web ; aucune modification
supplémentaire de source n’est autorisée par cette vérification.

Clôture à l’étape 04 : correction `0fb11118275083408e7f7a37f6cd9d12ff3133e2`
reprise dans Web par `93eba2a`. Qualité Showcase et types Client 2 ordinaires
réussis ; suites finales 70 et 45 tests réussis. Aucun code métier changé.
