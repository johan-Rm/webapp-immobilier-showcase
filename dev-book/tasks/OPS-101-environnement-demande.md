# OPS-101 — Isoler les environnements et vhosts de demande

- Demande : DEM-028
- Session de création : 01a21940-493f-7ee2-9901-d4c9a15de91d
- Couche : devops
- Branche : demands/DEM-028-workflow-demandes
- Worktree : worktree/DEM-028-workflow-demandes
- État : implémentée et commitée, à vérifier
- Chemins autorisés : infra/config/, infra/scripts/, infra/make/Makefile.ai-development-engineering, infra/docker/, infra/nginx/, infra/tests/, codebase-integrity/domaines/construction-livraison/scripts/environment.py, codebase-integrity/domaines/construction-livraison/tests/test_environment.py, infra/README.md, webapp/scripts/quality/, dev-book/demand/DEM-028-workflow-demandes.md, dev-book/tasks/OPS-101-environnement-demande.md
- Dépendances : OPS-100

## Résultat et critères

Attribuer identité, ports et vhosts stables avec réservation concurrente et refus de collision ; séparer développement et test, ressources et arrêt ; permettre site public et dashboard. Conserver la transition des couches et l’API partagée ; identifier les données chargées au setup sans supposer régénérables les journaux SaaS. Tester configuration, collisions, isolation et refus ; préparer les essais manuels Docker et HTTP de deux demandes.

## Réalisation et preuves

Allocation persistante sous verrou ; environnement et projets Compose distincts par demande et cible. Les adresses et ports sont stables ; le mode fixtures n’utilise pas les secrets de développement. Les secrets d’API sont à configurer explicitement dans chaque environnement.

`python3 -B -m unittest discover -s infra/tests -p 'test_demand_environment.py'` : 7 tests réussis, dont occupation réelle d’un port et allocations concurrentes simulées. `docker compose ... config --no-env-resolution` : configurations site et dashboard résolues avec leurs deux services et ports attendus ; aucun conteneur lancé. Les essais simultanés, HTTP et de chargement restent manuels et non vérifiés. Les données locales non identifiées et les journaux SaaS ne sont pas considérés jetables.

## Verdict humain

Aucun verdict humain.

## Commits

SHA référencé dans la trace de la demande.
