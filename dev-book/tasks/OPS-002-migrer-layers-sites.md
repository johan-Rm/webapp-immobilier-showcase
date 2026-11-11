# OPS-002 — Composer le socle immobilier et les layers clients

- Demande : DEM-002 ; brouillon `tmp/demande-layers-sites.md` dans le principal
- Type : développement
- Session de création : 01a1c16c-2085-7141-83fa-3460f6bd4463
- Couche : mission transverse autorisée par l’utilisateur, sans délégation
- Branche : feat/nuxt-site-layers
- Worktree : /home/johan/www/graines-digitales/modern-web-apps/showcase-immobilier
- État : code intégré avec DEM-003 le 2026-11-11
- Chemins autorisés : webapp/, infra/docker/, docs/, README.md, .gitignore, cette carte
- Dépendances : aucune ; base 1ae0ce888dc80f04640abd47f508b6ec80fa50fb

## Résultat et critères

Composer une seule layer client avec le socle commun ; conserver le site et le
dashboard existants. Prouver la surcharge des pages, la sélection exclusive des
contenus/médias et le fonctionnement SSR autonome. Les identifiants invalides ou
inconnus doivent échouer. Préserver les secrets et données locales.

## Réalisation et preuves

Avant migration : 10 fichiers de tests, 61 tests passent ; type-check de la base
réussie dans une copie temporaire sans secrets. Le dépôt et l’index étaient propres.
Les contenus et photos ont été déplacés intégralement, sans régénération.

| Vérification                             | Résultat                                                                                                                      |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `bun run quality:check` depuis `webapp/` | lint, format et types réussis                                                                                                 |
| `bun run test`                           | 11 fichiers, 66 tests réussis                                                                                                 |
| `bun run build`                          | build SSR réussie ; seule la cible historique est embarquée                                                                   |
| Smoke Playwright desktop et mobile       | 2 réussis, dans l’image locale `showcase-immobilier-dev-playwright:latest`                                                    |
| `make aide-check`                        | registre, documentation et 108 tests Python réussis                                                                           |
| `docker compose ... config --quiet`      | dev, préproduction et production valides ; aucun déploiement                                                                  |
| HTTP du SSR lancé depuis `/tmp`          | 200 pour `/fr`, `/en`, `/es`, login dashboard, contenu, thèmes CSS/JSON et image IPX                                          |
| Seconde layer temporaire                 | accueil surchargé, marque, contenu et fichier public propres ; cible retirée ensuite                                          |
| Identité compilée                        | `GD_TARGET=client-inexistant` au runtime ne change pas le client construit ; cette même valeur est refusée par `nuxt prepare` |
| Préservation                             | 244 fichiers déplacés identiques byte à byte à Git ; 686 fichiers images locaux conservés, aucun `.env` modifié               |

La vérification navigateur locale directe a échoué avant lancement (version de
Chromium absente, puis bibliothèque `libnspr4.so` absente avec le binaire disponible).
L’image Docker déjà installée a permis les deux smoke tests sans téléchargement.
Le SSR final a été lancé sur `127.0.0.1:19571`, hors du dépôt et sans accès à ses
sources de contenu via le cwd : le packaging autonome a bien été utilisé.
Les serveurs de vérification et la cible temporaire sont arrêtés/retirés en fin de mission.

Conventions existantes : types, absence d’import framework dans les services et
contrôles à revue humaine exécutés. Trois contrôles bloquants échouent également
sur la base intacte : images (3 violations), structure script setup (41) et qualité
(3 ternaires imbriqués). Après migration, le contrôle images n’en voit plus qu’une :
il ne couvre pas les deux `<img>` historiques déplacés avec la page Villa des Alizés.
Cette baisse ne constitue pas une correction. Les contrôles et conventions n’ont
pas été modifiés ; étendre leur portée aux nouvelles layers relève d’une consolidation.
Les autres alertes de revue humaine restent à examiner ; aucune validation inventée.

Limites : les images Docker applicatives n’ont pas été reconstruites ; les configurations
Compose sont validées et le SSR Node et navigateur sont testés. Aucun appel d’écriture
à l’API Symfony, aucun email envoyé. Les anciens volumes explicites de déploiement
peuvent nécessiter une mise à jour de chemin, décrite dans le guide.

Architecture : [layers clients](../../docs/2.architecture/14.site-layers.md).

## Verdict humain

Le 2026-11-10, l’humain confirme le lancement localhost : « ok ça tourne ».
Il valide le premier lot et demande son commit : « commit et définissons l’objectif
suivant ». Cette validation porte sur OPS-002 et conserve les limites de contrôles
rapportées ci-dessus. La migration complète reste progressive ; l’extraction des
screens appartient au prochain objectif.

## Commits

Implémentation validée : `ddab1c01092cbe9c9d8f99b72b00ee01c5e09818`.
Suivi de la reconstitution et de l’intégration : [DEM-002](../demand/DEM-002-migrer-layers-sites.md#suivi-après-intégration-avec-dem-003).
