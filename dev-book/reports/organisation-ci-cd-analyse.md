# Analyse de l’organisation CI/CD

- Demande : DEM-016 ; type : consolidation.
- Session d’analyse : 01a1ee70-2dc4-7331-992b-b24155dfd09a.
- Base examinée : `4c04cb2fdab715eb0ea38596961133ef0549ef27` ; analyse statique sans exécution de workflow ni de test lourd.

## Périmètre et constat

Les cinq fichiers de `.github/workflows/` ont été lus : `quality.yml`, `conventions.yml`, `sonarqube.yml`, `quality-extended.yml` et le workflow réutilisable `ai-development-engineering.yml`. Le contrat existant dans `webapp/scripts/quality/ci-plan.vitest.ts`, le catalogue des commandes et les documents liés ont été examinés. La recherche des références actives exclut les dépendances, fichiers générés, données privées, temporaires et copies de worktrees ; les documents historiques restent des traces. Les protections et secrets GitHub actuels n’ont pas été vérifiés ; leur existence ou leur statut ne sont pas supposés.

`quality` lance les contrôles qualité et les tests pour trois cibles, y compris les parcours navigateur sur fixtures ; il inclut sécurité et architecture dans un job distinct. `conventions` couvre les conventions frontend et services. Les deux appellent séparément le cadre AIDE ; SonarQube le référence également et requiert sa configuration distante. `quality-extended` propose manuellement mutation pilote, charge et Lighthouse. Fonctions et duplication DEM-013, couverture et `conventions-tests-devbook` ne sont pas raccordés comme contrôles applicatifs automatiques ; les tests des vérificateurs restent distincts de l’application des règles.

La qualité courante prépare les trois cibles et utilise des fixtures locales ; le contrôle des commits extrait la politique de la base PR. Les tests existants imposent notamment les noms et structures actuels, les trois cibles, des rapports même en échec et l’absence de contournement pour la sécurité. Ils devront évoluer avec l’organisation, sans assouplir les protections utiles. Lighthouse est actuellement un contrôle manuel GitHub, à retirer de GitHub Actions selon la décision humaine.

## Décisions confirmées

Organiser six workflows visibles : cadre et traçabilité ; qualité du code et sécurité ; conventions ; tests internes ; runtime ; SonarQube séparé. Préserver les déclenchements automatiques à chaque PR et sur push `develop` / `master`. Les trois cibles restent couvertes là où elles sont pertinentes. Préserver le contrôle des commits sur la politique de base vérifiée et les rapports exploitables même en échec ; éviter la répétition inutile du cadre entre familles sans perdre de vérification.

Fonctions et duplications tournent à chaque PR : signalements informatifs, `debugger` bloquant. La couverture tourne à chaque PR pour trois cibles : scores informatifs, mesure échouée ou vide bloquante. Sur Showcase, une mesure antérieure a pris 81 secondes ; aucune durée n’est garantie pour les autres cibles ou GitHub. `conventions-tests-devbook` reste manuel ; il ne se confond pas avec le contrôle des commits. La mutation pilote reste manuelle ; la mutation étendue inactive. Les tests runtime sur fixtures couvrent navigateur et charge légère à chaque PR, selon la sévérité confirmée dans DEM-014. Lighthouse desktop/mobile est exclusivement local, y compris en cas d’échec : aucun workflow GitHub ne le lance.

La charge BFF → API réelle de DEM-015 reste manuelle au départ : ne pas l’activer sur les PR, ne pas exposer de secrets à du code non fiable ni contacter le VPS implicitement. Un éventuel élargissement exige une décision distincte. La question d’un déclenchement manuel GitHub pour d’autres mesures ne transforme pas les contrôles manuels locaux en exécutions automatiques.

## Contrôle proposé et limites

Tester de manière déterministe le contrat des workflows sur des configurations et exemples : six familles, événements, cibles et contrôles attendus, cas conforme, famille ou contrôle absent, déclenchement incorrect, couverture échouée ou vide, préservation des échecs bloquants et distinction des statuts informatifs. Vérifier l’absence de Lighthouse en CI, de mutation étendue active et de charge sur API réelle dans les PR ; vérifier la conservation des rapports en échec et le contrôle indépendant des commits. Ces vérifications de configuration ne prouvent pas l’exécution réelle sur GitHub, les protections distantes ni l’accès aux secrets.

Réorganisation des workflows, tests de contrat et documentation relèvent de DevOps. La carte DEM-014 modifie elle aussi les tests de plan ; intégrer son commit identifié avant de modifier ces mêmes fichiers. Les scénarios DEM-015 et les workflows peuvent être conçus indépendamment ; aucune connexion au VPS n’est requise ici. Les durées et coûts réels sur trois cibles sont inconnus.

Les suites complètes, E2E et contrôles nécessitant un service sont réservés à l’humain. Préparer leurs commandes et prérequis, sans déclencher directement ou indirectement les workflows lourds par l’agent. Un test léger dépassant une minute est arrêté ; un résultat absent reste inconnu. Les statuts GitHub nécessaires et leur éventuelle migration doivent être identifiés sans changer ou contourner les protections.

## Constats d’implémentation

Le 2026-11-20, la lecture de l’API GitHub de protection classique de `develop` retourne « Branch not protected » ; les deux listes de règles de branche et de rulesets retournent vides. Cette observation ne garantit pas les réglages futurs ou une politique externe. Les anciens statuts visibles sous `quality / aide / cadre` et `conventions / aide / cadre` deviennent `aide / cadre` ; les jobs applicatifs sont répartis entre `third-party-tests`, `conventions`, `internal-tests` et `runtime-tests`. Toute protection ajoutée ou règle externe doit être coordonnée sur ces nouveaux noms, sans contournement.

Les coûts, temps, exécutions GitHub et disponibilité de SonarQube après réorganisation restent inconnus. Le contrôle de couverture refuse désormais un résultat dépourvu d’instruction applicative mesurée, tout en conservant les scores informatifs et les fichiers non mesurables.

L’humain demande ensuite les noms visibles `aide-tests` et `conventions-tests`, cohérents avec les autres familles ; les chemins des workflows restent identiques. Cette modification change à nouveau les noms de statuts à coordonner.
