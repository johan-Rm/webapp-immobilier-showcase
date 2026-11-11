# OPS-004 — Composer les apps sélectionnées et adapter l’outillage Nuxt

- Demande : DEM-003 ; brouillon principal `tmp/demande-extraire-screens-immobiliers.md`
- Type : consolidation
- Session de création : 01a1c16c-2085-7141-83fa-3460f6bd4463
- Couche : devops
- Branche : layers/devops
- Worktree : worktree/devops
- État : correctifs du 2026-11-11 validés et commités localement ; à livrer
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

## Écart CI relevé le 2026-11-11

Sur le commit publié `d97fbda`, le job qualité Client 2 échoue avec TS2307 :
`shared/types/content.ts` importe `../../schemas/interfaces` et
`shared/types/dashboardAccommodation.ts` importe `@schemas/interfaces`, absents
sur le checkout CI. Preuve : job GitHub `130420960304`, copie locale du journal
`/tmp/dem003-ci-quality-client2.log`. Le job Showcase est ensuite annulé par la
matrice CI ; cette annulation ne démontre pas un échec de ses types.
Les types Client 2 locaux précédemment réussis disposaient des contrats déjà
générés et ne couvraient donc pas ce checkout vierge. Aucune configuration,
convention ou règle n’est modifiée dans la reprise du correctif d’images ;
la préparation des contrats en CI reste à corriger et vérifier avant livraison.

## Reprise du 2026-11-11 — contrats sur checkout vierge

Après demande de poursuivre les corrections restantes, reprise dans le principal
sur `demands/DEM-003`, base `d97fbda992a67a96abff8513e1b9de4b6b5b2be6`.
Le hook commun `prepare:types` génère désormais les interfaces et DTO avant la
configuration TypeScript de la cible. Aucune donnée, initialisation, route BFF
ou configuration Symfony de Showcase n’est ajoutée à Client 2.

Le test de cibles existant copie les sources YAML et le générateur réels, retire
les artefacts avant chaque cible et exécute `nuxt prepare` puis `vue-tsc --noEmit`.
Il passe pour les deux cibles sans schémas générés préalables. La fixture du vrai
Client 2 fournit également les sources communes tout en conservant toutes ses
assertions d’absence des composants, routes, secrets et bootstrap Showcase.
Les chemins sources sont figés sur ceux de la fixture pour ne pas hériter d’une
source de schémas externe de l’utilisateur. Les sources seules sont copiées ;
aucun `.env`, secret, contenu client ou artefact de contrats existant n’est repris.

Chemins de correction : `webapp/nuxt.config.ts`,
`webapp/scripts/build/site-targets.vitest.ts`, `webapp/tests/layers/client2.vitest.ts`,
`webapp/schemas/README.md` et `docs/2.architecture/14.site-layers.md`.
Le test isolé de cibles passe (2 cas). Les deux qualités et builds SSR passent ;
les tests Client 2 passent (45 cas sur 9 fichiers). Les résultats Showcase sont
consignés dans WEB-001. Logs : `/tmp/dem003-final-client2-immobilier-{quality-check,test,build}.log`.
Les contrats communs sont donc préparés sur checkout vierge sans reprise des
artefacts du principal. Le comportement d’isolation est confirmé par WEB-002.
État du correctif : implémenté, non commité, à vérifier ; le verdict historique
ne vaut pas validation de cette reprise. Aucune modification des contrôles
Codebase Integrity, de leurs seuils ou de leurs exceptions.

## Validation des correctifs du 2026-11-11

Verdict humain explicite : « c’est validé ». Il couvre le correctif présenté,
ses tests et ses limites documentées ci-dessus. Empreinte du lot vérifiée avant
consignation : 55 fichiers inchangés depuis la présentation sur `d97fbda`.
Session intervenante : `01a1c16c-2085-7141-83fa-3460f6bd4463`.

Commit local du correctif validé : `aceda231cfc9a1da46f76b6801525cb0b285fe36`. Aucun push ni fusion.
