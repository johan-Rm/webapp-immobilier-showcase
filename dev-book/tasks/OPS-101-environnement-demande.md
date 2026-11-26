# OPS-101 — Isoler les environnements et vhosts de demande

- Demande : DEM-028
- Session de création : 01a21940-493f-7ee2-9901-d4c9a15de91d
- Couche : devops
- Branche : demands/DEM-028-workflow-demandes
- Worktree : worktree/DEM-028-workflow-demandes
- État : prête
- Chemins autorisés : infra/config/, infra/scripts/, infra/docker/, infra/nginx/, infra/tests/, codebase-integrity/domaines/construction-livraison/scripts/environment.py, codebase-integrity/domaines/construction-livraison/tests/test_environment.py, infra/README.md, webapp/scripts/quality/, dev-book/demand/DEM-028-workflow-demandes.md, dev-book/tasks/OPS-101-environnement-demande.md
- Dépendances : OPS-100

## Résultat et critères

Attribuer identité, ports et vhosts stables avec réservation concurrente et refus de collision ; séparer développement et test, ressources et arrêt ; permettre site public et dashboard. Conserver la transition des couches et l’API partagée ; identifier les données chargées au setup sans supposer régénérables les journaux SaaS. Tester configuration, collisions, isolation et refus ; préparer les essais manuels Docker et HTTP de deux demandes.

## Réalisation et preuves

À renseigner après réalisation ; distinguer tests automatisés, essais manuels et limites.

## Verdict humain

Aucun verdict humain.

## Commits

À renseigner après implémentation.
