# BFF-002 — Sécuriser les sessions et l’administration SaaS

- Demande : DEM-005 ; type : développement
- Brouillon de référence : `tmp/demande-dashboard-saas.md`, relatif au dépôt principal, hors du worktree ; ne pas le copier.
- Demande définitive prévue : `dev-book/demand/DEM-005-dashboard-saas.md`, créée seulement à la reconstitution ; fichier actuellement absent, lien à ajouter alors.
- Session de création : 01a1ca56-891a-7700-97c6-a576d3d9a615
- Couche : bff
- Branche : layers/bff
- Worktree : worktree/bff
- Base locale vérifiée : `5dc9fe796cb24a4bc5d604835c4092e8a309e6dd` ; aucun fetch.
- État : périmètre partiel validé et commité localement ; reste à livrer
- Chemins autorisés : `webapp/server/api/saas/auth/`, `webapp/server/api/saas/organizations/`, `webapp/server/api/saas/projects/`, `webapp/server/utils/saas/auth/`, `webapp/server/tests/saas-auth.vitest.ts`, cette carte
- Dépendances de réalisation : DOM-001 ; API Symfony existante inchangée, sans livraison backend
- Commits vérifiés : DOM-001 `8c1000ecc9996cd3632a323fd1ed49604ad4e929`, preuve `3af26ccc0bda0781928f3ef68f8682994549c637`. API consultée en lecture seule à `9fed427658d9c0983b5982a6e6922d179a6bf4eb`.
- Dépendances de vérification globale : OPS-013

## Résultat et critères

Connexion e-mail/mot de passe, logout, session et renouvellement des jetons Symfony côté serveur.
Relayer invitations, acceptation, révocation et récupération de mot de passe sans inscription libre.
Lister les organisations/projets réellement autorisés et administrer organisations/projets/membres
selon le rôle contractuel ; ne jamais déduire un droit du seul choix actif dans le navigateur.
Création organisation/projet réservée à l’équipe SaaS ; invitations aussi par administrateur client.
Vérifier le contexte sur chaque requête, protéger les mutations contre CSRF et ne pas exposer de token.
Une révocation doit être effective sur les prochains accès protégés, pas seulement après reconnexion.
Exclusions : authentification Google et endpoints historiques, UI, projet API partagé en écriture.

Les critères de besoin et exclusions communs restent dans le brouillon ; aucune modification
de Codebase Integrity, de règle ou de gouvernance hors consolidation déclarée.
Les métadonnées de cette carte relèvent de la trace obligatoire, même hors périmètre applicatif.
Documentation : Le contrat OPS-010 porte les erreurs et les secrets ; fournir à OPS-013 la procédure utilisateur et les preuves.

## Réalisation et preuves

Reprise du 2026-11-12, session d’origine conservée. L’analyse du dashboard historique et
le recadrage « API inchangée » restent dans le brouillon de référence, section Réanalyse.
Aucune modification PHP, donnée API, configuration locale ou convention technique.

### Périmètre présenté

- Connexion native `/api/auth/login`, renouvellement `/api/auth/refresh`, logout local.
  Cookie opaque HttpOnly/SameSite=Lax, Secure en HTTPS ; jetons et mots de passe absents
  des réponses. Seuls les jetons utilisateur sont conservés côté serveur, jamais un compte de service.
- Listes organisations/projets/membres, pagination Hydra et contrat frontend paginé.
  Les projets sont filtrés par organisation autorisée puis par accès natif aux articles ;
  les collections Symfony sont consultées à chaque requête, sans confiance dans le contexte navigateur.
- Créations organisation/projet réservées à l’équipe côté BFF et toujours soumises aux droits
  Symfony. Vérification Origin des mutations, refus des liens amont étrangers, erreurs neutralisées.
- Routes d’invitation, acceptation, retrait et récupération présentes mais explicitement
  indisponibles (`501 unsupported_api`) ; capacités retournées à false dans la session.
  Les routes d’administration vérifient d’abord la session et l’organisation.

### Configuration serveur du périmètre

`SAAS_ORIGIN` (repli `SITE_URL`) et `SYMFONY_API_URL` : origines HTTP(S) sans chemin.
`SAAS_PLATFORM_ADMIN_EMAILS` : liste privée séparée par virgules des comptes de l’équipe ;
le rôle natif ROLE_SUPER_ADMIN est aussi reconnu depuis la réponse d’authentification.
Cette liste ne confère aucun droit supplémentaire dans Symfony.
`SAAS_SESSION_DIR` : répertoire privé propre à l’instance, par défaut
`.data/saas-sessions` sous le répertoire de travail serveur ; ne jamais le servir publiquement.
Sessions de huit heures, fichiers 0600, identifiants aléatoires hachés dans les noms de fichier,
écriture atomique ; fichiers expirés retirés lorsqu’ils sont relus. Renouvellement et logout
sérialisés par session dans un processus. Le stockage et la coordination multi-instances
ne sont pas couverts ; aucune garantie distribuée annoncée.

### Preuves locales

Assemblage jetable `/tmp/dem005-bff002-review` : HEAD BFF de base, code courant de cette carte,
DOM-001 commité et configuration OPS-011 `f3664dd5a92a2202a285f3e04de9ba13ebf72863`.
Dépendances installées réutilisées en lecture seule ; aucune copie de `.env` ni consommation
applicative du travail non commité par une autre carte.
Depuis `webapp/` de cet assemblage :

- `GD_TARGET=showcase-immobilier nuxt prepare` : réussi.
- `GD_TARGET=showcase-immobilier node node_modules/vitest/vitest.mjs run server/tests/saas-auth.vitest.ts --reporter=verbose` : 14 tests réussis, vrais handlers H3 sur HTTP local, API native simulée.
- Suite locale complète avant les deux derniers cas et le contrôle d’organisation des routes
  indisponibles : 18 fichiers, 129 tests réussis. Le contrôle ciblé final couvre ces ajouts.
- `eslint server/utils/saas/auth server/api/saas server/tests/saas-auth.vitest.ts --max-warnings 0`
  et Prettier sur ces mêmes chemins : réussis.
- `vue-tsc --noEmit` : réussi, sans erreur. Contrôle ciblé supplémentaire réussi avec une
  configuration temporaire étendant `tsconfig.json`, limitée aux 18 sources de cette carte
  et à la déclaration `#site` ; fichiers testés identiques à ceux du worktree.
- `python3 codebase-integrity/domaines/fiabilite-verifications/scripts/check_docs.py`
  depuis le worktree : structure et liens conformes, limites habituelles de `docs/README.md`.

Tests : secrets, cookies, CSRF, cible publique refusée, erreurs API, accès inter-organisations,
projets sans accès éditorial, retrait d’accès entre requêtes, pagination relative et SSRF,
créations et refus natifs, renouvellements simultanés/rotation/refus, expiration, logout,
fonctions indisponibles et JWT amont incohérent. Les données sont fictives ; aucune connexion
ni écriture sur Symfony réel. L’isolation API directe reste à vérifier dans OPS-013.

### Limites et suite

Le contrat initial d’OPS-010 supposait des routes backend inexistantes. L’adaptateur réalise
le sous-ensemble natif ; les invitations sûres, reset de mot de passe et retraits de membres
ne sont pas réalisés et les critères correspondants restent ouverts. Ne pas présenter la
carte entière comme satisfaite, ni une révocation API directe comme démontrée.

Le dashboard utilise encore `dashboard/server` : ces handlers ne sont pas activés sur sa
cible. Le raccordement de configuration devra consommer le commit validé de cette carte,
puis être testé avec les parcours Web ; la garde de cible renvoie 404 sur Showcase.
Ce raccordement est une intégration fonctionnelle, pas une consolidation générale.
BFF-003 attend le commit de ce socle de session ; BFF-004 attend BFF-003.

### État soumis

HEAD `5dc9fe796cb24a4bc5d604835c4092e8a309e6dd`, index vide. Tous les fichiers applicatifs
présentés sont non suivis : `server/api/saas/` (13 handlers), `server/utils/saas/auth/`
(4 utilitaires), `server/tests/saas-auth.vitest.ts`, relatifs à `webapp/`.
Les cartes BFF-003/004 restent des préparations documentaires ; leurs dépendances backend
sont corrigées sans implémentation ni verdict.

## Verdict humain

Le 2026-11-12, l’humain confirme « oui » après clarification explicite de la validation
du périmètre partiel de BFF-002, au-delà de l’affichage des couches dans VS Code.
Acceptés : sessions, accès et administration native décrits dans « Périmètre présenté »,
avec les limites et fonctions restant ouvertes indiquées dans « Limites et suite ».
Ce verdict ne valide ni BFF-003/004 ni l’intégration réelle du dashboard.

Avant consignation du verdict, les 19 fichiers soumis correspondent exactement au manifeste
de présentation : SHA256 `4f9a0d0d7e613cba3b32e9e2fce6444e3b61d83c32f758cf03eeb0f905d0e2e6`.
Les 18 sources applicatives sont inchangées ; seuls l’état et les traces documentaires
du verdict sont ajoutés. Branche `layers/bff`, HEAD de base indiqué ci-dessus, index vide
avant préparation du commit ; cartes BFF-003/004 exclues du commit.

## Commits

Implémentation et verdict partiel : `e9b922ac3be8d1106b812e665264e5988194f6c7`.
Le présent complément documentaire relève ce SHA ; aucun changement fonctionnel ajouté.
Les limites indiquées plus haut restent ouvertes. Aucun push, PR ou merge effectué.
La réunion globale est prévue dans le principal libre et propre, branche `demands/DEM-005`
créée seulement à la reconstitution depuis develop local vérifié.
