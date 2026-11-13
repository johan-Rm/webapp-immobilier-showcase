# Codebase Integrity

## Rôle et responsabilités

- Vérifier les conventions de contribution et les traces des demandes.
- Préparer des worktrees et des environnements locaux isolés.
- Tester les vérificateurs dans des dépôts jetables, sans remote.

## Conventions techniques

### Contributions

- L’intégration est `develop` ; la production est `master`. Une contribution utilise une branche dédiée.
- Une demande déclare un seul type : `développement` ou `consolidation`.
- Une carte validée produit un commit `type(CARTE-NNN): résultat`, avec `Demande : DEM-NNN` dans le corps. Le scope `DEM-NNN` est réservé aux traces documentaires (`docs`).
- Une contribution de développement ne modifie pas `codebase-integrity/`. Les modifications des conventions et des contrôles passent par la consolidation.
- Une consolidation déclare chaque chemin modifié, sa convention et un contrôle ajouté ou modifié ; les accompagnements sont justifiés séparément. Les demandes et cartes référencées sont les traces exemptées de cette déclaration.
- La plage contrôlée est explicite ; les anciens commits hors plage ne sont pas contrôlés rétroactivement. Les commits de fusion sont refusés dans une contribution.
- Le vérificateur local de contribution est extrait de la base d’intégration, jamais remplacé par le candidat. L’amorçage local exige un SHA complet explicitement approuvé via `--bootstrap-policy-sha`, depuis la base initiale de DEM-001.
- Ne pas modifier un contrôle pour contourner un échec. Les preuves techniques ne valent pas validation humaine.

### Worktrees et environnements

- Les couches et leurs préfixes de cartes, dont `DASH` pour Dashboard, sont déclarés dans [la configuration](../infra/config/layers.json) ; leurs identifiants restent stables. Le routage retient le chemin correspondant le plus long : les tests dédiés exacts priment sur le dossier général de Web.
- Un seul écrivain par couche ; les affectations se vérifient dans les cartes, pas seulement avec Git.
- Créer les worktrees sur affectation, depuis une base explicite. Aucun fetch, service ou copie de secrets lors de la création.
- Réutiliser la branche déjà sortie ; refuser les destinations étrangères, liens symboliques et chemins non enregistrés avant toute écriture.
- Les environnements propres à chaque worktree ont leurs ports, noms Compose, caches, contenus, médias et données. Une relance préserve les fichiers locaux.
- Refuser les chemins de données sortant du worktree et les liens symboliques dans ces destinations.
- Une API Symfony externe n’est pas isolée par Git : son accès en écriture exige une affectation explicite et un projet de test dédié.
- Tester l’outillage dans des dépôts temporaires ; ne jamais réinitialiser le dépôt utilisateur pour un test.

### Contrôles existants

Les conventions Nuxt restent définies dans les README applicatifs et les [standards d’architecture](../docs/2.architecture/index.md). Leurs vérificateurs et leurs tests sont regroupés sous `codebase-integrity/domaines/`, sans duplication.

Les contrôles frontend découvrent tous les fichiers Git de `app/`, des
`sites/<client>/app/` et de `base/real-estate/`, y compris les clients inactifs.
Les scopes composants, pages, layouts et composables restent distincts. L’exception
image concerne seulement `components/AppImage.vue` à la racine d’une application ;
un fichier homonyme dans le catalogue ou un sous-dossier reste contrôlé.
Les alias frontend des imports de types se résolvent dans l’application du fichier ;
ceux du catalogue, provisoirement consommé par Showcase seul, ciblent son application.

Le créateur refuse une base sans les fichiers requis par `requireBasePaths`,
notamment le regroupement `webapp/` et la configuration des couches.

### Classement des conventions

- Chaque convention recensée appartient à un seul domaine et référence le chapitre `Conventions techniques` de son README source. Ne pas recopier sa règle dans le registre.
- Le [registre central](conventions.json) référence les points de contrôle, leur état (`implémenté` ou `à implémenter`), leur mode et leurs limites.
- Un contrôle implémenté n’est pas une preuve que la convention passe ; les résultats sont consignés dans les cartes. Une détection nécessitant une revue humaine reste explicitement qualifiée.
- Un domaine sans entrée signifie qu’aucune convention n’y est encore recensée, pas que ce domaine est conforme. L’inventaire initial n’est pas exhaustif.
- Une évolution des règles, de leur classement ou de leurs contrôles suit la consolidation.

## Organisation

`domaines/<domaine>/scripts/` contient les vérificateurs ; `tests/` leurs tests,
et `regles.yaml` les paramètres des conventions lorsqu’ils existent. Seuls les
cinq domaines disposant de contrôles ont un dossier. Aucun README n’est créé
dans ces sous-dossiers. `commun/` accueille les utilitaires utilisés par plusieurs
domaines. Les tests des fonctionnalités Nuxt restent dans `webapp/`.

Installer les dépendances des contrôles avec `bun install --frozen-lockfile`
depuis `codebase-integrity/`, puis lancer `bun run test`. `make aide-check`
vérifie le registre et les tests Python ; les tests TypeScript des vérificateurs
sont également exécutés par la CI AIDE. Les anciennes commandes `check:*` du
paquet webapp délèguent au paquet Codebase Integrity.

## Commandes de contrôle

- `make integrity-domains` : vue centrale des conventions par domaine.
- `make aide-check` : registre, demandes, liens documentaires et tests Python de l’outillage.
- `make contribution-check BASE=<sha-cible> HEAD=<sha-candidat>` : contrôle des objets Git avec les vérificateurs extraits de la base, sans exécuter le code applicatif candidat.
- `make quality-conventions-check` : conventions Nuxt dans Docker, avec les limites de revue humaine déclarées.

Depuis `webapp/`, exécuter aussi `bun run quality:check` et `bun run test`.
La portée du contrôle documentaire est définie dans [docs/README.md](../docs/README.md#conventions-techniques).
Les commandes des environnements isolés sont dans [worktree/README.md](../worktree/README.md).

Le workflow AIDE exécute les tests TypeScript et Bun des vérificateurs puis
`make aide-check`, sans variable d’amorçage ni étape distante de contrôle de
contribution. Le contrôle local `make contribution-check BASE=<sha>` reste
disponible et conserve ses restrictions. Cette divergence avec la référence AIDE
est explicitement autorisée et tracée dans DEM-003 ; les contrôles applicatifs
restent actifs.
