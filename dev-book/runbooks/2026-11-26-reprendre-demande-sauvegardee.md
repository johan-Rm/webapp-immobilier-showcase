# Reprendre une demande sauvegardée

Procédure exceptionnelle prévue par OPS-096 après adoption de la convention du
journal. Elle restaure uniquement le document de DEM-019 dans son espace
documentaire et conserve la sauvegarde existante.

## Préparer l’espace

Depuis le principal, inspecter les demandes locales et la branche explicite
`develop`. Confirmer l’absence d’autre document ou réservation DEM-019. Résoudre
le SHA complet de la base puis lancer `make demand-open DEMAND=DEM-019 BASE=<sha>`.
Relever le chemin de l’espace affiché et vérifier qu’il est sur
`demands/DEM-019`, avec un index et un arbre propres.

## Vérifier et reprendre le document

Depuis le principal, extraire dans un fichier temporaire. Vérifier la provenance
et l’empreinte avant toute écriture dans le journal.

```bash
set -eu
document=dev-book/demand/DEM-019-harmoniser-sorties-tests-internes.md
saved_tree=4c68802e616a9b37f3a0b302f042a3b749903578
snapshot=$(mktemp)
git show "$saved_tree:$document" > "$snapshot"
printf '%s  %s\n' b5bffc3ebd619f8dc051b6fab557014248869bb6bf497837dc93202c4cf9a2a9 "$snapshot" | sha256sum -c -
```

Dans l’espace réservé, copier le fichier avec protection contre l’écrasement.
Vérifier avec `cmp` que la copie est identique. Conserver la session d’origine
`01a1ee70-2dc4-7331-992b-b24155dfd09a`, l’identité, le type et les décisions.
Ajouter ensuite la session intervenante réelle et la trace de provenance.
Relire le diff et enregistrer la reprise dans le premier commit documentaire
autorisé de la demande. Conserver le fichier temporaire uniquement le temps de
la comparaison et préserver la sauvegarde Git d’origine.

Si l’identité est déjà attribuée, que le fichier cible existe ou que l’empreinte
diffère, arrêter la reprise et préserver les sources.
