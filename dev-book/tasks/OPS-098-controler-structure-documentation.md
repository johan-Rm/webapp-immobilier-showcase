# OPS-098 — Contrôler la structure et les liens de la documentation

- Demande : DEM-026
- Brouillon dans le dépôt principal : `tmp/demande-consolidation-documentation.md`
- Demande définitive à référencer après reconstitution : `dev-book/demand/`
- Session de création : `01a217b7-1feb-7220-9163-1c0926b26aa6`
- Couche : devops
- Branche : `layers/devops`
- Worktree : `worktree/devops`
- État : implémentée et commitée, à vérifier
- Chemins autorisés : `codebase-integrity/domaines/fiabilite-verifications/scripts/check_docs.py`, `codebase-integrity/domaines/fiabilite-verifications/tests/test_docs.py`, `docs/README.md` pour la portée du contrôle, le patch d’activation, les neuf destinations de liens historiques autorisées et cette carte
- Dépendances : commit local OPS-097, `fe8adbedc74480ecf91fc4020c2c3906df1e6a15`

## Résultat et critères

Étendre le contrôle bloquant `make conventions-tests-docs`. À la racine de `docs/`, seuls `README.md` et `index.md` sont admis. Chaque thématique est accessible depuis le sommaire principal et chaque page de sujet depuis le sommaire de sa thématique. Vérifier les cibles et ancres des liens locaux de `docs/`.

Tester une arborescence conforme, un fichier inattendu à la racine, une thématique absente du sommaire, une page omise et des cibles ou ancres invalides. Vérifier que les métadonnées, ressources, README et index de thématique sont dispensés d’entrée en tant que pages. Maintenir les exclusions Git existantes. Les préfixes actuels, les introductions, les liens externes et le jugement éditorial restent hors de ce nouveau contrôle.

## Réalisation et preuves

Depuis le worktree DevOps, le cas ciblé `DocumentsTest.test_documentation_tree_checks_navigation_and_local_links` de `test_docs.py` réussit. Il couvre le cas conforme et cinq diagnostics. Appliquer le [patch d’activation](../reports/ops-098-activation-controle-documentaire.patch) après celui d’OPS-097 à la reconstitution.

Dans une projection temporaire avec les deux patchs appliqués, le contrôle de l’arborescence publiée retourne zéro erreur et zéro notice. Après autorisation, le patch actualise les destinations des neuf liens dans cinq demandes et quatre cartes historiques en préservant le texte et les preuves. La cible `make conventions-tests-docs` réussit dans la projection temporaire, avec quatre étapes sur quatre et le code 0. Aucun service ni accès réseau.

## Verdict humain

Aucun verdict humain.

## Commits

À renseigner après réalisation.
