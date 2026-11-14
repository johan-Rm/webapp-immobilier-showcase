# DEM-008 — Appliquer la charte Graines Digitales au dashboard SaaS

- Type : développement
- Conventions : [dev-book](../README.md).
- Session de création : 01a1d8d6-52a5-7cd0-90c8-633d9849b8b2
- Date : 2026-11-14
- État : livraison bloquée par le build Docker SSR ; validation humaine avec réserve conservée.
- Confirmation humaine : « confirmé », après restitution du cadrage dans cette session.
- Identifiant réservé : DEM-008 ; maximum DEM-007 observé dans les références Git locales, brouillons et demandes des worktrees, sans fetch.

## Besoin et décisions

Donner au nouveau dashboard SaaS commun l’identité visuelle Graines Digitales,
pour les utilisateurs et administrateurs des organisations et projets définis dans
[DEM-005](DEM-005-dashboard-saas.md).
Le résultat attendu est une apparence cohérente avec la charte sur tous les écrans,
sans réorganisation des usages existants.

Références visuelles uniques :

- [Charte officielle](<../../resources/design/Brand Guidelines - Graines Digitales (standalone).html>).
- [Pictogramme fourni](../../resources/design/Picto-fond-noir-1000x1000.svg).

Appliquer la charte aux couleurs, au logo, aux polices et à l’apparence des composants :
boutons, champs, tableaux et autres composants présents. Inclure tous les écrans,
la connexion, le choix d’organisation/projet et les fenêtres de dialogue, dans les
modes clair et sombre, sur ordinateur et mobile.

Conserver la disposition, la navigation et les fonctionnalités actuelles, ainsi
que Nuxt UI et l’interface française. Utiliser Rationale pour les titres si la
licence est disponible, sinon Newsreader ; Inter pour les textes.

Exclusions : sites clients, dashboard historique Showcase, nouveaux parcours métier
et refonte de la disposition. Ne pas recopier la charte dans une nouvelle documentation.

À l’analyse : vérifier la disponibilité de la police Rationale et de sa licence,
inventorier les composants et leurs états, préciser les adaptations aux deux modes
nécessaires à la lisibilité sans dénaturer la charte. Aucun arbitrage de besoin ouvert ;
le remplacement de Rationale est déjà confirmé.

Le frontend relève de la couche `dashboard`, selon la
[configuration des couches](../../infra/config/layers.json) : `layers/dashboard`,
`worktree/dashboard`, périmètre `webapp/dashboard/` et tests dédiés déclarés.
Les cartes ci-dessous portent les affectations et chemins retenus, sans nouvelle couche.

## Critères et cartes

1. Tous les écrans et composants du nouveau dashboard présentent une identité conforme
   aux références, dans les deux modes ; les états interactifs et messages restent lisibles.
2. Les polices respectent la décision ci-dessus ; la disponibilité de Rationale ou
   le recours à Newsreader est justifié.
3. La disposition, la navigation et les fonctionnalités existantes sont conservées.
4. Une comparaison visuelle avec la charte est fournie sur ordinateur et mobile,
   dans les modes clair et sombre, avec des captures représentatives.
5. Les contrôles couvrent la lisibilité, la navigation au clavier et le bon
   fonctionnement des parcours existants ; leurs résultats et limites sont consignés.
6. Une validation visuelle humaine explicite est obtenue à l’étape de vérification.

Cartes issues du découpage :

| Carte | Couche et source | Dépendance de réalisation | Couverture |
| --- | --- | --- | --- |
| OPS-022 | [DevOps](../tasks/OPS-022-references-design-dashboard.md) | Aucune | Références et documentation du thème |
| DASH-001 | [Dashboard](../tasks/DASH-001-charte-graines-digitales.md) | OPS-022 `76f283a`, intégré sur Dashboard par `c23aaab` | Critères 1 à 6, thème et vérifications |

Les détails techniques, chemins et commandes ont leur emplacement unique dans chaque
carte. Aucun changement BFF, Domaine ou Web nécessaire. OPS-022 est commitée et intégrée dans Dashboard ;
DASH-001 est réalisée dans cette même session selon l’arbitrage humain du workflow.
Documentation concernée : guide des thèmes et README Dashboard, avec liens vers la charte ; preuves propres à chaque carte.

## Vérification et livraison

Le cadrage a été confirmé dans la session de création, puis le résultat présenté
à l’étape 04 a reçu le verdict humain « c’est validé » le 2026-11-14.
Les deux cartes portent ce verdict, leurs critères, les preuves et les SHA examinés.
Cette validation conserve la réserve explicitement présentée : le pictogramme est
accessible dans la lane de développement, mais sa disponibilité pendant la construction
de l’image Docker SSR doit être corrigée à l’étape 03 puis vérifiée avant livraison.
La réserve et son périmètre font référence dans OPS-022 ; elle n’est pas levée ici.

Corrections locales de démarrage et connexion vérifiées : le serveur Node de vérification
a été arrêté pour libérer 19305 ; le montage SVG est commité. Les origines publique et
Symfony ont été corrigées dans le seul `.env` ignoré de Dashboard, conservé sans copie.
Après autorisation explicite du test de connexion avec le compte fourni, Chromium a
confirmé connexion, session et organisations HTTP 200 et affichage de l’accueil connecté,
sans simulation du BFF ni modification métier. Aucun identifiant ou cookie consigné.
Les tests d’identité et parcours simulés restent distincts de cette preuve réelle.

Arbitrage explicite du workflow pendant la réalisation : un commit local par tâche,
sans validation intermédiaire dans la même session ; l’humain vérifie ensuite la demande
complète. Les échanges entre sessions/agents restent fondés sur les commits disponibles.
Les skills installés d’implémentation et de vérification et les consignes globales ont
été alignés ; le projet porte cette règle dans AGENTS.md. Les guides sources AIDE
restent à aligner, leur couche DevOps étant occupée par une autre mission ; le correctif
local préparé est conservé dans `tmp/workflow-aide-guides.patch` du dépôt principal.
Ce suivi du cadre ne constitue pas une modification cachée du thème ou des contrôles.

Reconstitution dans le principal relatif `.`, branche `demands/DEM-008`, depuis
`develop` local vérifié `f5349944afeef829f3c9851b4cd591e9cff05249`, sans fetch.
Les deux ressources expressément confiées étaient les seuls fichiers non suivis :
comparées octet pour octet au commit OPS-022, temporairement mises à l’abri dans tmp,
puis remises identiques après leur intégration par Git. Elles sont désormais suivies.
Aucun transfert de code non commité depuis une couche, aucune nouvelle copie de réunion.

Les sources retenues ci-dessous incluent les verdicts humains. Les cherry-picks présents
sur Dashboard qui répètent OPS-022 ne sont pas réappliqués : source originale unique.

| SHA source validé | SHA obtenu (`cherry-pick -x`) |
| --- | --- |
| `76f283ad89914030550544ef597bd96cca9f4223` | `6835e51694555db26da7ef10bd96a544aec783a5` |
| `fab0986167e4214e9ac2062cd57fca5bf5b42082` | `96aa080b0236a26e60ae1ba44a846324a1a58235` |
| `fba869c236a78eda4df5f0c9fb45863f98c5d3b5` | `792215e425c2f4746c5e194a08d6dd4d90ea68f2` |
| `f92e78fc18ee3e5a88a875466e2c7448f9c77b96` | `a24ba33a8212c3cf7a995c7860b8bbf291983864` |
| `81a2eff346948682594612dd6acebe6ede289080` | `365f2878ce962de87253325cf91533f63cae1488` |

Le document définitif matérialise le brouillon conservé dans
`tmp/demande-design-dashboard.md`, qui reste une trace locale historique.
Les liens des cartes sont adaptés à ce document ; ces seules traces documentaires
peuvent rester non commitées pour le commit de livraison autorisé à l’étape suivante.
La branche à retrouver dans le principal après fusion distante est `develop` ;
les worktrees de couche restent sur leurs branches `layers/*`.
Aucun push, PR, merge ou déploiement effectué à cette étape.


Contrôles de reconstitution terminés : les cinq mentions de provenance `-x` et
les cinq identités de patches ont été vérifiées. Code, infrastructure, ressources
et guides identiques au HEAD Dashboard présenté, sans nouveau comportement.
Les deux ressources sont suivies et identiques au commit validé d’origine.
`make aide-check` : registre, demandes, structure et liens conformes ; 119 tests
réussis. `git diff --check` réussi sur les seules traces documentaires restantes.
Les tests applicatifs ne sont pas répétés : aucun code modifié depuis les preuves
validées. Le contrôle de contribution sur la plage complète sera exécuté après
commit du document définitif, avant PR ; aucun résultat n’est anticipé ici.
La réserve Docker SSR et les smokes clients d’ensemble restent à traiter avant
livraison selon les cartes. Les originaux temporaires ont été remis ; aucune
copie de sauvegarde supplémentaire laissée dans tmp.


Tentative de livraison du 2026-11-14 : cible distante `origin/develop` vérifiée
par fetch au SHA `f5349944afeef829f3c9851b4cd591e9cff05249`, inchangée.
Les traces de reconstitution ont été commitées dans
`bc1fc3933d24aa3495ff74ac1c0894aa5a4a3c33`. Arbres des couches propres lors
de l’inventaire ; aucune branche de couche déplacée.
`make aide-check` : 119 tests réussis ; contrôle de contribution conforme sur
les six commits présentés par rapport à la cible distante vérifiée.

Le build Docker SSR a été réellement exécuté avec le Dockerfile et le contexte
`webapp/`, le contexte additionnel `schemas`, `GD_TARGET=dashboard` et une image
de vérification locale dédiée. Échec confirmé : `[UNRESOLVED_IMPORT]` sur
`../../../../../resources/design/Picto-fond-noir-1000x1000.svg?url` depuis
`Brand.vue`. La ressource du dépôt est hors du contexte de construction et
n’est pas fournie à cette étape. Le montage de développement ne corrige donc
pas la construction SSR. Preuve : `/tmp/dem008-delivery-docker-build.log`.
Les contrôles réussis sont dans `/tmp/dem008-delivery-aide.log` et
`/tmp/dem008-delivery-contribution.log`.

La réserve est bloquante : reprise d’OPS-022 à l’implémentation pour le packaging,
puis vérification humaine de la correction, avant reprise de la livraison.
Aucune modification fonctionnelle effectuée à l’étape 06, aucun push, PR,
merge ou réalignement. Les services locaux existants restent intacts.
