# OPS-021 — Consolider en dernier les contrôles frontend et leur exception temporaire

- Demande : DEM-007 ; type : consolidation
- Brouillon : `tmp/demande-couche-dashboard.md`, relatif au principal, hors des worktrees ; ne pas copier.
- Demande définitive prévue : `dev-book/demand/DEM-007-couche-dashboard.md`, créée seulement à la reconstitution ; actuellement absente.
- Session de création : 01a1ce6e-0fd8-7b72-9e6b-c6926289c5fa
- Date : 2026-11-13
- Couche : devops
- Branche : layers/devops
- Worktree : worktree/devops
- Base locale vérifiée : `71efe4950c25246bacce5583e16f64063a6dfc77` ; aucun fetch.
- État : validée et commitée localement, à livrer
- Chemins autorisés : `codebase-integrity/commun/validation-rules.ts`, `codebase-integrity/README.md`, `codebase-integrity/conventions.json`, `codebase-integrity/domaines/architecture-dependances/tests/verify-layer-scopes.vitest.ts`, `codebase-integrity/domaines/architecture-dependances/scripts/verify-types-placement.ts`, `codebase-integrity/domaines/qualite-code/regles.yaml`, `codebase-integrity/domaines/qualite-code/scripts/verify-script-setup-standard.ts`, `codebase-integrity/domaines/qualite-code/tests/verify-script-setup-standard.test.ts`, `webapp/dashboard/README.md`, cette carte.
- Dépendances de réalisation : aucune dépendance de code initiale ; ordre humain après OPS-020, sans en faire une dépendance inverse.
- Vérification globale : Les preuves finales de cette carte ne valent pas validation humaine.

## Résultat et critères

Instruction humaine : prévoir une exception temporaire explicite pour les
18 fichiers signalés, puis « termine ces taches et créons une carte de consolidation
à la fin ». Cette carte est ce suivi final ; aucune correction de ces Vue n'est
incluse dans les cartes de création/runtime.
Étendre les helpers frontend à dashboard/app/ et la résolution des alias à cette
application, indépendamment de GD_TARGET. Tous les autres scopes, sévérités et
exceptions AppImage existants restent inchangés. Activer réellement les contrôles
sur Dashboard ; aucune exemption globale de cette application.
Limiter l'exception aux seuls signalements règle 1 « sections manquantes » des
18 fichiers inventoriés. Conserver un état de référence explicite (chemin,
empreinte de contenu, sections absentes, référence DEM-007) ; rendre l'exception
visible dans la sortie. Un autre fichier, une nouvelle section absente, une
empreinte différente ou l'ordre incorrect des sections ne doit pas être couvert.
Pas d'enrichissement automatique de la liste ni de désactivation d'un autre contrôle.
Un fichier corrigé sort de l'exception ; toute prolongation exige un arbitrage tracé.
Le guide autorise l'omission des blocs inutiles, tandis que le contrôle impose
12 balises : documenter cette divergence sans prétendre trancher pour toute la base.
Avant de généraliser une politique de sections ou de modifier les fichiers Vue,
revenir à l'arbitrage humain ; la présente autorisation est uniquement locale et
temporaire. Les limites du registre des conventions doivent refléter cette portée.
La liste initiale et les empreintes sont dans l'analyse du brouillon, à revérifier
avant implémentation ; ce ne sont pas des corrections de source déjà acceptées.

## Réalisation et preuves

Réalisation après le smoke réussi d'OPS-020, sans consommer de code non commité
entre couches. Dashboard rejoint les helpers de découverte frontend et de racine
d'alias ; le résolveur existant en bénéficie sans modification supplémentaire.
Les 18 empreintes d'origine ont été revérifiées avant inscription dans les règles
YAML. Seuls chemin, contenu et sections absentes exacts autorisent la tolérance
règle 1, affichée à chaque usage. Aucun fichier Vue modifié et aucun seuil changé.
La divergence du guide sur les blocs inutiles reste documentée, sans règle globale
inventée ; aucun autre écart n'est corrigé ou masqué par cette carte.

Preuves du 2026-11-13 : 10 tests TypeScript réussis (Git jetable hors restriction
sandbox), 44 tests Bun réussis. Tests positifs/négatifs : chemins/scopes/alias
Dashboard même cible inactive, wrapper AppImage limité à la racine, image illicite
et section absente détectées dans une fixture Git ; exception exacte acceptée,
contenu modifié/chemin voisin/sections différentes/autre demande refusés,
fichier corrigé hors tolérance et mauvais ordre toujours bloquant.
`make aide-check` : 119 tests réussis ; registre/demandes/liens conformes.
`bun run --cwd codebase-integrity check:conventions` réussit avec 18 tolérances
visibles et les avertissements de revue humaine conservés.
Les neuf commandes de `make quality-conventions-check` réussissent aussi dans
Docker : recette obtenue par `make -n`, env_file remplacé par un fichier fictif,
Dashboard/contrôles/dépendances montés en lecture seule, données temporaires et
réseau désactivé. L'appel Make standard ne peut pas s'exécuter tel quel ici :
.env DevOps absent, et lane-env refuse le node_modules lié préexistant.
Ce lien reste intact ; aucun .env DevOps créé. Le contrôle Docker porte bien sur
les sources actuelles, pas sur celles embarquées dans une ancienne image.

Constats Dashboard à revoir humainement, sans verdict de conformité inventé :
app-deep-nesting dans useDashboardAccess:57, useDashboardAdmin:69 et
useDashboardAuth:36/41 ; app-no-redundant-guards dans ArticleResources:125 et
useDashboardAccess:22/23 (chemins relatifs à dashboard/app/).
Les avertissements historiques des autres applications restent présents.
Aucune exception supplémentaire n'est ajoutée pour ces avertissements.
Format des cinq fichiers TS/YAML modifiés vérifié avec Prettier ; rubriques
README conservées. Aucun commit ni validation humaine de cette carte.

Les corrections et accompagnements sont déclarés dans le brouillon, sans recopier
la déclaration dans chaque carte. Réconcilier ses chemins exacts avec le diff final ;
aucune exemption implicite de couverture de contribution. Un seul écrivain DevOps.

## Verdict humain

Validation explicite le 2026-11-13 : « validé », couvrant OPS-020 et OPS-021
présentées ensemble, avec leurs limites et avertissements conservés.
Contenu revérifié identique au relevé présenté avant ajout de cette trace ;
aucun changement fonctionnel supplémentaire.

## Commits

Commit d’implémentation validée : `7c5a6108d06e02aff76edfb2803b50e097749855`.
Cette trace documentaire est consignée séparément. Reconstitution prévue
dans le principal libre et propre, `demands/DEM-007` depuis develop vérifié, sans
copie de réunion ; retour sur develop après intégration distante.
