# DASH-005 — Adapter l’import du pictogramme

- Demande : DEM-022, [demande reconstituée](../demand/DEM-022-placer-ressources-design-racine.md).
- Type : développement ; session de création : `01a20294-5e96-7f03-8096-cd1653e7508b` ; date : 2026-11-22.
- Couche : dashboard ; branche : `layers/dashboard` ; worktree : `worktree/dashboard`.
- État : correctif implémenté, à vérifier humainement.
- Chemins autorisés : `webapp/dashboard/app/components/dashboard/Brand.vue`, `webapp/dashboard/app/assets/css/main.css`, `webapp/tests/layers/dashboard.vitest.ts` et cette carte.
- Dépendances de réalisation : aucune. La résolution effective de l’import et les builds se vérifient après réunion du commit OPS-086 `6339cae99bebede15a4cb6d85c67e0b64e46cc42` et de cette tâche.

## Résultat et critères

Adapter l’import du pictogramme au nouvel emplacement et actualiser la référence de la charte dans le commentaire CSS. Préserver l’identité visuelle et le fonctionnement du dashboard, sans copie du pictogramme ni modification de son contenu. La configuration des montages et les ressources relèvent d’OPS-086.

## Vérifications et preuves

Vérifier la résolution de l’import et rechercher les références actives obsolètes ; relire le diff. Après réunion des contributions, faire vérifier manuellement les builds et le dashboard avec les prérequis, commandes et résultats attendus documentés. Les tests lourds et ceux exigeant des services ne sont pas lancés par l’agent. Consigner les preuves et distinguer le résultat technique du verdict humain.

## Résultats d’implémentation

L’import et la référence CSS pointent vers `design/`. Le fichier cible existe dans le commit OPS-086 ; la résolution dans le worktree et le fonctionnement du dashboard nécessitent la réunion des contributions. `git diff --check` réussi. Aucun build ni test nécessitant un service lancé ; validation humaine en attente.

## Verdict humain

```verdict-json
{
  "decision": "validé",
  "portee": "DEM-022, OPS-086 et DASH-005, avec les limites présentées : résolution de l’import, builds et dashboard non vérifiés ; documentation à intégrer et README à coordonner",
  "contenu": {
    "type": "git",
    "valeur": "92a199cf81eb548849fc3c62aca37e17a5bab33e"
  }
}
```

## Correctif après échec CI

Les trois jobs d’intégration de la PR #16 échouent sur ce test : sa fixture copiait encore `resources/`, absent après le déplacement. Elle copie désormais `design/` au même niveau que `webapp/`, conformément au nouvel import. Le verdict précédent reste limité au commit initial ; ce correctif attend une nouvelle vérification humaine. Le test lance une préparation et une compilation Nuxt avec un délai maximal de 180 secondes : il relève d’une exécution manuelle.
