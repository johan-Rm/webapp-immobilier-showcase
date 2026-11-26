# OPS-096 — Préparer la reprise de DEM-019

- Demande : DEM-020
- Type : consolidation
- Brouillon au principal : `tmp/demande-consolidation-journal-demandes.md`
- Demande définitive prévue : `dev-book/demand/DEM-020-journal-versionne-demandes.md`
- Session de création : 01a2175b-509d-76f2-8a98-746661b2e1fa
- Couche : devops
- Branche : layers/devops
- Worktree : worktree/devops
- État : validée par l’humain
- Chemins autorisés : dev-book/runbooks/, `dev-book/tasks/OPS-096-preparer-reprise-demande-sauvegardee.md`
- Dépendances : OPS-094 : `598226c3f010d8b5b6f4edc0d0b48ee09246bebe` pour la réservation. La clôture ne fait pas partie de la reprise. Reprise effective après adoption de la convention.

## Résultat et critères

- Documenter l’extraction du seul document depuis la référence Git complète consignée dans le brouillon. Préserver la sauvegarde existante.
- Prouver sur copie isolée la fidélité au fichier source, la conservation de l’identité, du type, des décisions et de la session d’origine, puis la traçabilité de la session intervenante.
- Consigner la comparaison et son empreinte. Laisser la reprise réelle à l’exécution de la procédure après adoption.

## Réalisation et preuves

Procédure dans [Reprendre une demande sauvegardée](../runbooks/2026-11-26-reprendre-demande-sauvegardee.md). Simulation réussie dans un dépôt Git temporaire avec le script de réservation, `git show`, `cmp` et `sha256sum`. Comparaison octet par octet réussie. La source et la copie portent la session d’origine `01a1ee70-2dc4-7331-992b-b24155dfd09a`. La reprise effective reste prévue après adoption.

## Verdict humain

```verdict-json
{
  "decision": "validé",
  "portee": "DEM-020, carte OPS-096, contenu présenté à la vérification du 26 novembre 2026.",
  "contenu": {
    "type": "git",
    "valeur": "c9cf53c0db96b406dc0c1cb750e06c37b3eb7718"
  }
}
```

Verdict global formulé dans le chat le 26 novembre 2026 : « validé ».

## Commits

En attente d’implémentation.
