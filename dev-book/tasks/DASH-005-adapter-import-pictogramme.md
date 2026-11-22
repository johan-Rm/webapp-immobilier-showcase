# DASH-005 — Adapter l’import du pictogramme

- Demande : DEM-022, [brouillon du principal](../../../../tmp/demande-design-racine.md) ; demande définitive prévue à la reconstitution.
- Type : développement ; session de création : `01a20294-5e96-7f03-8096-cd1653e7508b` ; date : 2026-11-22.
- Couche : dashboard ; branche : `layers/dashboard` ; worktree : `worktree/dashboard`.
- État : implémentée et commitée, à vérifier.
- Chemins autorisés : `webapp/dashboard/app/components/dashboard/Brand.vue`, `webapp/dashboard/app/assets/css/main.css` et cette carte.
- Dépendance de réalisation : aucune. La résolution effective de l’import et les builds se vérifient après réunion du commit OPS-086 `6339cae99bebede15a4cb6d85c67e0b64e46cc42` et de cette tâche.

## Résultat et critères

Adapter l’import du pictogramme au nouvel emplacement et actualiser la référence de la charte dans le commentaire CSS. Préserver l’identité visuelle et le fonctionnement du dashboard, sans copie du pictogramme ni modification de son contenu. La configuration des montages et les ressources relèvent d’OPS-086.

## Vérifications et preuves

Vérifier la résolution de l’import et rechercher les références actives obsolètes ; relire le diff. Après réunion des contributions, faire vérifier manuellement les builds et le dashboard avec les prérequis, commandes et résultats attendus documentés. Les tests lourds et ceux exigeant des services ne sont pas lancés par l’agent. Consigner les preuves et distinguer le résultat technique du verdict humain.

## Résultats d’implémentation

L’import et la référence CSS pointent vers `design/`. Le fichier cible existe dans le commit OPS-086 ; la résolution dans le worktree et le fonctionnement du dashboard nécessitent la réunion des contributions. `git diff --check` réussi. Aucun build ni test nécessitant un service lancé ; validation humaine en attente.
