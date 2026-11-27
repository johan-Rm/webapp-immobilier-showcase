# OPS-102 — Clore et nettoyer une demande livrée

- Demande : DEM-028
- Session de création : 01a21940-493f-7ee2-9901-d4c9a15de91d
- Couche : devops
- Branche : demands/DEM-028-workflow-demandes
- Worktree : worktree/DEM-028-workflow-demandes
- État : implémentée et commitée, à vérifier
- Chemins autorisés : infra/scripts/demand_delivery.py, infra/scripts/demand_worktree.py, infra/tests/test_demand_delivery.py, infra/make/Makefile.ai-development-engineering, dev-book/demand/DEM-028-workflow-demandes.md, dev-book/tasks/OPS-102-nettoyage-demande-livree.md
- Dépendances : OPS-100, OPS-101

## Résultat et critères

Vérifier preuve de squash, identité, disponibilité et absence de travail inédit ; archiver la tête puis retirer branche, worktree et seules ressources démontrées temporaires de la demande. Préserver secrets, données ou ressources non identifiés et refuser les ambiguïtés ; tests Git temporaires et simulations des erreurs et collisions.

## Réalisation et preuves

La clôture accepte les branches descriptives ou historiques, vérifie le squash et l’arbre, archive la tête et supprime la branche après retrait du worktree. Le seul fichier local supprimable par Git est le `.env` ignoré du worktree livré : décision humaine du 27 novembre 2026. Les autres fichiers locaux, liens symboliques, volumes et objets Docker ambigus bloquent la suppression. Le registre reste verrouillé pendant la clôture ; les conteneurs et réseaux de la demande sont vérifiés avant arrêt et suppression.

`python3 -B -m unittest discover -s infra/tests -p 'test_demand*.py'` : 35 tests réussis, dont 12 tests de clôture avec dépôts Git temporaires et Docker simulé. Les tests préservent les fichiers `.env` du principal et d’un autre worktree. Le contrôle dev-book et `git diff --check` réussissent. Aucun service Docker réel n’a été démarré ou supprimé ; l’absence d’une autre activité humaine sur le worktree reste à confirmer lors de la livraison.

## Verdict humain

```verdict-json
{
  "decision": "validé",
  "portee": "OPS-102 ; Docker réel et absence d’activité humaine non vérifiés",
  "contenu": {"type": "git", "valeur": "75a0691f0a7897e4e361e350225665784e81ff58"}
}
```

## Commits

SHA référencé dans la trace de la demande.
