# OPS-097 — Reclasser la documentation technique

- Demande : DEM-026
- Brouillon dans le dépôt principal : `tmp/demande-consolidation-documentation.md`
- Demande définitive à référencer après reconstitution : `dev-book/demand/`
- Session de création : `01a217b7-1feb-7220-9163-1c0926b26aa6`
- Couche : devops
- Branche : `layers/devops`
- Worktree : `worktree/devops`
- État : validée humainement
- Chemins autorisés : `docs/`, `dev-book/reports/` pour le relevé HAR, `codebase-integrity/domaines/fiabilite-verifications/scripts/check_runtime_names.py` pour la référence déplacée, le brouillon documentaire et cette carte
- Base locale constatée : `59b90275a3573d9ffedccb4d21d53e57b34d0f73`
- Dépendances : vérifier le contenu des guides modifiés par DEM-020 sur la base de réalisation et préserver ses changements à la reconstitution

## Résultat et critères

Formaliser le rôle de la documentation technique dans les rubriques existantes de `docs/README.md`. Reclasser les sept guides situés à la racine, conserver les noms des thématiques existantes et relier les sujets depuis leurs sommaires. Revoir la durabilité des explications. Préserver le relevé HAR dans le dev-book et vérifier les règles durables avant de les reprendre.

Mettre à jour les références actives vers les chemins déplacés, y compris celle de `check_runtime_names.py`. Préserver l’historique des demandes, cartes et rapports. Vérifier les liens relatifs et les ancres. Consigner l’inventaire avant/après, le chemin de la trace HAR et les résultats de la recherche des anciens chemins.

`AGENTS.md` et `TEST.md` contiennent des références actives et sont hors des chemins configurés pour DevOps. L’humain autorise les trois corrections de liens dans ces fichiers. Le périmètre exclut le renommage des thématiques, l’ajout systématique de résumés et la modification des comportements applicatifs.

## Réalisation et preuves

Le [brouillon documentaire](../reports/ops-097-documentation.patch) prépare la réorganisation pour la reconstitution. Le patch s’applique à la base de la carte selon `git apply --check dev-book/reports/ops-097-documentation.patch`, exécuté depuis le worktree DevOps. Le [relevé HAR](../reports/releve-har-firefox-chargement-images.md) préserve la mesure datée.

Une projection locale de la documentation a passé la vérification ciblée des liens avec le parseur de `check_docs.py` et les règles de forme préexistantes écartées pour cette vérification. Python 3 a examiné 53 pages et n’a émis ni erreur ni notice. Trois liens existants ont été corrigés vers la configuration Tailwind, la configuration Nuxt Showcase et le hook de génération des schémas. Aucun accès réseau ni test de service.

Le patch applique les trois corrections autorisées et le chemin de `check_runtime_names.py` avec les déplacements à la reconstitution.

## Verdict humain

```verdict-json
{
  "decision": "validé",
  "portee": "DEM-026, carte OPS-097, contenu présenté à la vérification du 26 novembre 2026.",
  "contenu": {
    "type": "git",
    "valeur": "fe8adbedc74480ecf91fc4020c2c3906df1e6a15"
  }
}
```

## Commits

- Implémentation : `fe8adbedc74480ecf91fc4020c2c3906df1e6a15`.
