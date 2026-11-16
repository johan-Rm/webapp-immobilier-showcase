# OPS-031 — Vérifier le socle complet et préparer la recette humaine

- Demande : DEM-011 ; type : consolidation.
- Session de création : 01a1d56d-446b-7931-bf53-7687a7d10912
- Date : 2026-11-14
- Couche : devops
- Branche : layers/devops
- Worktree : `/home/johan/www/graines-digitales/modern-web-apps/showcase-immobilier/worktree/devops`
- État : outils implémentés et commités ; clôture technique bloquée par sécurité et SOLID, vérification humaine à faire.
- Base locale vérifiée : `ca571d60c39b8b5932d74cd43dcbe4131c47c578` ; aucun fetch.
- Dépendances : OPS-030, WEB-006, DASH-004, DOM-002, BFF-005 ; SHA à renseigner après validation des cartes amont, aucun SHA inventé.
- Référence de cadrage : `tmp/demande-consolidation-tests-conventions-nuxt.md`, relatif au principal, hors worktrees ; ne pas copier. Analyse et décisions : `tmp/analyse-tests-conventions-nuxt.md`.
- Chemins autorisés (en plus de cette carte) :

- `docs/3.application/ci-conventions-validation.md`
- `docs/2.architecture/3.page-layout-screen-model.md`
- `codebase-integrity/README.md`
- `webapp/scripts/quality/contracts.ts`
- `webapp/scripts/quality/contracts.vitest.ts`
- `webapp/scripts/quality/manifest.vitest.ts`

## Résultat et critères

Publier un catalogue unique des commandes dans la documentation, conformément au contrat README confirmé, avec familles, cibles, déclencheurs, prérequis et limites ; les cartes renvoient à cette référence. Vérifier génération déterministe des contrats YAML dans deux répertoires temporaires et entrées invalides, sans git diff sur artefacts ignorés ni téléchargement Symfony implicite. Réconcilier la déclaration de contribution avec chaque chemin final. Préparer une recette de relecture et exécution manuelles ; distinguer résultats techniques et verdict humain, préserver DEM-010, aucun déploiement. Rassembler les commits amont seulement selon l’étape autorisée ; aucun transfert de fichiers non commité.

Exclusions communes : secrets et .env, données utilisateur, code Cap Nour/Kazen en écriture, production, DEM-010, nouvelles conventions non arbitrées. Préserver les rubriques et l’ordre des README. Un résultat inconnu ne vaut pas réussite.

## Réalisation et preuves

Le catalogue unique est `docs/executer-controles.md` : familles, cibles, prérequis, rapports et limites. Les guides d’architecture expliquent la propriété du repère principal et la relation entre conventions et contrôles. Les README ne contiennent pas de liens ni d’inventaire temporaire de commandes.

Le pilote de contrats compare deux générations isolées : 28 artefacts identiques observés, sources inchangées, aucun appel Symfony distant. Trois tests couvrent génération vide, sortie symbolique, YAML invalide et empreintes de contenu. Le manifeste vérifie toutes les sélections disponibles et les refus explicites, sans exposer l’environnement privé.

Le bilan complet suit l’intégration des deux correctifs WEB-006/007 déjà committés. Les contrôles de sécurité signalent des avis high/critical existants et SOLID quatre dépassements de responsabilité de composables. Ces résultats restent bloquants sans baisse de seuil ni exemption ajoutée. La livraison GitHub, les budgets et l’approbation des références visuelles restent hors de cette étape. La déclaration et les preuves finales sont conservées dans le brouillon du principal.

## Verdict humain

Aucun verdict d’implémentation. Le cadrage confirmé n’est pas une validation du code.

## Commits

Le workflow autorisé le 2026-11-15 permet un commit technique local par tâche terminée puis la poursuite des dépendances, avant vérification humaine globale. Les SHA réels sont consignés dans le récapitulatif du brouillon. Aucun push, PR ou fusion.

## Bilan intégré

Le rapport de référence est [ops031-verification.json](../reports/ops031-verification.json). Il distingue suites par cible, mesures, blocages et limites ; les suites communes ne doivent pas être additionnées. Les outils des cartes sont réalisés ; les contrôles globaux ne sont pas tous verts. Aucune validation humaine nouvelle ni livraison n’est déduite de ce bilan.
