# DEM-004 — Définir les vhosts locaux par pile

- Type : développement
- Session de création et de reconstitution : 01a1ca55-428a-73c2-8ba4-240528dc1169
- Date : 2026-11-11
- État : livraison en cours ; contrôles avant PR
- Cadrage confirmé : « go », après restitution dans la session de création
- Branche : demands/DEM-004 ; worktree principal : `.`
- Base develop locale : `35d4a0636914b103b84afdf6efb01ffc0b25fea2`
- Retour du principal après fusion distante : develop

## Besoin et décisions

Les développeurs doivent identifier les deux sites et chacune des cinq piles locales
par des noms HTTP distincts, sans anciens alias ni site servi par défaut.
Les dix noms et ports confirmés figurent dans le
[guide des sites](../../docs/2.architecture/14.site-layers.md#construire-et-déployer),
référence unique des accès. `preprod` désigne le principal local.

Conserver les couches Web, BFF, Domaine et DevOps existantes, leurs ports et
l’isolation des données, secrets et services. Chaque Nginx accepte uniquement les
deux noms de sa pile ; tous les autres noms sont refusés en HTTP 421, sans redirection.
Préserver le développement direct sur localhost:3000 et les ports 19301–19304.
Actualiser configurations, sondes et documentation active ; conserver les traces historiques.

Créer seulement le dossier vide `worktree/design`, sans couche configurée, branche,
pile Docker ni vhost design. Git ne transporte pas ce dossier vide ; sa présence
locale et cette limite sont décrites dans le [guide des worktrees](../../worktree/README.md).
Aucun changement sur VPS, préproduction distante ou production. Préserver les .env,
les données et les services utilisateur. Aucune question de besoin ouverte.

Le découpage a retenu un gabarit Nginx paramétré et des tests isolés depuis le HEAD
commité, sans création de missions ou de worktrees BFF/Domaine. Les adaptations
restent dans infra, sans évolution de Codebase Integrity. Références examinées :
cadre AIDE (worktrees et contributions), nuxt-builder (une build par cible et Host
résolu au proxy) ; aucune nouvelle divergence requise. L’absence de l’ancre
`types-de-demandes` dans le dev-book local n’a pas conduit à modifier ses conventions.

## Critères et cartes

1. Les dix URL servent le site attendu, avec ses routes propres.
2. Les anciens noms, inconnus et noms d’autres piles sont refusés sans servir Showcase.
3. Les cinq ports de développement direct restent utilisables.
4. Configurations, contrôles et documentation active décrivent la nouvelle convention.
5. Le dossier design reste vide, sans service associé.
6. Les environnements distants, données et .env sont préservés.

| Carte | Couche | Dépendance de réalisation | Verdict |
| --- | --- | --- | --- |
| [OPS-008 — Routage](../tasks/OPS-008-router-vhosts-par-pile.md) | devops | base locale vérifiée | validée et commitée |
| [OPS-009 — Vérification et documentation](../tasks/OPS-009-verifier-et-documenter-vhosts-locaux.md) | devops | commit validé OPS-008 | validée et commitée |

OPS-008 a été validée par « ok c’est validé » ; OPS-009 par « validé », le 2026-11-11
dans la session de création. Leurs preuves et limites détaillées restent dans les cartes.
Le brouillon d’interview `tmp/demande-vhosts-locaux.md` est conservé localement, ignoré par Git.

## Vérification et livraison

Les cartes attestent les dix vhosts sur les cinq piles SSR coexistantes, les routes,
les refus d’hôtes et les cinq développements directs testés successivement dans des
copies indépendantes. Dossier design créé vide. Dix tests fonctionnels et 111 tests
existants réussis ; commande Make vérifiée sur chaque pile et sans pile active.
Limite conservée : images SSR locales existantes, sans reconstruction ni validation
des URL canoniques compilées. Aucun test d’envoi mail ou d’écriture API externe.

Reconstitution dans le principal libre et propre, depuis develop local vérifié,
sans fetch, conflit ni modification des branches de couche. Les quatre cherry-picks
portent leur provenance ; l’arbre des quatre commits est identique à celui de layers/devops.

| Source validée | Commit reconstitué |
| --- | --- |
| `dce5e9e16c5be9d851a97e8da46da6eb01a25690` | `51e200c8a4c40d0c6c86090b361bb35a466f0e7c` |
| `54333b9f556ce415935d245fd4c12450991399a3` | `5f20059ca3b341605f8ebbfff1b9286900d09df6` |
| `33872fe2879df87aa2dccc33dce0fbad3c43aacb` | `306a853ca5f28f803504b439b05d85b7089cd8f9` |
| `cb6ec28d852d8cfca640af939ecfc3e365d796b2` | `0948dd48d94af97f3243178c8a3a0d387f2ea9fd` |

La demande et les liens définitifs des cartes sont inclus dans le commit
documentaire de livraison. Le suivi après intégration restera dans le brouillon local.

Contrôles du résultat reconstitué : `make aide-check` réussi (registre, types,
liens et 111 tests Python), `python3 infra/tests/test_local_ssr.py` réussi
(10 tests), `git diff --check` et `git diff develop HEAD --check` conformes.
Le diff des commits vers layers/devops est vide. Les tests Docker complets déjà
consignés dans OPS-009 ne sont pas rejoués : aucune différence fonctionnelle.
Les deux cartes sont reliées au présent document dans les traces non commitées.

Préparation de livraison du 2026-11-11 : origin/develop vérifié après fetch à
`35d4a0636914b103b84afdf6efb01ffc0b25fea2` ; plage complète de quatre commits
validés, plus les présentes traces documentaires. GitHub autorise Rebase and merge.
Principal réservé à DEM-004 ; Web propre, sans contribution au-delà de la base,
mission DEM-003 clôturée ; DevOps propre, portant les seuls commits DEM-004 validés.
Aucun layers/* publié ; aucun changement des .env, données ou worktrees.
