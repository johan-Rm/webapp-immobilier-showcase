# WEB-003 — Créer le dashboard et ses parcours d’accès

- Demande : DEM-005 ; type : développement
- Brouillon de référence : `tmp/demande-dashboard-saas.md`, relatif au dépôt principal, hors du worktree ; ne pas le copier.
- Demande définitive prévue : `dev-book/demand/DEM-005-dashboard-saas.md`, créée seulement à la reconstitution ; fichier actuellement absent, lien à ajouter alors.
- Session de création : 01a1ca56-891a-7700-97c6-a576d3d9a615
- Couche : web
- Branche : layers/web
- Worktree : worktree/web
- Base locale vérifiée : `5dc9fe796cb24a4bc5d604835c4092e8a309e6dd` ; aucun fetch.
- État : validée et commitée localement ; à livrer ; complément validé et commité localement, à livrer
- Chemins autorisés : `webapp/dashboard/`, `webapp/tests/e2e/saas-access.spec.ts`, `webapp/tests/layers/dashboard.vitest.ts`, cette carte
- Dépendances de réalisation : OPS-010 `5eee4c05ad298775d509a1469b5642a1517699df`, OPS-011 `f3664dd5a92a2202a285f3e04de9ba13ebf72863`, DOM-001 `8c1000ecc9996cd3632a323fd1ed49604ad4e929`
- Commits nécessaires : commits de contrat, composition et Domaine identifiés ci-dessus ; aucun fichier non commité consommé.
- Dépendances de vérification globale : BFF-002 (accès réels), OPS-013

## Résultat et critères

Correction de dépendance trop large : le frontend consomme le contrat validé et peut être testé avec
réponses BFF simulées. BFF-002 bloque les preuves d’accès réels, pas l’écriture des écrans ;
aucun succès de connexion fictif en fonctionnement normal et aucun endpoint Symfony ajouté.

Créer la cible dashboard : identité/config Nuxt et frontend propre sans héritage Showcase.
UI française Nuxt UI sobre, mobile, layouts et composants de présentation ; logique dans composables.
Connexion, invitations, récupération mot de passe, organisations/projets, gestion des collaborateurs
et création réservée des organisations/projets selon le contrat ; états vide/chargement/erreur.
Afficher le menu du brouillon, distinguer les entrées indisponibles ; catégories hors menu.
Sélecteur organisation puis projet ; un compte peut changer d’organisation selon ses accès.
Ne pas annoncer une action disponible si elle n’est pas implémentée. Aucun secret côté client.
Exclusions : éditeur article WEB-004, paiement, migration du dashboard historique.
Chemin webapp/dashboard/ affecté à Web pour DEM-005 par instruction humaine ; consolidation
du routage et des contrôles reportée après le développement, sans bloquer cette carte.

Les critères de besoin et exclusions communs restent dans le brouillon ; aucune modification
de Codebase Integrity, de règle ou de gouvernance hors consolidation déclarée.
Les métadonnées de cette carte relèvent de la trace obligatoire, même hors périmètre applicatif.
Documentation : README dashboard concis renvoyant aux conventions frontend existantes ; guide utilisateur central OPS-013.

## Réalisation et preuves

Implémentation du 2026-11-12, session intervenante identique à la session de création.
Cible Nuxt UI autonome : accès e-mail/mot de passe, invitation (nouveau compte ou compte
existant), récupération/réinitialisation, déconnexion, choix organisation/projet,
création organisation/projet pour l’équipe SaaS et gestion des membres pour les administrateurs.
Menu complet avec entrées futures indisponibles ; aucune entrée catégories.
Erreurs BFF visibles et saisie conservée, jetons d’invitation retirés de l’URL après lecture.
Le hook de préparation crée le relais TypeScript généré parent seulement s’il est absent ;
il permet le build isolé sans préparation préalable d’un site et préserve les fichiers existants.

État présenté : HEAD `5dc9fe796cb24a4bc5d604835c4092e8a309e6dd`, index vide,
aucun fichier suivi modifié. Nouveaux fichiers : tout `webapp/dashboard/` (24 fichiers),
`webapp/tests/e2e/saas-access.spec.ts`, `webapp/tests/layers/dashboard.vitest.ts` et cette carte.
Les cartes WEB-004/005 préexistantes restent non suivies et hors périmètre.
Empreinte SHA-256 des 26 fichiers applicatifs/tests, triés par chemin relatif :
`5e64e74576488b4b3dd46170ccd1f15677482c681860d1441d62100f8527911b`.
Calcul : concaténer pour chaque fichier le chemin UTF-8, un octet nul puis ses octets ;
la carte est exclue de l’empreinte.

Contrôles terminés avec succès :

- Depuis Web : `make aide-check` — 111 tests, structure et liens documentaires conformes.
- Depuis `webapp/` : ESLint et `prettier --check` sur dashboard et ses deux tests — conformes.
- Assemblage temporaire `/tmp/dem005-web003-bdl7gfg9` : base Web et dépendances
  commitées identifiées ci-dessus ; les 26 fichiers testés sont identiques octet pour octet
  à ceux présentés. Aucun échange de source non commitée entre couches.
- Depuis son `webapp/` : `GD_TARGET=dashboard bun run build` et
  `vue-tsc --noEmit --project dashboard/.nuxt/tsconfig.site.json` — réussis.
- `GD_TARGET=showcase-immobilier bun run test` — 119 tests, 18 fichiers ; comprend
  préparation et build de la vraie layer sans modules ni routes Showcase.
- `GD_TARGET=dashboard bunx --no-install playwright test tests/e2e/saas-access.spec.ts
  --workers=1 --reporter=line --config=playwright.local.config.ts` — 16 succès,
  profils bureau/mobile : accès, rôles, membres, création, erreurs, récupération,
  invitations avec reprise de connexion et protection des routes sans session.
  Serveur SSR issu du build ; réponses `/api/saas/**` simulées dans les tests uniquement.
  Configuration locale temporaire : exécutable Chromium headless déjà disponible (révision
  1248), bibliothèques locales et cache ffmpeg adaptés à l’environnement, sans modification
  de la configuration du projet. Pilotage reproductible local :
  `/tmp/dem005-web003-browser.py` ; port loopback temporaire, serveur arrêté après test.
- Captures `dashboard.png` bureau/mobile sous le dossier de résultats Playwright de
  cet assemblage inspectées : sélecteurs lisibles, disposition mobile empilée et menu replié.

Limites : aucune preuve d’authentification ou d’isolation serveur réelle ; BFF-002 et
OPS-013 doivent les établir sur environnement isolé. Les contrôles de droits dans l’UI
ne remplacent pas ceux de l’API. Symfony reste propre et inchangé ; aucun endpoint ajouté.
Aucun commit, push ou verdict humain produit à cette étape.

## Verdict humain

Validation humaine explicite du 2026-11-12 : « validé », limitée à WEB-003 présentée.
Empreinte des 26 fichiers revérifiée identique avant commit ; aucune correction fonctionnelle.

## Commits

Commit d’implémentation validée : `f3398f8cc12474640737887b77e16d0ca7afe90d`.
Complément documentaire limité à la trace du SHA et de l’état ; WEB-004/005 hors index.
La réunion globale est prévue dans le principal libre et propre, branche `demands/DEM-005`
créée seulement à la reconstitution depuis develop local vérifié.

## Complément fonctionnel du 2026-11-12

Même session réelle de création ; reprise de DEM-005, sans consolidation.
Base `2286109212a2f1dbf01323155f0f23ebb8a37789`, `layers/web`, index vide avant écriture.
Les changements de cette reprise sont identifiés ; aucun travail étranger consommé.

Le transport d’URL dynamique précise son paramètre de requête `$fetch<T, string>`
pour conserver le type de réponse générique quand Nitro connaît les routes réelles.
Aucun changement de requête, authentification ou comportement HTTP. Le fixture de
layer copie maintenant le serveur BFF commité pour permettre les contrôles futurs
du sélectionneur sans masquer les routes historiques à exclure.

Snapshot indépendant `/tmp/dem005-acces-types`, uniquement amonts committés et ces
deux fichiers Web. Une déclaration Nitro de fixture pointe sur le handler session
BFF commité, sans consommer le sélectionneur DevOps non commité : contrôle de types
dashboard réussi (`GD_TARGET=dashboard bun --no-env-file run type-check`). Cette
configuration de fixture est ensuite remplacée par la configuration DevOps commitée
pour `vitest run tests/layers/dashboard.vitest.ts` : test réussi avec vrai build du
dashboard. ESLint ciblé sans warning. Logs `/tmp/dem005-acces-{types,tests}.log`.
Le contrôle d’ensemble d’OPS-011 doit reprendre depuis ce correctif commité.

État présenté : 2 fichiers de réalisation, plus cette carte ;
manifestes de chemins et SHA-256 : `/tmp/dem005-web-003-raccordement-manifest.json`.
Empreinte triée chemin UTF-8, octet nul puis contenu, carte exclue :
`0fcf828ebe7b93791a5ced066aaf9f4a12361b4dd911daad471d09fd2d0845e4`.
Aucun commit ni verdict humain créé à cette étape. Les verdicts et commits antérieurs
restent inchangés et ne valident pas ce complément.

Contrôle documentaire et cadre final : `make aide-check` depuis cette couche,
111 tests réussis, structure et liens conformes ; `git diff --check` conforme.
Log `/tmp/dem005-web-raccordement-aide.log`.

## Verdict humain — complément fonctionnel

Validation explicite du 2026-11-12 : « validé », couvrant les seuls compléments
WEB-003, OPS-012 et BFF-003 présentés et leurs limites sur fixtures. Les fichiers
correspondent aux empreintes présentées avant indexation ; aucune correction
fonctionnelle depuis la restitution. OPS-011 et OPS-013 sont hors de ce verdict.

Commit local du complément validé : `ba6db7dc4a73f7df780a947a80c626211482ba63`.
Cette trace ne modifie aucune fonctionnalité ; les autres compléments restent
hors de ce commit. Aucun push, PR, fusion ou passage automatique à l’étape suivante.
