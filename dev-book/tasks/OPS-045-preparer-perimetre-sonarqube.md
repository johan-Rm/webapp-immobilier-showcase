# OPS-045 — Préparer le périmètre SonarQube vérifiable

- Demande : DEM-017, brouillon au principal `tmp/demande-consolidation-sonarqube.md` ; demande définitive prévue à la reconstitution.
- Session de création : 01a1fed8-cd9a-7561-9aa0-6c26f1125293
- Couche : devops ; branche : `layers/devops` ; worktree : `worktree/devops`.
- État : validée humainement.
- Chemins autorisés : `codebase-integrity/commun/application-scope.ts`, `codebase-integrity/domaines/fiabilite-verifications/`, `codebase-integrity/README.md`, `codebase-integrity/conventions.json`, `webapp/scripts/quality/`, `infra/make/`, `Makefile`, cette carte et le brouillon du principal.
- Dépendances : aucune.

## Résultat et critères

Préparer et prévisualiser sans réseau la sélection confirmée dans le brouillon, à partir des seuls fichiers suivis. Réutiliser le sélecteur existant lorsque pertinent sans altérer ses consommateurs ; couvrir CSS et configurations applicatives selon la décision. La liste exacte, les exclusions, les chemins et les empreintes doivent permettre de vérifier la correspondance entre prévisualisation et copie temporaire. Séparer prévisualisation et analyse réelle.

Refuser avant toute analyse sélection vide, lien symbolique, fichier interdit, chemin échappant au périmètre ou erreur de lecture ; détecter les changements entre sélection et copie. La copie seule ne constitue pas un confinement : définir et vérifier une frontière d'exécution qui empêche l'accès aux données exclues, ou refuser l'envoi si cette garantie ne peut être établie. Protéger les fichiers temporaires et documenter leur durée de vie et leur nettoyage ciblé. Ne pas lire ni révéler de secret pendant la prévisualisation.

Tests ciblés sans réseau dans des dépôts temporaires : fichiers conformes de chaque zone ; autres cibles, tests et données exclues ; fichiers non suivis ; liens internes et externes ; absence de fichiers, lecture impossible et modification concurrente ; respect des consommateurs existants. Conserver les preuves et les limites ; les suites complètes et tests avec services restent manuels.

## Réalisation et preuves

Prévisualisation locale : `python3 webapp/scripts/quality/sonar_scope.py` ; 305 fichiers sélectionnés dans ce worktree, analyse non réalisée. La copie temporaire est supprimée à la sortie ; les fichiers sont relus sans suivre les liens et leur empreinte est comparée. Le suivi Git ne garantit pas l'absence de secret dans un fichier applicatif.

`python3 -m unittest codebase-integrity/domaines/fiabilite-verifications/tests/test_sonar_scope.py` : 4 tests réussis, sans service. La sélection réelle, le refus des liens et les modifications de fichiers sont couverts ; une erreur d'accès effective et le confinement du scanner ne sont pas démontrés. Le scanner ne doit pas être lancé sans frontière vérifiée ; son raccordement relève d'OPS-046.

## Verdict humain

Verdict explicite « validé » dans la session `01a211b5-0ab6-7733-9516-b83103d91b22`.

```verdict-json
{
  "decision": "validé",
  "portee": "DEM-017, OPS-045 — Sélection, copie temporaire et prévisualisation du périmètre SonarQube.",
  "contenu": {
    "type": "git",
    "valeur": "aee94c98a7c7a8da62d6f3e52a4f9b9561e5f060"
  }
}
```

## Commits

- Implémentation examinée : `aee94c98a7c7a8da62d6f3e52a4f9b9561e5f060`.
