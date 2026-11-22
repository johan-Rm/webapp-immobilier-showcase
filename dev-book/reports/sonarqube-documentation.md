# Brouillon documentaire SonarQube

Destination prévue : remplacer le périmètre et les instructions devenus inexacts dans `docs/3.application/sonarqube-cloud.md`, puis vérifier la cohérence de `docs/executer-controles.md` à la reconstitution. Aucun changement de `docs/` à cette étape.

## Prévisualisation locale

Depuis la racine du worktree, `make third-party-tests-sonar-preview` affiche les chemins et empreintes des fichiers applicatifs suivis retenus. La copie temporaire sert uniquement à vérifier leur préparation puis est supprimée. Elle ne constitue pas un confinement du scanner ni une analyse Sonar ; un fichier suivi peut lui-même contenir une donnée sensible.

## Analyse réelle

Depuis la racine du worktree, `make third-party-tests-sonar` lance le scanner installé séparément dans `SONAR_SCANNER_HOME`, avec `SONAR_ORGANIZATION`, `SONAR_PROJECT_KEY` et `SONAR_BRANCH` explicites. Le token provient de `SONAR_TOKEN` ou de `webapp/.env`. Prérequis : Linux, Bubblewrap, `socat`, scanner officiel et accès réseau au service. Les sources sont copiées puis montées en lecture seule dans un environnement isolé. Un relais éphémère limite les connexions aux destinations Sonar Cloud UE prévues ; il refuse les adresses non publiques. Les fichiers temporaires et la socket sont supprimés à la fin.

Un journal privé par exécution reste sous `webapp/.tmp/sonarqube/` avec permissions limitées ; le token connu est masqué et le journal est tronqué à 4 Mio. Ces journaux restent sur l'hôte jusqu'à leur suppression manuelle ciblée. Leur contenu peut comprendre des métadonnées du projet. Un rapport de soumission ne prouve ni la réussite distante ni l'exhaustivité des fichiers analysés.

Pour un essai manuel sur Linux x64, après configuration des trois variables publiques ci-dessus et du token local, `bash webapp/scripts/quality/manual_sonar_cloud.sh` télécharge le scanner officiel dans un dossier temporaire privé, vérifie son empreinte et lance la commande. Ce dossier et le scanner téléchargé sont supprimés en fin d'exécution ; le journal privé est conservé. Le résultat « soumise » doit être confirmé dans SonarQube Cloud ; « non réalisée » ou l'absence de résultat reste inconnu ou en échec.

Le workflow prépare le scanner officiel vérifié par SHA-256 pour les pushes et les PR de confiance. Les PR externes et Dependabot sont signalées sans analyse ni token ; les réglages GitHub doivent aussi interdire la transmission de secrets aux forks, car le workflow d'une contribution peut être modifié. Les fichiers applicatifs suivis ne sont pas inspectés pour rechercher d'éventuels secrets. Le Git filtré expose les noms de fichiers exclus, messages et identités des commits, ainsi que les versions historiques des fichiers autorisés ; sa compatibilité avec le scanner officiel reste inconnue. Les résultats, limites du plan, avertissements, réglages et permissions du service restent à vérifier séparément. La précision TypeScript peut être réduite par l'absence des dépendances et des schémas générés. Le projet Sonar et les protections de branche n'ont pas été inspectés ou modifiés.
