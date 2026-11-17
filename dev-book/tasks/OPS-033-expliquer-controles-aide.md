# OPS-033 — Expliquer la progression des contrôles AIDE

- Demande : DEM-011 ; type : consolidation.
- Session de création : 01a1d56d-446b-7931-bf53-7687a7d10912
- Date : 2026-11-15
- Couche : devops ; branche : layers/devops.
- Worktree : `/home/johan/www/graines-digitales/modern-web-apps/showcase-immobilier/worktree/devops`.
- Base : `ca571d60c39b8b5932d74cd43dcbe4131c47c578`.
- État : validée le 2026-11-15 ; commit local autorisé.
- Dépendances : aucune dépendance de code nouvelle ; reprise DEM-011 identifiée.

## Résultat et critères

Demande explicite de rendre aide-check compréhensible : annoncer les quatre étapes, expliquer leur objet, afficher leurs résultats et conserver un rapport complet. Les refus simulés des tests ne doivent pas apparaître comme des échecs du dépôt. Ne masquer ni échec réel ni code de sortie. Exécuter les autres vérifications même après un échec pour présenter le bilan complet.

Périmètre : cette carte, `infra/make/Makefile.ai-development-engineering`, `codebase-integrity/commun/run_aide_checks.py`, `codebase-integrity/commun/test_domains.py`, `codebase-integrity/domaines/fiabilite-verifications/tests/test_aide_runner.py`. Aucun changement des tests applicatifs. Aucun lien entre réussite technique et validation humaine.

## Réalisation et preuves

Commande depuis le worktree : `make aide-check`. Le lanceur écrit un rapport local distinct par étape dans un répertoire temporaire annoncé, présente le premier diagnostic en cas d’échec et retourne un code non nul si une étape échoue. Les sorties des cas de test attendus sont capturées avec le mécanisme unittest ; les détails d’un test échoué restent disponibles dans le rapport. Aucune dépendance ajoutée. La commande reste disponible dans le worktree DevOps uniquement avant livraison.

Deux tests du lanceur réussis : quatre succès ; deux échecs avec poursuite des quatre étapes, bilan et quatre rapports. Vérification réelle : registre et demandes conformes, tests Python réussis, documentation en échec sur les README existants, donc résultat global non nul attendu. Sortie conservée localement dans `/tmp/dem011-aide-readable.log`.

## Présentation colorée

Palette approuvée le 2026-11-15 : bleu pour l’étape en cours, vert pour une réussite, rouge pour un échec ou bilan bloquant, gris pour les explications et durées. Jaune réservé aux points à examiner ; aucun statut de ce type n’est inventé. Les statuts restent écrits, les diagnostics et chemins restent sans couleur. Activation uniquement sur sortie terminal avec TERM compatible ; absence de TERM, TERM=dumb, redirection ou présence de NO_COLOR désactivent les couleurs. Aucun code couleur ajouté aux rapports.

Cinq tests du lanceur réussis : résultat et poursuite des étapes, détection du terminal, NO_COLOR même vide, codes de couleur et réinitialisation, exécution colorée avec diagnostics/rapports sans codes. Aucun contrôle métier modifié ni résultat global rendu conforme par cette présentation. Aucun commit créé.

## Verdict humain

Validation humaine explicite le 2026-11-15 : « tout est validé », limitée à la carte présentée.

```verdict-json
{
  "decision": "validé",
  "portee": "OPS-033 : présentation AIDE, conservation des échecs, couleurs et rapports ; aucun écart de documentation exempté.",
  "contenu": {
    "type": "sha256",
    "fichier": "dev-book/reports/ops033-verification.json",
    "valeur": "9f9c47e30b38d523badd129537cfc44985c7dfaa10734d8df5ade426a79e5d89"
  }
}
```

## Commits

Commit local de cette carte et de sa preuve ; SHA annoncé après création. Aucun push, PR ou fusion.

### Séparation des sorties — précision du 2026-11-17

Les évolutions ultérieures de nommage, préparation et séparation des tests sont portées par OPS-030 ; le catalogue courant est la documentation d’exécution des contrôles. Les commandes et résultats plus haut constituent les traces de la version initialement examinée. Le verdict humain initial n’est pas étendu aux correctifs ultérieurs ; leur recette et leurs réserves sont suivies dans OPS-031.
