# DEM-009 — Colorer les blocs du tableau de bord et choisir le thème

- Type : développement
- Session de création : 01a1d94b-2ea6-7270-a3b3-407d88574000 ; étapes suivantes dans la même session.
- Date : 2026-11-14.
- État : validée et reconstituée ; livraison en cours.
- Cadrage confirmé : « oui » ; périmètre, associations Lucide et retouches confirmés ensuite.
- Conventions : [dev-book](../README.md).

## Besoin et décisions

Améliorer le repérage des sections pour les utilisateurs du dashboard SaaS commun,
sur la base de [DEM-008](DEM-008-design-dashboard.md), et permettre le choix du thème.
Conserver la charte, la disposition, les fonctions et les exclusions de cette demande :
sites clients, dashboard historique, nouvelles fonctions métier et refonte de navigation.

Tous les blocs des écrans connectés, dont Accueil, Articles et Administration, ont
un fond neutre au repos, une couleur propre, un pictogramme Lucide et des accents sur
les actions. Style flat, sans bordure ; légère teinte du fond au survol, sans déplacement,
même sur les blocs informatifs, sans leur ajouter de clic.
Les associations validées font référence dans [DASH-002](../tasks/DASH-002-blocs-colores-dashboard.md).

Palette humaine de référence (codes exacts, sans obligation de consommer les onze couleurs) :

| Couleur | Code |
| --- | --- |
| Loblolly | #c7cdce |
| Fountain Blue | #55b8c6 |
| Copperfield | #dc8260 |
| Cotton Candy | #f8b3c9 |
| Carnation | #f25558 |
| Yellow Orange | #f5ac3f |
| Tulip Tree | #e8b52d |
| Dalmasca | #decb58 |
| Olive Green | #b2b760 |
| Picton Blue | #6ab3e4 |
| Lavender | #c08dd9 |


Retouches humaines intégrées et validées : supprimer les bordures décoratives et les
contours des champs dans tout l’espace connecté, y compris les menus et panneaux ouverts ;
conserver le focus clavier visible et distinguer les champs par leur fond.
Le badge du pictogramme reprend une teinte de sa couleur, conformément à la capture
fournie, sans modifier le code de l’icône. Les actions conservent un texte sombre sur
fond pastel ; les statuts métier gardent leur sens.
Référence initiale de style, sans reprise de son organisation ou de son métier :
`/home/johan/www/lab/cap-nour-mvp/ui-ux-design/draft/cap-nour-cta-color-blocks-v1.html`.

L’en-tête connecté propose Clair, Sombre et Automatique selon le système.
Automatique est le choix par défaut ; mémoriser le choix dans ce navigateur et
l’appliquer à tout l’espace connecté, sans préférence de compte ni nouvel endpoint.
Les deux modes restent lisibles. Le style sans bordures ne s’étend pas à l’authentification.

## Critères et cartes

1. Tous les blocs des écrans concernés respectent les associations et le style validés.
2. Le survol teinte seulement le fond, sans déplacement ni comportement ajouté aux blocs informatifs.
3. Champs, boutons, séparations et panneaux connectés sont sans bordures décoratives ; focus clavier visible.
4. Les trois modes sont accessibles dans l’en-tête sur ordinateur/mobile, mémorisés après rechargement ; Automatique suit les changements du système.
5. Les deux thèmes, les contrastes, glyphes, parcours clavier et interactions existantes sont vérifiés ; le résultat visuel reçoit une validation humaine.

| Carte | Couche | Couverture et dépendances |
| --- | --- | --- |
| [DASH-002](../tasks/DASH-002-blocs-colores-dashboard.md) | dashboard | Critères 1, 2, 3, 5 ; inclut le correctif sans bordures et badges teintés |
| [DASH-003](../tasks/DASH-003-selecteur-theme-dashboard.md) | dashboard | Critères 4, 5 ; aucune dépendance de réalisation à DASH-002 |

Les deux cartes sont validées. Base DEM-008 disponible ; réalisation séquentielle dans
`worktree/dashboard`, branche `layers/dashboard`, selon [les couches](../../infra/config/layers.json).
Les preuves et commandes propres à chaque carte restent dans celles-ci. Les chemins de
captures et journaux locaux s’entendent depuis leur worktree d’origine, conservé.
Documentation durable : [README Dashboard](../../webapp/dashboard/README.md), mis à jour sans copie de charte.

## Vérification et livraison

Verdict global humain le 2026-11-14 : « c'est génial, c'est validé », après présentation
complète incluant les deux retouches. Les cartes associent ce verdict aux trois commits
applicatifs ; le quatrième commit en porte les traces documentaires.
Tests et limites détaillés dans les cartes : première version à 70 tests navigateur
réussis ; reprise à 72/74, puis 18 scénarios affectés réussis après correction de
l’attente du sélecteur dans les deux tests mobiles. Ne pas présenter cette reprise
comme 74 réussites sur une passe. Qualité, conventions, build SSR et 119 tests du cadre
réussis. Captures finales examinées puis résultat accepté par l’humain.
Fixtures BFF : preuve de l’interface, pas de Symfony réel. Aucun déploiement effectué.

Reconstitution dans le principal relatif `.`, branche `demands/DEM-009`, depuis develop
local propre vérifié `8349181d21dab60bb7f4a659c02790f74ee56a1c`, sans fetch. Les seuls commits validés
ci-dessous sont repris avec `cherry-pick -x`, sans conflit, dans l’ordre de réalisation.
Quatre provenances et identités de patches vérifiées ; arbre suivi identique à
`layers/dashboard` avant les seules traces documentaires de reconstitution.
Les couches restent sur `layers/*` ; branche à retrouver dans le principal après
fusion distante : `develop`. Aucun nouveau worktree ni dossier de réunion.

| SHA source validé | SHA obtenu |
| --- | --- |
| `7e2759f55f9cb1cd34b0f5dac054a05daf63acbf` | `3f4fe3b351c0bf42b07df63b34ed09e599488b5f` |
| `b72f84f9838e2150483726f3221430a46875fcf8` | `4b2ea3ff9c77416045467013601c1094199239b2` |
| `aaccb117cd4eabc9ced5c7ea2438a7350f562f9f` | `6e3afb864ada9c7eac391457e1a50b57e1a0232b` |
| `ecee0137e7321ab3f6bcdb46e8b318b67be29c7e` | `0ae8ce8e99dbb17e661094662612e8fb62cbaf3d` |

Document matérialisé depuis `tmp/demande-blocs-colores-theme-dashboard.md`, conservé
comme trace locale historique. Les cartes référencent maintenant cette demande.
Les seules traces documentaires peuvent rester non commitées pour le commit de livraison.
Le contrôle de contribution précédemment refusé pour absence de demande définitive
devra être réexécuté après ce commit documentaire, sur la plage complète avant PR.
Aucun résultat de ce contrôle n’est anticipé ici. Aucun push, PR, merge ou déploiement.

Contrôles de reconstitution : `make aide-check` réussi (structure, liens, types de demandes
et 119 tests du cadre), journal `/tmp/dem009-reconstitution-aide.log` ; `git diff --check`
réussi et document nouveau contrôlé séparément. Code et infrastructure identiques à la
couche Dashboard validée : les tests applicatifs ne sont pas répétés sans changement.
Index vide ; seuls le présent document et les liens des deux cartes restent à committer
à l’étape de livraison. Aucun contrôle affaibli.

Préparation de livraison du 2026-11-14, même session : cible distante develop vérifiée
à `8349181d21dab60bb7f4a659c02790f74ee56a1c`, identique à la base locale ; fetch effectué.
Dépôt distant réel : `johan-Rm/webapp-immobilier-showcase` ; Rebase and merge disponible.
Les cinq couches sont propres et locales sans upstream publié ; ancienne livraison
DEM-008 clôturée, seules contributions inédites Dashboard : les quatre sources reprises ici.
Aucune mission étrangère identifiée dans les cartes et les changements locaux.

Contrôles applicatifs de livraison : 152 tests réussis (15 fichiers), conventions et
119 tests du cadre réussis ; lint, types et build SSR Dashboard réussis.
La commande globale de formatage s’arrête sur EACCES en parcourant un répertoire .data
protégé, pourtant déjà exclu. Sans modifier données, permissions ou règles, le même
Prettier et sa configuration ont vérifié les 918 fichiers Git suivis de webapp/ et
codebase-integrity/ : format conforme. Aucun fichier applicatif non suivi à contrôler.
Les anciens rapports navigateur Docker sont aussi protégés : les nouveaux résultats
utilisent `webapp/.tmp/dem009-delivery-results/`, sans écraser les anciens rapports.
Journaux : `/tmp/dem009-delivery-{quality,format,types,tests,conventions,aide,build,browser}.log`.
Le suivi de PR et d’intégration sera tracé dans le brouillon conservé, sans écriture
sur develop après fusion. Aucun déploiement de production prévu.

Passe navigateur finale de livraison sur le principal : **74 tests réussis en une seule
passe**, ordinateur/mobile et clair/sombre, sur le SSR réellement construit.
Commande : `LD_LIBRARY_PATH=/tmp/ops020-browser-deps/root/usr/lib/x86_64-linux-gnu GD_TARGET=dashboard PLAYWRIGHT_BASE_URL=http://127.0.0.1:29305 bun run test:e2e -- saas-access.spec.ts saas-editor.spec.ts --workers=2 --output=.tmp/dem009-delivery-results --reporter=list`.
L’arbre applicatif contrôlé est `2d5be987e9866f23d4d7cc7f0c92ae0baa018f28` (`webapp/`) ;
le commit documentaire de livraison ne le modifie pas. Les limites des fixtures BFF
et l’absence de déploiement restent applicables. Le contrôle de contribution est
exécuté après matérialisation commitée ; résultat et futur HEAD de PR dans le brouillon.

Le premier contrôle de contribution a relevé le point final du champ Type : syntaxe
documentaire normalisée au format du projet, sans modifier la règle ni le contenu validé.
