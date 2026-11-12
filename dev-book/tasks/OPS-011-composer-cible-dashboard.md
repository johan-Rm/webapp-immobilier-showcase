# OPS-011 — Composer la cible dashboard indépendante

- Demande : DEM-005 ; type : développement
- Brouillon de référence : `tmp/demande-dashboard-saas.md`, relatif au dépôt principal, hors du worktree ; ne pas le copier.
- Demande définitive prévue : `dev-book/demand/DEM-005-dashboard-saas.md`, créée seulement à la reconstitution ; fichier actuellement absent, lien à ajouter alors.
- Session de création : 01a1ca56-891a-7700-97c6-a576d3d9a615
- Couche : devops
- Branche : layers/devops
- Worktree : worktree/devops
- Base locale vérifiée : `5dc9fe796cb24a4bc5d604835c4092e8a309e6dd` ; aucun fetch.
- État : validée et commitée localement ; à livrer
- Chemins autorisés : `webapp/nuxt.config.ts`, `webapp/package.json`, `webapp/bun.lock`, `webapp/tsconfig.json`, `webapp/eslint.config.ts`, `webapp/vitest.config.ts`, `webapp/playwright.config.ts`, `webapp/scripts/build/site.ts`, `webapp/scripts/build/site-targets.vitest.ts`, `webapp/scripts/build/schema-hook.ts`, `webapp/scripts/build/type-check.ts`, `webapp/scripts/README.md`, cette carte
- Dépendances de réalisation : DOM-001 validée, commit `8c1000ecc9996cd3632a323fd1ed49604ad4e929`
- Commits nécessaires : DOM-001 `8c1000ecc9996cd3632a323fd1ed49604ad4e929`, vérifié dans Git ; aucune dépendance de consolidation.
- Dépendances de vérification globale : OPS-013

## Résultat et critères

Étendre la sélection de cible au dashboard hors sites/, en consommant le registre partagé DOM-001.
Une build sert une seule cible ; aucune résolution de cible depuis Host. Conserver Showcase par défaut.
Configurer sorties, alias, types et scripts pour dashboard sans bootstrap, contenus, médias ou routes
Showcase. Ne pas casser Client 2 ni les outils de génération de schémas.
N’ajouter une dépendance qu’après inventaire des composants/libs déjà installés ; conserver le lock.
Les chemins applicatifs listés sont affectés à DevOps pour DEM-005 par la décision humaine de report ;
la mise à jour durable du routage et des contrôles est différée après le développement.
Exclusions : composants Vue, serveur métier, modifications Codebase Integrity.

Les critères de besoin et exclusions communs restent dans le brouillon ; aucune modification
de Codebase Integrity, de règle ou de gouvernance hors consolidation déclarée.
Les métadonnées de cette carte relèvent de la trace obligatoire, même hors périmètre applicatif.
Documentation : commentaires et commandes dans scripts/README.md ; transmettre à OPS-013 les limites.
Précision de chemins : hook Article et lanceur type-check applicatifs ajoutés dans webapp/scripts/, déjà affecté à DevOps ; aucune convention modifiée.

## Réalisation et preuves

Implémentation du 2026-11-11, session `01a1ca56-891a-7700-97c6-a576d3d9a615`.
Reprise de DEM-005 sur `layers/devops` : seules les cartes OPS-011/012/013 non suivies étaient
présentes au démarrage. Elles appartiennent à la même mission ; OPS-012/013 sont préservées.
Le prérequis de consolidation a été retiré sur instruction humaine, sans modifier les contrôles.

Résultat : sélection dashboard via le registre DOM-001 ; identité/config obligatoires dans dashboard/ ;
srcDir et alias propres, serveur vide propre par défaut ; sorties dashboard/.nuxt et dashboard/.output
sans écrasement des sorties sites. Showcase reste la cible par défaut. Les locales dashboard sont locales
à sa layer. Le lanceur type-check choisit son projet TypeScript ; Vitest et Playwright ciblent les bons
périmètres, avec les futurs tests SaaS distincts des tests historiques. Le hook génère le DTO Article.
Aucune dépendance ajoutée ; package.json change seulement le lanceur type-check, lock inchangé.

Dépendance réelle : `8c1000ecc9996cd3632a323fd1ed49604ad4e929`, lue depuis Git.
Le registre n’existe pas encore sur la branche DevOps : aucune copie de fichiers Domaine ni cherry-pick
créant un commit à l’étape 03. Les vérifications d’intégration utilisent un snapshot temporaire des
sources DevOps courantes et des seuls fichiers webapp de ce commit validé, sans .env ni données client.
Snapshot de preuve : `/tmp/dem005-ops011-_lgl5fzg` ; script de préparation local `/tmp/dem005-ops011-snapshot.py`.
Les neuf fichiers soumis sont identiques à ceux testés dans ce snapshot.

Contrôles exécutés :
- Dans le snapshot/webapp, `bun run type-check` : réussi sur les vraies sources Showcase assemblées.
- `bun run test` : 17 fichiers, 118 tests réussis, dont les trois tests de composition.
- Le test `scripts/build/site-targets.vitest.ts` crée ses propres layers minimales temporaires :
  prépare/types les trois cibles, vérifie le DTO Article généré, l’absence de catalogue et routes
  Showcase hors Showcase, les alias dashboard et le refus de cible inconnue/traversée ; construit
  Client 2 et dashboard, vérifie la coexistence des deux sorties puis le lanceur type-check dashboard.
- Une assertion initiale supposait un chemin absolu dans le tsconfig Nuxt : corrigée pour comparer
  les chemins résolus depuis le buildDir ; le résultat final porte sur le contenu corrigé ci-dessous.
- Depuis worktree/devops/webapp : ESLint et Prettier --check sur les scripts/configurations touchés : réussis.
- Depuis worktree/devops : `make aide-check` réussi, dont 111 tests Python ; `git diff --check` réussi.
- API Symfony : arbre propre, HEAD `9fed427658d9c0983b5982a6e6922d179a6bf4eb` inchangé.

État soumis : HEAD `136146ec5a6e252cab51cd3ea8dcd377e936904e`, branche layers/devops,
index vide ; huit fichiers suivis modifiés, nouveau lanceur type-check et cette carte non suivis.
OPS-012/013 restent des cartes non suivies de planification, hors réalisation OPS-011.
Empreintes SHA-256 des fichiers de réalisation :

- `webapp/nuxt.config.ts` : `fe1d060189e879869290ae334c4f7fa07959548e69ee33cf4754ee61cd6383f3`.
- `webapp/package.json` : `6941643140f295bd2e186c14ae6f992e839a2a4286a889fc2ef2f8f6843b0263`.
- `webapp/playwright.config.ts` : `a55d9d96aecb0976cb7082783d03875088bde1081dbc6ca88d44854f34315fb2`.
- `webapp/vitest.config.ts` : `160bb6b2dc425b56e3614bdeb17fa8767169577feda33dbc35605eef1d86ba80`.
- `webapp/scripts/README.md` : `2aeb867bbeed507278523ea4beef9e840ebeac85707eec66a905950b12373fc6`.
- `webapp/scripts/build/site.ts` : `2227af1e9a21c3d40f886e60a62ff8ec0198c834aa1d5947bc9d346d1b3d4fc6`.
- `webapp/scripts/build/site-targets.vitest.ts` : `195ed4ccb676eb42801f57d27f7fa268a96adc4b54362247e041ead8363022b9`.
- `webapp/scripts/build/schema-hook.ts` : `9aaa2f5387eeeb87ca399858a2d694c936ffe5a6e50639eaf93a1d0b94f9674c`.
- `webapp/scripts/build/type-check.ts` : `7a81eb5cea4772b717719abd211a0ccd1f1b8eb879a85dbed46a59f6fa440c26`.

Limites : WEB-003 n’a pas encore créé l’application dashboard ; les builds dashboard ci-dessus
utilisent une layer de test minimale. Les builds/parcours réels attendent WEB-003 et OPS-013.
BFF SaaS, vhost et projection de publication ne sont pas implémentés ici. Aucune API modifiée,
aucune règle de vérificateur modifiée, aucun commit ni étape suivante engagés.

## Verdict humain

Validation humaine explicite du 2026-11-12 : « validé », après présentation d’OPS-011.
Périmètre accepté : les neuf fichiers de réalisation et cette carte. Empreintes revérifiées
à l’identique avant indexation ; aucune modification fonctionnelle depuis la présentation.
Aucune autre carte ni évolution Symfony n’est couverte par ce verdict.

## Commits

Commit local réalisé : `f3664dd5a92a2202a285f3e04de9ba13ebf72863`.
Périmètre vérifié : neuf fichiers validés et cette carte uniquement.
La présente mise à jour trace seulement le SHA et l’état réel ; OPS-012/013 restent hors index.
La réunion globale est prévue dans le principal libre et propre, branche `demands/DEM-005`
créée seulement à la reconstitution depuis develop local vérifié.
