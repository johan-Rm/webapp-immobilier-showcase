# OPS-085 — Réécrire le README racine

- Demande : DEM-021, [brouillon du principal](../../../../tmp/demande-reecrire-readme.md) ; demande définitive prévue à la reconstitution.
- Type : développement.
- Session de création : `01a20297-2846-7532-a284-d2b995cbbc41`.
- Couche : devops ; branche : `layers/devops` ; worktree : `worktree/devops`.
- État : validée humainement ; reconstitution à réaliser.
- Chemins autorisés : `README.md` et cette carte ; matrice dans le brouillon du principal.
- Dépendances de réalisation : aucune. La branche contient des commits DEM-017 antérieurs ; leur présence ne prouve pas une occupation de la couche. La reconstitution sélectionnera les commits validés de DEM-021.

## Résultat et critères

Appliquer le contenu retenu dans le brouillon : présentation, organisation, installation et vérifications. Retirer Essaouira et le chapitre de configuration d’un futur projet. Remplacer les deux liens relatifs par des URL absolues GitHub et vérifier leurs destinations. Ne modifier ni les autres occurrences, ni l’application, ni les conventions et contrôles.

## Vérifications et preuves

Relire le contenu et le diff, vérifier les deux destinations et l’absence de liens relatifs ; consigner les résultats ici. Aucun test applicatif lourd n’est requis. La validation humaine reste distincte du commit technique.

Contrôles : `git diff --check` réussi ; texte, rubriques, absence d’Essaouira et deux liens absolus vérifiés par script. Les deux fichiers cibles sur `develop` ont été lus via le connecteur GitHub. Aucun test applicatif lourd lancé.

## Verdict humain

```json
{
  "decision": "validé",
  "portee": "DEM-021 et OPS-085, avec les limites présentées, dont l’absence de tests applicatifs lourds",
  "contenu": {
    "type": "git",
    "valeur": "d6810c99e6cb8e74a74f7f60b8643dac86840fff"
  }
}
```
