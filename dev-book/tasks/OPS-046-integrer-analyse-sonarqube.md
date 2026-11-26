# OPS-046 — Raccorder l’analyse SonarQube et présenter ses limites

- Demande : DEM-017, brouillon au principal `tmp/demande-consolidation-sonarqube.md` ; demande définitive prévue à la reconstitution.
- Session de création : 01a1fed8-cd9a-7561-9aa0-6c26f1125293
- Couche : devops ; branche : `layers/devops` ; worktree : `worktree/devops`.
- État : validée humainement.
- Chemins autorisés : `.github/workflows/sonarqube.yml`, `sonar-project.properties`, `webapp/scripts/quality/`, `codebase-integrity/domaines/fiabilite-verifications/`, `codebase-integrity/README.md`, `codebase-integrity/conventions.json`, `infra/make/`, `Makefile`, `dev-book/reports/sonarqube-documentation.md`, `docs/3.application/sonarqube-cloud.md`, `docs/executer-controles.md`, cette carte et le brouillon du principal. Le rapport prépare la documentation à intégrer à la reconstitution.
- Dépendances : commit OPS-045 `aee94c98a7c7a8da62d6f3e52a4f9b9561e5f060` présent dans cette couche.

## Résultat et critères

Raccorder la sélection et le confinement prouvés par OPS-045 à une commande locale distincte et au workflow CI. Préserver les déclenchements existants, le résultat Sonar informatif et la visibilité des erreurs techniques ; adapter le contrat de test des workflows sans masquer les échecs. Déclarer explicitement « analyse non réalisée » si le token manque, si le service est indisponible ou si le contexte de PR n'est pas fiable. Ne jamais exposer de token ; utiliser `webapp/.env` local et les secrets CI selon le cadrage.

Tester hors réseau les états sélection refusée, token absent, PR non fiable, scanner simulé réussi ou en échec et rapport absent ; prouver qu'aucun scanner n'est lancé si les préconditions de sécurité échouent. Prévoir un contrôle manuel distinct pour l'analyse réelle, la PR, les permissions et la désactivation du mode automatique ; aucun réglage distant n'est supposé modifié. Expliciter les limites du plan, des données transmises, des avertissements, de l'historique Git et de la résolution TypeScript. Sans preuve que le scanner est confiné au périmètre confirmé, ne pas autoriser l'envoi ni présenter l'analyse comme réalisée.

Documenter les commandes, prérequis, états et limites dans les guides existants. Les suites complètes, tests de service et analyses réelles restent manuels ; préciser les commandes, le répertoire et le résultat attendu à leur préparation.

## Réalisation et preuves

La commande locale lance un scanner séparément installé dans Bubblewrap sur une copie filtrée, avec une branche explicitement désignée. Le workflow prépare le scanner officiel vérifié par empreinte pour les pushes ; les PR signalent « analyse non réalisée » tant que leur contexte Git ne peut pas être fourni au scanner en sécurité. Le brouillon documentaire indique les prérequis et limites.

Tests ciblés sans réseau : `python3 -m unittest codebase-integrity/domaines/fiabilite-verifications/tests/test_sonar_run.py codebase-integrity/domaines/fiabilite-verifications/tests/test_sonar_scope.py` : 9 tests réussis avec scanner simulé, y compris accès refusé au dossier personnel et au dépôt Git, rapport absent, refus des PR et absence de divulgation du token simulé. Le workflow est syntaxiquement valide. Le scanner officiel n'est pas installé localement ; aucune analyse réelle, exécution GitHub, vérification de rapport distant ni lecture des réglages du service n'a été faite.

À cette étape, une analyse de chaque PR nécessitait encore la disponibilité sûre des métadonnées Git. Les résultats et erreurs du scanner restent informatifs ; la désactivation automatique doit être effectuée et vérifiée séparément par un administrateur. Aucun changement de réglage distant effectué.

Recherche complémentaire, dépôt synthétique local sans service : un paquet Git contenant les commits et arbres, mais pas les blobs, puis le seul blob autorisé, conserve le SHA du commit et rend le contenu privé synthétique inaccessible. Les noms de fichiers exclus restent toutefois lisibles dans les arbres ; les objets de commit peuvent aussi contenir des messages et identités. L'exercice n'a pas exécuté le scanner réel et ne prouve ni son fonctionnement avec un dépôt incomplet ni les données transmises. Ne pas monter ces métadonnées dans le scanner sans décision sur ce périmètre supplémentaire.

Sur un second dépôt synthétique avec deux commits et des modifications autorisées et privées, un paquet filtré avec les seules versions du fichier autorisé conserve le point de divergence et produit le même diff Git sur ce fichier ; le contenu privé synthétique reste absent. Ce résultat concerne Git CLI, pas le scanner Sonar ni les dépôts réels. Une décision humaine est demandée sur l'exposition des métadonnées ; la construction et l'essai du scanner restent à faire.

L'humain répond « Oui, examiner cette solution » à la proposition d'examiner une copie Git filtrée exposant noms de fichiers, messages et identités, sans connaissance des données transmises. Expérience reproductible : `python3 -m unittest codebase-integrity/domaines/fiabilite-verifications/tests/test_sonar_git_metadata.py` ; 2 tests réussis sur un dépôt synthétique. Le point de divergence, le diff et l'attribution Git des lignes correspondent ; les deux contenus privés synthétiques restent absents, y compris lors d'une lecture depuis Bubblewrap. Les noms exclus et identités restent accessibles. Le prototype `sonar_git_preview.py` n'est pas raccordé au scanner ni à la CI : il copie aussi les versions historiques des fichiers autorisés, dont la sensibilité doit être considérée. La compatibilité JGit/Sonar, les objets nécessaires, les dépôts complexes et les données réellement transmises sont inconnus ; aucun accès distant ou scanner réel exécuté.

La copie filtrée est maintenant raccordée au scanner simulé pour les PR de confiance ; aucune analyse réelle n'est lancée. Après identification du risque d'accès aux services réseau locaux, Bubblewrap utilise aussi un espace réseau isolé. Les 13 tests ciblés passent hors du bac à sable de l'agent ; dans celui-ci, cinq tests sont ignorés car la création de l'espace réseau est refusée. Une sortie réseau confinée vers SonarQube reste à concevoir et vérifier : l'espace isolé n'a actuellement aucune route vers le service. Les étapes CI de téléchargement et d'analyse restent désactivées. Les anciens résultats de scanner simulé mentionnés plus haut concernaient une isolation des fichiers sans isolation réseau.

Recherche locale : aucun dispositif de sortie réseau filtrée réutilisable n'a été trouvé dans les chemins d'infrastructure et de contrôles examinés ; `socat` est présent sur cette machine, sans preuve de sa présence en CI. Une piste serait un relais éphémère accessible depuis l'espace réseau isolé par une socket Unix privée, qui n'autorise que des connexions TLS vers les hôtes Sonar nécessaires et refuse les adresses locales ou privées après résolution. La liste des hôtes réellement nécessaires, la protection contre les redirections et la compatibilité des téléchargements du scanner restent à établir. Une simple configuration de proxy ne prouve pas le confinement : la sandbox doit empêcher toute sortie directe. Les tests avec relais ou service relèvent d'une exécution humaine guidée ; aucun relais n'a été démarré ni développé à ce stade.

La [documentation réseau SonarQube Cloud](https://docs.sonarsource.com/sonarqube-cloud/appendices/networking-requirements) cite pour la région UE `sonarcloud.io`, ses sous-domaines et un hôte S3 de cache ; la [documentation d'installation](https://docs.sonarsource.com/sonarqube-cloud/analyzing-source-code/scanners/sonarcloud-extension-for-azure-devops) mentionne aussi `binaries.sonarsource.com` pour télécharger certaines versions. Ces indications ne prouvent pas que tous ces hôtes sont nécessaires à ce projet ni que son instance est en UE. Le scanner met à jour ses analyseurs : leur téléchargement, l'hôte S3 et les éventuelles redirections devront être vérifiés sans élargir automatiquement les destinations autorisées.

Un prototype isolé de politique de destinations, `sonar_egress_policy.py`, accepte uniquement HTTPS pour les hôtes Sonar Cloud UE et son hôte de cache documenté, sous réserve que toutes les adresses résolues soient publiques. Les 3 tests ciblés de `test_sonar_egress_policy.py` réussissent après correction d'un cas invalide détecté par le premier lancement. Aucun DNS, relais ni connexion n'a été testé ; la politique n'est pas raccordée au scanner et ne prouve aucun confinement. Pour empêcher une résolution modifiée entre vérification et connexion, le futur relais devra se connecter à l'adresse validée sans nouvelle résolution.

Un relais CONNECT éphémère a ensuite été préparé : socket Unix privée, vérification du nom, du port et des adresses, puis connexion à une adresse déjà vérifiée. Le scanner isolé peut y accéder via `socat` dans son espace réseau. Les 19 tests ciblés sans service réussissent ; ils vérifient notamment l'analyse des requêtes, les destinations, les adresses et le scanner simulé, sans exécuter le relais comme service. La vérification réelle du relais est manuelle, sans Sonar ni token : depuis la racine du worktree DevOps, avec Python 3, Git, Bubblewrap, `socat` et espaces de noms utilisateur/réseau fonctionnels, lancer `python3 codebase-integrity/domaines/fiabilite-verifications/tests/manual_sonar_relay.py`. Résultat attendu : 2 tests réussis, sortie `OK`. Le serveur local est fictif ; sa résolution est expressément simulée pour tester le chemin autorisé. Le test vérifie également le refus d'une destination locale et l'absence d'accès direct au serveur depuis la sandbox. Résultat manuel en attente ; la commande réelle et la CI restent désactivées.

Le 2026-11-22, l'humain rapporte l'exécution de cette commande : `Ran 2 tests in 1.696s`, `OK`. Ce résultat prouve les deux scénarios synthétiques du relais ; il ne prouve ni une analyse Sonar réelle ni le fonctionnement GitHub.

Suite à ce résultat, la commande locale et les étapes CI ont été raccordées au relais. Le Git filtré donne accès aux métadonnées et versions historiques indiquées dans la demande. Le scanner officiel et GitHub n'ont pas été exécutés. Le journal local est privé, avec masquage du token connu et limite de 4 Mio ; il peut contenir des métadonnées et reste à supprimer manuellement au besoin.

Contrôles ciblés après raccordement : 20 tests Python réussis hors bac à sable de l'agent, 63 tests Vitest du contrat CI réussis en 17,38 s, registre cohérent, syntaxe du script manuel correcte. Après ajout des journaux et adaptation du relais, l'humain a relancé `python3 codebase-integrity/domaines/fiabilite-verifications/tests/manual_sonar_relay.py` : `Ran 2 tests in 1.698s`, `OK`. Le test réel Sonar reste manuel et n'a pas été réalisé.

Contrôle négatif local avec scanner absent et token factice : message « analyse non réalisée » et échec de la commande `make` observés, comme attendu. En CI, le workflow restitue ce cas par un avertissement informatif sans bloquer la PR ; aucun succès d'analyse n'est déduit du statut du workflow.

## Verdict humain

Verdict explicite « validé » dans la session `01a211b5-0ab6-7733-9516-b83103d91b22`.

```verdict-json
{
  "decision": "validé",
  "portee": "DEM-017, OPS-046 — Raccordement local et CI, confinement et preuves sur scanner simulé et relais factice. Scanner officiel, exécution GitHub et réglages distants à vérifier. Le Git filtré conserve des métadonnées et l’historique des fichiers retenus. Les PR du même dépôt sont traitées comme fiables.",
  "contenu": {
    "type": "git",
    "valeur": "f2408017336398fb53fe42accb84597186a96912"
  }
}
```

## Commits

- Implémentation examinée : `f2408017336398fb53fe42accb84597186a96912`.

## Configuration locale dans VS Code

Le correctif approuvé pour implémentation ajoute une tâche VS Code qui lance le scanner depuis la racine ouverte dans l’éditeur. Les champs `SONAR_ORGANIZATION`, `SONAR_PROJECT_KEY` et `SONAR_TOKEN` sont déclarés dans `webapp/.env.example`. Le lanceur lit leur valeur dans `webapp/.env` en local et déduit la branche Git courante. Les variables explicites conservent la priorité et GitHub Actions utilise sa configuration dédiée. Les fichiers d’environnement privés restent intacts.

Chemins ponctuellement autorisés pour cet ajout : `.vscode/tasks.json` et `webapp/.env.example`, en plus des scripts, tests et brouillon documentaire déjà rattachés à la carte.

Depuis la racine DevOps, les suites ciblées `test_sonar_run.py`, `test_sonar_scope.py`, `test_sonar_egress.py` et `test_sonar_egress_policy.py` réussissent leurs 22 tests avec `python3 -B -m unittest`, dont le scanner factice en isolation. Le JSON de la tâche, les champs du modèle et la syntaxe Bash ont été vérifiés. L’exécution depuis VS Code avec le scanner réel reste à vérifier. Verdict humain « validé » dans la session `01a211b5-0ab6-7733-9516-b83103d91b22`, pour le correctif `7879cc627d092edd1f2c103cbc48e18c102b105a`.

## Lancement local par Make

L’humain choisit `make third-party-tests-sonar` pour l’analyse réelle. La cible réutilise les trois champs du fichier local et la détection de la branche Git. En local, elle prépare le scanner officiel si aucun scanner n’est fourni. En CI, elle utilise le scanner préparé par le workflow. Le modèle et le brouillon du guide décrivent le parcours Make. La tâche VS Code introduite par le correctif précédent est retirée.

Depuis la racine DevOps, les quatre fichiers de tests Sonar déjà ciblés réussissent leurs 23 tests avec `python3 -B -m unittest`. Le nouveau cas utilise deux scripts factices et vérifie le routage Make pour le poste local, le scanner préinstallé et GitHub Actions. `bash -n webapp/scripts/quality/manual_sonar_cloud.sh` et `make -n third-party-tests-sonar` réussissent. L’essai réel de la cible reste à effectuer. Verdict humain « validé » dans la session `01a211b5-0ab6-7733-9516-b83103d91b22`, pour le correctif `b513e232b3a0106fa1266955241e1830a8261324`.

## Suivi de la soumission SonarQube

La sortie locale annonce le téléchargement du scanner, le projet, la branche et le nombre de fichiers préparés. Après dépôt du rapport, elle affiche le tableau de bord ciblé et le lien de suivi de la tâche SonarQube Cloud, à partir de l’identifiant lu dans le rapport. L’identifiant ne peut contenir que les caractères admis par le format attendu. Le journal détaillé reste privé.

Les quatre fichiers de tests ciblés réussissent leurs 24 tests avec `python3 -B -m unittest` sur DevOps, avec scanner factice. Les cas du rapport absent, du lien symbolique, de l’identifiant non conforme et du masquage du token restent couverts. La syntaxe du lanceur Bash et le diff passent. Verdict humain « validé » dans la session `01a211b5-0ab6-7733-9516-b83103d91b22`, pour le correctif `f8986efc682f4dd20ba341dd1429f78b0647fee0`.
