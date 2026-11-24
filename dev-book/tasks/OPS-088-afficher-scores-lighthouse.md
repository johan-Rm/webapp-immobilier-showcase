# OPS-088 — Afficher les scores médians Lighthouse dans le terminal

- Demande : DEM-023 · consolidation.
- Brouillon au principal : `tmp/demande-consolidation-parcours-local.md`. Lien vers la demande définitive à la reconstitution.
- Session de création : 01a20c4d-bb03-77c1-a236-d39379aa3c1a
- Couche : devops
- Branche : layers/devops
- Worktree : worktree/devops
- État : validée humainement
- Dépendances : aucune dépendance de réalisation.
- Chemins autorisés : `codebase-integrity/commun/check_presentation.py`, `codebase-integrity/domaines/fiabilite-verifications/tests/test_check_presentation.py` et cette carte.

## Résultat et critères

- Après réussite, la commande Make habituelle affiche les quatre médianes sur 100 par page pour les profils mobile et desktop. Le bloc est espacé, coloré selon le support du terminal et lisible sans couleur.
- Les valeurs proviennent du rapport de cette exécution, résolu sous le répertoire des rapports Lighthouse. Un rapport absent ou illisible produit un message informatif. Un audit en échec conserve son code de sortie et ne produit aucun bloc de scores.
- Les rapports, le calcul des métriques et les conditions d’échec de l’audit restent régis par le contrôle actuel. Les scores sont informatifs. La présentation des autres contrôles reste hors périmètre.

## Réalisation et preuves

Exécuter les tests Python de présentation ciblés depuis le worktree DevOps avec des rapports synthétiques. Couvrir les deux profils, les quatre médianes, la sortie sans couleur, les rapports absents ou invalides et un code d’échec conservé. Consigner les commandes et résultats ici.

Pour l’essai humain, démarrer les fixtures de Showcase sur `127.0.0.1:19856`, puis lancer depuis le même dépôt `make runtime-tests-lighthouse GD_TARGET=showcase-immobilier QUALITY_BASE_URL=http://127.0.0.1:19856 PROFILE=mobile`, puis avec `PROFILE=desktop`. Chaque profil effectue trois audits de `/fr`. Comparer les quatre scores affichés par page au `summary.json` annoncé pour le profil courant.

### Contrôles observés

- `timeout 55s python3 -B -m unittest discover -s codebase-integrity/domaines/fiabilite-verifications/tests -p test_check_presentation.py` : 13 tests réussis, avec les deux profils, les couleurs, les erreurs de rapport et le code d’échec.
- Relecture du journal et du rapport mobile du POC depuis le principal : `/fr` affiche 100, 96, 100 et 69 sur 100.
- Nouveaux audits des deux profils réservés à l’essai humain. Aucun service requis pour les preuves ci-dessus.

## Verdict humain

Verdict explicite de l’humain : « ok les 2 commits validé ».

```verdict-json
{
  "decision": "validé",
  "portee": "DEM-023, OPS-088 — présentation Lighthouse. Audits réels mobile et desktop avec le rendu final à vérifier.",
  "contenu": {
    "type": "git",
    "valeur": "ca3444153b073c309f3c7341ddb3e532d2c92adb"
  }
}
```

## Commits

- Implémentation examinée : `ca3444153b073c309f3c7341ddb3e532d2c92adb`.
