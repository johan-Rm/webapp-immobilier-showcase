# OPS-031 — Vérifier le socle complet et préparer la recette humaine

- Demande : DEM-011 ; type : consolidation.
- Session de création : 01a1d56d-446b-7931-bf53-7687a7d10912
- Date : 2026-11-14
- Couche : devops
- Branche : layers/devops
- Worktree : `/home/johan/www/graines-digitales/modern-web-apps/showcase-immobilier/worktree/devops`
- État : validée humainement sous réserves le 2026-11-18 ; reconstitution et livraison non réalisées, contrôle SOLID toujours en échec.
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

Le bilan complet inclut les correctifs WEB-006/007 committés et la métadonnée de dépendances DASH-004 corrigée. Les contrôles de sécurité signalent des avis high/critical existants et SOLID quatre dépassements de responsabilité de composables. Ces résultats restent bloquants sans baisse de seuil ni exemption ajoutée. La livraison GitHub, les budgets et l’approbation des références visuelles restent hors de cette étape. La déclaration et les preuves finales sont conservées dans le brouillon du principal.

## Verdict humain

Le verdict global du 2026-11-18 porte sur les cartes et commits identifiés dans le [rapport de verdict](../reports/ops031-verdict-final.json). Les observations historiques ci-dessous conservent leur contexte antérieur.

```verdict-json
{
  "decision": "validé",
  "portee": "Validation globale sous réserves des 18 cartes DEM-011 présentées ; report SOLID vers DEM-012, exception Picomatch bornée et autres signalements ouverts, sans validation de CI ni livraison.",
  "contenu": {
    "type": "sha256",
    "fichier": "dev-book/reports/ops031-verdict-final.json",
    "valeur": "080c93e30ed7c4787ea1641e9653538c85bd4be5b9e784e102e2d14c222be216"
  }
}
```

## Commits

Le workflow autorisé le 2026-11-15 permet un commit technique local par tâche terminée puis la poursuite des dépendances, avant vérification humaine globale. Les SHA réels sont consignés dans le récapitulatif du brouillon. Aucun push, PR ou fusion.

## Bilan intégré

Le rapport de référence est [ops031-verification.json](../reports/ops031-verification.json). Il distingue suites par cible, mesures, blocages et limites ; les suites communes ne doivent pas être additionnées. Les outils des cartes sont réalisés ; les contrôles globaux ne sont pas tous verts. Aucune validation humaine nouvelle ni livraison n’est déduite de ce bilan.

La recette automatisée navigateur est réussie : 82 parcours Dashboard, quatre Client2 et deux Showcase. Les types des trois cibles, lint et formatage réussissent. Le contrôle des traces vérifie 20 cartes sans écart. La nouvelle image est construite et vérifiée avec contrats, Chromium sur les sites, k6 et Lighthouse natifs ; les processus de test possédés sont arrêtés. Les scores supplémentaires exécutés en parallèle ne constituent pas des budgets ni de nouvelles références comparatives.

## Réconciliation après harmonisation des commandes — 2026-11-17

Les correctifs d’interface et de séparation sont rattachés à OPS-030 ; leurs décisions, essais et commits y font référence. Le catalogue courant reste `docs/executer-controles.md`. Ne pas recopier ici la liste des commandes ni assimiler les résultats précédents à un nouveau verdict humain.

Rattachement des travaux : OPS-023 conserve le lanceur et sa validation initiale ; OPS-033 conserve la présentation et sa validation initiale ; OPS-030 porte leurs évolutions ultérieures ; cette carte porte la recette et le bilan final. Aucune nouvelle carte nécessaire. Les 18 cartes existantes restent le périmètre de la demande.

Vérification complémentaire : les huit commandes canoniques de conventions possèdent une source README identifiée. Le registre valide ses propres références mais ne garantit pas automatiquement la correspondance de toutes les commandes Make et de toutes leurs assertions : cette limite doit rester visible dans la recette. Les suites de fiabilité sont distinctes des contrôles du dépôt.

Restent à vérifier humainement : interface à trois préfixes et séparation des commandes après les correctifs OPS-030. Le reporting commun et le bilan groupé restent une note en brouillon, sans implémentation déduite du renommage. Les blocages sécurité et SOLID des dernières mesures restent ouverts ; ils n’ont pas été réexécutés dans cette revue documentaire. Les budgets, références visuelles et contrôles CI distants ne sont pas validés par cette revue.

### Rejeu d’intégration du 2026-11-17

Le diagnostic et les correctifs de l’image et de la concurrence sont portés par OPS-030. Le rapport de référence contient les versions, l’image exacte, le journal et son empreinte, ainsi que le résultat du rejeu complet Showcase. Ce résultat résout les échecs d’outillage observés dans cette suite ; il ne clôture ni les réserves sécurité/SOLID ni la vérification humaine de la demande.

### Défauts ouverts après aide aux commandes — 2026-11-17

Le rapport de référence consigne le défaut de préparation des composants Dashboard et le résultat réel des parcours Showcase sur le serveur de fixtures désormais disponible. Ces derniers échouent sur des erreurs IPX, malgré le prérequis d’URL résolu. Le serveur possédé est arrêté après l’essai. Aucun de ces défauts ne vaut validation ni clôture ; leur qualification reste distincte des correctifs de démarrage portés par OPS-030.

## Bilan avant clôture — 2026-11-18

Résultats consolidés dans `dev-book/reports/ops031-verification.json`, entrée `bilan_avant_cloture_2026_11_18` : défaut de préparation des composants corrigé, mutation isolée du tsconfig Nuxt, couverture des sept conventions supplémentaires rétablie par commandes individuelles. La sécurité bénéficie de la seule exception Picomatch approuvée jusqu’au 2 décembre 2026. Les quatre erreurs SOLID restent bloquantes ; avertissements, exemptions et imports non résolus restent à arbitrer, sans report implicite. Aucun verdict humain global ni livraison déduit des contrôles techniques.
