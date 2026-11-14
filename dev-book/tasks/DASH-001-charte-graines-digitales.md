# DASH-001 — Appliquer la charte aux écrans et composants du dashboard

- Demande : DEM-008 — développement
- Brouillon de référence : `tmp/demande-design-dashboard.md`, relatif au dépôt principal ; lecture depuis le principal, aucune copie dans la couche.
- Demande définitive prévue : `dev-book/demand/DEM-008-design-dashboard.md`, absente à cette étape ; lien à établir à la reconstitution.
- Session de création : 01a1d8d6-52a5-7cd0-90c8-633d9849b8b2
- Date : 2026-11-14
- Couche : dashboard
- Branche : layers/dashboard
- Worktree : worktree/dashboard
- État : implémentée et commitée, à vérifier
- Chemins autorisés : `webapp/dashboard/`, `webapp/tests/e2e/saas-access.spec.ts`, `webapp/tests/e2e/saas-editor.spec.ts`, `webapp/tests/layers/dashboard.vitest.ts`, cette carte.
- Dépendances de réalisation : OPS-022 `76f283ad89914030550544ef597bd96cca9f4223`, intégré par cherry-pick `c23aaab` dans cette session, sans verdict humain anticipé ; base locale `f5349944afeef829f3c9851b4cd591e9cff05249`.

## Résultat et critères

Appliquer le cadrage confirmé, dont les critères font référence dans le brouillon.
Centraliser les valeurs visuelles dans le thème Dashboard existant (`main.css` et
`app.config.ts`) plutôt que disperser des couleurs dans les composants. La charte
reste la référence ; ne pas importer le thème Showcase ou créer une seconde charte.

Périmètre inventorié : layouts auth/default ; routes `[access]`, index, articles,
administration ; Navigation, ContextPicker, AccessForm, Overview, Administration,
Articles, ArticleList, ArticleFields, ArticleActions, ArticleBlocks, RichText,
ArticleResources et leurs composants Nuxt UI, panneaux et fenêtres de dialogue.
États : repos, survol, focus, sélection, désactivation, chargement, vide, erreurs,
succès, avertissements, conflit et saisie non enregistrée.

1. Remplacer le thème teal/slate et les polices système par l’identité officielle.
   Rationale seulement si fichiers et licence exploitables sont vérifiés ; sinon
   Newsreader pour les titres, Inter pour les textes. Fournir les polices nécessaires
   et leurs licences sous `dashboard/`, sans modifier les dépendances partagées.
2. Utiliser le pictogramme fourni sans redessin ni recoloration arbitraire ; préserver
   son ratio et prévoir son contraste dans les deux modes. Un actif navigateur dérivé
   référence sa source unique ; ne pas servir la charte HTML au public.
3. Activer la gestion du mode dans la cible Dashboard : `ui.colorMode` est actuellement
   false. Suivre la préférence système clair/sombre avec repli clair ; les tests peuvent
   forcer chacun des modes. Aucun nouveau bouton ni changement de navigation requis.
4. Adapter les tokens sémantiques de fond, surface, texte, bordure, action et focus aux
   deux modes ; conserver des erreurs/succès/avertissements distincts et compréhensibles
   sans se fonder sur la couleur seule. Mesurer les contrastes : texte courant 4,5:1,
   grand texte 3:1, bordures utiles et focus 3:1. Documenter toute limite observée.
5. Préserver structure, grille, ordre des champs/actions, points de rupture et parcours ;
   aucun remaniement des écrans. Contrôler débordements et lisibilité des nouvelles polices.
6. Compléter uniquement les tests dédiés existants pour vérifier modes, clavier et
   parcours : connexion/erreur, organisation/projet, menu mobile, administration,
   article, médias/catégories, fenêtres de dialogue, garde de saisie et conflit.
   Les réponses BFF simulées ne prouvent pas le backend réel ; aucune écriture Symfony
   sans projet de test explicitement affecté.

Documentation : compléter les rubriques existantes de `webapp/dashboard/README.md`
avec la source du thème, les polices réellement utilisées et le fonctionnement des
modes ; renvoyer à la charte sans copie. Exclusions : sites clients, dashboard historique,
BFF, Domaine, contrôles globaux, dépendances partagées et nouvelles fonctions métier.
Les fichiers Vue modifiés ne bénéficient plus de leurs exceptions de sections figées
par empreinte : respecter les contrôles actuels, sans étendre les exceptions.

## Réalisation et preuves

Implémentation terminée le 2026-11-14, même session de création, base locale
`c23aaab9acebfff57e91397305befd750ce3b249` après intégration d’OPS-022.
Autorisation humaine explicite : un commit par tâche, puis vérification de la demande
complète. La dépendance ne nécessite donc plus de validation intermédiaire.

Changements : tokens olive et neutres locaux, fonds sans blanc pur, deux modes selon
le système, statuts distincts et focus visible ; Rationale/Inter embarquées avec licences ;
marque réutilisée aux emplacements existants. Grille, routes, ordre des champs/actions,
points de rupture et logique métier conservés. Le SVG est importé depuis la source
commune, sans copie ; son fragment de vue retire seulement les marges de l’aplat pour
la lisibilité à petite taille, sans changer les tracés, couleurs ou proportions.
Les URLs sont normalisées en chemins pour un rendu SSR et navigateur identique.

Polices obtenues depuis `fonts.googleapis.com`/`fonts.gstatic.com`, licences jointes :
[Rationale OFL](https://github.com/google/fonts/blob/main/ofl/rationale/OFL.txt) et
[Inter OFL](https://github.com/google/fonts/blob/main/ofl/inter/OFL.txt).
Le recours à Newsreader n’est pas nécessaire. Aucun appel au service de polices
externe depuis le navigateur ; les ressources sont compilées localement.

Contrôles terminés depuis ce worktree :

| Contrôle | Commande et résultat |
| --- | --- |
| Préparation et build isolés | Depuis `webapp/`, `GD_TARGET=dashboard bun run test -- tests/layers/dashboard.vitest.ts` : 1 test réussi, prépare et reconstruit la vraie cible ; instantané de test adapté pour inclure les ressources communes |
| SSR réel | `GD_TARGET=dashboard bun run build` : réussi, puis `HOST=127.0.0.1 PORT=19305 node dashboard/.output/server/index.mjs` |
| Navigateur SSR | `GD_TARGET=dashboard PLAYWRIGHT_BASE_URL=http://127.0.0.1:19305 bun run test:e2e -- saas-access.spec.ts saas-editor.spec.ts` : **60 tests réussis** ; clair/sombre, desktop/mobile, parcours existants, erreurs et conservation des saisies |
| Qualité | `GD_TARGET=dashboard bun run quality:check` : lint, format et types réussis |
| Conventions | Depuis `codebase-integrity/`, `bun run check:conventions` : réussi ; avertissements existants de revue et exceptions figées des fichiers non modifiés conservés |
| AIDE | `make aide-check` : registre, types, liens/structure conformes ; 119 tests réussis |
| Diff/documentation | `git diff --check` réussi ; titres et ordre du README comparés à HEAD, conservés |

Les tests d’identité mesurent les contrastes avec conversion des couleurs du navigateur
via canvas : textes, textes secondaires, actions et statuts ≥ 4,5:1 ; bordures utiles
et focus ≥ 3:1. Ils vérifient les polices réellement chargées, l’absence de débordement
sur connexion, le parcours complet au clavier et la restitution du focus du menu mobile.
Aucune erreur JavaScript ni alerte d’hydratation dans ces cas. La divergence d’URL du
pictogramme détectée sur le premier SSR a été corrigée avant la passe finale.
Les tests attendent explicitement l’hydratation avant de saisir : le premier essai
de référence en développement pouvait sinon soumettre un formulaire HTML non hydraté.

Environnement navigateur : dépendances verrouillées installées sans modifier le lock ;
Chromium correspondant à Playwright installé. Préfixer les commandes navigateur sur
cet hôte par `LD_LIBRARY_PATH=/tmp/ops020-browser-deps/root/usr/lib/x86_64-linux-gnu`
pour réutiliser les bibliothèques système de test disponibles.

Preuves locales, hors Git : `webapp/.tmp/dem008/before/` et `after/` contiennent
20 captures comparables chacun : connexion, contexte, administration, article et
catégories × desktop/mobile × clair/sombre (préfixe `desktop-` ou `mobile-`).
L’instantané initial a été construit depuis `c23aaab` dans `/tmp/dem008-before-7rtt63t9`
sans secrets ni modification d’un worktree ; son serveur temporaire est arrêté.
Le rapport des 60 cas avec les mesures jointes est dans `webapp/.tmp/playwright/report/index.html`.
Logs : `/tmp/dem008-build.log`, `/tmp/dem008-layer-test.log`, `/tmp/dem008-e2e-final.log`,
`/tmp/dem008-quality-final.log`, `/tmp/dem008-conventions-final.log`, `/tmp/dem008-dashboard-aide.log`.
Les captures ont été inspectées, dont connexion desktop claire et panneau catégories
mobile sombre ; la validation visuelle humaine n’est pas anticipée.

Limites : les parcours simulent le BFF et ne prouvent ni sécurité ni persistance Symfony.
Aucune écriture Symfony effectuée. La vérification globale après reconstitution et les
smokes des sites clients restent prévus à leur étape ; aucun fichier runtime client,
BFF ou Domaine n’a été modifié. Le serveur SSR final reste sur `http://localhost:19305`
pour la vérification humaine ; aucun déploiement ni service de production modifié.

## Verdict humain

Non sollicité à cette étape ; cadrage confirmé distinct de la validation du rendu.

## Commits

Un commit local initial pour cette tâche, sur autorisation humaine ; SHA réel relevé dans le brouillon après création. Aucun verdict humain déduit du commit.
