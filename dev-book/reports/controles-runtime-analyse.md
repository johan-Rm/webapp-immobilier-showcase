# Analyse des contrôles runtime

- Demande : DEM-014 ; type : consolidation.
- Session d’analyse : 01a1ee70-2dc4-7331-992b-b24155dfd09a.
- Base examinée : `4c04cb2fdab715eb0ea38596961133ef0549ef27` ; dépôt principal. Recherche statique, sans exécution de test.

## Périmètre et constat

Les trois commandes canoniques actuelles sont `internal-tests-browser`, `internal-tests-load` et `third-party-tests-lighthouse`. Trois alias historiques restent actifs : `test-browser`, `load-check`, `lighthouse-check`. La recherche des six noms dans les fichiers actifs hors dépendances, fichiers générés, temporaires et copies de worktrees relève : `Makefile`, `infra/make/Makefile.dev`, `codebase-integrity/commun/check_presentation.py`, ses tests Python, `docs/executer-controles.md` et `webapp/scripts/quality/ci-plan.vitest.ts`. Les anciens noms apparaissent aussi dans des traces du dev-book, à conserver comme preuves historiques.

Le lanceur interne utilise les familles `browser`, `load` et `lighthouse` ; les workflows les invoquent directement. `quality.yml` exécute déjà les parcours navigateur à chaque PR ; `quality-extended.yml` propose charge et Lighthouse sur déclenchement manuel. Les tests de plan vérifient notamment les commandes Make et les alias. La présentation distingue déjà les prérequis d’URL et les erreurs. Aucun contrôle identifié n’interdit aujourd’hui la réapparition des noms obsolètes.

La recherche couvre les fichiers lisibles non ignorés du dépôt principal, sans parcourir les copies des worktrees ni les données privées. Les fichiers ignorés, usages externes et scripts exécutés hors dépôt ne sont pas vérifiés ; leur compatibilité ne peut pas être garantie. Les README et la documentation des contrôles ont été lus pour leurs responsabilités ; aucun rendu ou service n’a été observé.

## Décisions confirmées

Regrouper navigateur, charge et Lighthouse sous les commandes `runtime-tests-browser`, `runtime-tests-load` et `runtime-tests-lighthouse`. Supprimer les six noms précédents sans alias, migrer les références actives et préserver les traces historiques. Une application démarrée et une URL explicite restent nécessaires ; conserver les prérequis et la sélection par cible et profil.

Un parcours navigateur essentiel ou une réponse incorrecte en charge est bloquant. Les temps de réponse et scores Lighthouse sont informatifs. Un audit Lighthouse échoué conserve un code d’erreur fidèle, mais ne bloque pas la PR : l’application de cette politique et l’exécution runtime à chaque PR relèvent de DEM-016. DEM-015 définira les scénarios de lecture BFF → API ; ne pas les implémenter ici.

## Contrôle et découpage

Une carte DevOps cohérente couvre les fichiers de commande, présentation, documentation et vérificateurs partagés. Un contrôle déterministe vérifie les trois noms attendus et l’absence des six noms obsolètes dans les interfaces et références actives, sans analyser les traces historiques comme des usages actuels. Prévoir cas conformes, ancien nom réintroduit, commande manquante et conservation d’une trace historique ; préciser le périmètre et éviter de fausses correspondances. Le contrôle est bloquant pour l’intégrité des noms ; les mesures runtime conservent les niveaux ci-dessus.

Le renommage implique une rupture volontaire pour les appels externes : aucun alias n’est conservé. La CI invoque les familles internes, inchangées ; sa réorganisation est hors périmètre. Les tests courts de vérificateur sont à exécuter selon les consignes en vigueur ; les suites complètes, E2E et tout contrôle exigeant un service sont réservés au lancement humain, avec commande, répertoire, prérequis et résultats à consigner. Une preuve absente reste inconnue.
