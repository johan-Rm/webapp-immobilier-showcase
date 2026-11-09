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
- Le vérificateur de contribution est extrait de la base d’intégration, jamais remplacé par le candidat. L’amorçage de DEM-001 exige un SHA complet explicitement approuvé, depuis la base `c365b4a6059c915ff639ffface5fa01c29fd6b3c`.
- Ne pas modifier un contrôle pour contourner un échec. Les preuves techniques ne valent pas validation humaine.

### Worktrees et environnements

- Les couches sont déclarées dans `infra/config/layers.json` ; leurs identifiants restent stables.
- Un seul écrivain par couche ; les affectations se vérifient dans les cartes, pas seulement avec Git.
- Créer les worktrees sur affectation, depuis une base explicite. Aucun fetch, service ou copie de secrets lors de la création.
- Réutiliser la branche déjà sortie ; refuser les destinations étrangères, liens symboliques et chemins non enregistrés avant toute écriture.
- Les environnements propres à chaque worktree ont leurs ports, noms Compose, caches, contenus, médias et données. Une relance préserve les fichiers locaux.
- Refuser les chemins de données sortant du worktree et les liens symboliques dans ces destinations.
- Une API Symfony externe n’est pas isolée par Git : son accès en écriture exige une affectation explicite et un projet de test dédié.
- Tester l’outillage dans des dépôts temporaires ; ne jamais réinitialiser le dépôt utilisateur pour un test.

### Contrôles existants

Les conventions Nuxt restent définies dans les README applicatifs et les [standards d’architecture](../docs/2.architecture/index.md). Leurs vérificateurs et leurs tests sont regroupés sous `codebase-integrity/domaines/`, sans duplication.

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

Pour DEM-001, l’amorçage exige `AIDE_BOOTSTRAP_POLICY_SHA` égal au SHA complet
du contenu explicitement approuvé. Le regroupement `webapp/` déjà commité doit être
intégré séparément à `develop` avant la première livraison du cadre. Les contrôles de
contribution précèdent ceux de l’application en CI ; leur présence ne prouve pas
l’activation des protections distantes. Les décisions et preuves restent dans DEM-001 et OPS-001.
