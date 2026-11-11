# OPS-007 — Supprimer la dépendance CI à la variable d’amorçage

- Demande : DEM-003
- Type : consolidation
- Session de création : 01a1c16c-2085-7141-83fa-3460f6bd4463
- Worktree : /home/johan/www/graines-digitales/modern-web-apps/showcase-immobilier
- Branche : demands/DEM-003
- Couche : correction transverse de livraison explicitement demandée
- État : correction explicitement autorisée et contrôlée, à publier
- Chemins autorisés : les cinq chemins de la dernière correction déclarée dans DEM-003, cette carte et la demande
- Dépendances : résultat réuni DEM-003, `be981d8b0578593bf45366a2948a6838dda53882`

## Décision et résultat

Le 2026-11-11, l’utilisateur demande la suppression de la variable puis autorise
explicitement la suppression de l’étape CI de contrôle de contribution :
« oui j’autorise ». L’exception bornée préparée auparavant est abandonnée.
Les tests de l’outillage, la documentation et les contrôles applicatifs restent
exécutés. Le contrôle local est conservé et n’accepte l’approbation initiale
que par argument CLI explicite. La suppression du contrôle de contribution
distant est marquée comme divergence autorisée avec la référence AIDE dans
DEM-003. Aucun succès de ce contrôle supprimé n’est annoncé.

## Vérifications

- `make aide-check` : registre, demandes, liens documentaires et 111 tests Python réussis.
- `bun run test:typescript` : 9 tests réussis dans 2 fichiers.
- `bun run test:bun` : 40 tests réussis.
- `git diff --check` : conforme ; aucune référence active à la variable dans le workflow ni dans l’outillage.
- Liste des variables du dépôt GitHub vérifiée vide ; aucune suppression distante nécessaire.
- Contrôles applicatifs conservés ; leur résultat GitHub sera vérifié après publication.
