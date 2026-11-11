# Worktrees de couche

Créer une copie uniquement pour une mission affectée, avec une base explicite :

```bash
make worktree-add LAYER=web BASE=develop
make worktree-list
```

Le créateur ne lance pas de services et ne copie aucun secret. Une relance réutilise la branche déjà sortie et conserve les fichiers. Les dossiers occupés ou étrangers sont refusés.

Le routage des missions est défini dans [AGENTS.md](../AGENTS.md#conventions-de-workflow).

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
19301–19304 et SSR 19401–19404. Le nom Compose associe projet, empreinte du dépôt
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
