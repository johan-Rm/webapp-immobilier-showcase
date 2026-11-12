---
blueprint_source: /app/docs/blueprints/modern-webapp-nuxt/directory-structure/scripts/README.md
blueprint_copied_at: 2026-01-22T13:03:48+00:00
---

`setup-local.ts` prépare les données fictives et `.env` sans API ni secret hérité.
Il refuse d’écraser des données non fictives. `run-schema-hook.mjs` génère les
contrats YAML locaux. Lancer `bun run setup:local` après installation.

Le contrôle `check:app:types` applique la règle de placement aux types manuels.
Les dossiers de contrats générés sont déclarés dans
`codebase-integrity/domaines/architecture-dependances/regles.yaml` (`generatedTypesDirs`) et restent dans leur couche
`schemas/`. Les doublons et imports de types manuels continuent d'être contrôlés.

`content-sync.ts` synchronise aussi le bloc `i18n` de `content/fr/ui/app.yaml`
depuis les langues du projet Symfony. Les champs éditoriaux existants sont
conservés. Publication après réussite ; aucune écriture en `--dry-run`.
Le filtre `--locale=` porte sur les contenus, pas sur la liste complète des langues.

Les scripts de contenu et de médias suivent `GD_TARGET`, comme Nuxt. Les chemins
et surcharges sont décrits dans [le guide des layers](../../docs/2.architecture/14.site-layers.md).

La composition accepte aussi `GD_TARGET=dashboard` : la layer `dashboard/` doit fournir
`site.ts`, `nuxt.config.ts` et son application. Ses sorties `dashboard/.nuxt` et
`dashboard/.output` restent distinctes des sites. `GD_TARGET=dashboard bun run type-check`
sélectionne les types préparés de cette cible ; `bun run build` utilise la même variable.
La cible se fixe à la construction, jamais selon Host. Le hook génère également le DTO Article.
Le dashboard active explicitement les seuls handlers `server/api/saas/**/*.METHOD.ts`
avec leurs méthodes et paramètres ; ni routes historiques Showcase ni plugins serveur globaux.
Une source SaaS absente ou symbolique fait échouer sa préparation. Les sites conservent leurs
répertoires serveur ; ce raccordement ne dépend jamais de Host.

## Projection publiée SaaS — Client 2

`bun --no-env-file scripts/saas/project.ts --dry-run|--once|--watch` consomme exclusivement la
file BFF `/api/saas/projects/<UUID>/publication/queue` et accuse sa génération sur
`/publication/ack`. Aucun appel d’écriture Symfony. `--watch` réessaie toutes les
cinq secondes. Le résultat JSON, sans secrets, indique `idle`, `dry-run`, `applied`,
`ack-pending` ou `failed` ; un accusé manquant fait échouer l’exécution ponctuelle.

Configuration privée explicite, sans lecture automatique des `.env` :

| Variable                        | Valeur attendue                                                  |
| ------------------------------- | ---------------------------------------------------------------- |
| `SAAS_PROJECTION_PROJECT_ID`    | UUID du seul projet pilote autorisé pour Client 2                |
| `SAAS_PROJECTION_SECRET`        | Secret worker partagé avec le BFF, au moins 32 caractères        |
| `SAAS_DASHBOARD_URL`            | Origine de transport du BFF, sans chemin                         |
| `SAAS_DASHBOARD_ORIGIN`         | Origine publique du dashboard, pour les accusés                  |
| `SAAS_PROJECTION_SOURCE_ORIGIN` | Origine Symfony exacte renvoyée par le BFF                       |
| `SAAS_PROJECTION_ROOT`          | Facultatif : `.data/saas-projection`, strictement dans `webapp/` |

Le BFF doit associer cet UUID à `client2-immobilier` dans sa configuration privée
`SAAS_PUBLICATION_PROJECTS`. Ni cible ni destination ne viennent du payload.
Le worker refuse liens symboliques, traversées, projets étrangers, générations
antérieures et changements d’une génération déjà appliquée. Images : uniquement
`/images/` à l’origine configurée, sans jeton ni redirection, MIME et signature
contrôlés, limite de 12 Mio chacune. Le SHA-256 porte sur les octets effectivement
téléchargés, y compris après watermark.

Contrat de lecture WEB-005 : `client2-immobilier/current.json` sous la racine
contient `{schemaVersion:1,projectId,target,generation,version,release}`. `release`
vaut `g<generation>-<version>` ; `version` est le SHA-256 de
`releases/<release>/manifest.json`. Ce manifeste contient les articles publics,
les index `{fr,en,es}` de `{id,slug,snapshotId}`, la génération, `sourceVersion`
et les médias `{id,path,mimeType,sha256,bytes}`. Les schémas stricts de
[saas/contract.ts](saas/contract.ts) font référence. Les médias relatifs restent
dans cette release ; leurs noms permettent un cache immuable. Le lecteur capture
le pointeur une seule fois par requête ; pointeur et réponses éditoriales doivent
être revalidés. Les anciennes releases restent disponibles pour les requêtes en
cours ; leur nettoyage est hors périmètre.

Chaque génération est vérifiée et synchronisée sur disque avant renommage atomique
du pointeur ; la file est relue avant activation. La dépublication retire article,
langue, index et SEO de la nouvelle release ; le lecteur utilise uniquement la
release courante. Un échec avant activation conserve la précédente. Une interruption
après activation ou avant accusé se reprend sans nouvelle publication. Une release
complète abandonnée avant bascule est vérifiée et réutilisée. Le verrou exclusif
empêche deux workers d’écrire ensemble. Après arrêt brutal, inspecter
`.projector.lock/owner.json`, arrêter les workers et confirmer l’absence du processus
avant retrait manuel du seul verrou ; aucun déverrouillage automatique.

L’extension Compose dashboard ajoute un worker optionnel sous profil
`saas-projection`, sans démarrage implicite. Avant le démarrage dashboard, préparer explicitement le dossier
`webapp/.data/saas-projection` avec `make dev-saas-project-prepare` dans la couche ; seul le worker le monte en écriture,
Client 2 le monte en lecture seule. Les commandes refusent les liens symboliques ;
Compose refuse de créer automatiquement ce dossier sur l’hôte. Le dashboard conserve ses données privées dans
`.data/dashboard`. Exporter les variables privées au shell ou les renseigner
volontairement dans l’environnement local ; aucun secret n’est copié. Commandes :
`make dev-build-saas-projector`, `make dev-saas-project`, `make dev-saas-project-watch`.
`make dev-saas-project-dry` utilise Bun natif et les origines exportées : aucun
conteneur, dossier, téléchargement d’image ou accusé. Affecter explicitement le
projet de test avant tout parcours réel. L’activation des handlers SaaS du dashboard
et le lecteur public Client 2 restent des intégrations distinctes, non prouvées ici.
