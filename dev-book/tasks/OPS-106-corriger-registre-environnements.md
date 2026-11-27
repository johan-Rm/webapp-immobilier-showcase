# OPS-106 — Diagnostiquer et corriger les chemins des environnements

- Demande : DEM-029
- Session de création : 01a21cf5-ae80-79e1-93aa-e5bca7961807
- Couche : devops
- Branche : demands/DEM-029-emplacement-worktrees
- Worktree : /home/johan/www/graines-digitales/modern-web-apps/showcase-immobilier.worktrees/DEM-029-emplacement-worktrees
- État : à vérifier par l’humain
- Chemins autorisés : infra/scripts/demand_environment.py, infra/scripts/demand_delivery.py, infra/tests/test_demand_environment.py, infra/tests/test_demand_delivery.py, infra/make/Makefile.ai-development-engineering, TEST.md, dev-book/tasks/OPS-106-corriger-registre-environnements.md, dev-book/demand/DEM-029-emplacement-worktrees.md
- Dépendances : OPS-105 validée et commitée

## Résultat et critères

Prévoir une commande explicite de diagnostic et correction du chemin sous verrou, conservant les cinq ports et le suffixe ; refuser identité ou registre ambigus et ressources Docker identifiées portant l’ancien chemin. Définir le traitement ciblé explicite sans suppression de données. Tester absence, divergence, concurrence, conflits et échecs ; ne pas supposer un registre présent.

Respecter le cadrage et les décisions de la demande. Ne pas modifier les ressources ou données des worktrees existants. Identifier les contrôles légers exécutés, les tests lourds à réaliser par l’humain et leurs limites.

## Réalisation et preuves

`make demand-env-rebind` vérifie sous verrou le registre, les identités Git et les deux parents, puis conserve ports et suffixe en mettant à jour le seul chemin. L’absence de réservation, un ancien chemin occupé, des conteneurs étrangers ou ambigus, tout réseau identifié pour la demande et Docker inaccessible bloquent la correction. Les réseaux sont refusés par précaution, leurs labels ne prouvant pas leur ancien répertoire. Aucune ressource n’est modifiée ; leur traitement reste explicite et humain.

Depuis le worktree : `python3 -B -m unittest discover -s infra/tests -p 'test_demand_environment.py'` : 11 tests réussis, Docker simulé ; `git diff --check` réussi. Aucun essai Docker réel ni modification du registre DEM-028. Les ressources inconnues ou sans labels de projet ne sont pas découvertes par ce contrôle ; l’identification complète avant intervention réelle reste une responsabilité humaine.

## Verdict humain

Verdict explicite de l’humain le 2026-11-27.

```verdict-json
{
  "decision": "validé",
  "portee": "OPS-106 : changements présentés ; empreinte du script principal",
  "contenu": {
    "type": "sha256",
    "fichier": "infra/scripts/demand_environment.py",
    "valeur": "f9b255c61312dd8766c4aca65f635bd0f1868354db530eba2e7009b6ce9ad649"
  }
}
```

## Commits

En attente.
