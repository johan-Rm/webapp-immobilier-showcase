# OPS-022 — Intégrer les références visuelles du dashboard

- Demande : DEM-008 — développement
- Brouillon de référence : `tmp/demande-design-dashboard.md`, relatif au dépôt principal ; lecture depuis le principal, aucune copie dans la couche.
- Demande définitive : [DEM-008](../demand/DEM-008-design-dashboard.md).
- Session de création : 01a1d8d6-52a5-7cd0-90c8-633d9849b8b2
- Date : 2026-11-14
- Couche : devops
- Branche : layers/devops
- Worktree : worktree/devops
- État : validée par l’humain ; réserve Docker SSR à corriger avant livraison
- Chemins autorisés : les deux fichiers déjà fournis sous `resources/design/`, `docs/4.design-system/2.themes-et-palettes.md`, `AGENTS.md`, `infra/docker/docker-compose.dashboard-dev.yml`, cette carte.
- Dépendances de réalisation : aucune ; base locale `f5349944afeef829f3c9851b4cd591e9cff05249`.

## Résultat et critères

Intégrer à la contribution les deux références déjà déposées sur instruction humaine
au principal, sans les modifier ni les publier comme page de l’application.
Le dossier `resources/design/` ne figure dans aucun routage explicite : affectation
à DevOps, couche par défaut déclarée, pour ces ressources documentaires du cadre.
Ne pas modifier la configuration des couches.

1. HTML et SVG identiques octet pour octet aux sources du principal ; comparer les
   empreintes et conserver les fichiers non suivis du principal jusqu’à leur reprise
   contrôlée à la reconstitution. Aucun transfert de code non commité vers Dashboard.
2. Ajouter au guide des thèmes un lien vers la charte et préciser le périmètre existant :
   la pipeline `themes.yaml` appartient à Showcase ; Dashboard est une cible Nuxt UI
   indépendante. Conserver les rubriques et leur ordre, sans recopier la palette.
3. Vérifier la disponibilité réelle de Rationale et de sa licence avant utilisation ;
   ne pas déduire une autorisation de la seule présence du fichier. Le remplacement
   Newsreader est déjà autorisé par le cadrage. Résultat de l’inventaire ci-dessous.

Exclusions : thème applicatif, code, infrastructure, contrôles et conventions globales.
Documentation durable : uniquement le guide existant ci-dessus ; les décisions produit
restent dans le brouillon. Ces ressources sont la référence documentaire unique ; les
actifs nécessaires au navigateur seront dérivés par DASH-001, avec leur provenance.

## Réalisation et preuves

Implémentation du 2026-11-14, session de création inchangée, sur HEAD
`f5349944afeef829f3c9851b4cd591e9cff05249` ; index initialement vide ; commit local par tâche autorisé explicitement après cette réalisation.

- Ajouts non suivis : les deux fichiers `resources/design/` et cette carte.
- Modification suivie : `docs/4.design-system/2.themes-et-palettes.md` uniquement ;
  source Showcase corrigée, portée Dashboard et liens aux références ajoutés.
- Les deux ressources sont identiques aux originaux du principal, conservés :
  comparaison octet par octet réussie. SHA-256 du SVG :
  `6b15db2d7b869d81cd9d9731f2fb31eec3df3e03fd71b5efd87e509cb7187c50` ;
  SHA-256 du HTML :
  `21c90482e82d2ce8db416d635c55a3a513ad34bb25a743e0fd91a690d6f3df64`.
- Inventaire corrigé : `git ls-files '*rationale*'` révèle le fichier versionné
  `webapp/sites/showcase-immobilier/app/assets/fonts/rationale-regular.woff2`.
  Aucune licence associée trouvée dans ce dossier, les références fournies ni la liste
  des fichiers de licence suivis. La première conclusion d’absence du fichier était
  incorrecte. La licence reste à vérifier avant réutilisation ; pas de preuve de droit
  d’usage obtenue ici. Inter est aussi présent dans ce dossier, sans licence associée trouvée.
- `make aide-check` : registre, types, structure/liens documentaires conformes ;
  **119 tests réussis** en 8,608 s. Les refus affichés dans les scénarios négatifs
  font partie des tests réussis, pas d’un échec de la contribution.
- `git diff --check` : réussi. Comparaison automatique des titres Markdown avant/après :
  rubriques et ordre conservés. Les liens ajoutés ciblent des fichiers présents.

Limites : contrôles documentaires et outillage seulement, aucun test de rendu ou
changement frontend. Vérification globale avec DASH-001 différée après commits validés.

Analyse : branche existante propre, index vide, même base que develop ; aucune mission
active identifiée pour DevOps (OPS-001 apparaît encore avec son verdict historique).
DEM-007 est explicitement clôturée dans son brouillon. Docker inaccessible lors de
`lane-status` : aucun fonctionnement des services n’est revendiqué.

## Verdict humain

Le 2026-11-14, dans la session de création : « c’est validé », après présentation
conjointe d’OPS-022 et DASH-001, des preuves et de la réserve Docker SSR.
Verdict associé au HEAD DevOps `fba869c236a78eda4df5f0c9fb45863f98c5d3b5`
(commits OPS-022 initial `76f283a` et correctif `fba869c`), sans diff supplémentaire.

Réserve présentée et conservée : rendre le pictogramme source disponible pendant
la construction de l’image Docker SSR ; le montage actuel couvre la lane de
développement seulement. Correction à réaliser à l’étape 03 puis à vérifier,
avant livraison. La validation n’est ni une levée de cette réserve ni une preuve
d’un build Docker SSR réussi.

## Commits

Commit local de cette tâche autorisé par la correction explicite du workflow dans cette session ; SHA réel consigné dans le brouillon après création. Verdict humain désormais consigné ci-dessus ; les commits techniques restent inchangés.


Correction du workflow sur instruction humaine : un commit par tâche dans cette session,
puis vérification humaine de DEM-008 complète. `AGENTS.md` du projet aligné dans ce lot ;
les skills installés `implementer-demande`, `verifier-arbitrer-demande` et les consignes
globales sont mis à jour séparément à leurs emplacements existants, autorisés par
« oui et modifie le skill aussi ». Validation structurelle des deux skills réussie.
Cette instruction remplace l’attente de validation intermédiaire inscrite initialement.


Correction de démarrage signalée par l’humain après DEM-008 : le serveur SSR de
vérification laissé sur 19305 bloquait Docker ; processus identifié par son PID,
sa commande et son worktree, puis arrêté sans toucher aux autres services.
Le lancement a ensuite révélé un import SVG absent du conteneur : ajout du seul
pictogramme source en montage lecture seule à `/resources/design/`, chemin utilisé
par le composant compilé depuis `/app/dashboard/`. Aucun duplicata du fichier,
changement de port, secret ou donnée. Correction de réalisation OPS-022, sans
modifier une convention ni un contrôle. Le build Docker SSR distinct reste à
vérifier lors du contrôle global ; les preuves SSR précédentes portaient sur Node.
Validation de la configuration Compose et contrôle documentaire avant commit ;
reprise du commit dans Dashboard pour le contrôle réel des deux accès, résultat
consigné dans le brouillon principal après exécution.
