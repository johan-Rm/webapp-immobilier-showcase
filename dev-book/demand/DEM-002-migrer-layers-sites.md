# DEM-002 — Migrer la webapp vers des layers clients

- Type : développement
- Session de création et de reconstitution : 01a1c16c-2085-7141-83fa-3460f6bd4463
- État : code intégré avec DEM-003 ; récupération de la trace documentaire historique
- Branche historique : `demands/DEM-002` ; suivi documentaire : `docs/DEM-002-cloture`
- Worktree : `/home/johan/www/graines-digitales/modern-web-apps/showcase-immobilier`
- Base locale vérifiée et branche de retour après fusion : `develop`, `1ae0ce888dc80f04640abd47f508b6ec80fa50fb`

## Besoin et décisions

Migrer ce dépôt vers des layers clients, sur une branche dédiée et sans délégation.
Nuxt Builder sert uniquement de référence. Le socle immobilier et le dashboard
restent communs ; chaque client possède ses contenus et médias, avec une cible
par build. Conserver les URL et fonctionnalités existantes.

Ce premier lot conserve les screens dans l’application commune. Leur extraction
et l’isolation complète de Showcase relèvent de DEM-003.

## Critères et cartes

Une carte sans dépendance : [OPS-002](../tasks/OPS-002-migrer-layers-sites.md).
Elle porte les critères, preuves, limites et le verdict humain du premier lot.
Architecture durable : [layers clients](../../docs/2.architecture/14.site-layers.md).

## Vérification et livraison

Reconstitution le 2026-11-10 depuis la branche source `feat/nuxt-site-layers`,
propre et affectée à cette même demande. Les deux commits validés ont été repris
avec `cherry-pick -x`, sans conflit. Le contenu suivi obtenu est identique à celui
de la branche source avant matérialisation de cette demande.

`make aide-check` réussit après matérialisation : registre, demandes, liens
documentaires et 108 tests Python. Les contrôles applicatifs et leurs limites
restent ceux du lot validé, référencés dans OPS-002 ; ils ne sont pas réexécutés
à cette étape, le contenu applicatif étant identique.

| Commit source validé | Commit reconstitué |
| --- | --- |
| `ddab1c01092cbe9c9d8f99b72b00ee01c5e09818` | `34b4436e225249880ccc629c38a808bdef51e429` |
| `6f4ebb114a9e856e762690b46425e11f5df65796` | `f16fb4aada56f9bc78440fe312639bc0fd67b089` |

Le brouillon local est conservé dans `tmp/demande-layers-sites.md`. Les worktrees
Web et Devops portent DEM-003 et restent inchangés. Aucun push, PR ou fusion
effectué à cette étape. Le document définitif reste à commiter lors de la livraison.

Tentative de livraison du 2026-11-10 : authentification GitHub disponible et
`git fetch origin` réussi. Le remote effectif est
`git@github.com:johan-Rm/webapp-immobilier-showcase.git` ; la cible distante
`origin/develop` vaut `d1323571dc8f8c2025f8d18f4cc794f2a33bd5f1`.
La plage complète inclut aussi quatre commits locaux antérieurs à DEM-002 :
`29eabc3`, `c365b4a`, `55c3841`, `1ae0ce8`. Leur livraison préalable reste à établir.

Les commandes `bun run check:app:images`,
`bun run check:app:script-setup-standard` et `bun run check:app:code-quality`,
requises par le workflow conventions, ont chacune retourné le code 1 sur la
branche reconstituée. Résultats détaillés locaux :
`/tmp/dem002-delivery-images.log`, `/tmp/dem002-delivery-script.log` et
`/tmp/dem002-delivery-code.log`. Les limites historiques décrites dans OPS-002
ne dispensent pas de ces contrôles de livraison. Aucun contournement, push, PR
ou fusion ; les couches occupées par DEM-003 restent préservées.

## Suivi après intégration avec DEM-003

Le 2026-11-11, la [PR #2](https://github.com/johan-Rm/webapp-immobilier-showcase/pull/2)
a intégré le code de ce premier lot avec DEM-003, par Rebase and merge, dans
`1708493f186a8aa42d26e1c18cb80756c6ce5f7c`. Les blocages décrits ci-dessus
concernent la tentative historique du 2026-11-10, pas le résultat intégré.
La demande [DEM-003](DEM-003-isoler-sites-et-screens.md) conserve les décisions
et correctifs de cette livraison directe, sans livraison séparée de DEM-002.

Le seul contenu inédit de la branche historique était cette demande au commit
`048ce55962e6d89d9a8d8e4bb1c3ee93388c2a79`. Il est récupéré par cherry-pick
avec provenance avant suppression de la branche. Aucun code applicatif modifié.
La session d’origine est conservée ; la reprise appartient à la même session.
