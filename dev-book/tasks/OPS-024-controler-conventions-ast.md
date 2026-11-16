# OPS-024 — Contrôler les conventions adaptées avec limites explicites

- Demande : DEM-011 ; type : consolidation.
- Session de création : 01a1d56d-446b-7931-bf53-7687a7d10912
- Date : 2026-11-14
- Couche : devops
- Branche : layers/devops
- Worktree : `/home/johan/www/graines-digitales/modern-web-apps/showcase-immobilier/worktree/devops`
- État : implémentée et commitée, à vérifier ; bilan global dans OPS-031.
- Base locale vérifiée : `ca571d60c39b8b5932d74cd43dcbe4131c47c578` ; aucun fetch.
- Dépendances : WEB-006, DASH-004 ; SHA à renseigner après validation des cartes amont, aucun SHA inventé.
- Référence de cadrage : `tmp/demande-consolidation-tests-conventions-nuxt.md`, relatif au principal, hors worktrees ; ne pas copier. Analyse et décisions : `tmp/analyse-tests-conventions-nuxt.md`.
- Chemins autorisés (en plus de cette carte) :

- `codebase-integrity/domaines/interface-internationalisation/regles.yaml`
- `codebase-integrity/domaines/interface-internationalisation/scripts/verify-ui-structure.ts`
- `codebase-integrity/domaines/interface-internationalisation/tests/verify-ui-structure.vitest.ts`
- `codebase-integrity/domaines/qualite-code/regles.yaml`
- `codebase-integrity/domaines/qualite-code/scripts/verify-code-quality.ts`
- `codebase-integrity/conventions.json`
- `codebase-integrity/package.json`
- `codebase-integrity/bun.lock`
- `codebase-integrity/README.md`

## Résultat et critères

Arbitrage de reprise confirmé le 2026-11-15 : voir l’analyse, autorisation limitée aux seules empreintes des six fichiers après preuve des sections manquantes identiques. Aucun élargissement ; traitement coordonné entre DASH-004 et OPS-024, sans transfert de code non commité.

Contrôle AST des marqueurs, valeurs statiques, unicité et propriété du main ; exemptions racines composant/conditionnelles/multiples visibles. Les Screens peuvent porter section/aside. Ne pas importer les interdictions main/screens incompatibles. Ajouter les détections informatives traductions, événements VueUse et commentaires au présent selon décisions ; ne pas transformer les gardes heuristiques existantes en blocage. Conserver template/script/style, AppImage et i18n direct, tokens et noms locaux. Toute autre convention Cap Nour reste une correspondance documentée ou une proposition non adoptée ; aucune nouvelle interdiction de réseau ou de nommage implicite. Couvrir les cibles inactives.

Exclusions communes : secrets et .env, données utilisateur, code Cap Nour/Kazen en écriture, production, DEM-010, nouvelles conventions non arbitrées. Préserver les rubriques et l’ordre des README. Un résultat inconnu ne vaut pas réussite.

## Réalisation et preuves

Au découpage initial, la réalisation attendait les commits amont. Ces dépendances sont désormais disponibles ; les preuves de réalisation figurent ci-dessous.

Depuis codebase-integrity/ : bun run test:typescript ; bun run test:bun. Depuis racine : make aide-check et make quality-conventions-check. Fixtures : slot imbriqué après template, racine multiple/conditionnelle/composant, mauvais nom et marqueur dynamique, régions autorisées Screen, deux main. Erreur déterministe bloquante ; suggestions de revue informatives.

Les commandes nouvelles ci-dessus sont à créer, pas réputées disponibles aujourd’hui. Pour les essais humains : lire les chemins modifiés, indiquer préparation et répertoire, conserver sortie/code/rapport, reproduire les cas négatifs dans une fixture temporaire. Préserver la saisie et les données en cas d’erreur.

## Verdict humain

Aucun verdict d’implémentation. Le cadrage confirmé n’est pas une validation du code.

## Commits

Le workflow autorisé le 2026-11-15 permet un commit technique local par tâche terminée puis la poursuite des dépendances, avant vérification humaine globale. Les SHA réels sont consignés dans le récapitulatif du brouillon. Aucun push, PR ou fusion.

## Reprise après revue du socle

L’extension explicitement approuvée est réalisée dans OPS-035 avec un moteur AST commun, plutôt que dupliquer des vérificateurs. Les marqueurs, traductions, événements et commentaires y disposent de contrôles ou warnings testés. Les migrations Dashboard, empreintes DEM-007, raccordements et preuves d’intégration de cette carte restent conditionnés aux dépendances amont ; aucun commit ni validation globale déduits.

## Résultat intégré

Dépendances intégrées par cherry-pick ciblé : WEB-006, WEB-007 et DASH-004 ; moteur AST éprouvé par OPS-035. Mise à jour limitée des empreintes autorisées ci-dessous, avec scripts strictement identiques à OPS-023 et listes des sections manquantes inchangées. Cinq empreintes évoluent ; AccessForm reste inchangé. Aucun nouveau fichier ni élargissement d’exception.

```json
[
  {
    "file": "dashboard/app/components/dashboard/AccessForm.vue",
    "previous": "138b3395f8e9de0fe94bd92ece977b4cc5fdcf4b68a46ca932790ffdc4f0b8cb",
    "sha256": "138b3395f8e9de0fe94bd92ece977b4cc5fdcf4b68a46ca932790ffdc4f0b8cb",
    "missing": [
      1,
      2,
      5,
      6,
      7,
      9,
      10,
      11,
      12
    ],
    "scriptUnchanged": true
  },
  {
    "file": "dashboard/app/components/dashboard/Articles.vue",
    "previous": "15b8c24f1ae1afd7419ef6cb50bb3239cefda940b5ce1848ebca0c4aa858a941",
    "sha256": "e54fbd36bcd8f19b925227c99a216f67161708315b8acd18a6d9eb02add060e6",
    "missing": [
      1,
      2,
      3,
      5,
      6,
      7,
      8,
      11
    ],
    "scriptUnchanged": true
  },
  {
    "file": "dashboard/app/pages/[access].vue",
    "previous": "c6c753ab648a8ca58fe3cb9587ca0646a94cbc668dc7c5c0dad6f58ef540bfe1",
    "sha256": "8dfe7590176fbe68a3ae8016d9aa6658233c36810b4b260cab811a76314f4bd6",
    "missing": [
      1,
      3,
      5,
      6,
      7,
      9,
      10,
      12
    ],
    "scriptUnchanged": true
  },
  {
    "file": "dashboard/app/pages/administration.vue",
    "previous": "d19a585327e70812e9b88a1963ac09090b5578a35887d009ebd55a734cee0789",
    "sha256": "ad1204b02af3fc877ba365530871aa51a3fe831b1a430d20eb8c803751ad8455",
    "missing": [
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      12
    ],
    "scriptUnchanged": true
  },
  {
    "file": "dashboard/app/pages/articles.vue",
    "previous": "807556bc98c395d37d5370c733df9e8e901ce55037db9758a73c6795ee180e50",
    "sha256": "c73944e451f9eac165404ff4c9d9096101d58938035c008314309469b7a1f327",
    "missing": [
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      12
    ],
    "scriptUnchanged": true
  },
  {
    "file": "dashboard/app/pages/index.vue",
    "previous": "8c20720476511b239f2a07fc95c09e012275aa3714df7195c9a6f14d5e6ce2db",
    "sha256": "8fe458e19074c81065a1275682c9fe23095cbed378755ffc0d6423b06cab54a2",
    "missing": [
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      12
    ],
    "scriptUnchanged": true
  }
]
```

Vérification intégrée : contrôle frontend AST réussi (213 fichiers, zéro erreur, 410 avertissements, 41 exemptions), contrôle historique des sections réussi avec exactement six exceptions actives DEM-007. Les avertissements restent à relire et ne prouvent ni rendu ni adéquation métier. Les tests de vérificateurs sont réussis dans OPS-035 (153 Python, 66 Vitest, 44 Bun).
