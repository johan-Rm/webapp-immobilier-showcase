# Worktrees de couche

Créer une copie uniquement pour une mission affectée, avec une base explicite :

```bash
make worktree-add LAYER=web BASE=develop
make worktree-list
```

Le créateur ne lance pas de services et ne copie aucun secret. Une relance réutilise la branche déjà sortie et conserve les fichiers. Les dossiers occupés ou étrangers sont refusés.

Le routage des missions est défini dans [AGENTS.md](../AGENTS.md#conventions-de-workflow).

Depuis la racine, sans changer de dossier :

```bash
make lane-status
make lane-status web
make lane-up web
make lane-logs web
make lane-rebuild web
make lane-down web
make demands
make tasks
make tasks DEM-006
```

Les commandes de services ciblent le worktree Git enregistré de la couche déclarée
selon [la configuration des couches](../infra/config/layers.json). `up` démarre le
serveur avec rechargement automatique ; `rebuild` reconstruit et recrée ce service.
Un environnement absent ou incohérent provoque un diagnostic avec la préparation
à lancer : aucune création automatique. Une seule action et un seul argument sont
acceptés ; ne pas combiner l’argument positionnel avec `LAYER`. Les anciennes formes
`make lane-up LAYER=web` et les appels depuis le worktree restent utilisables.
L’arrêt conserve les données ; les logs suivent toute la pile jusqu’à Ctrl+C.

`demands` et `tasks` lisent le tmp du principal, les demandes versionnées et les
cartes de tous les worktrees locaux, y compris les cartes non commitées. Les copies
équivalentes sont regroupées avec leurs chemins sources. Les états partiels,
contradictions et sources manquantes restent visibles. Une clôture explicite exclut
la demande de la vue courante malgré les anciens états « à livrer » ; le filtre
`tasks DEM-NNN` permet aussi de consulter une demande déjà livrée. Sans preuve de
clôture reconnue, la demande reste affichée avec son état déclaré, à examiner.
Ces vues ne modifient aucun état et n’effectuent aucun fetch.

`lane-status` affiche toutes les couches déclarées ou celle passée en argument :
branche et HEAD, changements indexés/non indexés/non suivis, conteneurs Compose et
cartes des demandes sans clôture reconnue. Les chemins sources et contradictions
restent visibles. Sans carte identifiée, la disponibilité reste inconnue.
Cette lecture fonctionne sans `.env` ; elle ne crée rien et n’effectue aucun fetch.
Les projets Docker attendus sont calculés selon l’identité isolée du dépôt et de
la couche. Un conteneur arrêté reste visible ; un projet absent et un daemon
inaccessible sont distingués. Les conteneurs portant un nom de projet personnalisé
hors de cette convention ne sont pas attribués automatiquement à une couche.

Depuis le worktree affecté :

```bash
make lane-env LAYER=web
make lane-setup LAYER=web
make lane-up LAYER=web BUILD=1
make lane-check LAYER=web
make lane-down LAYER=web
```

`lane-env` prépare un `.env` neuf depuis le modèle versionné et un secret aléatoire,
sans copier les identifiants du principal. Il crée les dossiers locaux avant Docker ;
une relance conserve les fichiers. `lane-setup` prépare explicitement la démonstration.

Les identifiants de `infra/config/layers.json` donnent les ports de développement
19301–19305 et publics 19401–19405. Le nom Compose associe projet, empreinte du dépôt
principal et couche. Les deux modes d’une couche partagent ses données ; les couches
ont des contenus, médias, données et rapports distincts. Les schémas source sont
montés en lecture seule. Ne pas partager les dossiers générés ou les données en écriture.

`lane-check` vérifie la configuration locale, sans garantir la disponibilité des ports
ni le fonctionnement des services. `lane-down` conserve les données.
L’API Symfony reste extérieure : les écritures exigent un projet de test explicitement affecté.

Pour vérifier deux piles avec une image locale existante, sans téléchargement ni construction :

```bash
make aide-runtime-check IMAGE=showcase-immobilier-dev-webapp-localhost:latest
```

Le contrôle utilise un snapshot temporaire sans les `.env` locaux, lance Web et BFF,
compare leurs réponses et écritures, puis arrête ses conteneurs. Il conserve le snapshot
en cas d’échec pour diagnostic et le supprime en cas de succès.

Les deux sites SSR d’une couche utilisent son même port public isolé, distingués
par les domaines du [guide des layers](../docs/2.architecture/14.site-layers.md).
`make dev-check-ssr` découvre ce port auprès du Nginx de la pile courante.

Pour le SSR, après `lane-env` et `lane-setup`, lancer depuis le worktree affecté :

```bash
make dev-webapp-ssr BUILD=1
# Dans un autre terminal du même worktree :
make dev-check-ssr
# Arrêt, en conservant les données :
make lane-down LAYER=web
```

Adapter LAYER à la couche affectée. Sans `BUILD=1`, les images existantes sont réutilisées.
Le dossier `worktree/design` est réservé vide, sans branche, configuration de couche,
service ni vhost. Git ne conserve pas un dossier vide : sa présence locale n’est
pas reproduite par un clone ; le recréer vide si nécessaire.

Dashboard possède désormais son périmètre frontend et ses tests dédiés dans la
configuration ; l’affectation temporaire à Web de DEM-005 prend fin sans modifier
les cartes historiques. Son worktree sera créé après validation des cartes de
configuration et de services de DEM-007. `devComposeFile` et `devServices` déclarent
sa composition de développement ; leur prise en charge reste à réaliser dans OPS-019.
Sans ces champs, les commandes conservent `infra/docker/docker-compose.dev.yml`
et le service `webapp-localhost`.
