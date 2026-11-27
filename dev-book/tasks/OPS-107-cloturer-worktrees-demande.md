# OPS-107 — Contrôler la clôture des deux emplacements

- Demande : DEM-029
- Session de création : 01a21cf5-ae80-79e1-93aa-e5bca7961807
- Couche : devops
- Branche : demands/DEM-029-emplacement-worktrees
- Worktree : /home/johan/www/graines-digitales/modern-web-apps/showcase-immobilier.worktrees/DEM-029-emplacement-worktrees
- État : validée par l’humain
- Chemins autorisés : infra/scripts/demand_delivery.py, infra/tests/test_demand_delivery.py, TEST.md, dev-book/tasks/OPS-107-cloturer-worktrees-demande.md, dev-book/demand/DEM-029-emplacement-worktrees.md
- Dépendances : OPS-105 et OPS-106 validées et commitées

## Résultat et critères

Approfondir les vérifications de clôture pour les deux parents en préservant les preuves de squash, archives, fichiers locaux, volumes et refus d’états ambigus. Vérifier les chemins et labels Compose ainsi que les réseaux partagés ; tester les succès et refus sans toucher aux espaces réels.

Respecter le cadrage et les décisions de la demande. Ne pas modifier les ressources ou données des worktrees existants. Identifier les contrôles légers exécutés, les tests lourds à réaliser par l’humain et leurs limites.

## Réalisation et preuves

La clôture interroge Docker même sans entrée de registre. Des ressources identifiées sans réservation bloquent tout nettoyage ; Docker inaccessible bloque également la clôture. Les ressources, réseaux partagés, volumes et fichiers non identifiés restent protégés. Les deux emplacements sont couverts par les tests de clôture.

Depuis le worktree : `python3 -B -m unittest discover -s infra/tests -p 'test_demand_delivery.py'` : 16 tests réussis, Docker simulé ; `git diff --check` réussi. Aucun essai Docker réel ni clôture de DEM-028. Les ressources sans labels Compose reconnus ne sont pas identifiées automatiquement.

## Verdict humain

Verdict explicite de l’humain le 2026-11-27.

```verdict-json
{
  "decision": "validé",
  "portee": "OPS-107 : changements présentés ; empreinte du script principal",
  "contenu": {
    "type": "sha256",
    "fichier": "infra/scripts/demand_delivery.py",
    "valeur": "3420291c23813e99eef24805ac3e45b9cfb1094c644c92923248c800649f2562"
  }
}
```

## Commits

`929abf0def0b87b9f0fe9d09991d8b40493cd64c`

Vérification globale : validation humaine du 27 novembre 2026 sur `95324bb638fe3bc216c54a60ff08c964d3fb8a27`, avec les limites consignées dans la demande.
